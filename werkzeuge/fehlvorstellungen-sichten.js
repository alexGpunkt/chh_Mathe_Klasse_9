#!/usr/bin/env node
/* ============================================================
   fehlvorstellungen-sichten.js · Arbeitsliste für die fachliche Durchsicht

   Aufruf:  node werkzeuge/fehlvorstellungen-sichten.js [PZ|LF|KP|SK]
            node werkzeuge/fehlvorstellungen-sichten.js --offen
            node werkzeuge/fehlvorstellungen-sichten.js --kategorie grundwert_bezug

   Das Schema verhindert technische Fehler, keine unpassenden fachlichen
   Zuordnungen. Ob „mal_statt_geteilt" in PZ dasselbe meint wie in KP, kann
   nur ein Mensch entscheiden. Dieses Werkzeug legt die Entscheidung vor:

     · welche Fehlvorstellung in welcher Kategorie landet,
     · in welchen Bereichen und Aufgaben sie tatsächlich vorkommt,
     · was in keine Kategorie fällt (`--offen`) — das ist die eigentliche
       Arbeitsliste.

   Es ändert nichts und schlägt nichts vor. Eine automatisch geratene
   Kategorie wäre schlimmer als eine offene.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const argumente = process.argv.slice(2);
const nurOffen = argumente.includes('--offen');
const kategorieFilter = (() => {
  const i = argumente.indexOf('--kategorie');
  return i >= 0 ? argumente[i + 1] : null;
})();
const nurBereich = (argumente.find(a => /^[A-Za-z]{2}$/.test(a)) || '').toUpperCase();

const katalog = JSON.parse(
  fs.readFileSync(path.join(WURZEL, 'schema', 'fehlvorstellungen-kategorien.json'), 'utf8')
);
const kategorien = katalog.kategorien.map(k => ({
  ...k,
  regeln: k.muster.map(m => new RegExp(m))
}));

function kategorieFuer(id) {
  for (const k of kategorien) {
    if (k.regeln.some(r => r.test(id))) return k;
  }
  return null;
}

/* ---------- Vorkommen einsammeln ---------- */
const vorkommen = new Map();   // id -> { bereiche:Set, einheiten:Set, stellen:[] }

for (const bereich of fs.readdirSync(path.join(WURZEL, 'units'))) {
  const bp = path.join(WURZEL, 'units', bereich);
  if (!fs.statSync(bp).isDirectory()) continue;
  if (nurBereich && bereich.toUpperCase() !== nurBereich) continue;

  for (const einheit of fs.readdirSync(bp)) {
    const datei = path.join(bp, einheit, 'tasks.json');
    if (!fs.existsSync(datei)) continue;
    const daten = JSON.parse(fs.readFileSync(datei, 'utf8'));

    for (const aufgabe of daten.tasks || []) {
      const alle = [
        ...(aufgabe.misconceptions || []),
        ...(aufgabe.fields || []).flatMap(f => f.misconceptions || [])
      ];
      for (const m of alle) {
        if (!m.id) continue;
        if (!vorkommen.has(m.id)) {
          vorkommen.set(m.id, { bereiche: new Set(), einheiten: new Set(), stellen: [] });
        }
        const v = vorkommen.get(m.id);
        v.bereiche.add(bereich.toUpperCase());
        v.einheiten.add(einheit.toUpperCase());
        v.stellen.push({
          einheit: einheit.toUpperCase(),
          aufgabe: aufgabe.id,
          pfad: aufgabe.path,
          rueckmeldung: String(m.feedback || m.rueckmeldung || '').replace(/\s+/g, ' ').slice(0, 110)
        });
      }
    }
  }
}

/* ---------- Zuordnen ---------- */
const proKategorie = new Map();
const offen = [];

for (const [id, v] of [...vorkommen].sort((a, b) => a[0].localeCompare(b[0], 'de'))) {
  const k = kategorieFuer(id);
  if (!k) { offen.push([id, v]); continue; }
  if (!proKategorie.has(k.id)) proKategorie.set(k.id, { kategorie: k, eintraege: [] });
  proKategorie.get(k.id).eintraege.push([id, v]);
}

/* ---------- Ausgabe ---------- */
const gesamt = vorkommen.size;
const zugeordnet = gesamt - offen.length;
const kopf = nurBereich ? `Bereich ${nurBereich}` : 'alle Bereiche';

console.log(`Fehlvorstellungen · ${kopf}`);
console.log(`${gesamt} unterschiedliche IDs, ${zugeordnet} zugeordnet, ${offen.length} offen`);
console.log('');

if (!nurOffen) {
  for (const { kategorie, eintraege } of
       [...proKategorie.values()].sort((a, b) => b.eintraege.length - a.eintraege.length)) {
    if (kategorieFilter && kategorie.id !== kategorieFilter) continue;

    const bereiche = new Set();
    eintraege.forEach(([, v]) => v.bereiche.forEach(b => bereiche.add(b)));
    console.log(`── ${kategorie.titel}  [${kategorie.id}]`);
    console.log(`   ${eintraege.length} IDs · Bereiche: ${[...bereiche].sort().join(', ')}`);
    console.log(`   ${kategorie.beschreibung}`);
    console.log('');

    for (const [id, v] of eintraege) {
      const orte = [...v.einheiten].sort().join(', ');
      console.log(`   ${id}`);
      console.log(`     ${v.stellen.length}× in ${orte}`);
      if (kategorieFilter) {
        /* Bei gezielter Durchsicht auch die Rückmeldungen zeigen — daran
           entscheidet sich, ob die Zuordnung fachlich trägt. */
        for (const s of v.stellen.slice(0, 6)) {
          console.log(`     · ${s.einheit}/${s.aufgabe} (${s.pfad}): „${s.rueckmeldung}"`);
        }
      }
    }
    console.log('');
  }
}

if (offen.length && !kategorieFilter) {
  console.log('── Ohne Kategorie — bitte fachlich sichten');
  console.log('   Entweder ein Muster in schema/fehlvorstellungen-kategorien.json ergänzen');
  console.log('   oder bewusst einzeln lassen. Beides ist eine Entscheidung, kein Fehler.');
  console.log('');
  for (const [id, v] of offen) {
    console.log(`   ${id}  (${v.stellen.length}× · ${[...v.bereiche].sort().join(', ')})`);
  }
  console.log('');
}

console.log('Hinweis: Diese Zuordnung ist eine Ordnungshilfe, kein fachlicher Nachweis.');
console.log('Dieselbe ID kann in zwei Lernbereichen Verschiedenes meinen.');
