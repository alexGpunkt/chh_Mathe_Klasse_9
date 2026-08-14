#!/usr/bin/env node
/* ============================================================
   uebungsblaetter.js · Handschriftliche Übungsblätter als PDF

   Aufruf:  node werkzeuge/uebungsblaetter.js            (alle 54)
            node werkzeuge/uebungsblaetter.js pz-08      (nur eines)

   Erzeugt je Einheit  units/<bereich>/<id>/uebungsblatt.pdf.

   Warum überhaupt gedruckt: Der digitale Weg prüft Ergebnisse, nicht
   Rechenwege. Wer nur tippt, übt das Aufschreiben nicht — und in der
   Klassenarbeit wird aufgeschrieben. Das Blatt kommt deshalb NACH dem
   digitalen Teil und behandelt dasselbe Thema mit anderen Zahlen.

   Warum vorab erzeugt statt im Browser: Ein PDF, das erst auf dem Gerät
   entsteht, ist offline nicht da und lässt sich nicht vorab kontrollieren.
   Die Blätter liegen im Repository, sind druckbar und für alle gleich.

   Der Selbstkontrollkasten am Ende enthält die richtigen Lösungen gemischt
   mit ebenso vielen falschen. Die falschen sind keine Zufallszahlen,
   sondern die typischen Fehler aus dem Aufgabenpool — wer „das kommt hin"
   denkt, findet dort genau sein Ergebnis wieder und muss noch einmal
   hinsehen.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { PDF } = require('./pdf.js');
const ausdruck = require('../assets/js/ausdruck.js');

const WURZEL = path.resolve(__dirname, '..');
const ORDNER = path.join(WURZEL, 'uebungsblaetter');
const nurEinheit = (process.argv[2] || '').toLowerCase();

/* ---------- Zufall mit Saat ----------
   Dieselbe Einheit muss dasselbe Blatt ergeben, sonst unterscheidet sich das
   ausgeteilte Papier von der Datei im Repository. baue() greift auf
   Math.random zu; die Saat wird deshalb für die Dauer der Erzeugung
   untergeschoben und danach zurückgegeben. */
function saatZufall(saat) {
  let z = saat >>> 0;
  return () => {
    z ^= z << 13; z >>>= 0;
    z ^= z >> 17;
    z ^= z << 5; z >>>= 0;
    return z / 4294967296;
  };
}
function saatAus(text) {
  let h = 2166136261;
  for (const zeichen of String(text)) {
    h ^= zeichen.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mitSaat(saat, arbeit) {
  const echt = Math.random;
  Math.random = saatZufall(saat);
  try { return arbeit(); }
  finally { Math.random = echt; }
}

function mischen(liste, zufall) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function zahlText(wert, einheit) {
  const text = einheit === '€' ? ausdruck.fmtGeld(wert) : ausdruck.fmt(wert);
  return einheit ? `${text} ${einheit}` : text;
}

/* ---------- Falsche Lösungen für den Kontrollkasten ----------
   Erste Wahl sind die hinterlegten Fehlvorstellungen: Sie sind die Fehler,
   die tatsächlich gemacht werden. Reichen sie nicht, kommen bewusst
   *plausible* Abweichungen dazu — Faktor 10, Zehnerdreher, Vorzeichen.
   Eine Zufallszahl wäre wertlos: Sie fällt sofort auf und der Kasten
   verlöre seinen Zweck. */
function falscheLoesungen(aufgabe, anzahl, zufall, belegt) {
  const kandidaten = [];
  const merken = wert => {
    if (!Number.isFinite(wert)) return;
    const gerundet = Math.round(wert * 1000) / 1000;
    if (belegt.has(gerundet)) return;
    if (kandidaten.some(k => Math.abs(k - gerundet) < 1e-9)) return;
    kandidaten.push(gerundet);
  };

  for (const m of aufgabe.misconceptions) merken(m.value);

  const a = aufgabe.answer;
  const abweichungen = [a * 10, a / 10, a * 2, a / 2, a + 10, a - 10, 0 - a,
    a * 100, a / 100, a + 1, a - 1, a * 3, a / 3];
  for (const wert of abweichungen) {
    if (kandidaten.length >= anzahl) break;
    /* Keine negativen Preise oder Längen erfinden. */
    if (wert < 0 && a > 0) continue;
    merken(Math.round(wert * 1000) / 1000);
  }

  return mischen(kandidaten, zufall).slice(0, anzahl);
}

/* Welche Generatoren gehören auf welchen Lernweg? Ohne "pfade" gilt ein
   Generator auf allen dreien — so bleibt Stufe B der geprüfte Bestand. */
function fuerPfad(aufgaben, stufe) {
  return aufgaben.filter(gen => !Array.isArray(gen.pfade) || gen.pfade.includes(stufe));
}

const STUFE_NAME = { A: 'Basis', B: 'Standard', C: 'Vertiefung' };

function blattBauen(bereich, einheitId, blatt, einheitTitel, stufe) {
  /* Eigene Saat je Lernweg: Sonst stünden auf dem A- und dem B-Blatt
     dieselben Zahlen, und der Wechsel des Lernwegs brächte nichts Neues. */
  const saat = saatAus('mathe9-uebungsblatt-' + einheitId + '-' + stufe);
  const zufall = saatZufall(saat);

  const gewaehlt = fuerPfad(blatt.aufgaben, stufe);
  const aufgaben = mitSaat(saat, () => gewaehlt.map(gen => ausdruck.baue(gen, stufe)));

  const doc = new PDF();

  /* ---------- Kopf ---------- */
  doc.text(`${einheitId.toUpperCase()} · ${einheitTitel}`, { groesse: 16, fett: true, abstand: 2 });
  doc.text(`Übungsblatt zur Nachbereitung — von Hand rechnen · Stufe ${stufe} (${STUFE_NAME[stufe]})`,
    { groesse: 11, abstand: 10 });
  doc.linie(doc.rand, doc.y + 4, doc.breite - doc.rand, doc.y + 4, 1);
  doc.luecke(14);

  doc.text('Name: ______________________________     Klasse: ____________     Datum: ______________',
    { groesse: 10, abstand: 12 });

  if (blatt.auftrag) {
    const hoehe = doc.hoeheVon(blatt.auftrag, 10, false, 2) + 12;
    doc.rahmen(hoehe, { fuellung: [0.95, 0.96, 0.97] });
    const merk = doc.y;
    doc.y -= 8;
    doc.text(blatt.auftrag, { groesse: 10, abstand: 2, x: doc.rand + 10 });
    doc.y = merk - hoehe - 14;
  }

  /* ---------- Aufgaben ---------- */
  aufgaben.forEach((aufgabe, i) => {
    doc.platzPruefen(140);
    doc.text(`Aufgabe ${i + 1}`, { groesse: 11, fett: true, abstand: 3 });
    doc.text(aufgabe.prompt, { groesse: 11, abstand: 4 });
    doc.luecke(4);
    doc.schreibfeld(96);
    doc.luecke(16);
  });

  /* ---------- Selbstkontrolle ---------- */
  doc.platzPruefen(150);
  doc.luecke(6);
  doc.text('Selbstkontrolle', { groesse: 12, fett: true, abstand: 4 });
  doc.text('In diesem Kasten stehen alle richtigen Lösungen — und ebenso viele falsche. '
    + 'Vergleiche erst, wenn du fertig gerechnet hast. Findest du dein Ergebnis nicht, '
    + 'rechne die Aufgabe noch einmal. Findest du es, prüfe trotzdem deinen Rechenweg: '
    + 'Die Hälfte der Zahlen hier ist falsch.', { groesse: 9.5, abstand: 3 });
  doc.luecke(6);

  const richtige = aufgaben.map(a => Math.round(a.answer * 1000) / 1000);
  const belegt = new Set(richtige);
  const falsche = [];
  for (const aufgabe of aufgaben) {
    const neu = falscheLoesungen(aufgabe, 1, zufall, belegt);
    for (const wert of neu) { falsche.push({ wert, einheit: aufgabe.unit_label }); belegt.add(wert); }
  }

  const alle = mischen(
    [...aufgaben.map(a => ({ wert: Math.round(a.answer * 1000) / 1000, einheit: a.unit_label })), ...falsche],
    zufall
  );
  const text = alle.map(e => zahlText(e.wert, e.einheit)).join('     ');
  const kastenHoehe = doc.hoeheVon(text, 12, true, 4) + 20;
  doc.rahmen(kastenHoehe, { fuellung: [0.97, 0.97, 0.94] });
  const merk = doc.y;
  doc.y -= 12;
  doc.text(text, { groesse: 12, fett: true, abstand: 4, x: doc.rand + 10 });
  doc.y = merk - kastenHoehe - 12;

  /* ---------- Rechenwege ---------- */
  doc.platzPruefen(120);
  doc.luecke(4);
  doc.text('Rechenwege zum Vergleich (erst nach dem Rechnen ansehen)',
    { groesse: 10, fett: true, abstand: 4 });
  aufgaben.forEach((aufgabe, i) => {
    if (!aufgabe.solution) return;
    doc.text(`${i + 1}.  ${aufgabe.solution}`, { groesse: 9.5, abstand: 3, farbe: [0.35, 0.35, 0.35] });
  });

  return { pdf: doc.bauen(`${einheitId.toUpperCase()} Übungsblatt Stufe ${stufe}`), aufgaben };
}

/* ---------- Durchlauf ---------- */
const index = JSON.parse(fs.readFileSync(path.join(WURZEL, 'units', 'index.json'), 'utf8'));
const titel = new Map();
for (const b of index.bereiche || []) {
  for (const e of b.einheiten || []) titel.set(String(e.id).toLowerCase(), e.title);
}

let geschrieben = 0;
let aufgabenGesamt = 0;
for (const datei of fs.readdirSync(ORDNER).filter(f => f.endsWith('.json')).sort()) {
  const daten = JSON.parse(fs.readFileSync(path.join(ORDNER, datei), 'utf8'));
  const bereich = String(daten.bereich || '').toLowerCase();

  for (const [einheitId, blatt] of Object.entries(daten.einheiten || {})) {
    if (nurEinheit && einheitId !== nurEinheit) continue;
    const ordner = path.join(WURZEL, 'units', bereich, einheitId);
    if (!fs.existsSync(ordner)) {
      console.error(`Ordner fehlt: ${ordner}`);
      process.exit(1);
    }
    for (const stufe of ['A', 'B', 'C']) {
      const gewaehlt = fuerPfad(blatt.aufgaben, stufe);
      if (!gewaehlt.length) {
        console.error(`${einheitId}: kein Generator für Stufe ${stufe}`);
        process.exit(1);
      }
      const { pdf, aufgaben } = blattBauen(bereich, einheitId, blatt, titel.get(einheitId) || '', stufe);
      fs.writeFileSync(path.join(ordner, `uebungsblatt-${stufe.toLowerCase()}.pdf`), pdf);
      geschrieben++;
      aufgabenGesamt += aufgaben.length;
    }
  }
}

console.log(`${geschrieben} Übungsblätter mit ${aufgabenGesamt} Aufgaben geschrieben.`);
console.log('Die Blätter sind bei gleicher Datenlage reproduzierbar — gleiche Saat, gleiche Zahlen.');
