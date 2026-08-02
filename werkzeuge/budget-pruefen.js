#!/usr/bin/env node
/* ============================================================
   budget-pruefen.js · Performancebudget für günstige Smartphones

   Aufruf:  node werkzeuge/budget-pruefen.js
   Rückgabe: 0 = innerhalb des Budgets, 1 = mindestens eine Grenze gerissen

   Die Grenzen stehen in werkzeuge/budget.json — mit Begründung, damit ein
   Anheben eine Entscheidung bleibt und keine Nebenwirkung.

   Was hier gemessen wird, ist alles, was sich ohne Gerät messen lässt:
   Auslieferungsgrößen und die Zahl gleichzeitiger Animationsschleifen.
   Was NICHT gemessen werden kann und in TESTPROTOKOLL-GERAETE.md gehört:
   Zeit bis zur Bedienbarkeit, Speicherverbrauch, Layoutsprünge und die
   tatsächliche Ladezeit über Mobilfunk. Ein grüner Lauf hier ist kein
   Beleg dafür, dass sich die App auf einem alten Android gut anfühlt.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WURZEL = path.resolve(__dirname, '..');
const P = (...t) => path.join(WURZEL, ...t);
const budget = JSON.parse(fs.readFileSync(P('werkzeuge', 'budget.json'), 'utf8'));
const G = budget.grenzen;

const fehler = [];
const zeilen = [];

function kb(bytes) { return Math.round(bytes / 1024); }
function gzip(datei) { return zlib.gzipSync(fs.readFileSync(datei)).length; }
function roh(datei) { return fs.statSync(datei).size; }

function alleDateien(ordner, endung) {
  const treffer = [];
  (function gehe(o) {
    for (const e of fs.readdirSync(o, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const p = path.join(o, e.name);
      if (e.isDirectory()) gehe(p);
      else if (e.name.endsWith(endung)) treffer.push(p);
    }
  })(P(ordner));
  return treffer;
}

function pruefe(schluessel, gemessen, einheit, was) {
  const grenze = G[schluessel];
  if (!grenze) return;
  const ok = gemessen <= grenze.wert;
  zeilen.push(`  ${ok ? '✓' : '✗'} ${was}: ${gemessen} ${einheit} (Grenze ${grenze.wert})`);
  if (!ok) {
    fehler.push(`${was}: ${gemessen} ${einheit} über der Grenze von ${grenze.wert}.\n     ${grenze.begruendung}`);
  }
}

/* ---------- 1 · JavaScript je Seite ---------- */
/* Entscheidend ist nicht die Gesamtmenge im Repository, sondern was ein
   Kind beim Öffnen EINER Seite tatsächlich lädt und parst. */
const seiten = fs.readdirSync(WURZEL).filter(f => f.endsWith('.html'));
let schlimmsteSeite = { name: '—', kb: 0 };
for (const seite of seiten) {
  const html = fs.readFileSync(P(seite), 'utf8');
  let summe = 0;
  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const ziel = P(path.posix.normalize(path.posix.join(path.posix.dirname(seite), m[1])));
    if (fs.existsSync(ziel)) summe += gzip(ziel);
  }
  if (kb(summe) > schlimmsteSeite.kb) schlimmsteSeite = { name: seite, kb: kb(summe) };
}
pruefe('js_je_seite_gzip_kb', schlimmsteSeite.kb, 'KB gzip',
  `größte Seite (${schlimmsteSeite.name})`);

/* ---------- 2 · JavaScript und CSS insgesamt ---------- */
const jsDateien = [...alleDateien('assets/js', '.js'), P('sw.js'), ...alleDateien('dashboard', '.js')];
const cssDateien = [...alleDateien('assets/css', '.css'), ...alleDateien('dashboard', '.css')];

pruefe('js_gesamt_gzip_kb', kb(jsDateien.reduce((n, f) => n + gzip(f), 0)), 'KB gzip', 'JavaScript gesamt');
pruefe('css_gesamt_gzip_kb', kb(cssDateien.reduce((n, f) => n + gzip(f), 0)), 'KB gzip', 'CSS gesamt');

const groesste = jsDateien
  .map(f => [path.relative(WURZEL, f).replace(/\\/g, '/'), roh(f)])
  .sort((a, b) => b[1] - a[1])[0];
pruefe('einzeldatei_kb', kb(groesste[1]), 'KB', `größte Datei (${groesste[0]})`);

/* ---------- 3 · Offlinepaket ---------- */
/* Alles, was der Service Worker beim Install auf einmal holt. Das ist die
   Größe, die im Schul-WLAN mit dreißig Geräten gleichzeitig zählt. */
const swQuelle = fs.readFileSync(P('sw.js'), 'utf8');
const imCache = [...swQuelle.matchAll(/'([^']+\.(?:html|css|js|json))'/g)].map(m => m[1]);
let offline = 0;
let fehlend = 0;
for (const f of imCache) {
  if (fs.existsSync(P(f))) offline += roh(P(f)); else fehlend++;
}
pruefe('offline_gesamt_kb', kb(offline), 'KB',
  `Offlinepaket (${imCache.length - fehlend} Dateien)`);

/* ---------- 4 · Gleichzeitige Animationsschleifen ---------- */
/* Gezählt wird, wie viele voneinander unabhängige rAF-Schleifen es gibt.
   Erwartet wird genau eine gemeinsame Schleife; jede weitere ist ein
   zweiter Verbraucher auf dem Hauptthread. */
const animQuelle = fs.readFileSync(P('assets/js/animationen.js'), 'utf8');
const schleifen = [...animQuelle.matchAll(/requestAnimationFrame\(/g)].length;
const schleifenNamen = new Set(
  [...animQuelle.matchAll(/requestAnimationFrame\(\s*([A-Za-zäöü_$][\w$]*)\s*\)/g)].map(m => m[1])
);
zeilen.push(`  · ${schleifen} rAF-Aufrufe in animationen.js, ${schleifenNamen.size} unterschiedliche Rückruffunktionen`);
if (schleifenNamen.size > G.animationsschleifen.wert) {
  /* Bewusst ein Hinweis und kein Fehler: Mehrere benannte Rückrufe können
     auch nacheinander laufen. Ob sie es tun, sagt nur ein echtes Gerät. */
  zeilen.push('    Hinweis: Bitte auf einem Gerät prüfen, ob diese Schleifen gleichzeitig laufen.');
}

/* ---------- Ausgabe ---------- */
console.log(`Performancebudget (${budget.geprueft_am_stand})`);
zeilen.forEach(z => console.log(z));

console.log('\nNicht hier prüfbar — gehört auf ein echtes Gerät:');
budget.nicht_hier_pruefbar.forEach(x => console.log('  · ' + x));

if (fehler.length) {
  console.log(`\nBudget überschritten (${fehler.length}):`);
  fehler.forEach(f => console.log('  ✗ ' + f));
  console.log('\nEntweder die Ursache beheben oder die Grenze in werkzeuge/budget.json');
  console.log('bewusst anheben — mit Begründung.');
  process.exit(1);
}
console.log('\nInnerhalb des Budgets.');
