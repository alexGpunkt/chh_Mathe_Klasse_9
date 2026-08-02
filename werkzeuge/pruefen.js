#!/usr/bin/env node
/* ============================================================
   pruefen.js · Gesamtprüfung vor dem Push

   Aufruf:  node werkzeuge/pruefen.js
   Rückgabe: 0 = alles in Ordnung, 1 = mindestens ein Fehler

   Geprüft wird, was sich ohne Browser und ohne Netz prüfen lässt:
   JSON gegen das Schema, doppelte Aufgaben-IDs, Animationsnamen,
   Vollständigkeit des Service-Worker-Caches, lokale Verweise,
   erlaubte externe Plattformen, devMode und Cache-Version.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pruefe } = require('./schema-pruefer');

const WURZEL = path.resolve(__dirname, '..');
const P = (...t) => path.join(WURZEL, ...t);
const lies = f => fs.readFileSync(P(f), 'utf8');
const liesJson = f => JSON.parse(lies(f));

const fehler = [];
const warnung = [];
const meldung = [];
const melde = t => meldung.push(t);

function alleDateien(ordner, endung) {
  const treffer = [];
  (function gehe(o) {
    for (const e of fs.readdirSync(P(o), { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === '.github') continue;
      const rel = path.posix.join(o, e.name).replace(/^\.\//, '');
      if (e.isDirectory()) gehe(rel);
      else if (e.name.endsWith(endung)) treffer.push(rel);
    }
  })(ordner);
  return treffer;
}

/* ---------- 1 · JSON lesbar ---------- */
const jsonDateien = alleDateien('.', '.json').filter(f => !f.includes('node_modules'));
const geladen = new Map();
for (const f of jsonDateien) {
  try { geladen.set(f, liesJson(f)); }
  catch (e) { fehler.push(`${f}: kein gültiges JSON — ${e.message}`); }
}
melde(`${geladen.size} JSON-Dateien gelesen`);

/* ---------- 2 · Einheiten gegen das Schema ---------- */
let schema = null;
try { schema = liesJson('schema/tasks.schema.json'); }
catch (e) { fehler.push('schema/tasks.schema.json fehlt oder ist kaputt: ' + e.message); }

const einheiten = [...geladen.keys()].filter(f => /^units\/[a-z]{2}\/[a-z]{2}-\d{2}\/tasks\.json$/.test(f));
if (schema) {
  let verletzungen = 0;
  for (const f of einheiten) {
    const probleme = pruefe(geladen.get(f), schema);
    probleme.forEach(p => fehler.push(`${f} · ${p}`));
    verletzungen += probleme.length;
  }
  melde(`${einheiten.length} Einheiten gegen das Schema geprüft (${verletzungen} Verstöße)`);
}

/* ---------- 3 · Aufgaben-IDs eindeutig ---------- */
const gesehen = new Map();
for (const f of einheiten) {
  for (const t of geladen.get(f).tasks || []) {
    if (gesehen.has(t.id)) fehler.push(`Doppelte Aufgaben-ID ${t.id} in ${f} und ${gesehen.get(t.id)}`);
    else gesehen.set(t.id, f);
  }
}
melde(`${gesehen.size} Aufgaben-IDs, alle eindeutig`);

/* ---------- 4 · Auswahlindizes im gültigen Bereich ---------- */
for (const f of einheiten) {
  for (const t of geladen.get(f).tasks || []) {
    if (t.type === 'choice' && Array.isArray(t.options)) {
      if (t.answer >= t.options.length) fehler.push(`${f} · ${t.id}: answer ${t.answer} liegt außerhalb der ${t.options.length} Optionen`);
      for (const m of t.misconceptions || []) {
        if (typeof m.value === 'number' && m.value >= t.options.length) {
          fehler.push(`${f} · ${t.id}: Fehlvorstellung ${m.id} zeigt auf Option ${m.value}, es gibt nur ${t.options.length}`);
        }
      }
    }
    if (t.type === 'assign' && Array.isArray(t.answer) && Array.isArray(t.values)) {
      if (t.answer.length !== (t.slots || []).length) fehler.push(`${f} · ${t.id}: answer hat ${t.answer.length} Einträge, slots ${t.slots?.length}`);
      if (new Set(t.answer).size !== t.answer.length) fehler.push(`${f} · ${t.id}: Zuordnung ist keine Bijektion`);
      t.answer.forEach(a => { if (a >= t.values.length) fehler.push(`${f} · ${t.id}: Zuordnung zeigt auf Wert ${a}, es gibt nur ${t.values.length}`); });
    }
  }
}

/* ---------- 5 · Lücken zeigen auf einen vorhandenen Schritt ---------- */
for (const f of einheiten) {
  const lk = geladen.get(f).lernkarten || {};
  for (const [pfad, karte] of Object.entries(lk)) {
    const L = karte.beispiel && karte.beispiel.luecke;
    if (!L) continue;
    const n = (karte.beispiel.schritte || []).length;
    if (L.schritt >= n) fehler.push(`${f} · ${pfad}: luecke.schritt ${L.schritt}, es gibt nur ${n} Schritte`);
  }
}

/* ---------- 6 · Absatzverweise zeigen auf einen vorhandenen Absatz ---------- */
for (const f of einheiten) {
  const d = geladen.get(f);
  for (const t of d.tasks || []) {
    const alle = [...(t.misconceptions || []), ...(t.fields || []).flatMap(x => x.misconceptions || [])];
    for (const m of alle) {
      const a = m.verweis && m.verweis.absatz;
      if (!Number.isInteger(a)) continue;
      const n = ((d.lernkarten || {})[t.path] || {}).erklaerung?.length || 0;
      if (a >= n) fehler.push(`${f} · ${t.id}: verweis.absatz ${a}, Pfad ${t.path} hat nur ${n} Absätze`);
    }
  }
}

/* ---------- 7 · Animationsnamen existieren ---------- */
const animQuelle = lies('assets/js/animationen.js');
const bekannteAnim = new Set([...animQuelle.matchAll(/\bid:\s*'([a-z0-9]+)'/g)].map(m => m[1]));
let animVerweise = 0;
for (const f of einheiten) {
  const d = geladen.get(f);
  const bilder = [
    ...Object.values(d.lernkarten || {}).map(k => k.visual),
    ...(d.tasks || []).map(t => t.visual)
  ].filter(v => v && v.type === 'animation');
  for (const v of bilder) {
    animVerweise++;
    if (!bekannteAnim.has(v.name)) fehler.push(`${f}: Animation „${v.name}" gibt es nicht`);
  }
}
melde(`${animVerweise} Animationsverweise auf ${bekannteAnim.size} vorhandene Animationen`);

/* ---------- 8 · Service Worker kennt alle Dateien ---------- */
const swQuelle = lies('sw.js');
const imCache = new Set([...swQuelle.matchAll(/'([^']+\.(?:html|css|js|json))'/g)].map(m => m[1]));
const zuCachen = [
  ...alleDateien('assets', '.js'), ...alleDateien('assets', '.css'),
  ...alleDateien('units', '.json'), ...alleDateien('spiral', '.json')
].map(f => f.replace(/^\.\//, ''));
for (const f of zuCachen) {
  if (f.includes('supabase-config')) continue;      // gerätespezifisch
  if (!imCache.has(f)) warnung.push(`sw.js cached ${f} nicht`);
}
for (const f of imCache) {
  if (!fs.existsSync(P(f))) fehler.push(`sw.js verweist auf ${f} — Datei fehlt`);
}
melde(`${imCache.size} Einträge im Service-Worker-Cache`);

/* ---------- 9 · lokale Verweise in HTML ---------- */
for (const seite of alleDateien('.', '.html')) {
  const html = lies(seite);
  for (const m of html.matchAll(/(?:src|href)="([^"#?:]+\.(?:js|css|html|json))"/g)) {
    const ziel = path.posix.normalize(path.posix.join(path.posix.dirname(seite), m[1]));
    if (!fs.existsSync(P(ziel))) fehler.push(`${seite}: verweist auf ${m[1]} — Datei fehlt`);
  }
}

/* ---------- 10 · externe Übungen nur von erlaubten Plattformen ---------- */
const ERLAUBT = ['learningapps.org', 'serlo.org', 'h5p.org', 'schule-bw.de',
                 'learningsnacks.de', 'quizlet.com', 'zum.de'];
let links = 0;
for (const f of einheiten) {
  for (const l of geladen.get(f).uebungslinks || []) {
    links++;
    let host = '';
    try { host = new URL(l.url).hostname.toLowerCase(); }
    catch { fehler.push(`${f}: „${l.url}" ist keine gültige Adresse`); continue; }
    if (!l.url.startsWith('https://')) fehler.push(`${f}: ${l.url} ist nicht https`);
    if (!ERLAUBT.some(b => host === b || host.endsWith('.' + b))) {
      fehler.push(`${f}: Plattform ${host} ist nicht freigegeben`);
    }
  }
}
melde(`${links} externe Übungsverweise geprüft`);

/* ---------- 11 · JavaScript-Syntax ---------- */
for (const f of [...alleDateien('assets/js', '.js'), 'sw.js', ...alleDateien('dashboard', '.js'), ...alleDateien('werkzeuge', '.js')]) {
  try { execFileSync(process.execPath, ['--check', P(f)], { stdio: 'pipe' }); }
  catch (e) { fehler.push(`${f}: Syntaxfehler — ${String(e.stderr || e.message).split('\n')[0]}`); }
}
melde('JavaScript-Syntax geprüft');

/* ---------- 12 · devMode passend zum Zweig ---------- */
let zweig = process.env.GITHUB_REF_NAME || '';
if (!zweig) {
  try { zweig = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: WURZEL }).toString().trim(); }
  catch { zweig = ''; }
}
const konfig = lies('assets/js/supabase-config.js');
const devAn = /devMode\s*:\s*true/.test(konfig);
if (zweig === 'master' && devAn) fehler.push('supabase-config.js: devMode ist auf master eingeschaltet');
if (zweig) melde(`Zweig ${zweig}, devMode ${devAn ? 'ein' : 'aus'}`);

/* ---------- 13 · Cache-Version erhöht? ---------- */
const version = (swQuelle.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1] || '';
try {
  const basis = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  const geaendert = execFileSync('git', ['diff', '--name-only', basis], { cwd: WURZEL }).toString().split('\n').filter(Boolean);
  const relevant = geaendert.filter(f => /^(assets\/|units\/|spiral\/|dashboard\/|sw\.js|.*\.html)/.test(f));
  const swGeaendert = geaendert.includes('sw.js');
  if (relevant.length && !swGeaendert) {
    warnung.push(`${relevant.length} Programm- oder Inhaltsdateien geändert, aber sw.js nicht — VERSION hochzählen (aktuell ${version})`);
  }
} catch { /* flacher Klon oder erster Commit: nicht prüfbar */ }
melde(`Cache-Version ${version}`);

/* ---------- Ausgabe ---------- */
meldung.forEach(m => console.log('  ✓ ' + m));
if (warnung.length) {
  console.log('\nHinweise (' + warnung.length + '):');
  warnung.forEach(w => console.log('  ! ' + w));
}
if (fehler.length) {
  console.log('\nFehler (' + fehler.length + '):');
  fehler.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('\nAlles in Ordnung.');
