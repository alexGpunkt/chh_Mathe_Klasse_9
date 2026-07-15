/* ============================================================
   matrix.js · Kompetenzmatrix für die Lehrkraft

   Die „Ich kann"-Sätze stehen bereits in jeder tasks.json unter can_do.
   Diese Seite macht sie abhakbar und gibt sie als Text aus, der direkt in
   ein Zeugnis oder einen Förderplan wandern kann.

   Datenschutz: Die Häkchen liegen unter mathe9.matrix.<Name> im
   localStorage — auf DIESEM Gerät, nichts geht an einen Server. Auf einem
   geteilten Rechner also besser Kürzel statt Klarnamen.
   ============================================================ */

const M = { idx: null, einheiten: [], name: '' };
const $m = s => document.querySelector(s);

const PFADNAME = { A: 'Basis', B: 'Standard', C: 'Vertiefung' };

async function hole(p) {
  const r = await fetch(p, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  return r.json();
}

async function startM() {
  try {
    M.idx = await hole('units/index.json');
    for (const b of M.idx.bereiche) {
      const daten = await Promise.all(
        b.einheiten.map(e => hole(`units/${b.code}/${e.id}/tasks.json`)));
      daten.forEach(d => M.einheiten.push({
        id: d.unit, title: d.title, leitidee: d.leitidee,
        standards: d.standards, can_do: d.can_do, bereich: b.title
      }));
    }
  } catch (e) {
    $m('#inhalt').innerHTML = `<div class="fehler">
      <strong>Die Einheiten konnten nicht geladen werden.</strong>
      <p>${e.message}. Starte <code>python -m http.server 8000</code> im Projektordner.</p></div>`;
    return;
  }

  $m('#name').addEventListener('input', () => {
    M.name = $m('#name').value.trim();
    haekchenLaden();
    $m('#blattname').textContent = M.name || '—';
  });
  $m('#kopieren').addEventListener('click', kopieren);
  $m('#drucken').addEventListener('click', () => window.print());
  $m('#leeren').addEventListener('click', leeren);

  namenslisteBauen();
  matrixBauen();
}

/* ---------- Bekannte Namen anbieten ---------- */
function bekannteNamen() {
  return Speicher.lies('mathe9.matrix.namen', []);
}
function namenMerken(n) {
  if (!n) return;
  const l = bekannteNamen();
  if (!l.includes(n)) { l.push(n); l.sort(); Speicher.schreib('mathe9.matrix.namen', l); }
  namenslisteBauen();
}
function namenslisteBauen() {
  const dl = $m('#namen');
  dl.innerHTML = '';
  bekannteNamen().forEach(n => {
    const o = document.createElement('option');
    o.value = n;
    dl.append(o);
  });
}

/* ---------- Matrix ---------- */
function matrixBauen() {
  const c = $m('#inhalt');
  c.innerHTML = '';
  let bereich = '';

  for (const e of M.einheiten) {
    if (e.bereich !== bereich) {
      bereich = e.bereich;
      c.append(el3('div', 'abschnitt-titel', bereich));
    }
    const karte = el3('div', 'mx-einheit');
    karte.innerHTML = `<div class="mx-kopf">
      <span class="mx-code">${e.id}</span>
      <span class="mx-titel">${e.title}</span>
      <span class="mx-standards">${e.leitidee} · ${e.standards.join(' ')}</span></div>`;

    for (const p of ['A', 'B', 'C']) {
      if (!e.can_do[p]) continue;
      const id = `${e.id}-${p}`;
      const zeile = el3('label', 'mx-zeile');
      zeile.style.borderLeft = `4px solid var(--${p.toLowerCase()})`;
      zeile.innerHTML = `
        <input type="checkbox" data-id="${id}" data-pfad="${p}"
               data-einheit="${e.id}" data-satz="${e.can_do[p].replace(/"/g, '&quot;')}">
        <span class="mx-pfad">${p} · ${PFADNAME[p]}</span>
        <span class="mx-satz">${e.can_do[p]}</span>`;
      zeile.querySelector('input').addEventListener('change', haekchenSpeichern);
      karte.append(zeile);
    }
    c.append(karte);
  }
  haekchenLaden();
}

function el3(tag, klasse, text) {
  const n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (text != null) n.textContent = text;
  return n;
}

/* ---------- Häkchen ---------- */
function schluessel() { return 'mathe9.matrix.' + (M.name || '_ohne_namen'); }

function haekchenSpeichern() {
  const gesetzt = [...document.querySelectorAll('#inhalt input:checked')].map(i => i.dataset.id);
  Speicher.schreib(schluessel(), gesetzt);
  namenMerken(M.name);
  zaehlerAktualisieren();
}

function haekchenLaden() {
  const gesetzt = new Set(Speicher.lies(schluessel(), []));
  document.querySelectorAll('#inhalt input').forEach(i => {
    i.checked = gesetzt.has(i.dataset.id);
  });
  zaehlerAktualisieren();
}

function zaehlerAktualisieren() {
  const alle = document.querySelectorAll('#inhalt input');
  const an = document.querySelectorAll('#inhalt input:checked');
  const proPfad = { A: 0, B: 0, C: 0 };
  an.forEach(i => proPfad[i.dataset.pfad]++);
  $m('#zaehler').textContent = `${an.length} von ${alle.length} erreicht`;
  $m('#verteilung').innerHTML =
    ['A', 'B', 'C'].map(p =>
      `<span class="stufe-pill" style="background:var(--${p.toLowerCase()}-bg);color:var(--${p.toLowerCase()})">${p}: ${proPfad[p]}</span>`
    ).join(' ');
}

function leeren() {
  if (!confirm(`Alle Häkchen für „${M.name || 'ohne Namen'}" entfernen?`)) return;
  Speicher.schreib(schluessel(), []);
  haekchenLaden();
}

/* ---------- Als Text ausgeben ---------- */
function kopieren() {
  const an = [...document.querySelectorAll('#inhalt input:checked')];
  if (!an.length) { meldung('Noch nichts angehakt.'); return; }

  const proPfad = { A: [], B: [], C: [] };
  an.forEach(i => proPfad[i.dataset.pfad].push(`${i.dataset.satz} (${i.dataset.einheit})`));

  let t = `Kompetenzstand Mathematik, Jahrgang 9 — ${M.name || 'ohne Namen'}\n`;
  t += `Stand: ${new Date().toLocaleDateString('de-DE')}\n`;
  t += `Grundlage: Rahmenlehrplan 1–10 Berlin/Brandenburg, Teil C Mathematik\n\n`;
  for (const p of ['A', 'B', 'C']) {
    if (!proPfad[p].length) continue;
    t += `${PFADNAME[p]} (Pfad ${p}) — ${proPfad[p].length} Kompetenzen:\n`;
    proPfad[p].forEach(s => { t += `  • ${s}\n`; });
    t += '\n';
  }
  const hoechster = ['C', 'B', 'A'].find(p => proPfad[p].length);
  t += `Schwerpunkt der selbstständigen Arbeit: Pfad ${hoechster} (${PFADNAME[hoechster]}).\n`;

  navigator.clipboard?.writeText(t)
    .then(() => meldung('In die Zwischenablage kopiert.'))
    .catch(() => zeigeText(t));
}

function meldung(txt) {
  const alt = $m('#meldung');
  if (alt) alt.remove();
  const d = el3('div', 'rueck ok', txt);
  d.id = 'meldung';
  $m('#kopfaktionen').after(d);
  setTimeout(() => d.remove(), 3000);
}

function zeigeText(t) {
  const alt = $m('#meldung');
  if (alt) alt.remove();
  const d = el3('div', 'rueck tipp');
  d.id = 'meldung';
  d.innerHTML = '<b>Zwischenablage nicht verfügbar</b> — markiere den Text und kopiere ihn selbst:';
  const ta = document.createElement('textarea');
  ta.className = 'mx-ausgabe';
  ta.value = t;
  ta.rows = 12;
  d.append(ta);
  $m('#kopfaktionen').after(d);
  ta.select();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startM);
else startM();
