#!/usr/bin/env node
/* ============================================================
   nachfass-luecken.js · Arbeitsliste für die Nachfassaufgaben

   Aufruf:  node werkzeuge/nachfass-luecken.js [PZ|LF|KP|SK]

   Eine Nachfassaufgabe erscheint nur, wenn der Pool zu einer
   Fehlvorstellung eine ZWEITE Aufgabe führt. Dieses Werkzeug sagt, wo
   das nicht der Fall ist — und in welcher Aufgabe derselbe Denkfehler
   fachlich auftreten könnte.

   Bewusst KEIN automatisches Nachtragen: Eine Fehlvorstellung braucht den
   konkreten falschen Wert und einen Rückmeldesatz. Beides ist eine
   fachliche Entscheidung; geraten wäre es schlimmer als offen zu bleiben.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const nurBereich = (process.argv[2] || '').toUpperCase();
const LEICHTER = { A: [], B: ['A'], C: ['B', 'A'] };

function stamm(id) {
  return String(id).replace(/_(vol|volumen|flaeche|bei_volumen|bei_flaeche|fehlt|uebersehen|vertauscht|beim_teilen)$/, '');
}

function fehlvorstellungen(t) {
  const alle = [...(t.misconceptions || [])];
  for (const f of t.fields || []) alle.push(...(f.misconceptions || []));
  return alle;
}

const zeilen = [];
let offen = 0, gesamt = 0;

const basis = path.join(WURZEL, 'units');
for (const bereich of fs.readdirSync(basis)) {
  const b = path.join(basis, bereich);
  if (!fs.statSync(b).isDirectory()) continue;
  for (const ordner of fs.readdirSync(b)) {
    const datei = path.join(b, ordner, 'tasks.json');
    if (!fs.existsSync(datei)) continue;
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    if (nurBereich && !d.unit.startsWith(nurBereich)) continue;

    const proPfad = { A: new Map(), B: new Map(), C: new Map() };
    for (const t of d.tasks || []) {
      for (const m of fehlvorstellungen(t)) {
        const k = stamm(m.id);
        if (!proPfad[t.path].has(k)) proPfad[t.path].set(k, []);
        proPfad[t.path].get(k).push(t.id);
      }
    }

    for (const pfad of ['A', 'B', 'C']) {
      for (const [k, aufgaben] of proPfad[pfad]) {
        gesamt++;
        const auchLeichter = LEICHTER[pfad].some(p => proPfad[p].has(k));
        if (aufgaben.length >= 2 || auchLeichter) continue;
        offen++;
        /* Welche Aufgaben desselben Pfades hätten fachlich Platz? Alles,
           was diesen Denkfehler noch nicht führt. */
        const kandidaten = (d.tasks || [])
          .filter(t => t.path === pfad && !aufgaben.includes(t.id)
                    && ['numeric', 'multi'].includes(t.type))
          .map(t => t.id)
          .slice(0, 3);
        zeilen.push({ unit: d.unit, pfad, id: k, hat: aufgaben[0], kandidaten });
      }
    }
  }
}

console.log(`Fehlvorstellungen je Pfad: ${gesamt} · davon ohne zweite Aufgabe: ${offen} (${Math.round(offen / gesamt * 100)} %)\n`);

let letzte = '';
for (const z of zeilen) {
  const kopf = z.unit + ' · Pfad ' + z.pfad;
  if (kopf !== letzte) { console.log('\n' + kopf); letzte = kopf; }
  console.log(`  ${z.id}`);
  console.log(`      bisher nur in: ${z.hat}`);
  console.log(`      denkbar in:    ${z.kandidaten.join(', ') || '— keine weitere Rechenaufgabe auf diesem Pfad'}`);
}

console.log('\nJe Eintrag zu ergänzen: der falsche Wert, der bei diesem Denkfehler');
console.log('herauskommt, und ein Rückmeldesatz. Danach greift die Nachfassaufgabe.');
