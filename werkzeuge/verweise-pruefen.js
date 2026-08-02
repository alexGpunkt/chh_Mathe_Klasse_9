#!/usr/bin/env node
/* ============================================================
   verweise-pruefen.js · Absatzverweise zur fachlichen Durchsicht

   Aufruf:  node werkzeuge/verweise-pruefen.js [PZ|LF|KP|SK]

   Die Verweise `misconceptions[].verweis.absatz` wurden regelbasiert
   erzeugt: zugeordnet wurde, wo Rückmeldung und Absatz mindestens zwei
   inhaltstragende Wörter teilen. Das ist eine Heuristik, keine fachliche
   Aussage — deshalb dieses Werkzeug. Es stellt jeden Verweis so dar, dass
   sich in einem Blick beurteilen lässt, ob er stimmt:

       Denkfehler → Rückmeldung → verlinkter Absatz

   Passt er nicht, genügt es, `verweis.absatz` in der tasks.json zu ändern
   oder das Feld zu löschen; ohne Feld springt die Anwendung wie zuvor zur
   Animation beziehungsweise zum Merksatz.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const nurBereich = (process.argv[2] || '').toUpperCase();

function umbrechen(text, breite, einzug) {
  const worte = String(text).split(/\s+/);
  const zeilen = [];
  let zeile = '';
  for (const w of worte) {
    if ((zeile + ' ' + w).trim().length > breite) { zeilen.push(zeile.trim()); zeile = w; }
    else zeile += ' ' + w;
  }
  if (zeile.trim()) zeilen.push(zeile.trim());
  return zeilen.map((z, i) => (i ? einzug : '') + z).join('\n');
}

let anzahl = 0, ohne = 0;
const basis = path.join(WURZEL, 'units');

for (const bereich of fs.readdirSync(basis)) {
  const b = path.join(basis, bereich);
  if (!fs.statSync(b).isDirectory()) continue;

  for (const ordner of fs.readdirSync(b)) {
    const datei = path.join(b, ordner, 'tasks.json');
    if (!fs.existsSync(datei)) continue;
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    if (nurBereich && !d.unit.startsWith(nurBereich)) continue;

    const zeilen = [];
    for (const t of d.tasks || []) {
      const alle = [...(t.misconceptions || []),
                    ...(t.fields || []).flatMap(f => f.misconceptions || [])];
      for (const m of alle) {
        const a = m.verweis && m.verweis.absatz;
        if (!Number.isInteger(a)) { ohne++; continue; }
        const absaetze = ((d.lernkarten || {})[t.path] || {}).erklaerung || [];
        anzahl++;
        zeilen.push(
          `  ${t.id} · Pfad ${t.path} · ${m.id}` +
          (m.konzeptfehler ? `  [${m.konzeptfehler}]` : '') + '\n' +
          '     Rückmeldung: ' + umbrechen(m.feedback, 66, '                  ') + '\n' +
          `     → Absatz ${a}:  ` + umbrechen(absaetze[a] || '(fehlt!)', 66, '                  ') + '\n'
        );
      }
    }
    if (zeilen.length) {
      console.log('\n=== ' + d.unit + ' · ' + d.title + ' ===');
      console.log(zeilen.join('\n'));
    }
  }
}

console.log(`\n${anzahl} Verweise zur Durchsicht · ${ohne} Fehlvorstellungen ohne Verweis`);
console.log('Ohne Verweis ist kein Mangel: Dann springt die Anwendung zur Animation');
console.log('der eigenen Stufe, sonst zum Merksatz. Das ist thematisch immer richtig.');
