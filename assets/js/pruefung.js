/* ============================================================
   pruefung.js · Prüfungstrainer

   Wichtig: Das hier ist KEIN eigener Aufgabenbestand, sondern eine
   SICHT auf den vorhandenen Pool. Gefiltert wird über Tags (bbr, msa)
   und Stufen. Sonst müsstest du zwei Pools pflegen — und der zweite
   veraltet.

   Gerendert wird mit derselben engine.js wie die Einheiten. Diese Datei
   stellt nur zusammen und setzt window.QUELLE.
   ============================================================ */

const P = { sets: null, idx: null, formelkarte: null };

const $p = s => document.querySelector(s);

function mische(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function hole(pfad) {
  const r = await fetch(pfad, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${pfad}: HTTP ${r.status}`);
  return r.json();
}

/* ---------- Alle Einheiten laden ---------- */
async function alleAufgaben() {
  const einheiten = [];
  for (const b of P.idx.bereiche) {
    for (const e of b.einheiten) einheiten.push({ bereich: b.code, ...e });
  }
  const daten = await Promise.all(
    einheiten.map(e => hole(`units/${e.bereich}/${e.id}/tasks.json`)));
  const raus = [];
  const woerter = new Set();
  daten.forEach(d => {
    (d.wortspeicher || []).forEach(w => woerter.add(w));
    d.tasks.forEach(t => raus.push({ ...t, herkunft: 'aus ' + d.unit }));
  });
  return { tasks: raus, wortspeicher: [...woerter] };
}

/* ---------- Ein Set zusammenstellen ---------- */
async function baueSet(id) {
  const set = P.sets.find(s => s.id === id);
  if (!set) throw new Error(`Unbekanntes Set: ${id}`);

  const pfad = set.pfad || Speicher.lies('mathe9.pfad', 'B');
  const { tasks, wortspeicher } = await alleAufgaben();

  let treffer = tasks.filter(t => t.path === pfad);
  if (set.filter.tag) treffer = treffer.filter(t => (t.tags || []).includes(set.filter.tag));
  if (set.filter.step_min) treffer = treffer.filter(t => t.step >= set.filter.step_min);

  if (!treffer.length) {
    throw new Error(`Für Pfad ${pfad} enthält dieses Set keine Aufgaben`);
  }
  const gewaehlt = mische(treffer).slice(0, set.anzahl);
  const ziel = Math.min(set.ziel, gewaehlt.length);

  return {
    unit: 'PRÜFUNG',
    title: set.title,
    leitidee: 'L1',
    standards: ['K1', 'K3', 'K5'],
    wortspeicher,
    can_do: { A: '', B: '', C: '' },
    formelkarte: P.formelkarte,
    tasks: gewaehlt,
    pfad_fest: pfad,
    reihenfolge_fest: true,
    hilfen: set.hilfen,
    pruefung: { id: set.id, ziel }
  };
}

/* ---------- Auswahl anzeigen ---------- */
function zeigeAuswahl() {
  const pfad = Speicher.lies('mathe9.pfad', 'B');

  /* In der Auswahl gibt es nichts zu bedienen: kein Fortschritt, keine
     Pfadwahl, keine Formelkarte. Elemente zeigen, die nichts tun, ist
     schlimmer als keine Elemente. */
  ['.streifen-wrap', '.pfadwahl', '.formelkarte'].forEach(s => {
    const n = document.querySelector(s);
    if (n) n.remove();
  });
  document.body.style.paddingBottom = '24px';

  const b = $p('#buehne');
  b.innerHTML = '';

  const info = document.createElement('p');
  info.className = 'stufe-zeile';
  info.innerHTML = `<span class="stufe-pill">Pfad ${pfad}</span>
    <span>Sets ohne festen Pfad nutzen deinen Lernweg.</span>`;
  b.append(info);

  const liste = document.createElement('div');
  liste.className = 'liste';
  for (const s of P.sets) {
    const a = document.createElement('a');
    a.className = 'eintrag';
    a.href = `pruefung.html?set=${s.id}`;
    const p = s.pfad || pfad;
    a.style.borderLeft = `4px solid var(--${p.toLowerCase()})`;
    a.innerHTML = `
      <span class="nr">${s.anzahl}&nbsp;Aufg.</span>
      <span class="txt"><strong>${s.title}</strong><span>${s.untertitel}</span></span>
      <span class="pfeil">→</span>`;
    liste.append(a);
  }
  b.append(liste);

  const hinweis = document.createElement('p');
  hinweis.className = 'hinweis';
  hinweis.innerHTML = `Die Sets ziehen aus allen Einheiten, die es gibt — jedes Mal neu
    gemischt. Es zählt, was <b>auf Anhieb</b> sitzt. Die Formelkarte bleibt unten
    erreichbar, so wie in der echten Prüfung die Formelsammlung.`;
  b.append(hinweis);
}

/* ---------- Ablauf ---------- */
async function starteP() {
  try {
    const [sets, idx] = await Promise.all([
      hole('pruefung-sets.json'), hole('units/index.json')]);
    P.sets = sets.sets;
    P.formelkarte = sets.formelkarte;
    P.idx = idx;
  } catch (e) {
    $p('#buehne').innerHTML = `<div class="fehler">
      <strong>Der Prüfungstrainer konnte nicht laden.</strong>
      <p>${e.message}. Starte im Projektordner <code>python -m http.server 8000</code>
      und öffne die Seite über <code>http://localhost:8000</code>.</p></div>`;
    return;
  }

  const id = new URLSearchParams(location.search).get('set');
  if (!id) { zeigeAuswahl(); return; }

  /* engine.js erst jetzt nachladen — sie liest window.QUELLE beim Start. */
  window.QUELLE = () => baueSet(id);
  const s = document.createElement('script');
  s.src = 'assets/js/engine.js';
  document.body.append(s);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starteP);
else starteP();
