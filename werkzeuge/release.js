#!/usr/bin/env node
/* Produktionsfassung kontrolliert vorbereiten.

   Probelauf:  node werkzeuge/release.js
   Schreiben:  node werkzeuge/release.js --schreiben
   Tracking bewusst aktivieren/deaktivieren:
               --tracking | --ohne-tracking

   Bei einer fehlgeschlagenen Prüfung werden sämtliche geschriebenen Dateien
   automatisch auf den vorherigen Stand zurückgesetzt.

   Ohne Changelog-Eintrag für die neue Fassung wird nichts freigegeben: Eine
   Fassung ohne festgehaltene Änderungen, ohne Angabe der zugehörigen
   Datenbankmigration und ohne Rückkehrpunkt ist im Störungsfall nicht zu
   beurteilen. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WURZEL = path.resolve(__dirname, '..');
const P = (...t) => path.join(WURZEL, ...t);
const SCHREIBEN = process.argv.includes('--schreiben');
const TRACKING_AN = process.argv.includes('--tracking');
const TRACKING_AUS = process.argv.includes('--ohne-tracking');
if (TRACKING_AN && TRACKING_AUS) {
  console.error('Bitte nur --tracking oder --ohne-tracking angeben.');
  process.exit(2);
}

function git(...args) {
  try { return execFileSync('git', args, { cwd: WURZEL, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim(); }
  catch { return ''; }
}
function ersetzenBoolean(text, feld, wert) {
  const regel = new RegExp(`(${feld}\\s*:\\s*)(true|false)`);
  if (!regel.test(text)) throw new Error(`Feld „${feld}" fehlt in der Konfiguration.`);
  return text.replace(regel, `$1${wert}`);
}

const dateien = new Map();
function lies(rel) {
  if (!dateien.has(rel)) dateien.set(rel, { alt: fs.readFileSync(P(rel), 'utf8'), neu: null });
  return dateien.get(rel).alt;
}
function plane(rel, neu) { lies(rel); dateien.get(rel).neu = neu; }

/* 1 · Konfiguration: Datenschutzentscheidung nicht heimlich überschreiben. */
let konfig = ersetzenBoolean(lies('assets/js/supabase-config.js'), 'devMode', 'false');
if (TRACKING_AN) konfig = ersetzenBoolean(konfig, 'enabled', 'true');
if (TRACKING_AUS) konfig = ersetzenBoolean(konfig, 'enabled', 'false');
plane('assets/js/supabase-config.js', konfig);

/* 2 · Testzugang nicht voreinstellen. */
let dev = lies('assets/js/dev-tools.js').replace(/readBool\('skipLogin',\s*true\)/g, "readBool('skipLogin', false)");
plane('assets/js/dev-tools.js', dev);

/* 3 · Produktionscache und Manifest. */
let sw = lies('sw.js');
const regel = /const VERSION = '([^']+)'/;
const altCache = (sw.match(regel) || [])[1] || '';
const nummer = Number((altCache.match(/v(\d+)/) || [])[1] || 0);
if (!nummer) throw new Error('Cache-Version in sw.js konnte nicht gelesen werden.');
const neueNummer = nummer + 1;
const neuerCache = `mathe9-v${neueNummer}-prod`;
sw = sw.replace(regel, `const VERSION = '${neuerCache}'`);
plane('sw.js', sw);

const trackingAktiv = /enabled\s*:\s*true/.test(konfig);
const manifest = {
  name: 'Mathe 9 · Campus Hannah Höch',
  version: `v${neueNummer}`,
  cache_version: neuerCache,
  source_commit: git('rev-parse', 'HEAD').slice(0, 12) || 'unbekannt',
  source_branch: git('rev-parse', '--abbrev-ref', 'HEAD') || 'unbekannt',
  source_dirty: Boolean(git('status', '--porcelain')),
  gebaut_am: new Date().toISOString(),
  tracking_aktiv: trackingAktiv,
  einheiten: 54
};
plane('version.json', JSON.stringify(manifest, null, 2) + '\n');

/* 4 · Changelog: Gibt es einen Eintrag für die neue Fassung? */
const changelog = fs.existsSync(P('CHANGELOG.md')) ? fs.readFileSync(P('CHANGELOG.md'), 'utf8') : '';
const changelogEintrag = new RegExp(`^##\\s+v${neueNummer}\\b`, 'm').test(changelog);

/* 5 · Ist die Fassung schon einmal getaggt worden? */
const vorhandeneTags = git('tag', '--list').split('\n').filter(Boolean);
const tagVergeben = vorhandeneTags.includes(`v${neueNummer}`);

console.log(SCHREIBEN ? 'Produktionsfassung wird vorbereitet:\n' : 'Probelauf — nichts wird geschrieben:\n');
for (const [rel, v] of dateien) {
  if (v.alt !== v.neu) console.log(`  · ${rel}`);
}
console.log(`  · Tracking: ${trackingAktiv ? 'aktiv' : 'deaktiviert'}${TRACKING_AN || TRACKING_AUS ? ' (explizit gewählt)' : ' (bestehende Einstellung beibehalten)'}`);
console.log(`  · Cache: ${altCache} → ${neuerCache}`);
console.log(`  · Changelog-Eintrag „## v${neueNummer}": ${changelogEintrag ? 'vorhanden' : 'FEHLT'}`);
console.log(`  · Git-Tag v${neueNummer}: ${tagVergeben ? 'existiert bereits' : 'noch frei'}`);

if (!changelogEintrag) {
  console.error(`\nAbbruch: In CHANGELOG.md fehlt ein Abschnitt „## v${neueNummer} — …".`);
  console.error('Hinein gehören: Änderungen, zugehörige Datenbankmigration,');
  console.error('bekannte Einschränkungen und der Weg zurück zur Vorgängerfassung.');
  process.exit(1);
}
if (tagVergeben) {
  console.error(`\nAbbruch: Das Tag v${neueNummer} ist bereits vergeben.`);
  console.error('Eine bereits veröffentlichte Fassung darf nicht überschrieben werden.');
  process.exit(1);
}

if (!SCHREIBEN) {
  console.log('\nAusführen mit: node werkzeuge/release.js --schreiben');
  process.exit(0);
}

const geschrieben = [];
function rollback() {
  for (const rel of geschrieben.reverse()) fs.writeFileSync(P(rel), dateien.get(rel).alt);
}

try {
  for (const [rel, v] of dateien) {
    if (v.alt === v.neu) continue;
    fs.writeFileSync(P(rel), v.neu);
    geschrieben.push(rel);
  }

  console.log('\nPrüfungen:');
  const env = { ...process.env, GITHUB_REF_NAME: 'master' };
  for (const werkzeug of ['pruefen.js', 'a11y-pruefen.js', 'budget-pruefen.js']) {
    process.stdout.write(`  · ${werkzeug} … `);
    execFileSync(process.execPath, [P('werkzeuge', werkzeug)], { cwd: WURZEL, env, stdio: 'pipe' });
    console.log('in Ordnung');
  }
} catch (error) {
  rollback();
  console.error('\nRelease NICHT freigegeben. Alle Änderungen wurden zurückgesetzt.');
  const ausgabe = String(error.stdout || error.stderr || error.message || '');
  console.error(ausgabe.split('\n').filter(Boolean).slice(0, 20).join('\n'));
  process.exit(1);
}

/* Die Reihenfolge ist nicht beliebig: Der Webclient darf nicht vor den
   Datenbankfunktionen live gehen, die er aufruft. Umgekehrt schadet eine
   migrierte Datenbank der alten Fassung nicht — die neuen Tabellen und
   Funktionen stören sie nicht. */
console.log(`\nBereit. Veröffentlichungsreihenfolge — bitte genau so:

  Datenbank zuerst
   1. Produktionsdatenbank sichern und prüfen, dass die Sicherung nicht leer ist
   2. supabase/setup.sql im TESTPROJEKT ausführen
   3. Rollen, RPCs und Policies im Testprojekt prüfen (Prüfliste in MIGRATION.md)
   4. supabase/setup.sql im produktiven Projekt ausführen
   5. mindestens eine Lehrkraft freischalten und das Dashboard öffnen

  Dann erst die Anwendung
   6. Änderungen prüfen und als Release ${manifest.version} committen
   7. nach master mergen und pushen
   8. GitHub Actions abwarten (Gesamtprüfung, Barrierefreiheit, Browser-Smoke)
   9. Tag setzen:  git tag -a ${manifest.version} -m "${manifest.version}" && git push origin ${manifest.version}
  10. bei geändertem Anmeldeverfahren alte Sitzungstokens widerrufen
  11. TESTPROTOKOLL-GERAETE.md auf echten Geräten durchführen

  Der CHANGELOG-Abschnitt zu ${manifest.version} nennt den Weg zurück.`);
