/* ============================================================
   beamer.js · Fortschritt aller Lernenden als laufende Strichmännchen

   Diese Seite hat bewusst keinen eigenen Datenzugang. Sie hängt an einem
   BroadcastChannel und zeigt, was das Lehrerdashboard hineinschickt.

   Warum kein eigener Abruf?

   - Das Sitzungstoken der Lehrkraft bliebe sonst in zwei Fenstern liegen.
     Eines davon hängt an einem Beamer, oft in einem Raum, den man kurz
     verlässt. Ein Token weniger ist ein Token weniger.
   - Beide Ansichten zeigen garantiert denselben Stand. Zwei unabhängige
     Abrufe im Fünfsekundentakt tun das nicht, und dann diskutiert man im
     Unterricht darüber, welche Zahl stimmt.

   Die Bewertung des Ping-Status läuft dagegen HIER, im Sekundentakt.
   Sonst würde ein Kind erst beim nächsten Datenpaket rot — die Grenzwerte
   sollen aber genau dann greifen, wenn sie überschritten sind.
   ============================================================ */
'use strict';

const KANAL_NAME = 'mathe9-beamer';
const TAKT_MS = 1000;

const $ = s => document.querySelector(s);

let kanal = null;
let stand = { zeilen: [], einstellungen: null, ts: 0, klasse: '', reihe: [] };
let letzteNachricht = 0;
let bahnen = new Map();          // student-Schlüssel → DOM-Knoten

/* ---------- Grundeinstellungen ----------
   Sie kommen mit jedem Datenpaket aus dem Lehrerdashboard. Bis das erste
   ankommt, gelten diese Werte — sie entsprechen den Voreinstellungen dort. */
const STANDARD = {
  maxFehler: 3,
  maxSekundenOhnePing: 120,
  frischSekunden: 45,
  bezug: 'reihe'
};

function einstellungen() {
  return { ...STANDARD, ...(stand.einstellungen || {}) };
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============================================================
   1 · Der Ping-Status
   Drei Zustände, in genau dieser Rangfolge geprüft:

     alarm  Ein Grenzwert ist überschritten — rot und blinkend.
     rot    Der letzte Ping ist zu lange her, aber noch im Rahmen.
     gruen  Der Ping ist da.

   „Erfolglose Ping-Versuche" hat zwei Quellen. Das Gerät selbst zählt
   mit, wie oft ein Versand fehlgeschlagen ist, und hängt den Stand an den
   nächsten Herzschlag. Diese Zahl ist genau, kommt aber erst an, wenn
   wieder etwas durchgeht — ein Gerät ohne Netz kann nicht melden, dass es
   kein Netz hat. Deshalb wird zusätzlich gerechnet, wie viele Herzschläge
   seit dem letzten angekommenen Ping ausgeblieben sein müssen. Gilt der
   jeweils höhere Wert.
   ============================================================ */
function pingLage(zeile) {
  const e = einstellungen();
  const jetzt = Date.now();
  const letzter = zeile.letzterPing ? new Date(zeile.letzterPing).getTime() : 0;
  const sekunden = letzter ? Math.max(0, Math.round((jetzt - letzter) / 1000)) : Infinity;

  const takt = Math.max(5, Number(zeile.pingTaktSekunden) || 20);
  const ausgefallen = Number.isFinite(sekunden)
    ? Math.max(0, Math.floor(sekunden / takt) - 1)
    : Infinity;
  const gemeldet = Math.max(0, Number(zeile.pingFehler) || 0);
  const fehler = Math.max(gemeldet, ausgefallen);

  const ueberZeit = sekunden > e.maxSekundenOhnePing;
  const ueberFehler = fehler > e.maxFehler;

  if (ueberZeit || ueberFehler) {
    return {
      status: 'alarm', sekunden, fehler,
      grund: ueberZeit
        ? `seit ${Number.isFinite(sekunden) ? sekunden + ' s' : 'Beginn'} kein Ping`
        : `${fehler} erfolglose Ping-Versuche`
    };
  }
  if (sekunden > e.frischSekunden) {
    return { status: 'rot', sekunden, fehler, grund: `letzter Ping vor ${sekunden} s` };
  }
  return { status: 'gruen', sekunden, fehler, grund: `Ping vor ${sekunden} s` };
}

/* ============================================================
   2 · Wie weit ist jemand?

   Zwei Bezugsgrößen, im Lehrerdashboard umschaltbar:

     'reihe'    Fortschritt über die ganze Unterrichtsreihe. Die Gerade
                ist der Kurs, die Striche darauf sind die Einheiten.
                Das ist die Ansicht für den Überblick.
     'einheit'  Fortschritt in der aktuellen Einheit. Die Gerade ist eine
                Einheit. Das ist die Ansicht für eine Unterrichtsstunde.
   ============================================================ */
function anteil(zeile) {
  const bezug = einstellungen().bezug;
  const inEinheit = Math.max(0, Math.min(100, Number(zeile.percent) || 0)) / 100;
  if (bezug === 'einheit') return inEinheit;

  const gesamt = (stand.reihe || []).length;
  if (!gesamt) return inEinheit;
  const i = (stand.reihe || []).indexOf(String(zeile.unit || '').toLowerCase());
  if (i < 0) return inEinheit;
  return Math.max(0, Math.min(1, (i + inEinheit) / gesamt));
}

/* ============================================================
   3 · Zeichnen
   ============================================================ */

const SVG = 'http://www.w3.org/2000/svg';

function svgEl(tag, attr) {
  const n = document.createElementNS(SVG, tag);
  Object.entries(attr).forEach(([k, v]) => n.setAttribute(k, String(v)));
  return n;
}

/* Kopf, Rumpf, zwei Arme, zwei Beine. Mehr braucht ein Strichmännchen
   nicht, und weniger Linien heißen auf acht Meter Entfernung: erkennbar. */
function maennchenBauen() {
  const svg = svgEl('svg', { class: 'maennchen', viewBox: '0 0 40 52', 'aria-hidden': 'true' });
  svg.append(
    svgEl('circle', { cx: 20, cy: 8, r: 6 }),
    svgEl('line', { x1: 20, y1: 14, x2: 20, y2: 34 }),                        // Rumpf
    svgEl('line', { class: 'arm-l',  x1: 20, y1: 22, x2: 9,  y2: 30 }),
    svgEl('line', { class: 'arm-r',  x1: 20, y1: 22, x2: 31, y2: 30 }),
    svgEl('line', { class: 'bein-l', x1: 20, y1: 34, x2: 11, y2: 50 }),
    svgEl('line', { class: 'bein-r', x1: 20, y1: 34, x2: 29, y2: 50 })
  );
  return svg;
}

function bahnBauen(zeile) {
  const bahn = document.createElement('div');
  bahn.className = 'bahn';

  const kopf = document.createElement('div');
  kopf.className = 'bahn-kopf';
  const name = document.createElement('span');
  name.className = 'name';
  const ping = document.createElement('span');
  ping.className = 'ping';
  kopf.append(name, ping);

  const strecke = document.createElement('div');
  strecke.className = 'strecke';
  const linie = document.createElement('div');
  linie.className = 'linie';
  const fuell = document.createElement('div');
  fuell.className = 'linie-fuell';
  const ziel = document.createElement('div');
  ziel.className = 'ziel';
  ziel.textContent = '🏁';
  const laeufer = document.createElement('div');
  laeufer.className = 'laeufer';
  laeufer.append(maennchenBauen());
  strecke.append(linie, fuell, laeufer, ziel);

  const fuss = document.createElement('div');
  fuss.className = 'bahn-fuss';
  const einheit = document.createElement('span');
  einheit.className = 'einheit';
  const prozent = document.createElement('span');
  prozent.className = 'prozent';
  fuss.append(einheit, prozent);

  bahn.append(kopf, strecke, fuss);
  bahn._teile = { name, ping, fuell, laeufer, einheit, prozent, strecke };
  return bahn;
}

/* Die Striche auf der Geraden: einer je Einheit der Reihe. Sie werden nur
   neu gesetzt, wenn sich die Reihe oder der Bezug ändert — bei 28 Kindern
   mal 54 Strichen jede Sekunde wäre das sonst spürbar. */
function markenSetzen(bahn) {
  const { strecke } = bahn._teile;
  const gesamt = einstellungen().bezug === 'reihe' ? (stand.reihe || []).length : 0;
  const soll = gesamt > 1 && gesamt <= 60 ? gesamt : 0;
  if (bahn._marken === soll) return;
  bahn._marken = soll;

  strecke.querySelectorAll('.marke').forEach(m => m.remove());
  for (let i = 1; i < soll; i++) {
    const m = document.createElement('div');
    m.className = 'marke';
    m.style.left = (i / soll * 100) + '%';
    strecke.append(m);
  }
}

function spaltenSetzen(anzahl) {
  /* Mehrspaltig, sobald es eng wird. Die Zahl folgt daraus, wie viele
     Zeilen bei der aktuellen Fensterhöhe noch lesbar bleiben — grob eine
     Bahn je 100 Bildpunkten Höhe. */
  const proSpalte = Math.max(1, Math.floor((window.innerHeight - 150) / 100));
  const noetig = Math.max(1, Math.ceil(anzahl / proSpalte));
  const moeglich = Math.max(1, Math.floor(window.innerWidth / 300));
  const spalten = Math.max(1, Math.min(noetig, moeglich, 4));
  $('#bahnen').style.setProperty('--spalten', String(spalten));
}

function zeichnen() {
  const ziel = $('#bahnen');
  const zeilen = [...(stand.zeilen || [])];

  if (!zeilen.length) {
    bahnen.clear();
    ziel.replaceChildren(Object.assign(document.createElement('p'), {
      className: 'leer',
      textContent: letzteNachricht
        ? 'Noch niemand hat heute etwas bearbeitet.'
        : 'Warte auf Daten aus dem Lehrerdashboard …'
    }));
    $('#zaehlerAktiv').textContent = '0';
    $('#zaehlerAlarm').textContent = '0';
    return;
  }

  /* Reihenfolge: alphabetisch. Auf einer Leinwand sucht man Namen, nicht
     Ränge — und eine nach Fortschritt sortierte Liste, die bei jedem
     Aktualisieren springt, macht aus dem Unterricht ein Rennen. */
  zeilen.sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));

  let mitPing = 0;
  let imAlarm = 0;
  const gesehen = new Set();

  zeilen.forEach(zeile => {
    const schluessel = zeile.id || zeile.name;
    gesehen.add(schluessel);

    let bahn = bahnen.get(schluessel);
    if (!bahn) {
      bahn = bahnBauen(zeile);
      bahnen.set(schluessel, bahn);
      ziel.append(bahn);
    }

    const lage = pingLage(zeile);
    if (lage.status === 'gruen') mitPing++;
    if (lage.status === 'alarm') imAlarm++;

    const p = anteil(zeile);
    const t = bahn._teile;

    bahn.dataset.status = lage.status;
    bahn.dataset.fertig = p >= 0.999 ? 'ja' : 'nein';
    bahn.title = `${zeile.name} · ${lage.grund}`;

    t.name.textContent = zeile.name || '—';
    t.ping.title = lage.grund;
    /* Die Füße stehen dort, wo die Strecke aufhört — nicht darüber
       hinaus. Deshalb wird der Läufer innerhalb von 2 % bis 98 % gesetzt. */
    t.laeufer.style.left = (2 + p * 96) + '%';
    t.fuell.style.width = (p * 100) + '%';
    t.einheit.textContent = zeile.unit
      ? String(zeile.unit).toUpperCase() + (zeile.path ? ' · ' + zeile.path : '')
      : '—';
    t.prozent.textContent = Math.round(
      (einstellungen().bezug === 'reihe' ? p * 100 : Number(zeile.percent) || 0)
    ) + ' %';

    markenSetzen(bahn);
  });

  /* Wer nicht mehr im Datenpaket steht, verschwindet auch von der Leinwand. */
  [...bahnen.entries()].forEach(([schluessel, bahn]) => {
    if (gesehen.has(schluessel)) return;
    bahn.remove();
    bahnen.delete(schluessel);
  });

  spaltenSetzen(zeilen.length);
  $('#zaehlerAktiv').textContent = String(mitPing);
  $('#zaehlerAlarm').textContent = String(imAlarm);
}

function kopfzeileSetzen() {
  const e = einstellungen();
  const alter = letzteNachricht ? Math.round((Date.now() - letzteNachricht) / 1000) : null;

  $('#titel').textContent = e.bezug === 'reihe'
    ? 'Wo stehen wir in der Unterrichtsreihe?'
    : 'Wo stehen wir in dieser Einheit?';

  const teile = [];
  if (stand.klasse) teile.push('Lerngruppe ' + stand.klasse);
  teile.push(`Alarm ab ${e.maxFehler} erfolglosen Pings oder ${e.maxSekundenOhnePing} s ohne Ping`);
  if (alter != null) teile.push(`Stand vor ${alter} s`);
  $('#unterzeile').textContent = teile.join(' · ');

  /* Wenn das Dashboard-Fenster geschlossen oder abgestürzt ist, darf hier
     kein eingefrorener Stand stehenbleiben, den niemand als alt erkennt. */
  const hinweis = $('#hinweis');
  if (letzteNachricht && Date.now() - letzteNachricht > 30000) {
    hinweis.textContent = 'Seit über 30 Sekunden kein Datenpaket vom Lehrerdashboard. '
      + 'Ist das Dashboard-Fenster noch offen?';
    hinweis.className = 'hinweis warnung';
    hinweis.hidden = false;
  } else if (letzteNachricht) {
    hinweis.hidden = true;
  }
}

/* ============================================================
   4 · Verbindung zum Lehrerdashboard
   ============================================================ */

function verbinden() {
  if (typeof BroadcastChannel !== 'function') {
    $('#unterzeile').textContent =
      'Dieser Browser kennt BroadcastChannel nicht — die Beameransicht braucht ihn.';
    return;
  }
  kanal = new BroadcastChannel(KANAL_NAME);
  kanal.addEventListener('message', e => {
    const nachricht = e.data || {};
    if (nachricht.typ !== 'daten') return;
    stand = {
      zeilen: Array.isArray(nachricht.zeilen) ? nachricht.zeilen : [],
      einstellungen: nachricht.einstellungen || null,
      klasse: nachricht.klasse || '',
      reihe: Array.isArray(nachricht.reihe) ? nachricht.reihe : [],
      ts: nachricht.ts || Date.now()
    };
    letzteNachricht = Date.now();
    zeichnen();
    kopfzeileSetzen();
  });

  /* Anmelden: Das Dashboard schickt daraufhin sofort das aktuelle Paket,
     statt bis zum nächsten Takt zu warten. Wird alle fünf Sekunden
     wiederholt, solange noch nichts angekommen ist — dann findet die
     Ansicht auch ein Dashboard, das erst später geöffnet wird. */
  const anmelden = () => kanal.postMessage({ typ: 'bereit', ts: Date.now() });
  anmelden();
  setInterval(() => { if (!letzteNachricht) anmelden(); }, 5000);

  /* Abmelden, damit das Dashboard weiß, wann es wieder pausieren darf. */
  addEventListener('pagehide', () => {
    try { kanal.postMessage({ typ: 'tschuess' }); } catch { /* Fenster geht ohnehin */ }
  });
}

/* ============================================================
   5 · Start
   ============================================================ */

/* Der Sekundentakt bewertet nur neu — er holt keine Daten. Ohne ihn
   würde ein Kind erst beim nächsten Datenpaket rot, also je nach Takt bis
   zu fünf Sekunden zu spät. */
setInterval(() => { zeichnen(); kopfzeileSetzen(); }, TAKT_MS);
addEventListener('resize', () => spaltenSetzen(bahnen.size));

$('#vollbild').addEventListener('click', vollbildUmschalten);
addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') vollbildUmschalten();
});

function vollbildUmschalten() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => { /* verweigert */ });
}

verbinden();
zeichnen();
kopfzeileSetzen();
