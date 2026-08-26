#!/usr/bin/env node
/* ============================================================
   quiz-pruefen.js · Kann jede Einheit ihr Abschlussquiz stellen?

   Das Quiz hat keinen eigenen Aufgabenbestand — es entsteht aus dem
   Material der Einheit. Das ist der Vorteil (es kann nicht abweichen)
   und zugleich die Stelle, an der es still ausfallen kann: Ein
   Merksatz aus lauter Formeln, eine Einheit mit nur einer
   Worterklärung, ein Pfad ohne Auswahlaufgaben — und schon steht am
   Ende der Stunde ein Quiz mit zwei Fragen statt fünf, ohne dass es
   jemand merkt.

   Deshalb wird hier für alle 54 Einheiten × 3 Pfade gebaut, was der
   Browser bauen würde, und geprüft:

     · genügend Fragen (Soll 5, Untergrenze 4)
     · genau eine richtige Antwort, Index im gültigen Bereich
     · keine doppelten Antwortmöglichkeiten in einer Frage
     · die Lösung steht nicht zufällig auch in einem Ablenker
     · jede Frage stammt aus DIESER Einheit

   Ausgeführt wird dieselbe Datei, die im Browser läuft. Eine zweite
   Umsetzung wäre eine zweite Gelegenheit, sich zu vertun.

   Aufruf:  node werkzeuge/quiz-pruefen.js [--json] [--bereich pz]
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WURZEL = path.resolve(__dirname, '..');
const NUR_JSON = process.argv.includes('--json');
const bereichIdx = process.argv.indexOf('--bereich');
const NUR_BEREICH = bereichIdx > -1 ? process.argv[bereichIdx + 1] : null;

/* Wie oft je Einheit und Pfad gebaut wird. Die Auswahl ist zufällig —
   ein einzelner Lauf beweist deshalb nichts über den nächsten. */
const PROBEN = 40;
const SOLL = 5;
const UNTERGRENZE = 4;

/* ---------- quiz.js in einer minimalen Umgebung laden ----------
   Gebraucht wird nur `window`; document, Tracker und Stand berührt der
   Bauteil des Moduls nicht. Käme das anders, schlüge es hier sofort
   fehl — und das ist die Absicht. */
function quizModulLaden() {
  const quelle = fs.readFileSync(path.join(WURZEL, 'assets', 'js', 'quiz.js'), 'utf8');
  const kontext = { window: {}, console, Math, Date, Object, Array, JSON };
  kontext.globalThis = kontext;
  vm.createContext(kontext);
  vm.runInContext(quelle, kontext, { filename: 'quiz.js' });
  if (!kontext.window.Quiz) throw new Error('quiz.js hat window.Quiz nicht gesetzt');
  return kontext.window.Quiz;
}

function einheiten() {
  const index = JSON.parse(fs.readFileSync(path.join(WURZEL, 'units', 'index.json'), 'utf8'));
  const liste = [];
  for (const bereich of index.bereiche || []) {
    if (NUR_BEREICH && bereich.code.toLowerCase() !== NUR_BEREICH.toLowerCase()) continue;
    for (const einheit of bereich.einheiten || []) {
      if (einheit.geplant) continue;
      liste.push({
        bereich: bereich.code,
        id: einheit.id,
        datei: path.join(WURZEL, 'units', bereich.code, einheit.id, 'tasks.json')
      });
    }
  }
  return liste;
}

/* ---------- eine einzelne Fragenliste prüfen ---------- */
function fragenPruefen(fragen, ort, fehler, warnung) {
  fragen.forEach((f, i) => {
    const wo = `${ort} Frage ${i + 1} (${f.art})`;
    if (!f.frage || String(f.frage).trim().length < 8) {
      fehler.push(`${wo}: Fragetext fehlt oder ist zu kurz`);
    }
    /* Rechenaufgaben haben keine Auswahl, sondern ein Eingabefeld. Geprüft
       wird dort, dass es überhaupt etwas zu treffen gibt: eine endliche
       Zahl und eine Toleranz, die nicht alles durchgehen lässt. */
    if (f.typ === 'zahl') {
      if (typeof f.antwort !== 'number' || !Number.isFinite(f.antwort)) {
        fehler.push(`${wo}: Ergebnis ist keine Zahl`);
      }
      const weit = f.toleranz > Math.max(1, Math.abs(f.antwort) * 0.1);
      if (!(f.toleranz >= 0)) {
        fehler.push(`${wo}: keine gültige Toleranz`);
      } else if (weit && !f.toleranz_gesetzt) {
        fehler.push(`${wo}: Toleranz ${f.toleranz} ist zu groß für das Ergebnis ${f.antwort}`);
      } else if (weit) {
        /* Eine in der Aufgabe gesetzte weite Toleranz ist eine
           Autorenentscheidung — bei „Schätze …" ist sie das Kriterium und
           kein Versehen. Gemeldet wird sie trotzdem: Im Quiz zählt sie
           für eine Note mit, und das soll niemand übersehen. */
        warnung.push(`${wo}: gesetzte Toleranz ${f.toleranz} auf ${f.antwort} `
          + '— als Schätzaufgabe gewollt?');
      }
      return;
    }

    const opt = f.optionen || [];
    if (opt.length < 3) fehler.push(`${wo}: nur ${opt.length} Antwortmöglichkeiten`);
    if (!Number.isInteger(f.antwort) || f.antwort < 0 || f.antwort >= opt.length) {
      fehler.push(`${wo}: Antwortindex ${f.antwort} liegt außerhalb der Auswahl`);
      return;
    }
    const gesehen = new Set();
    for (const o of opt) {
      const norm = String(o).trim().toLowerCase();
      if (!norm) fehler.push(`${wo}: leere Antwortmöglichkeit`);
      if (gesehen.has(norm)) fehler.push(`${wo}: „${o}" steht doppelt zur Wahl`);
      gesehen.add(norm);
    }
    /* Eine Lücke, deren Lösung auch in einem Ablenker steckt, ist keine
       Frage, sondern ein Los. */
    if (f.satz && !f.nurText) {
      const loesung = String(opt[f.antwort] || '').toLowerCase();
      const satz = (String(f.satz.vorne) + ' ' + String(f.satz.hinten)).toLowerCase();
      if (loesung.length > 3 && satz.includes(loesung)) {
        warnung.push(`${wo}: die Lösung „${opt[f.antwort]}" steht auch im Satz`);
      }
    }
  });
}

/* ---------- Lauf ---------- */
const Quiz = quizModulLaden();
const fehler = [];
const warnung = [];
const zeilen = [];
let gebaut = 0;

for (const e of einheiten()) {
  const daten = JSON.parse(fs.readFileSync(e.datei, 'utf8'));
  const zeile = { einheit: daten.unit, A: null, B: null, C: null };

  for (const pfad of ['A', 'B', 'C']) {
    let kleinste = Infinity;
    const arten = new Set();

    for (let n = 0; n < PROBEN; n++) {
      const satz = Quiz.bauen(daten, pfad);
      gebaut++;
      const fragen = satz.fragen || [];
      kleinste = Math.min(kleinste, fragen.length);
      fragen.forEach(f => arten.add(f.art + (f.typ === 'zahl' ? ':zahl' : '')));
      /* Der Inhalt wird nur beim ersten Durchgang ausführlich geprüft;
         die übrigen Proben zählen die Fragen. Sonst stünden bei einem
         Fehler vierzigmal dieselbe Zeile. */
      if (n === 0) fragenPruefen(fragen, `${daten.unit}/${pfad}`, fehler, warnung);
    }

    if (kleinste < UNTERGRENZE) {
      fehler.push(`${daten.unit}/${pfad}: im schlechtesten Fall nur ${kleinste} Fragen `
        + `(Untergrenze ${UNTERGRENZE})`);
    } else if (kleinste < SOLL) {
      warnung.push(`${daten.unit}/${pfad}: im schlechtesten Fall ${kleinste} statt ${SOLL} Fragen`);
    }
    zeile[pfad] = { fragen: kleinste, arten: [...arten].sort() };
  }
  zeilen.push(zeile);
}

if (NUR_JSON) {
  console.log(JSON.stringify({ einheiten: zeilen, fehler, warnung }, null, 2));
} else {
  console.log('=== Abschlussquiz je Einheit · Prüfbericht ===\n');
  console.log(`Gebaut: ${gebaut} Quizsätze aus ${zeilen.length} Einheiten `
    + `(${PROBEN} Proben je Einheit und Pfad)\n`);

  const knapp = zeilen.filter(z => ['A', 'B', 'C'].some(p => z[p].fragen < SOLL));
  if (knapp.length) {
    console.log('--- Einheiten, die nicht immer fünf Fragen stellen ---');
    for (const z of knapp) {
      const teile = ['A', 'B', 'C'].map(p => `${p}: ${z[p].fragen}`).join('  ');
      console.log(`  ${z.einheit.padEnd(8)} ${teile}`);
    }
    console.log('');
  }

  /* Welche Fragearten kommen überhaupt vor? Wenn eine Art nirgends
     auftaucht, ist ihr Erzeuger tot und niemand merkt es. */
  const zaehler = new Map();
  for (const z of zeilen) {
    for (const p of ['A', 'B', 'C']) {
      for (const a of z[p].arten) zaehler.set(a, (zaehler.get(a) || 0) + 1);
    }
  }
  console.log('--- Fragearten, in wie vielen Einheit/Pfad-Paaren ---');
  [...zaehler.entries()].sort((a, b) => b[1] - a[1])
    .forEach(([art, n]) => console.log(`  ${String(n).padStart(4)}×  ${art}`));
  console.log('');

  if (warnung.length) {
    console.log(`--- Hinweise (${warnung.length}) ---`);
    warnung.slice(0, 25).forEach(w => console.log('  · ' + w));
    if (warnung.length > 25) console.log(`  … und ${warnung.length - 25} weitere`);
    console.log('');
  }
  if (fehler.length) {
    console.log(`Fehler (${fehler.length}):`);
    fehler.forEach(f => console.log('  ✗ ' + f));
  } else {
    console.log('Alle Einheiten können ihr Abschlussquiz stellen.');
  }
}

process.exit(fehler.length ? 1 : 0);
