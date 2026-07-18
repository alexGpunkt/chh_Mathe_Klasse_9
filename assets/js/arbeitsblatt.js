/* ============================================================
   arbeitsblatt.js · Druckfertiges Arbeitsblatt aus dem Pool

   Der Pool muss auch funktionieren, wenn keine 28 Geräte im Raum sind.
   Diese Seite baut aus denselben tasks.json ein Blatt zum Austeilen —
   Aufgaben mit Schreibraum, Lösungen im Anhang.
   ============================================================ */

const AB = { idx: null, daten: {} };
const $a = s => document.querySelector(s);

async function hole(p) {
  const r = await fetch(p, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
  return r.json();
}

async function startAB() {
  try { AB.idx = await hole('units/index.json'); }
  catch (e) {
    $a('#formular').innerHTML = `<div class="fehler">
      <strong>Der Einheiten-Index konnte nicht geladen werden.</strong>
      <p>${e.message}. Starte <code>python -m http.server 8000</code> im Projektordner.</p></div>`;
    return;
  }
  formularBauen();

  const p = new URLSearchParams(location.search);
  if (p.get('u')) {
    const ids = p.get('u').split(',');
    document.querySelectorAll('input[name=einheit]').forEach(c => c.checked = ids.includes(c.value));
    const pf = p.get('p');
    if (pf) { const r = document.querySelector(`input[name=pfad][value=${pf}]`); if (r) r.checked = true; }
    erzeugen();
  }
}

function formularBauen() {
  const f = $a('#formular');
  f.innerHTML = '';

  for (const b of AB.idx.bereiche) {
    f.append(el2('div', 'abschnitt-titel', b.title));
    const gitter = el2('div', 'ab-gitter');
    for (const e of b.einheiten) {
      const lab = el2('label', 'ab-check');
      lab.innerHTML = `<input type="checkbox" name="einheit" value="${e.id}" data-bereich="${b.code}">
        <span><b>${e.id.toUpperCase()}</b> ${e.title}</span>`;
      gitter.append(lab);
    }
    f.append(gitter);
  }

  f.append(el2('div', 'abschnitt-titel', 'Lernweg'));
  const pf = el2('div', 'ab-gitter');
  [['A', 'Basis'], ['B', 'Standard'], ['C', 'Vertiefung']].forEach(([v, t], i) => {
    const lab = el2('label', 'ab-check');
    lab.innerHTML = `<input type="radio" name="pfad" value="${v}" ${i === 1 ? 'checked' : ''}>
      <span><b>Pfad ${v}</b> ${t}</span>`;
    pf.append(lab);
  });
  f.append(pf);

  f.append(el2('div', 'abschnitt-titel', 'Optionen'));
  const opt = el2('div', 'ab-gitter');
  opt.innerHTML = `
    <label class="ab-check"><input type="checkbox" id="mitTipps"> <span>Tipps mitdrucken</span></label>
    <label class="ab-check"><input type="checkbox" id="mitLoesung" checked> <span>Lösungsanhang</span></label>
    <label class="ab-check"><input type="checkbox" id="mitFormel" checked> <span>Formelkarte auf Blatt 1</span></label>`;
  f.append(opt);

  const akt = el2('div', 'aktionen');
  const b1 = el2('button', 'btn btn-haupt', 'Arbeitsblatt erzeugen');
  b1.addEventListener('click', erzeugen);
  akt.append(b1);
  f.append(akt);
}

function el2(tag, klasse, text) {
  const n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (text != null) n.textContent = text;
  return n;
}

/* ---------- Erzeugen ---------- */
async function erzeugen() {
  const gewaehlt = [...document.querySelectorAll('input[name=einheit]:checked')];
  if (!gewaehlt.length) {
    $a('#blatt').innerHTML = '<p class="hinweis">Wähle mindestens eine Einheit aus.</p>';
    return;
  }
  const pfad = document.querySelector('input[name=pfad]:checked').value;
  const mitTipps = $a('#mitTipps').checked;
  const mitLoesung = $a('#mitLoesung').checked;
  const mitFormel = $a('#mitFormel').checked;

  $a('#blatt').innerHTML = '<p class="lade">Wird gebaut …</p>';
  const daten = await Promise.all(gewaehlt.map(c =>
    hole(`units/${c.dataset.bereich}/${c.value}/tasks.json`)));

  const aufgaben = [];
  daten.forEach(d => d.tasks
    .filter(t => t.path === pfad)
    .sort((a, b) => a.step - b.step)
    .forEach(t => aufgaben.push({ ...t, _unit: d.unit })));

  const PFADNAME = { A: 'Basis', B: 'Standard', C: 'Vertiefung' };
  const titel = daten.length === 1 ? daten[0].title
    : `${daten[0].unit} bis ${daten[daten.length - 1].unit}`;

  let h = `<div class="blatt-kopf">
      <div>
        <div class="blatt-schule">Campus Hannah Höch · Mathematik 9</div>
        <h2>${titel}</h2>
        <div class="blatt-meta">Pfad ${pfad} · ${PFADNAME[pfad]} · ${aufgaben.length} Aufgaben</div>
      </div>
      <div class="blatt-namensfeld">Name:<span></span>Datum:<span></span></div>
    </div>`;

  if (mitFormel) {
    const formeln = [...new Set(daten.flatMap(d => (d.formelkarte?.formeln) || []))];
    const woerter = [...new Set(daten.flatMap(d => d.wortspeicher || []))];
    h += `<div class="blatt-formel">
      <h3>Formelkarte</h3>
      <pre>${formeln.join('\n')}</pre>
      ${woerter.length ? `<h3>Wortspeicher</h3><p>${woerter.join(' · ')}</p>` : ''}
    </div>`;
  }

  h += '<ol class="blatt-aufgaben">';
  aufgaben.forEach(t => { h += '<li>' + aufgabeHtml(t, mitTipps) + '</li>'; });
  h += '</ol>';

  if (mitLoesung) {
    h += '<div class="blatt-umbruch"></div><h2 class="blatt-loesungstitel">Lösungen</h2><ol class="blatt-loesungen">';
    aufgaben.forEach(t => { h += `<li><div class="rechenweg">${loesungText(t)}</div></li>`; });
    h += '</ol>';
  }

  h += `<div class="blatt-fuss">Erzeugt aus dem Aufgabenpool ·
    ${aufgaben.map(t => t._unit).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</div>`;

  $a('#blatt').innerHTML = h;
  const akt = el2('div', 'aktionen');
  const d = el2('button', 'btn btn-haupt', 'Drucken / als PDF sichern');
  d.addEventListener('click', () => window.print());
  akt.append(d);
  $a('#blatt').prepend(akt);
  $a('#blatt').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function aufgabeHtml(t, mitTipps) {
  let h = `<div class="ab-frage">${esc(t.prompt)}</div>`;

  if (t.visual) h += visualHtml(t.visual);

  if (t.type === 'choice') {
    h += '<ul class="ab-optionen">';
    t.options.forEach(o => { h += `<li>☐ ${esc(o)}</li>`; });
    h += '</ul>';
  } else if (t.type === 'assign') {
    h += `<div class="ab-werte">Werte: ${t.values.map(esc).join(' · ')}</div><ul class="ab-slots">`;
    t.slots.forEach(s => { h += `<li>${esc(s)}: <span class="ab-linie"></span></li>`; });
    h += '</ul>';
  } else if (t.type === 'multi') {
    h += '<ul class="ab-slots">';
    t.fields.forEach(f => {
      h += `<li>${esc(f.label)}: <span class="ab-linie"></span> ${f.unit_label || ''}</li>`;
    });
    h += '</ul>';
  } else {
    h += `<div class="ab-rechenraum"></div>
      <div class="ab-ergebnis">Ergebnis: <span class="ab-linie"></span> ${t.unit_label || ''}</div>`;
  }

  if (mitTipps && t.hints?.length) {
    h += `<div class="ab-tipp">Tipp: ${esc(t.hints[0])}</div>`;
  }
  return h;
}

function loesungText(t) {
  if (t.type === 'choice') {
    return esc(t.options[t.answer]) + (t.solution ? '\n' + esc(t.solution) : '');
  }
  if (t.type === 'assign') {
    return t.slots.map((s, i) => `${s}: ${t.values[t.answer[i]]}`).join('\n')
      + (t.solution ? '\n' + esc(t.solution) : '');
  }
  if (t.type === 'multi') {
    return t.fields.map(f => `${f.label}: ${zahl(f.answer)} ${f.unit_label || ''}`.trim()).join('\n')
      + (t.solution ? '\n' + esc(t.solution) : '');
  }
  return `${zahl(t.answer)} ${t.unit_label || ''}`.trim() + (t.solution ? '\n' + esc(t.solution) : '');
}

function zahl(x) {
  if (typeof x !== 'number') return String(x);
  return String(Math.round(x * 1e6) / 1e6).replace('.', ',');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startAB);
else startAB();
