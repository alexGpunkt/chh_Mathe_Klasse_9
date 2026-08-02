#!/usr/bin/env node
/* ============================================================
   links-pruefen.js · externe Übungen anfragen

   Aufruf:  node werkzeuge/links-pruefen.js

   Meldet, was sich technisch feststellen lässt:
     - nicht erreichbar oder Zeitüberschreitung
     - HTTP-Fehler
     - Weiterleitung auf eine andere Domain
     - Plattform nicht mehr freigegeben

   Was NICHT geprüft wird und weiterhin ein Mensch ansehen muss: ob der
   Inhalt fachlich noch passt, ob die Aufgaben zum Niveau gehören und ob
   die Seite inzwischen Werbung oder eine Anmeldepflicht zeigt. Eine 200
   ist kein Qualitätsnachweis.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const WURZEL = path.resolve(__dirname, '..');
const ERLAUBT = ['learningapps.org', 'serlo.org', 'h5p.org', 'schule-bw.de',
                 'learningsnacks.de', 'quizlet.com', 'zum.de'];
const ZEITGRENZE = 15000;

function einheiten() {
  const treffer = [];
  const basis = path.join(WURZEL, 'units');
  for (const bereich of fs.readdirSync(basis)) {
    const b = path.join(basis, bereich);
    if (!fs.statSync(b).isDirectory()) continue;
    for (const e of fs.readdirSync(b)) {
      const datei = path.join(b, e, 'tasks.json');
      if (fs.existsSync(datei)) treffer.push(datei);
    }
  }
  return treffer;
}

async function anfragen(url) {
  const steuerung = new AbortController();
  const uhr = setTimeout(() => steuerung.abort(), ZEITGRENZE);
  try {
    /* Erst HEAD — spart Übertragung. Manche Plattformen mögen kein HEAD,
       dann noch einmal als GET. */
    let antwort = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: steuerung.signal });
    if (antwort.status === 405 || antwort.status === 501) {
      antwort = await fetch(url, { method: 'GET', redirect: 'follow', signal: steuerung.signal });
    }
    return { status: antwort.status, ziel: antwort.url };
  } catch (e) {
    return { fehler: e.name === 'AbortError' ? 'Zeitüberschreitung' : e.message };
  } finally {
    clearTimeout(uhr);
  }
}

(async () => {
  const befunde = [];
  let geprueft = 0;

  for (const datei of einheiten()) {
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const kurz = path.relative(WURZEL, datei).replace(/\\/g, '/');
    for (const l of d.uebungslinks || []) {
      geprueft++;
      const start = new URL(l.url);
      const erg = await anfragen(l.url);

      if (erg.fehler) { befunde.push([kurz, l.titel, l.url, 'nicht erreichbar: ' + erg.fehler]); continue; }
      if (erg.status >= 400) { befunde.push([kurz, l.titel, l.url, 'HTTP ' + erg.status]); continue; }

      const zielHost = new URL(erg.ziel).hostname.toLowerCase();
      const startHost = start.hostname.toLowerCase();
      if (zielHost !== startHost) {
        const nochErlaubt = ERLAUBT.some(b => zielHost === b || zielHost.endsWith('.' + b));
        befunde.push([kurz, l.titel, l.url,
          `Weiterleitung auf ${zielHost}${nochErlaubt ? '' : ' — Plattform nicht freigegeben'}`]);
      }
    }
  }

  console.log(`${geprueft} externe Übungen angefragt.`);
  if (!befunde.length) { console.log('Keine technischen Auffälligkeiten.'); return; }

  console.log(`\n${befunde.length} Auffälligkeiten:\n`);
  for (const [datei, titel, url, was] of befunde) {
    console.log(`  ${datei}\n    „${titel}"\n    ${url}\n    → ${was}\n`);
  }
  console.log('Hinweis: Erreichbarkeit ist kein Qualitätsnachweis. Die fachliche');
  console.log('Prüfung bleibt Aufgabe der Lehrkraft.');
  process.exitCode = befunde.length ? 2 : 0;   // 2 = nur Hinweis, kein Baufehler
})();
