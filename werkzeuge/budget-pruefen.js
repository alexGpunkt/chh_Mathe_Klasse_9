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
/* Nachgeladene Dateien zählen mit — sonst misst diese Prüfung die
   Kennzahl statt der Sache. animationen-laden.js hängt je nach ?u= einen
   Lernbereichsblock ein; gezählt wird der größte davon, also der
   ungünstigste Fall. Ein Kind lädt ihn genauso wie ein festes
   <script src>, nur eben eine Zehntelsekunde später. */
const NACHGELADEN = {
  'assets/js/animationen-laden.js': [
    'assets/js/animationen-lf.js',
    'assets/js/animationen-pz.js',
    'assets/js/animationen-kp.js',
    'assets/js/animationen-sk.js'
  ],
  /* Der Prüfungstrainer stellt erst seinen Aufgabenpool zusammen, setzt
     window.QUELLE und holt dann engine.js — die liest QUELLE beim Start.
     Ein spät geholtes Skript wiegt trotzdem. */
  'assets/js/pruefung.js': ['assets/js/engine.js']
};

const seiten = fs.readdirSync(WURZEL).filter(f => f.endsWith('.html'));
let schlimmsteSeite = { name: '—', kb: 0, zusatz: null };
for (const seite of seiten) {
  const html = fs.readFileSync(P(seite), 'utf8');
  let summe = 0;
  let groesstesNachladen = 0;
  let nachladeName = null;

  for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const rel = path.posix.normalize(path.posix.join(path.posix.dirname(seite), m[1]));
    const ziel = P(rel);
    if (fs.existsSync(ziel)) summe += gzip(ziel);

    for (const kandidat of NACHGELADEN[rel] || []) {
      if (!fs.existsSync(P(kandidat))) continue;
      const g = gzip(P(kandidat));
      if (g > groesstesNachladen) { groesstesNachladen = g; nachladeName = kandidat; }
    }
  }

  summe += groesstesNachladen;
  if (kb(summe) > schlimmsteSeite.kb) {
    schlimmsteSeite = { name: seite, kb: kb(summe), zusatz: nachladeName };
  }
}
pruefe('js_je_seite_gzip_kb', schlimmsteSeite.kb, 'KB gzip',
  `größte Seite (${schlimmsteSeite.name}${schlimmsteSeite.zusatz
    ? ' inkl. ' + path.posix.basename(schlimmsteSeite.zusatz) : ''})`);

/* ---------- 2 · JavaScript und CSS insgesamt ----------
   Gemessen wird, was ein SCHÜLERGERÄT lädt — nicht, was im Repository
   liegt. Das ist keine Bequemlichkeit, sondern die Begründung der Grenze
   selbst: Sie schützt die Erstinstallation des Service Workers im
   Schul-WLAN. Eine Datei, die dort nie ankommt, gehört nicht in diese
   Summe, egal wie groß sie ist.

   Die Regel ist mechanisch, damit sie sich nicht per Hand aufweichen
   lässt: Gezählt wird die Vereinigung aus

     (a) allem, was sw.js beim Install vorab holt, und
     (b) allem, was ein <script src> einer Seite im Hauptverzeichnis
         anfordert.

   Damit fallen zwei Gruppen heraus, und zwar von selbst:

     dashboard/*.js  Das Lehrerdashboard steht seit V34 nicht mehr im
                     Offlinepaket und wird von keiner Schülerseite
                     eingebunden. Es lädt weiterhin normal über das Netz.
     dev-tools.js    Wird von dev-boot.js nur bei devMode nachgeladen.
                     Auf master fordert es niemand an.

   Wer eine der beiden Dateien wieder in sw.js einträgt oder in eine Seite
   einbindet, bekommt sie hier automatisch zurück in die Rechnung. */

const swQuelleFuerListe = fs.readFileSync(P('sw.js'), 'utf8');
const swVorabliste = [...swQuelleFuerListe.matchAll(/'([^']+\.(?:html|css|js|json))'/g)].map(m => m[1]);

function ausgeliefert(endung) {
  const gefunden = new Set();

  /* Der Service Worker selbst steht in keiner Liste und in keinem
     <script src> — er wird über navigator.serviceWorker.register geholt.
     Auf dem Gerät landet er trotzdem, also zählt er mit. */
  if (endung === '.js') gefunden.add(P('sw.js'));

  for (const eintrag of swVorabliste) {
    if (!eintrag.endsWith(endung)) continue;
    const ziel = P(path.posix.normalize(eintrag));
    if (fs.existsSync(ziel)) gefunden.add(ziel);
  }

  for (const seite of seiten) {
    const html = fs.readFileSync(P(seite), 'utf8');
    const muster = endung === '.js'
      ? /<script[^>]+src="([^"]+)"/g
      : /<link[^>]+href="([^"]+\.css)"/g;
    for (const m of html.matchAll(muster)) {
      if (!m[1].endsWith(endung) || /^https?:/i.test(m[1])) continue;
      const ziel = P(path.posix.normalize(path.posix.join(path.posix.dirname(seite), m[1])));
      if (fs.existsSync(ziel)) gefunden.add(ziel);
    }
  }

  return [...gefunden];
}

const jsDateien = ausgeliefert('.js');
const cssDateien = ausgeliefert('.css');

/* Was bewusst NICHT mitgezählt wird — im Bericht sichtbar, damit die
   Entscheidung nicht in diesem Werkzeug verschwindet. */
const alleJs = [...alleDateien('assets/js', '.js'), P('sw.js'), ...alleDateien('dashboard', '.js')];
const nichtGezaehlt = alleJs
  .filter(f => !jsDateien.includes(f))
  .map(f => [path.relative(WURZEL, f).replace(/\\/g, '/'), kb(gzip(f))])
  .sort((a, b) => b[1] - a[1]);

pruefe('js_gesamt_gzip_kb', kb(jsDateien.reduce((n, f) => n + gzip(f), 0)), 'KB gzip', 'JavaScript gesamt');
pruefe('css_gesamt_gzip_kb', kb(cssDateien.reduce((n, f) => n + gzip(f), 0)), 'KB gzip', 'CSS gesamt');

if (nichtGezaehlt.length) {
  zeilen.push(`  · nicht an Schülergeräte ausgeliefert und deshalb nicht gezählt: `
    + nichtGezaehlt.map(([n, k]) => `${n} (${k} KB)`).join(', '));
}

const groesste = jsDateien
  .map(f => [path.relative(WURZEL, f).replace(/\\/g, '/'), roh(f)])
  .sort((a, b) => b[1] - a[1])[0];
pruefe('einzeldatei_kb', kb(groesste[1]), 'KB', `größte Datei (${groesste[0]})`);

/* ---------- 3 · Offlinepaket ---------- */
/* Alles, was der Service Worker beim Install auf einmal holt. Das ist die
   Größe, die im Schul-WLAN mit dreißig Geräten gleichzeitig zählt. */
const imCache = swVorabliste;
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
/* Das Laufwerk steht seit V34 im Kern; die Bereichsdateien bringen keine
   eigene Schleife mit. Geprüft wird deshalb der Kern. */
const animQuelle = fs.readFileSync(P('assets/js/animationen-kern.js'), 'utf8');
const schleifen = [...animQuelle.matchAll(/requestAnimationFrame\(/g)].length;
const schleifenNamen = new Set(
  [...animQuelle.matchAll(/requestAnimationFrame\(\s*([A-Za-zäöü_$][\w$]*)\s*\)/g)].map(m => m[1])
);
zeilen.push(`  · ${schleifen} rAF-Aufrufe in animationen-kern.js, ${schleifenNamen.size} unterschiedliche Rückruffunktionen`);
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
