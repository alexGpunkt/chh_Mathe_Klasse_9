#!/usr/bin/env node
/* ============================================================
   links-pruefen.js · externe Übungen anfragen

   Aufruf:  node werkzeuge/links-pruefen.js
            node werkzeuge/links-pruefen.js --bericht befund.json

   Mit --bericht wird der Befund zusätzlich als JSON geschrieben. Daraus
   baut der GitHub-Workflow ein Issue: neue Fehler öffnen es, ein
   bestehendes wird aktualisiert, und wenn wieder alles erreichbar ist,
   wird es geschlossen. Ein Befund, der nur im Actions-Protokoll steht,
   wird nicht gelesen.

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
const BERICHT = (() => {
  const i = process.argv.indexOf('--bericht');
  return i >= 0 ? process.argv[i + 1] : null;
})();

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
  /* Viele Einheiten verweisen auf dieselbe Sammlung. Jede URL wird deshalb
     nur einmal angefragt und der Befund anschließend allen Fundstellen
     zugeordnet. Sechs parallele Anfragen bleiben freundlich zu den
     Plattformen und verkürzen den Lauf dennoch deutlich. */
  const fundstellen = new Map();
  for (const datei of einheiten()) {
    const d = JSON.parse(fs.readFileSync(datei, 'utf8'));
    const kurz = path.relative(WURZEL, datei).replace(/\\/g, '/');
    for (const l of d.uebungslinks || []) {
      if (!fundstellen.has(l.url)) fundstellen.set(l.url, []);
      fundstellen.get(l.url).push({ datei: kurz, titel: l.titel });
    }
  }

  const urls = [...fundstellen.keys()];
  const ergebnisse = new Map();
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      ergebnisse.set(url, await anfragen(url));
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, urls.length) }, worker));

  const befunde = [];
  for (const url of urls) {
    const erg = ergebnisse.get(url);
    let was = '';
    if (erg.fehler) was = 'nicht erreichbar: ' + erg.fehler;
    else if (erg.status >= 400) was = 'HTTP ' + erg.status;
    else {
      const zielHost = new URL(erg.ziel).hostname.toLowerCase();
      const startHost = new URL(url).hostname.toLowerCase();
      if (zielHost !== startHost) {
        const nochErlaubt = ERLAUBT.some(b => zielHost === b || zielHost.endsWith('.' + b));
        was = `Weiterleitung auf ${zielHost}${nochErlaubt ? '' : ' — Plattform nicht freigegeben'}`;
      }
    }
    if (was) for (const f of fundstellen.get(url)) befunde.push([f.datei, f.titel, url, was]);
  }

  const verweise = [...fundstellen.values()].reduce((n, x) => n + x.length, 0);
  console.log(`${urls.length} unterschiedliche Adressen für ${verweise} Übungsverweise angefragt.`);

  if (BERICHT) schreibeBericht(befunde, urls.length, verweise);

  if (!befunde.length) { console.log('Keine technischen Auffälligkeiten.'); return; }

  console.log(`\n${befunde.length} betroffene Verweise:\n`);
  for (const [datei, titel, url, was] of befunde) {
    console.log(`  ${datei}\n    „${titel}"\n    ${url}\n    → ${was}\n`);
  }
  console.log('Hinweis: Erreichbarkeit ist kein Qualitätsnachweis. Die fachliche');
  console.log('Prüfung bleibt Aufgabe der Lehrkraft.');
  process.exitCode = 2;
})();

/* Der Bericht ist nach Einheiten geordnet, nicht nach URLs: Wer ihn liest,
   muss wissen, welche Stunde betroffen ist — nicht, welcher Server hakt. */
function schreibeBericht(befunde, adressen, verweise) {
  const proEinheit = new Map();
  for (const [datei, titel, url, was] of befunde) {
    const einheit = (datei.match(/units\/[a-z]{2}\/([a-z]{2}-\d{2})\//) || [])[1] || datei;
    if (!proEinheit.has(einheit)) proEinheit.set(einheit, []);
    proEinheit.get(einheit).push({ titel, url, befund: was });
  }

  const zeilen = [];
  for (const [einheit, treffer] of [...proEinheit].sort()) {
    zeilen.push(`### ${einheit.toUpperCase()}`);
    zeilen.push('');
    for (const t of treffer) {
      zeilen.push(`- **${t.befund}** — [${t.titel}](${t.url})`);
    }
    zeilen.push('');
  }

  const markdown = befunde.length
    ? [
        `${befunde.length} Übungsverweise sind technisch auffällig `
          + `(${adressen} Adressen für ${verweise} Verweise geprüft).`,
        '',
        ...zeilen,
        '---',
        '',
        'Erreichbarkeit ist **kein** Qualitätsnachweis: Eine 200 sagt nichts darüber,',
        'ob die Aufgaben fachlich noch passen, ob die Seite inzwischen Werbung zeigt',
        'oder eine Anmeldung verlangt. Diese Prüfung bleibt Aufgabe der Lehrkraft.',
        '',
        'Wird ein Verweis ersetzt oder entfernt, verschwindet er beim nächsten Lauf',
        'von selbst aus dieser Liste.'
      ].join('\n')
    : `Alle ${adressen} Adressen für ${verweise} Übungsverweise waren erreichbar.`;

  const inhalt = {
    geprueft_am: new Date().toISOString(),
    adressen,
    verweise,
    betroffen: befunde.length,
    einheiten: [...proEinheit.keys()].sort(),
    markdown,
    befunde: befunde.map(([datei, titel, url, was]) => ({ datei, titel, url, befund: was }))
  };

  fs.mkdirSync(path.dirname(path.resolve(BERICHT)), { recursive: true });
  fs.writeFileSync(BERICHT, JSON.stringify(inhalt, null, 2));
  console.log(`Bericht geschrieben: ${BERICHT}`);
}
