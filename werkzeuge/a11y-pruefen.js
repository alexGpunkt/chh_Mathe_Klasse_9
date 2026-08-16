#!/usr/bin/env node
/* ============================================================
   a11y-pruefen.js · statische Barrierefreiheitsprüfung

   Aufruf:  node werkzeuge/a11y-pruefen.js

   Was hier geprüft wird, lässt sich ohne Browser feststellen:
   Sprachauszeichnung, doppelte IDs, Alternativtexte, Beschriftung von
   Bedienelementen, Überschriftenfolge, Touchziele in den Stylesheets und
   Alternativtexte in den Aufgabendaten.

   Was hier NICHT geprüft werden kann und in TESTPROTOKOLL-GERAETE.md
   gehört: Screenreader-Ausgabe, Fokusreihenfolge im echten Rendering,
   Bedienung per Tastatur, Zoom auf 200/400 %, tatsächliche Farbkontraste
   nach dem Kaskadieren. Ein grüner Lauf hier ist kein Nachweis von
   Barrierefreiheit — nur die Abwesenheit der maschinell findbaren Fehler.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const fehler = [];
const hinweis = [];

const htmlDateien = fs.readdirSync(WURZEL)
  .filter(f => f.endsWith('.html'))
  .concat(['dashboard/index.html', 'dashboard/beamer.html']
    .filter(f => fs.existsSync(path.join(WURZEL, f))));

for (const rel of htmlDateien) {
  const html = fs.readFileSync(path.join(WURZEL, rel), 'utf8');
  const ort = m => `${rel}: ${m}`;

  /* 1 · Sprache */
  if (!/<html[^>]*\blang="de"/i.test(html)) fehler.push(ort('<html> ohne lang="de"'));

  /* 2 · Titel */
  if (!/<title>[^<]{3,}<\/title>/i.test(html)) fehler.push(ort('kein aussagekräftiger <title>'));

  /* 3 · Doppelte IDs */
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const doppelt = ids.filter((x, i) => ids.indexOf(x) !== i);
  [...new Set(doppelt)].forEach(d => fehler.push(ort(`ID „${d}" kommt mehrfach vor`)));

  /* 4 · Bilder mit Alternativtext */
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=/i.test(m[0])) fehler.push(ort('<img> ohne alt: ' + m[0].slice(0, 60)));
  }

  /* 5 · Bedienelemente beschriftet */
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attr = m[1], inhalt = m[2].replace(/<[^>]+>/g, '').trim();
    if (!inhalt && !/aria-label=/i.test(attr) && !/aria-labelledby=/i.test(attr)) {
      fehler.push(ort('<button> ohne Beschriftung: ' + m[0].slice(0, 70)));
    }
  }
  for (const m of html.matchAll(/<input\b([^>]*)>/gi)) {
    const attr = m[1];
    if (/type="(hidden|submit|button)"/i.test(attr)) continue;
    const id = (attr.match(/\bid="([^"]+)"/) || [])[1];
    const beschriftet = /aria-label=/i.test(attr) || /aria-labelledby=/i.test(attr)
      || (id && new RegExp(`<label[^>]*for="${id}"`, 'i').test(html))
      || new RegExp(`<label[^>]*>[^<]*<input\\b[^>]*${(attr.match(/\bid="[^"]+"/) || [''])[0]}`, 'i').test(html);
    /* Labels, die das Feld umschließen, erkennt die grobe Regel nicht immer —
       deshalb nur ein Hinweis, kein Fehler. */
    if (!beschriftet) hinweis.push(ort('<input> ohne erkennbare Beschriftung: ' + m[0].slice(0, 70)));
  }

  /* 6 · Überschriftenfolge */
  const stufen = [...html.matchAll(/<h([1-6])\b/gi)].map(m => Number(m[1]));
  if (stufen.length && stufen[0] !== 1 && rel !== 'dashboard/index.html') {
    hinweis.push(ort(`erste Überschrift ist h${stufen[0]}, nicht h1`));
  }
  for (let i = 1; i < stufen.length; i++) {
    if (stufen[i] - stufen[i - 1] > 1) {
      hinweis.push(ort(`Überschrift springt von h${stufen[i - 1]} auf h${stufen[i]}`));
      break;
    }
  }

  /* 7 · Viewport nicht gesperrt */
  const vp = (html.match(/<meta[^>]*name="viewport"[^>]*content="([^"]*)"/i) || [])[1] || '';
  if (/user-scalable\s*=\s*no/i.test(vp)) fehler.push(ort('viewport verbietet das Zoomen'));
  const maxScale = (vp.match(/maximum-scale\s*=\s*([\d.]+)/i) || [])[1];
  if (maxScale && Number(maxScale) < 5) fehler.push(ort(`viewport begrenzt den Zoom auf ${maxScale}`));
}

/* 8 · Touchziele in den Stylesheets */
const cssDateien = [
  ['assets', 'css', 'app.css'],
  ['assets', 'css', 'anim.css'],
  ['assets', 'css', 'buch.css'],
  ['assets', 'css', 'rechner.css'],
  ['dashboard', 'dashboard.css'],
  ['dashboard', 'beamer.css']
];
const css = cssDateien
  .filter(teile => fs.existsSync(path.join(WURZEL, ...teile)))
  .map(teile => fs.readFileSync(path.join(WURZEL, ...teile), 'utf8')).join('\n');

function regexEscape(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function hatGrossesTouchziel(selektor) {
  let basis = selektor.replace(/::-(?:webkit-slider-thumb|moz-range-thumb).*$/, '').trim();
  if (/\binput\b/.test(basis)) {
    const inputBasis = basis.replace(/::.*$/, '').trim();
    const inputRegel = new RegExp(regexEscape(inputBasis) + '\\s*\\{([^}]*)\\}', 'm').exec(css);
    if (inputRegel && /(?:min-height|height)\s*:\s*(?:4[4-9]|[5-9]\d|\d{3,})px/.test(inputRegel[1])) return true;
    basis = basis.replace(/\s+input(?:\[[^\]]+\])?.*$/, '').trim();
  }
  if (!basis) return false;
  const regel = new RegExp(regexEscape(basis) + '\\s*\\{([^}]*)\\}', 'm').exec(css);
  return !!(regel && /(?:min-height|height)\s*:\s*(?:4[4-9]|[5-9]\d|\d{3,})px/.test(regel[1]));
}

for (const m of css.matchAll(/(min-height|height)\s*:\s*(\d+)px/g)) {
  const wert = Number(m[2]);
  /* Nur Regeln betrachten, die offensichtlich Bedienelemente betreffen. */
  const umfeld = css.slice(Math.max(0, m.index - 300), m.index);
  const letzterSelektor = (umfeld.match(/([^{}]+)\{[^{}]*$/) || [])[1] || '';
  if (!/(btn|button|opt|\.pfad-btn|input|schalt|tool)/i.test(letzterSelektor)) continue;
  if (wert < 44 && wert >= 20 && !hatGrossesTouchziel(letzterSelektor.trim())) {
    hinweis.push(`assets/css: „${letzterSelektor.trim().slice(0, 50)}" ist ${wert}px hoch (Touchziel 44px)`);
  }
}

/* 8b · Farbkontraste der Token, hell und dunkel
   Gemessen wird nach WCAG 2.1: Verhältnis der relativen Leuchtdichten.
   Geprüft werden die Paarungen, die im Betrieb tatsächlich vorkommen —
   nicht alle Kombinationen, die rechnerisch möglich wären. */
function tokenLesen(css, block) {
  const abschnitt = css.slice(css.indexOf(block));
  const ende = abschnitt.indexOf('}');
  const werte = {};
  for (const m of abschnitt.slice(0, ende).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    werte[m[1]] = m[2].trim();
  }
  return werte;
}
function zuRgb(wert, tabelle, tiefe = 0) {
  if (!wert || tiefe > 5) return null;
  const v = String(wert).trim();
  const ref = v.match(/^var\((--[a-z0-9-]+)\)$/);
  if (ref) return zuRgb(tabelle[ref[1]], tabelle, tiefe + 1);
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = v.match(/^rgba?\(([^)]+)\)/);
  if (rgba) {
    const teile = rgba[1].split(',').map(x => parseFloat(x));
    return teile.length >= 3 ? teile.slice(0, 3) : null;
  }
  return null;
}
function leuchtdichte([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function kontrast(a, b) {
  const l1 = leuchtdichte(a), l2 = leuchtdichte(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

{
  const appCss = fs.readFileSync(path.join(WURZEL, 'assets', 'css', 'app.css'), 'utf8');
  const hell = tokenLesen(appCss, ':root {');
  const dunkelBlock = appCss.slice(appCss.indexOf('@media (prefers-color-scheme: dark)'));
  const dunkel = { ...hell, ...tokenLesen(dunkelBlock, ':root {') };

  /* [Vordergrund, Hintergrund, Beschreibung, Mindestverhältnis] */
  const paare = [
    ['--ink', '--paper', 'Fließtext auf Papier', 4.5],
    ['--ink', '--paper-hi', 'Fließtext auf der Karte', 4.5],
    ['--ink-soft', '--paper-hi', 'Nebentext auf der Karte', 4.5],
    ['--ink-faint', '--paper-hi', 'Hilfstext auf der Karte', 3],
    ['--kopf-text', '--kopf-bg', 'Kopfzeile', 4.5],
    ['--a', '--paper-hi', 'Pfad A auf der Karte', 4.5],
    ['--b', '--paper-hi', 'Pfad B auf der Karte', 4.5],
    ['--c', '--paper-hi', 'Pfad C auf der Karte', 4.5],
    ['--a', '--a-bg', 'Pfad A auf eigenem Grund', 4.5],
    ['--b', '--b-bg', 'Pfad B auf eigenem Grund', 4.5],
    ['--c', '--c-bg', 'Pfad C auf eigenem Grund', 4.5],
    ['--ok', '--ok-bg', 'Richtig-Rückmeldung', 4.5],
    ['--korr', '--korr-bg', 'Falsch-Rückmeldung', 4.5],
    ['--merk-text', '--merk-bg', 'Merkkasten', 4.5],
    ['--ink', '--merk-bg', 'Text im Merkkasten', 4.5],
    ['--ink', '--flaeche', 'Text auf abgesetzter Fläche', 4.5]
  ];

  for (const [modus, tabelle] of [['hell', hell], ['dunkel', dunkel]]) {
    for (const [vorne, hinten, was, mindest] of paare) {
      const f = zuRgb(tabelle[vorne], tabelle), h = zuRgb(tabelle[hinten], tabelle);
      if (!f || !h) { hinweis.push(`Kontrast ${modus}: ${vorne} auf ${hinten} nicht auswertbar`); continue; }
      const k = kontrast(f, h);
      if (k < mindest) {
        fehler.push(`Kontrast ${modus}: ${was} (${vorne} auf ${hinten}) nur ${k.toFixed(2)}:1, nötig ${mindest}:1`);
      } else if (k < mindest * 1.15) {
        hinweis.push(`Kontrast ${modus}: ${was} liegt mit ${k.toFixed(2)}:1 knapp über ${mindest}:1`);
      }
    }
  }
}

/* 9 · Alternativtexte in den Aufgabendaten */
let ohneAlt = 0, mitBild = 0;
const basis = path.join(WURZEL, 'units');
for (const bereich of fs.readdirSync(basis)) {
  const b = path.join(basis, bereich);
  if (!fs.statSync(b).isDirectory()) continue;
  for (const ordner of fs.readdirSync(b)) {
    const datei = path.join(b, ordner, 'tasks.json');
    if (!fs.existsSync(datei)) continue;
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const bilder = [
      ...Object.values(d.lernkarten || {}).map(k => k.visual),
      ...(d.tasks || []).map(t => t.visual)
    ].filter(Boolean);
    for (const v of bilder) {
      mitBild++;
      /* Animationen beschreiben sich selbst über ihren Kurztext; die
         gezeichneten Bilder brauchen ein alt. */
      if (v.type === 'animation') continue;
      if (!v.alt || String(v.alt).trim().length < 8) {
        ohneAlt++;
        fehler.push(`${d.unit}: Bild vom Typ „${v.type}" ohne brauchbaren Alternativtext`);
      }
    }
  }
}

console.log(`${htmlDateien.length} Seiten und ${mitBild} Bilder geprüft.`);
if (hinweis.length) {
  console.log(`\nHinweise (${hinweis.length}):`);
  hinweis.forEach(h => console.log('  ! ' + h));
}
if (fehler.length) {
  console.log(`\nFehler (${fehler.length}):`);
  fehler.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('\nKeine maschinell findbaren Fehler. Die Prüfung mit Screenreader,');
console.log('Tastatur und Zoom bleibt trotzdem nötig — siehe TESTPROTOKOLL-GERAETE.md.');
