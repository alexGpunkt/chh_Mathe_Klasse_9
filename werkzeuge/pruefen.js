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

/* ---------- 2b · Einheitenverzeichnis und Sollumfang ---------- */
try {
  const index = liesJson('units/index.json');
  const verzeichnet = new Map();
  for (const bereich of index.bereiche || []) {
    for (const einheit of bereich.einheiten || []) {
      const id = String(einheit.id || '').toLowerCase();
      if (!id) continue;
      if (verzeichnet.has(id)) fehler.push(`units/index.json: Einheit ${id} ist doppelt eingetragen`);
      verzeichnet.set(id, einheit);
    }
  }

  const vorhanden = new Set();
  for (const f of einheiten) {
    const m = f.match(/^units\/([a-z]{2})\/([a-z]{2}-\d{2})\/tasks\.json$/);
    if (!m) continue;
    const id = m[2];
    vorhanden.add(id);
    const d = geladen.get(f);
    const eintrag = verzeichnet.get(id);
    if (!eintrag) fehler.push(`${f}: fehlt in units/index.json`);
    if (String(d.unit || '').toLowerCase() !== id) fehler.push(`${f}: unit lautet „${d.unit}", erwartet wäre „${id.toUpperCase()}"`);
    if (eintrag && Number(eintrag.aufgaben) !== (d.tasks || []).length) {
      fehler.push(`units/index.json: ${id} meldet ${eintrag.aufgaben} Aufgaben, Datei enthält ${(d.tasks || []).length}`);
    }
    if (eintrag && String(eintrag.title || '') !== String(d.title || '')) {
      fehler.push(`units/index.json: Titel von ${id} weicht von tasks.json ab`);
    }
    const proPfad = { A: 0, B: 0, C: 0 };
    for (const t of d.tasks || []) if (proPfad[t.path] != null) proPfad[t.path]++;
    if (proPfad.A !== 4 || proPfad.B !== 6 || proPfad.C !== 4) {
      fehler.push(`${f}: erwartet A/B/C = 4/6/4, gefunden ${proPfad.A}/${proPfad.B}/${proPfad.C}`);
    }
  }
  for (const id of verzeichnet.keys()) {
    if (!vorhanden.has(id)) fehler.push(`units/index.json: ${id} verweist auf keine tasks.json`);
  }
  if (verzeichnet.size !== 54 || vorhanden.size !== 54) {
    fehler.push(`Einheitenumfang: Verzeichnis ${verzeichnet.size}, Dateien ${vorhanden.size}; erwartet 54`);
  }
  melde(`${vorhanden.size} Einheiten mit units/index.json und Sollverteilung 4/6/4 abgeglichen`);
} catch (e) {
  fehler.push('units/index.json konnte nicht geprüft werden: ' + e.message);
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
const bekannteAnim = new Set([...animQuelle.matchAll(/register\(\{\s*id:\s*'([a-z0-9]+)'/g)].map(m => m[1]));
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

/* Jede Animation braucht eine Textfassung für A/B/C. Ein bloßer Kurztext
   bleibt als Laufzeit-Fallback erlaubt, soll aber bei den registrierten
   Lernanimationen nicht die differenzierte Beschreibung ersetzen. */
const animBloecke = [...animQuelle.matchAll(/register\(\{\s*id:\s*'([a-z0-9]+)'([\s\S]*?)\n\s{2}\}\);/g)];
if (animBloecke.length !== bekannteAnim.size) {
  fehler.push(`Animationsprüfung konnte nur ${animBloecke.length} von ${bekannteAnim.size} Definitionen abgrenzen`);
}
for (const [, id, inhalt] of animBloecke) {
  const kopf = inhalt.split(/\n\s*bauen\s*\(/)[0];
  const textBlock = (kopf.match(/\btext\s*:\s*\{([\s\S]*?)\n\s*\}/) || [])[1] || '';
  for (const stufe of ['A', 'B', 'C']) {
    if (!new RegExp(`\\b${stufe}\\s*:\\s*\\[[^\\]]+\\]`).test(textBlock)) {
      fehler.push(`Animation ${id}: Textfassung für Stufe ${stufe} fehlt`);
    }
  }
}
melde(`${animBloecke.length} Animationen mit Textfassungen A/B/C geprüft`);

/* ---------- 8 · Service Worker kennt alle Dateien ---------- */
const swQuelle = lies('sw.js');
const imCache = new Set([...swQuelle.matchAll(/'([^']+\.(?:html|css|js|json))'/g)].map(m => m[1]));
const zuCachen = [
  ...alleDateien('assets', '.js'), ...alleDateien('assets', '.css'),
  ...alleDateien('units', '.json'), ...alleDateien('spiral', '.json')
].map(f => f.replace(/^\.\//, ''));
for (const f of zuCachen) {
  if (f.includes('supabase-config')) continue;      // gerätespezifisch
  if (!imCache.has(f)) fehler.push(`sw.js cached ${f} nicht`);
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

/* ---------- 9b · Content-Security-Policy ----------
   Die Richtlinie wirkt nur, wenn sie auf JEDER Seite steht und überall
   dieselbe ist. Eine Seite ohne CSP ist das Loch, durch das alles geht;
   zwei verschiedene Fassungen sind schlimmer als eine, weil niemand mehr
   sagen kann, welche gilt. */
{
  const seiten = alleDateien('.', '.html');
  const gefunden = new Map();
  for (const seite of seiten) {
    const html = lies(seite);
    const treffer = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i);
    if (!treffer) { fehler.push(`${seite}: keine Content-Security-Policy`); continue; }
    const richtlinie = treffer[1];
    if (!gefunden.has(richtlinie)) gefunden.set(richtlinie, []);
    gefunden.get(richtlinie).push(seite);

    /* Die Richtlinie erlaubt nur Skripte von eigener Herkunft. Ein
       Inline-Block würde deshalb nicht ausgeführt — der Fehler fiele erst
       im Browser auf, und dort als „geht nicht", nicht als Meldung. */
    for (const block of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>/gi)) {
      fehler.push(`${seite}: Inline-<script> — die CSP führt es nicht aus, bitte in eine Datei auslagern (${block[0].slice(0, 40)})`);
    }
  }
  if (gefunden.size > 1) {
    const uebersicht = [...gefunden.values()].map(s => s.join(', ')).join('  ||  ');
    fehler.push(`Uneinheitliche Content-Security-Policy in: ${uebersicht}`);
  }
  const richtlinie = [...gefunden.keys()][0] || '';
  for (const pflicht of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "base-uri 'none'"]) {
    if (richtlinie && !richtlinie.includes(pflicht)) {
      fehler.push(`Content-Security-Policy: „${pflicht}" fehlt`);
    }
  }
  /* Wenn das Tracking eingeschaltet ist, muss die Datenbank auch erreichbar
     sein — sonst blockiert die eigene Richtlinie den Datenversand. */
  if (/enabled\s*:\s*true/.test(lies('assets/js/supabase-config.js')) &&
      richtlinie && !/connect-src[^;]*supabase/.test(richtlinie)) {
    fehler.push('Content-Security-Policy: Tracking ist aktiv, aber connect-src erlaubt Supabase nicht');
  }
  melde(`${seiten.length} Seiten mit identischer Content-Security-Policy, keine Inline-Skripte`);
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

/* ---------- 10b · Erklärvideos ----------
   Das Schema prüft die Form der Adresse. Hier geht es um das, was das
   Schema nicht sehen kann: dass dieselbe Einheit nicht zweimal auf dasselbe
   Video zeigt, dass ein pfadgebundenes Video zu einem Pfad gehört, den es in
   dieser Einheit gibt, und dass die Verweise überhaupt in der Quellliste
   stehen — sonst ist unklar, woher sie stammen. */
{
  let videos = 0;
  const proVideo = new Map();
  for (const f of einheiten) {
    const d = geladen.get(f);
    const gesehen = new Set();
    const pfade = new Set((d.tasks || []).map(t => t.path));
    for (const video of d.videos || []) {
      videos++;
      const id = String(video.url).split('v=')[1] || '';
      if (gesehen.has(video.url)) fehler.push(`${f}: Video ${id} ist doppelt eingetragen`);
      gesehen.add(video.url);
      if (video.pfad && !pfade.has(video.pfad)) {
        fehler.push(`${f}: Video ${id} ist an Pfad ${video.pfad} gebunden, den es hier nicht gibt`);
      }
      if (!proVideo.has(id)) proVideo.set(id, []);
      proVideo.get(id).push(d.unit);
    }
  }

  /* Ein Video, das in vier Einheiten steht, erklärt vermutlich keine davon
     genau. Das ist ein Hinweis, kein Fehler — bei Grundlagen wie dem Satz
     des Pythagoras ist Mehrfachnutzung richtig. */
  for (const [id, orte] of proVideo) {
    if (orte.length > 3) warnung.push(`Video ${id} ist in ${orte.length} Einheiten verlinkt: ${orte.join(', ')}`);
  }

  /* Die Quellliste ist die Herkunftsangabe. Fehlt sie, lässt sich später
     nicht mehr sagen, woher ein Verweis kam und wonach ausgewählt wurde. */
  const quelldatei = 'youtube_videos_lehrerschmitt.csv';
  if (fs.existsSync(P(quelldatei))) {
    const csv = lies(quelldatei);
    const bekannt = new Set([...csv.matchAll(/watch\?v=([A-Za-z0-9_-]{11})/g)].map(m => m[1]));
    for (const [id, orte] of proVideo) {
      if (!bekannt.has(id)) fehler.push(`Video ${id} (${orte.join(', ')}) steht nicht in ${quelldatei}`);
    }
    melde(`${videos} Erklärvideos in ${proVideo.size} Adressen, alle aus ${quelldatei}`);
  } else {
    warnung.push(`${quelldatei} fehlt — die Herkunft der ${videos} Videoverweise ist nicht mehr nachvollziehbar`);
    melde(`${videos} Erklärvideos in ${proVideo.size} Adressen`);
  }
}

/* ---------- 11 · JavaScript-Syntax ---------- */
for (const f of [...alleDateien('assets/js', '.js'), 'sw.js', ...alleDateien('dashboard', '.js'), ...alleDateien('werkzeuge', '.js')]) {
  try { execFileSync(process.execPath, ['--check', P(f)], { stdio: 'pipe' }); }
  catch (e) { fehler.push(`${f}: Syntaxfehler — ${String(e.stderr || e.message).split('\n')[0]}`); }
}
melde('JavaScript-Syntax geprüft');

/* ---------- 12 · devMode passend zum Zweig ---------- */
let zweig = process.env.GITHUB_BASE_REF || process.env.GITHUB_REF_NAME || '';
if (!zweig) {
  try { zweig = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: WURZEL, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim(); }
  catch { zweig = ''; }
}
const konfig = lies('assets/js/supabase-config.js');
const devAn = /devMode\s*:\s*true/.test(konfig);
if (zweig === 'master' && devAn) fehler.push('supabase-config.js: devMode ist auf master eingeschaltet');
if (zweig === 'develop' && !devAn) fehler.push('supabase-config.js: devMode ist auf develop ausgeschaltet');
if (zweig) melde(`Ziel-/Arbeitszweig ${zweig}, devMode ${devAn ? 'ein' : 'aus'}`);

/* ---------- 13 · Cache-Version erhöht? ---------- */
const version = (swQuelle.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1] || '';
if (!version) fehler.push('sw.js: const VERSION fehlt');
try {
  const istCiVergleich = Boolean(process.env.GITHUB_BASE_REF);
  const basis = istCiVergleich ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  let vergleich = `${basis}...HEAD`;
  let altRef = basis;

  if (!istCiVergleich) {
    const arbeitsbaum = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
      cwd: WURZEL, stdio: ['ignore', 'pipe', 'pipe']
    }).toString().split('\n').filter(Boolean);
    if (arbeitsbaum.length) {
      /* Lokale Prüfung vor dem Commit: genau der häufigste Moment, in dem
         eine Cache-Erhöhung vergessen wird. */
      vergleich = 'HEAD';
      altRef = 'HEAD';
    }
  }

  const args = vergleich === 'HEAD'
    ? ['diff', '--name-only', 'HEAD']
    : ['diff', '--name-only', vergleich];
  const geaendert = execFileSync('git', args, { cwd: WURZEL, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString().split('\n').filter(Boolean);
  const relevant = geaendert.filter(f => /^(assets\/|units\/|spiral\/|dashboard\/)/.test(f) || /\.html$/.test(f));
  if (relevant.length) {
    let alt = '';
    try {
      const altSw = execFileSync('git', ['show', `${altRef}:sw.js`], { cwd: WURZEL, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
      alt = (altSw.match(/const VERSION\s*=\s*'([^']+)'/) || [])[1] || '';
    } catch { /* Basisstand ohne sw.js */ }
    if (alt && alt === version) {
      fehler.push(`${relevant.length} Programm- oder Inhaltsdateien geändert, aber Cache-VERSION blieb „${version}"`);
    }
  }
} catch { /* erster Commit oder Export ohne Git-Historie */ }
melde(`Cache-Version ${version}`);

try {
  const manifest = liesJson('version.json');
  if (manifest.cache_version !== version) {
    fehler.push(`version.json: cache_version „${manifest.cache_version}" passt nicht zu sw.js „${version}"`);
  }
  const nummerManifest = String(manifest.version || '').match(/^v(\d+)$/);
  const nummerCache = String(version).match(/-v(\d+)-/);
  if (!nummerManifest || !nummerCache || nummerManifest[1] !== nummerCache[1]) {
    fehler.push(`version.json: Version „${manifest.version}" passt nicht zur Cache-Version „${version}"`);
  }
  if (Number(manifest.einheiten) !== 54) fehler.push('version.json: einheiten muss 54 sein');
  melde(`Versionsmanifest ${manifest.version} stimmt mit dem Service Worker überein`);
} catch (e) {
  fehler.push('version.json fehlt oder ist ungültig: ' + e.message);
}

/* ---------- 14 · Supabase-SQL strukturell prüfen ---------- */
try {
  const sql = lies('supabase/setup.sql');
  const ohneKommentare = sql.replace(/--[^\n]*/g, ' ');
  if ((sql.match(/\$\$/g) || []).length % 2 !== 0) fehler.push('supabase/setup.sql: ungerade Zahl von $$-Begrenzern');
  if (/\bwhere\s+where\b/i.test(ohneKommentare)) fehler.push('supabase/setup.sql: doppeltes WHERE gefunden');
  if (/\bbegin\s+begin\b/i.test(ohneKommentare)) fehler.push('supabase/setup.sql: doppeltes BEGIN gefunden');
  if (!/^\s*begin\s*;/i.test(ohneKommentare)) fehler.push('supabase/setup.sql: Transaktion beginnt nicht mit BEGIN;');
  if (!/commit\s*;\s*$/i.test(ohneKommentare)) fehler.push('supabase/setup.sql: Transaktion endet nicht mit COMMIT;');
  for (const name of ['mathe9_validate_student_login', 'mathe9_aufraeumen', 'mathe9_person_export', 'mathe9_person_loeschen', 'mathe9_student_anmelden', 'mathe9_student_sitzung', 'mathe9_ist_lehrkraft', 'mathe9_wartung_status', 'mathe9_lehrkraft_sperren', 'mathe9_lehrkraft_uebersicht']) {
    if (!new RegExp('create\\s+or\\s+replace\\s+function\\s+public\\.' + name + '\\b', 'i').test(sql)) {
      fehler.push(`supabase/setup.sql: Funktion ${name} fehlt`);
    }
  }
  for (const name of ['mathe9_aufraeumen', 'mathe9_person_export', 'mathe9_person_loeschen']) {
    const muster = 'create\\s+or\\s+replace\\s+function\\s+public\\.' + name + '\\b([\\s\\S]*?)\\n\\$\\$;';
    const block = (sql.match(new RegExp(muster, 'i')) || [])[1] || '';
    if (!/auth\.uid\(\)/i.test(block) || !/42501/.test(block)) {
      fehler.push(`supabase/setup.sql: SECURITY-DEFINER-Funktion ${name} prüft die Lehrkraftfreigabe nicht ausdrücklich`);
    }
  }
  if (!/delete\s+from\s+public\.mathe9_student_tokens\s+where\s+gueltig_bis\s*</i.test(sql)) {
    fehler.push('supabase/setup.sql: abgelaufene Schüler-Tokens werden nicht bereinigt');
  }
  /* Ohne Protokolltabellen sind Aufräumjob und Lehrkraftfreigabe nicht
     überprüfbar — genau die beiden Dinge, die im Zweifel jemand belegen muss. */
  for (const tabelle of ['mathe9_wartung_laeufe', 'mathe9_teacher_audit']) {
    if (!new RegExp('create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.' + tabelle + '\\b', 'i').test(sql)) {
      fehler.push(`supabase/setup.sql: Protokolltabelle ${tabelle} fehlt`);
    }
    if (!new RegExp('alter\\s+table\\s+public\\.' + tabelle + '\\s+enable\\s+row\\s+level\\s+security', 'i').test(sql)) {
      fehler.push(`supabase/setup.sql: ${tabelle} ohne Row Level Security`);
    }
  }
  if (!/insert\s+into\s+public\.mathe9_wartung_laeufe/i.test(sql)) {
    fehler.push('supabase/setup.sql: mathe9_aufraeumen protokolliert seine Läufe nicht');
  }
  if (!/insert\s+into\s+public\.mathe9_teacher_audit/i.test(sql)) {
    fehler.push('supabase/setup.sql: Änderungen an der Lehrkraftfreigabe werden nicht protokolliert');
  }
  /* Lernmodus, Freigaben und Lernzeit sind seit V30 der Kern des
     Unterrichtsablaufs. Fehlt eines davon, sperrt oder öffnet die
     Anwendung stillschweigend das Falsche. */
  for (const name of ['mathe9_lernmodus', 'mathe9_lernzeit_melden', 'mathe9_unterricht_setzen', 'mathe9_freigeben', 'mathe9_freigabe_zuruecknehmen']) {
    if (!new RegExp('create\\s+or\\s+replace\\s+function\\s+public\\.' + name + '\\b', 'i').test(sql)) {
      fehler.push(`supabase/setup.sql: Funktion ${name} fehlt`);
    }
  }
  for (const tabelle of ['mathe9_unterricht', 'mathe9_freigaben', 'mathe9_lernzeit']) {
    if (!new RegExp('create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.' + tabelle + '\\b', 'i').test(sql)) {
      fehler.push(`supabase/setup.sql: Tabelle ${tabelle} fehlt`);
    }
    if (!new RegExp('alter\\s+table\\s+public\\.' + tabelle + '\\s+enable\\s+row\\s+level\\s+security', 'i').test(sql)) {
      fehler.push(`supabase/setup.sql: ${tabelle} ohne Row Level Security`);
    }
  }
  /* Ein abgelaufener Bewertungsmodus muss von selbst in den offenen
     Zustand zurückfallen — sonst sperrt eine vergessene Umschaltung die
     ganze Klasse bis zum nächsten Eingriff aus. */
  if (!/gilt_bis\s+is\s+null\s+or\s+aktuell\.gilt_bis\s*>\s*now\(\)/i.test(sql)) {
    fehler.push('supabase/setup.sql: mathe9_lernmodus lässt den Bewertungsmodus nicht ablaufen');
  }
  /* Lernzeit ist personenbezogen und gehört in Auskunft und Löschfrist. */
  if (!/'lernzeit'/.test(sql)) {
    fehler.push('supabase/setup.sql: mathe9_person_export enthält die Lernzeit nicht');
  }
  if (!/delete\s+from\s+public\.mathe9_lernzeit/i.test(sql)) {
    fehler.push('supabase/setup.sql: Lernzeiten werden nicht aufgeräumt');
  }
  melde('Supabase-SQL auf Transaktion, Verwaltungsrechte, Tokenpflege, Protokolle und Funktionsblöcke geprüft');
} catch (e) {
  fehler.push('supabase/setup.sql konnte nicht geprüft werden: ' + e.message);
}

/* ---------- 14b · Handschriftliche Übungsblätter ----------
   Jede Einheit braucht ihr Blatt. Fehlt eines, verweist die Einheitenseite
   auf eine Datei, die es nicht gibt — und der handschriftliche Teil des
   Unterrichts fällt genau dort aus, wo niemand es merkt. */
{
  const ordner = P('uebungsblaetter');
  let blaetter = 0;
  let generatoren = 0;
  const bekannt = new Set();

  if (!fs.existsSync(ordner)) {
    fehler.push('Ordner uebungsblaetter/ fehlt');
  } else {
    for (const datei of fs.readdirSync(ordner).filter(f => f.endsWith('.json'))) {
      const daten = liesJson('uebungsblaetter/' + datei);
      for (const [id, blatt] of Object.entries(daten.einheiten || {})) {
        blaetter++;
        bekannt.add(id);
        generatoren += (blatt.aufgaben || []).length;
        if (!blatt.auftrag) fehler.push(`uebungsblaetter/${datei}: ${id} ohne Arbeitsauftrag`);
        if ((blatt.aufgaben || []).length < 4) {
          fehler.push(`uebungsblaetter/${datei}: ${id} hat nur ${(blatt.aufgaben || []).length} Aufgaben`);
        }
      }
    }
  }

  for (const f of einheiten) {
    const id = (f.match(/^units\/[a-z]{2}\/([a-z]{2}-\d{2})\//) || [])[1];
    if (!id) continue;
    if (!bekannt.has(id)) fehler.push(`uebungsblaetter/: kein Blatt für ${id}`);
    const pdf = f.replace('tasks.json', 'uebungsblatt.pdf');
    if (!fs.existsSync(P(pdf))) {
      fehler.push(`${pdf} fehlt — node werkzeuge/uebungsblaetter.js ausführen`);
    } else if (fs.statSync(P(pdf)).size < 1500) {
      fehler.push(`${pdf} ist verdächtig klein (${fs.statSync(P(pdf)).size} Bytes)`);
    }
  }
  melde(`${blaetter} Übungsblätter mit ${generatoren} Generatoren, ${einheiten.length} PDFs vorhanden`);
}

/* ---------- 15 · Changelog zur aktuellen Fassung ----------
   Eine Fassung ohne festgehaltene Änderungen lässt sich im Störungsfall
   nicht beurteilen — und der Rückkehrpunkt steht dann nirgends. */
try {
  const manifest = liesJson('version.json');
  const changelog = lies('CHANGELOG.md');
  if (!new RegExp(`^##\\s+${manifest.version}\\b`, 'm').test(changelog)) {
    fehler.push(`CHANGELOG.md: kein Abschnitt „## ${manifest.version}"`);
  } else {
    melde(`CHANGELOG.md enthält einen Abschnitt zu ${manifest.version}`);
  }
} catch (e) {
  fehler.push('CHANGELOG.md fehlt oder ist nicht lesbar: ' + e.message);
}

/* ---------- 16 · Kategorienkatalog der Fehlvorstellungen ----------
   Das Dashboard fasst Denkfehler über die Lernbereiche hinweg zusammen.
   Ein Muster, das nicht übersetzt, würde dort still danebenliegen. */
try {
  const katalog = liesJson('schema/fehlvorstellungen-kategorien.json');
  const kategorien = katalog.kategorien || [];
  if (!kategorien.length) fehler.push('schema/fehlvorstellungen-kategorien.json: keine Kategorien');
  const regeln = [];
  const bekannteIds = new Set();
  for (const k of kategorien) {
    if (bekannteIds.has(k.id)) fehler.push(`Kategorie ${k.id} ist doppelt`);
    bekannteIds.add(k.id);
    for (const feld of ['titel', 'beschreibung']) {
      if (!k[feld]) fehler.push(`Kategorie ${k.id}: ${feld} fehlt`);
    }
    for (const muster of k.muster || []) {
      try { regeln.push([k, new RegExp(muster)]); }
      catch (e) { fehler.push(`Kategorie ${k.id}: Muster „${muster}" ist kein gültiger regulärer Ausdruck`); }
    }
  }
  const alleIds = new Set();
  for (const f of einheiten) {
    for (const t of geladen.get(f).tasks || []) {
      const alle = [...(t.misconceptions || []), ...(t.fields || []).flatMap(x => x.misconceptions || [])];
      alle.forEach(m => { if (m.id) alleIds.add(m.id); });
    }
  }
  /* Offene IDs sind bewusst KEIN Fehler: Eine Kategorie zu raten wäre
     schlechter als sie offen zu lassen. Gemeldet werden sie trotzdem —
     sie sind die Arbeitsliste für die fachliche Durchsicht. */
  const offen = [...alleIds].filter(id => !regeln.some(([, r]) => r.test(id)));
  if (offen.length) {
    warnung.push(`${offen.length} Fehlvorstellungen ohne Kategorie — node werkzeuge/fehlvorstellungen-sichten.js --offen`);
  }
  melde(`${alleIds.size} Fehlvorstellungen gegen ${kategorien.length} Kategorien geprüft (${offen.length} offen)`);
} catch (e) {
  fehler.push('schema/fehlvorstellungen-kategorien.json konnte nicht geprüft werden: ' + e.message);
}

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
