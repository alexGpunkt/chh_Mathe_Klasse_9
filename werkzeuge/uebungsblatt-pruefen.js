#!/usr/bin/env node
/* ============================================================
   uebungsblatt-pruefen.js · Generatoren der Übungsblätter prüfen

   Aufruf:  node werkzeuge/uebungsblatt-pruefen.js [PZ|LF|KP|SK]
   Rückgabe: 0 = alles in Ordnung, 1 = mindestens ein Fehler

   Ein gedrucktes Blatt lässt sich nicht nachträglich korrigieren. Deshalb
   wird jeder Generator hier mit vielen zufälligen Zahlen durchgerechnet und
   dabei geprüft, was sich maschinell prüfen lässt:

     · Der Ausdruck ist auswertbar, das Ergebnis endlich.
     · Das Ergebnis ist bei der angegebenen Rundung EXAKT — 33,333… wäre
       auf einem handschriftlichen Blatt nicht kontrollierbar.
     · Im Aufgabentext bleibt kein Platzhalter {…} und keine interne
       Code-Schreibweise wie h_Dreieck stehen.
     · Die falschen Antworten unterscheiden sich vom richtigen Ergebnis.
     · Die Bedingung ist erfüllbar (sonst hängt der Generator).
     · Ergebnisse sind nicht negativ, wo das sachlich unmöglich ist.

   Was hier NICHT geprüft werden kann: ob die Formel fachlich die richtige
   ist. Ein Generator, der konsequent falsch rechnet, läuft hier grün durch.
   Dagegen hilft nur, den Rechenweg in `solution` zu lesen — er steht auf
   dem Blatt und muss zum Ergebnis passen.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { werteAus, fuelle, baue } = require('../assets/js/ausdruck.js');

const WURZEL = path.resolve(__dirname, '..');
const ORDNER = path.join(WURZEL, 'uebungsblaetter');
const PROBEN = 300;
const nurBereich = (process.argv[2] || '').toUpperCase();

const fehler = [];
const hinweis = [];
let generatoren = 0;
let einheiten = 0;

/* Ohne Einheit sind manche Ergebnisse sachlich immer positiv (Preise,
   Längen, Anzahlen). Ein negatives Ergebnis wäre dort ein Rechenfehler
   im Generator, kein gültiger Zufall. */
const NIE_NEGATIV = ['€', '%', 'kg', 'l', 'h', 'Tage', 'Kinder', 'Bäume', 'Kisten',
  'Packungen', 'Personen', 'Mitglieder', 'cm', 'cm²', 'cm³', 'm', 'm²', 'm³',
  'dm³', 'mm', 'km', 'Liter', 'g', 'Minuten', 'Stück'];

function pruefeGenerator(bereich, einheit, gen) {
  generatoren++;
  const wo = `${bereich}/${einheit}/${gen.id || '(ohne id)'}`;
  if (!gen.id) fehler.push(`${wo}: id fehlt`);
  if (!gen.template) fehler.push(`${wo}: template fehlt`);
  if (!gen.answer) fehler.push(`${wo}: answer fehlt`);
  if (!gen.solution) hinweis.push(`${wo}: kein Rechenweg (solution) — auf dem Blatt fehlt dann die Kontrolle`);

  const stellen = gen.round ?? 2;
  let gebaut = 0;
  const gesehen = new Set();

  for (let i = 0; i < PROBEN; i++) {
    let a;
    try { a = baue(gen); }
    catch (e) {
      /* Eine unerfüllbare Bedingung meldet baue() selbst — einmal reicht. */
      fehler.push(`${wo}: ${e.message}`);
      return;
    }
    gebaut++;
    gesehen.add(a.prompt);

    if (!Number.isFinite(a.answer)) {
      fehler.push(`${wo}: Ergebnis ist keine Zahl bei „${a.prompt}"`);
      return;
    }

    /* Exaktheit: Der ungerundete Wert muss der gerundeten Ausgabe
       entsprechen, sonst steht auf dem Blatt eine gerundete Lösung, die
       das Kind beim Nachrechnen nicht trifft. */
    const roh = werteAus(gen.answer, a.vars);
    if (Number.isFinite(roh)) {
      if (gen.gerundet) {
        /* Manche Aufgaben werden sachlich gerundet — Zinsen auf Cent etwa.
           Dann muss der Aufgabentext das sagen, und die Rundung darf nicht
           auf der Kippe stehen: Bei genau …,xx5 rundet nicht jedes Kind
           gleich, und die gedruckte Lösung stimmt für die Hälfte nicht. */
        if (!/[Rr]unde/.test(gen.template)) {
          fehler.push(`${wo}: gerundet gesetzt, aber der Aufgabentext verlangt kein Runden`);
          return;
        }
        const kante = Math.abs((Math.abs(roh) * 10 ** stellen) % 1 - 0.5);
        if (kante < 1e-6) {
          fehler.push(`${wo}: ${roh} liegt genau auf der Rundungsgrenze bei „${a.prompt}"`);
          return;
        }
      } else if (Math.abs(roh - a.answer) >= 1e-9) {
        fehler.push(`${wo}: Ergebnis ${roh} ist bei ${stellen} Stellen nicht exakt (→ ${a.answer}) bei „${a.prompt}"`);
        return;
      }
    }

    if (/\{[^}]*\}/.test(a.prompt)) {
      fehler.push(`${wo}: Platzhalter im Aufgabentext geblieben: „${a.prompt}"`);
      return;
    }
    if (a.solution && /\{[^}]*\}/.test(a.solution)) {
      fehler.push(`${wo}: Platzhalter im Rechenweg geblieben: „${a.solution}"`);
      return;
    }

    const codeSchreibweise = /\b[A-Za-zÄÖÜäöüß]+_[A-Za-zÄÖÜäöüß]+\b/;
    if (codeSchreibweise.test(a.prompt)) {
      fehler.push(`${wo}: interne Code-Schreibweise im Aufgabentext: „${a.prompt}"`);
      return;
    }
    if (a.solution && codeSchreibweise.test(a.solution)) {
      fehler.push(`${wo}: interne Code-Schreibweise im Rechenweg: „${a.solution}"`);
      return;
    }

    if (a.answer < 0 && NIE_NEGATIV.includes(gen.unit_label)) {
      fehler.push(`${wo}: negatives Ergebnis ${a.answer} ${gen.unit_label} bei „${a.prompt}"`);
      return;
    }

    for (const m of a.misconceptions) {
      if (Math.abs(m.value - a.answer) < 1e-9) {
        fehler.push(`${wo}: falsche Antwort „${m.id}" ist gleich der richtigen (${a.answer})`);
        return;
      }
      if (!Number.isFinite(m.value)) {
        fehler.push(`${wo}: falsche Antwort „${m.id}" ist keine Zahl`);
        return;
      }
    }
  }

  /* Ein Generator, der immer dieselbe Aufgabe liefert, ist keiner. */
  if (gebaut === PROBEN && gesehen.size < 3) {
    hinweis.push(`${wo}: liefert nur ${gesehen.size} verschiedene Aufgaben`);
  }
}

/* ---------- Durchlauf ---------- */
if (!fs.existsSync(ORDNER)) {
  console.error('Ordner uebungsblaetter/ fehlt.');
  process.exit(1);
}

for (const datei of fs.readdirSync(ORDNER).filter(f => f.endsWith('.json')).sort()) {
  const daten = JSON.parse(fs.readFileSync(path.join(ORDNER, datei), 'utf8'));
  const bereich = String(daten.bereich || '').toUpperCase();
  if (nurBereich && bereich !== nurBereich) continue;

  for (const [einheit, blatt] of Object.entries(daten.einheiten || {})) {
    einheiten++;
    if (!blatt.auftrag) hinweis.push(`${bereich}/${einheit}: kein Arbeitsauftrag`);
    const aufgaben = blatt.aufgaben || [];
    if (aufgaben.length < 4) {
      fehler.push(`${bereich}/${einheit}: nur ${aufgaben.length} Aufgaben — mindestens 4 erwartet`);
    }
    const ids = new Set();
    for (const gen of aufgaben) {
      if (ids.has(gen.id)) fehler.push(`${bereich}/${einheit}: Aufgaben-ID ${gen.id} ist doppelt`);
      ids.add(gen.id);
      pruefeGenerator(bereich, einheit, gen);
    }
  }
}

console.log(`${einheiten} Übungsblätter, ${generatoren} Generatoren, je ${PROBEN} Proben gerechnet.`);
if (hinweis.length) {
  console.log(`\nHinweise (${hinweis.length}):`);
  hinweis.forEach(h => console.log('  ! ' + h));
}
if (fehler.length) {
  console.log(`\nFehler (${fehler.length}):`);
  fehler.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('\nAlle Generatoren rechnen sauber durch.');
