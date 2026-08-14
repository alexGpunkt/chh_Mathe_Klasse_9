#!/usr/bin/env node
/* ============================================================
   aufbau-pruefen.js · Prüft jede Einheit gegen die sechs
   didaktischen Phasen aus Aufbau_Lernabschnitte_allgemein_beispiele.txt

   Phase 1 Einstieg      → lernkarte.hinfuehrung + visual (Animation)
   Phase 2 Erarbeitung   → lernkarte.erklaerung (mehrere Absätze)
   Phase 3 Sicherung     → lernkarte.merke  (+ Sicherungsaufgabe, Typ
                            choice/assign, step 1)
   Phase 4 Musterbeispiel→ lernkarte.beispiel mit Schritten (+ Video)
   Phase 5 Übungsphase   → Aufgaben step 2–3, Übungslinks, Übungsblatt
   Phase 6 Vertiefung    → Aufgabe step 4 (Transfer / handschriftlich)

   Zusätzlich geprüft: Schrittweite je Lernweg (wie viele Aufgaben
   trägt ein Kind auf Pfad A/B/C) und ob die Progression innerhalb
   eines Pfades lückenlos ist.

   Aufruf:  node werkzeuge/aufbau-pruefen.js [--json] [--bereich pz]
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const NUR_JSON = process.argv.includes('--json');
const bereichIdx = process.argv.indexOf('--bereich');
const NUR_BEREICH = bereichIdx > -1 ? process.argv[bereichIdx + 1] : null;

/* Wie viele Aufgaben ein Lernweg tragen soll. Untergrenze = die Stufe
   trägt zu wenig, um zu festigen. Obergrenze = das Kind steigt aus.
   Pfad A darf weniger tragen: kleinere Schritte, dafür mehr Führung. */
const SPANNE = {
  A: { min: 3, max: 7 },
  B: { min: 4, max: 8 },
  C: { min: 3, max: 8 }
};

function lies(datei) {
  return JSON.parse(fs.readFileSync(datei, 'utf8'));
}

function einheiten() {
  const index = lies(path.join(WURZEL, 'units', 'index.json'));
  const liste = [];
  for (const bereich of index.bereiche || []) {
    if (NUR_BEREICH && bereich.code !== NUR_BEREICH) continue;
    for (const einheit of bereich.einheiten || []) {
      liste.push({
        bereich: bereich.code,
        bereichTitel: bereich.title,
        id: einheit.id,
        titel: einheit.title,
        datei: path.join(WURZEL, 'units', bereich.code, einheit.id, 'tasks.json')
      });
    }
  }
  return liste;
}

/* ---------- Phasenprüfung einer Lernkarte ---------- */
function phasenEinerStufe(daten, stufe) {
  const lk = daten.lernkarten?.[stufe] || null;
  const aufgaben = (daten.tasks || []).filter(t => t.path === stufe);
  const schritte = new Set(aufgaben.map(t => t.step));

  const sicherungsAufgabe = aufgaben.some(
    t => t.step === 1 && (t.type === 'choice' || t.type === 'assign')
  );

  return {
    stufe,
    aufgaben: aufgaben.length,
    schritte: [...schritte].sort((a, b) => a - b),
    p1_einstieg: Boolean(lk?.hinfuehrung),
    p1_animation: lk?.visual?.type === 'animation',
    p1_visual: Boolean(lk?.visual),
    p2_erarbeitung: (lk?.erklaerung || []).length >= 2,
    p3_merkkasten: Boolean(lk?.merke),
    p3_sicherungsaufgabe: sicherungsAufgabe,
    p4_musterbeispiel: Boolean(lk?.beispiel?.schritte?.length),
    p5_uebung: aufgaben.filter(t => t.step === 2 || t.step === 3).length,
    p6_vertiefung: aufgaben.filter(t => t.step === 4).length
  };
}

function pruefeEinheit(eintrag) {
  const daten = lies(eintrag.datei);
  const ordner = path.dirname(eintrag.datei);

  const stufen = ['A', 'B', 'C'].map(s => phasenEinerStufe(daten, s));
  const videos = (daten.videos || []).length;
  const links = (daten.uebungslinks || []).length;
  const blaetter = ['a', 'b', 'c'].filter(s =>
    fs.existsSync(path.join(ordner, `uebungsblatt-${s}.pdf`)));

  const maengel = [];

  stufen.forEach(s => {
    const spanne = SPANNE[s.stufe];
    if (s.aufgaben < spanne.min) {
      maengel.push(`Pfad ${s.stufe}: nur ${s.aufgaben} Aufgaben (mindestens ${spanne.min}) — der Schritt trägt zu wenig zum Festigen`);
    }
    if (s.aufgaben > spanne.max) {
      maengel.push(`Pfad ${s.stufe}: ${s.aufgaben} Aufgaben (höchstens ${spanne.max}) — der Schritt ist zu groß für eine Stunde`);
    }
    if (!s.p1_einstieg) maengel.push(`Pfad ${s.stufe}: Phase 1 fehlt (keine Hinführung)`);
    if (!s.p1_visual) maengel.push(`Pfad ${s.stufe}: Phase 1 ohne Anschauung (kein visual)`);
    else if (!s.p1_animation) maengel.push(`Pfad ${s.stufe}: Phase 1 nur statisch (visual ist keine Animation)`);
    if (!s.p2_erarbeitung) maengel.push(`Pfad ${s.stufe}: Phase 2 zu knapp (weniger als zwei Erklärungsabsätze)`);
    if (!s.p3_merkkasten) maengel.push(`Pfad ${s.stufe}: Phase 3 fehlt (kein Merkkasten)`);
    if (!s.p3_sicherungsaufgabe) maengel.push(`Pfad ${s.stufe}: Phase 3 ohne Sicherungsaufgabe (keine Auswahl-/Zuordnungsaufgabe auf Stufe 1)`);
    if (!s.p4_musterbeispiel) maengel.push(`Pfad ${s.stufe}: Phase 4 fehlt (kein durchgerechnetes Beispiel)`);
    if (s.p5_uebung < 2) maengel.push(`Pfad ${s.stufe}: Phase 5 zu dünn (${s.p5_uebung} Übungsaufgaben auf Stufe 2–3)`);
    if (s.p6_vertiefung < 1) maengel.push(`Pfad ${s.stufe}: Phase 6 fehlt (keine Transferaufgabe auf Stufe 4)`);

    /* Lückenlose Progression: Wer Stufe 3 hat, muss auch Stufe 2 haben. */
    for (let i = 1; i < s.schritte.length; i++) {
      if (s.schritte[i] - s.schritte[i - 1] > 1) {
        maengel.push(`Pfad ${s.stufe}: Sprung von Stufe ${s.schritte[i - 1]} auf ${s.schritte[i]} — dazwischen fehlt die Zwischenstufe`);
      }
    }
  });

  if (!videos) maengel.push('Phase 4: kein Erklärvideo hinterlegt');
  if (!links) maengel.push('Phase 5: keine externen Übungen verlinkt');
  if (blaetter.length < 3) {
    maengel.push(`Phase 5: Übungsblätter unvollständig (vorhanden: ${blaetter.join(', ') || 'keine'})`);
  }

  return {
    ...eintrag,
    datei: path.relative(WURZEL, eintrag.datei),
    stufen,
    videos,
    links,
    blaetter,
    maengel
  };
}

function main() {
  const ergebnisse = einheiten().map(e => {
    try { return pruefeEinheit(e); }
    catch (fehler) {
      return { ...e, datei: path.relative(WURZEL, e.datei), stufen: [], maengel: ['Datei nicht lesbar: ' + fehler.message] };
    }
  });

  if (NUR_JSON) {
    process.stdout.write(JSON.stringify(ergebnisse, null, 2));
    return;
  }

  /* Nach Mangelart zusammenfassen — 54 Einheiten einzeln durchzulesen
     hilft niemandem, das Muster dahinter schon. */
  const proMangel = new Map();
  ergebnisse.forEach(r => r.maengel.forEach(m => {
    const art = m.replace(/^Pfad [ABC]: /, '').replace(/\(.*\)/, '').replace(/\d+/g, 'N').trim();
    if (!proMangel.has(art)) proMangel.set(art, []);
    proMangel.get(art).push(r.id.toUpperCase());
  }));

  console.log('\n=== Aufbau der Lernabschnitte · Prüfbericht ===\n');
  console.log(`Geprüft: ${ergebnisse.length} Einheiten\n`);

  console.log('--- Häufigkeit der Abweichungen ---');
  [...proMangel.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([art, ids]) => {
    console.log(`${String(ids.length).padStart(3)}×  ${art}`);
    if (ids.length <= 8) console.log(`      ${[...new Set(ids)].join(', ')}`);
  });

  console.log('\n--- Aufgaben je Lernweg ---');
  console.log('Einheit    A   B   C   Stufen A/B/C');
  ergebnisse.forEach(r => {
    const s = Object.fromEntries(r.stufen.map(x => [x.stufe, x]));
    console.log(
      r.id.toUpperCase().padEnd(9),
      String(s.A?.aufgaben ?? 0).padStart(2),
      String(s.B?.aufgaben ?? 0).padStart(3),
      String(s.C?.aufgaben ?? 0).padStart(3),
      '  ' + ['A', 'B', 'C'].map(k => (s[k]?.schritte || []).join('') || '–').join(' / ')
    );
  });

  const sauber = ergebnisse.filter(r => !r.maengel.length);
  console.log(`\nOhne Abweichung: ${sauber.length} von ${ergebnisse.length}`);
  if (sauber.length) console.log(sauber.map(r => r.id.toUpperCase()).join(', '));
  console.log('');
}

main();
