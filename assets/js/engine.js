/* ============================================================
   engine.js · Aufgabenlogik für die Einheitenseite
   Kein Framework, kein Build-Step.
   Neue Einheit = neuer Ordner + tasks.json. Sonst nichts.
   ============================================================ */

/* Speicher, merkeFehler und fehlerProfil kommen aus store.js */

/* ---------- Zustand ---------- */
const S = {
  daten: null,
  pfad: Speicher.lies('mathe9.pfad', 'B'),
  stufe: 1,
  aufgabe: null,
  reihe: [],
  index: 0,
  tippsGenutzt: 0,
  versuche: 0,
  start: 0,
  geloest: new Set(),
  aufAnhieb: 0
};

const $ = (s, w = document) => w.querySelector(s);
const el = (tag, klasse, text) => {
  const n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (text != null) n.textContent = text;
  return n;
};

const STUFEN = { 1: 'Einstieg', 2: 'Geführt', 3: 'Frei', 4: 'Transfer' };

/* ---------- Start ----------
   Normalfall: eine Einheit über ?u= laden.
   Der Prüfungstrainer setzt vorher window.QUELLE und liefert seine eigenen
   Aufgaben — dieselbe Engine, anderer Zusammensteller. */
async function start() {
  if (typeof window.QUELLE === 'function') {
    try { S.daten = await window.QUELLE(); }
    catch (e) { zeigeFehler('den Aufgabenpool', e); return; }
  } else {
    const id = new URLSearchParams(location.search).get('u') || 'pz-05';
    const bereich = id.split('-')[0];
    const pfadZurDatei = `units/${bereich}/${id}/tasks.json`;
    try {
      const antwort = await fetch(pfadZurDatei, { cache: 'no-cache' });
      if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
      S.daten = await antwort.json();
    } catch (e) { zeigeFehler(pfadZurDatei, e); return; }
  }
  Tracker.setContext({ page: S.daten.pruefung ? 'pruefung' : 'einheit', unit: S.daten.unit, path: S.pfad });
  kopfBauen();
  formelkarteBauen();
  pfadSetzen(S.daten.pfad_fest || S.pfad);
}

function zeigeFehler(pfad, e) {
  $('#buehne').innerHTML = '';
  const box = el('div', 'fehler');
  box.append(el('strong', null, 'Die Aufgaben konnten nicht geladen werden.'));
  const p = el('p');
  p.innerHTML = `Gesucht wurde <code>${pfad}</code> (${e.message}).<br>
    Beim direkten Öffnen per Doppelklick blockiert der Browser das Laden von JSON.
    Starte im Projektordner einen lokalen Server:<br>
    <code>python -m http.server 8000</code><br>
    und öffne dann <code>http://localhost:8000/einheit.html?u=pz-05</code>.
    Über GitHub Pages funktioniert es ohne Zusatzschritt.`;
  box.append(p);
  $('#buehne').append(box);
}

/* ---------- Kopf & Pfadwahl ---------- */
function kopfBauen() {
  $('#code').textContent = S.daten.unit + ' · ' + S.daten.leitidee + ' · ' + S.daten.standards.join(' ');
  $('#titel').textContent = S.daten.title;
  document.title = S.daten.unit + ' · ' + S.daten.title;

  /* Ein Prüfungsset legt den Pfad fest — dann ist die Wahl keine Wahl mehr. */
  if (S.daten.pfad_fest) {
    const wahl = $('.pfadwahl');
    if (wahl) wahl.remove();
    return;
  }
  document.querySelectorAll('.pfad-btn').forEach(b => {
    b.addEventListener('click', () => pfadSetzen(b.dataset.p));
  });
}

function pfadSetzen(p) {
  S.pfad = p;
  if (!S.daten.pfad_fest) Speicher.schreib('mathe9.pfad', p);
  document.documentElement.style.setProperty('--pfad', `var(--${p.toLowerCase()})`);
  document.documentElement.style.setProperty('--pfad-bg', `var(--${p.toLowerCase()}-bg)`);
  document.querySelectorAll('.pfad-btn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.p === p)));

  S.reihe = S.daten.tasks.filter(t => t.path === p);
  /* Der Prüfungstrainer hat seine Reihenfolge schon festgelegt. */
  if (!S.daten.reihenfolge_fest) S.reihe.sort((a, b) => a.step - b.step);
  S.index = 0;
  S.geloest = new Set();
  S.aufAnhieb = 0;
  Tracker.setContext({ unit: S.daten.unit, path: p, task: null, progress: 0 });
  Tracker.track('path_selected', { path: p, source: S.daten.pruefung ? 'pruefung' : 'einheit' });
  Tracker.progress({ unit: S.daten.unit, path: p, completed: 0, total: S.reihe.length, percent: 0, status: 'active' });
  aufgabeZeigen();
}

/* ---------- Prozentstreifen = Fortschritt ---------- */
function streifenAktualisieren() {
  const gesamt = S.reihe.length || 1;
  const anteil = Math.round(S.geloest.size / gesamt * 100);
  $('#fuell').style.width = anteil + '%';
  $('#prozent').textContent = anteil + ' %';
  $('#absolut').textContent = `${S.geloest.size} von ${gesamt}`;
  $('.streifen').setAttribute('aria-valuenow', anteil);
}

/* ---------- Aufgabe rendern ---------- */
function aufgabeZeigen() {
  const b = $('#buehne');
  b.innerHTML = '';
  streifenAktualisieren();

  if (S.index >= S.reihe.length) { abschluss(); return; }

  const t = S.reihe[S.index];
  S.aufgabe = t;
  S.tippsGenutzt = 0;
  S.versuche = 0;
  S.start = Date.now();
  Tracker.setContext({ unit: S.daten.unit, path: t.path, task: t.id, progress: Math.round(S.geloest.size / (S.reihe.length || 1) * 100) });
  Tracker.track('task_view', { step: t.step, index: S.index + 1, total: S.reihe.length, source: S.daten.pruefung ? 'pruefung' : 'einheit' });

  const zeile = el('div', 'stufe-zeile');
  zeile.append(el('span', 'stufe-pill', `Pfad ${t.path} · Stufe ${t.step}`));
  zeile.append(el('span', null, t.herkunft || STUFEN[t.step]));
  zeile.append(el('span', null, `· Aufgabe ${S.index + 1}/${S.reihe.length}`));
  b.append(zeile);

  const karte = el('div', 'karte');
  const frage = el('p', 'frage');
  frage.innerHTML = markiereWorte(t.prompt);
  karte.append(frage);

  if (t.visual) karte.append(darstellung(t.visual));

  if (t.type === 'numeric') karte.append(numerischesFeld(t));
  if (t.type === 'choice')  karte.append(auswahl(t));
  if (t.type === 'assign')  karte.append(zuordnung(t));
  if (t.type === 'multi')   karte.append(mehrfachFelder(t));

  const akt = el('div', 'aktionen');
  const pruefen = el('button', 'btn btn-haupt', 'Prüfen');
  pruefen.id = 'pruefen';
  pruefen.addEventListener('click', () => pruefe());
  akt.append(pruefen);

  if (t.hints && t.hints.length && S.daten.hilfen !== false) {
    const tipp = el('button', 'btn btn-neben', 'Tipp');
    tipp.id = 'tipp';
    tipp.addEventListener('click', () => tippZeigen());
    akt.append(tipp);
  }
  karte.append(akt);
  const rueck = el('div');
  rueck.id = 'rueck';
  karte.append(rueck);

  b.append(karte);
  const feld = $('.zahl-feld');
  if (feld) feld.focus({ preventScroll: true });
}

/* Wortspeicher-Begriffe im Text markieren */
function markiereWorte(text) {
  let out = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  (S.daten.wortspeicher || []).forEach(w => {
    const kern = w.replace(/^(der|die|das)\s+/i, '');
    out = out.replace(new RegExp(`\\b(${kern})\\b`, 'g'),
      `<span class="wort" title="${w}">$1</span>`);
  });
  return out;
}

function numerischesFeld(t) {
  const zeile = el('div', 'eingabe-zeile');
  const i = el('input', 'zahl-feld');
  i.type = 'text';
  i.inputMode = 'decimal';
  i.enterKeyHint = 'done';
  i.autocomplete = 'off';
  i.setAttribute('aria-label', 'Ergebnis eingeben');
  i.addEventListener('keydown', e => { if (e.key === 'Enter') pruefe(); });
  zeile.append(i);
  if (t.unit_label) zeile.append(el('span', 'einheit-label', t.unit_label));
  return zeile;
}

/* Prozentstreifen als Aufgabenbild — dieselbe Darstellung wie oben im Kopf,
   damit Streifen im ganzen Bereich dasselbe bedeuten. */
function darstellung(v) {
  const wrap = el('div', 'bild');
  if (v.type === 'streifen') {
    const s = el('div', 'aufg-streifen');
    const f = el('div', 'aufg-fuell');
    f.style.width = v.fill + '%';
    s.append(f);
    s.append(el('div', 'aufg-skala'));
    s.append(el('div', 'aufg-marke'));
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', v.alt || 'Ein Streifen, teilweise gefärbt. Der Strich in der Mitte markiert 50 Prozent.');
    wrap.append(s);
    const leg = el('div', 'aufg-legende');
    leg.append(el('span', null, '0 %'));
    leg.append(el('span', null, '50 %'));
    leg.append(el('span', null, '100 %'));
    wrap.append(leg);
  }
  return wrap;
}

/* Mehrere Zahlenfelder — für Tabellen (Zinsen Jahr für Jahr) und
   Umwandlungen (Bruch → Dezimalzahl → Prozent). */
function mehrfachFelder(t) {
  const wrap = el('div', 'felder');
  t.fields.forEach((f, i) => {
    const r = el('div', 'feld');
    const lab = el('label', 'feld-name', f.label);
    lab.htmlFor = 'f' + i;
    r.append(lab);
    const zeile = el('div', 'eingabe-zeile');
    const inp = el('input', 'zahl-feld');
    inp.id = 'f' + i;
    inp.type = 'text';
    inp.inputMode = 'decimal';
    inp.enterKeyHint = i === t.fields.length - 1 ? 'done' : 'next';
    inp.autocomplete = 'off';
    inp.dataset.i = i;
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const naechstes = $(`#f${i + 1}`);
      if (naechstes) naechstes.focus(); else pruefe();
    });
    zeile.append(inp);
    if (f.unit_label) zeile.append(el('span', 'einheit-label', f.unit_label));
    r.append(zeile);
    wrap.append(r);
  });
  return wrap;
}

function auswahl(t) {
  const g = el('div', 'optionen');
  t.options.forEach((o, i) => {
    const b = el('button', 'opt', o);
    b.dataset.i = i;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      g.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
    });
    g.append(b);
  });
  return g;
}

function zuordnung(t) {
  const wrap = el('div');
  t.slots.forEach((s, si) => {
    const box = el('div', 'slot');
    box.dataset.slot = si;
    box.append(el('div', 'slot-name', s));
    const g = el('div', 'optionen');
    t.values.forEach((v, vi) => {
      const b = el('button', 'opt', v);
      b.dataset.i = vi;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        g.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
      });
      g.append(b);
    });
    box.append(g);
    wrap.append(box);
  });
  return wrap;
}

/* ---------- Tipps ---------- */
function tippZeigen() {
  const t = S.aufgabe;
  if (S.tippsGenutzt >= t.hints.length) return;
  const box = el('div', 'rueck tipp');
  box.innerHTML = `<b>Tipp ${S.tippsGenutzt + 1}:</b> ${t.hints[S.tippsGenutzt]}`;
  $('#rueck').append(box);
  S.tippsGenutzt++;
  Tracker.track('hint_opened', { hint_number: S.tippsGenutzt, task: t.id });
  if (S.tippsGenutzt >= t.hints.length) $('#tipp').disabled = true;
}

/* ---------- Prüfen ---------- */
function pruefe() {
  const t = S.aufgabe;
  S.versuche++;
  let richtig = false, gegeben = null, fehlvorstellung = null;

  if (t.type === 'numeric') {
    const roh = $('.zahl-feld').value.trim();
    if (roh === '') { S.versuche--; return; }
    const kandidaten = lesarten(roh).filter(z => !Number.isNaN(z));
    if (!kandidaten.length) {
      melde('nope', 'Das ist keine Zahl. Schreib nur das Ergebnis — ohne Einheit.');
      return;
    }
    const tol = t.tolerance ?? 0.001;
    gegeben = kandidaten[0];
    richtig = kandidaten.some(z => Math.abs(z - t.answer) <= tol);
    if (!richtig && t.misconceptions) {
      for (const z of kandidaten) {
        const m = t.misconceptions.find(m => Math.abs(z - m.value) <= tol);
        if (m) { fehlvorstellung = m; gegeben = z; break; }
      }
    }
  }

  if (t.type === 'choice') {
    const g = document.querySelector('.opt[aria-pressed="true"]');
    if (!g) return;
    gegeben = Number(g.dataset.i);
    richtig = gegeben === t.answer;
    if (!richtig && t.misconceptions) {
      const m = t.misconceptions.find(m => m.value === gegeben);
      if (m) fehlvorstellung = m;
    }
  }

  if (t.type === 'multi') {
    const felder = [...document.querySelectorAll('.felder .zahl-feld')];
    if (felder.some(f => f.value.trim() === '')) {
      if (!$('#unvollstaendig')) {
        const m = el('div', 'rueck tipp');
        m.id = 'unvollstaendig';
        m.textContent = 'Fülle noch alle Felder aus.';
        $('#rueck').append(m);
      }
      S.versuche--;
      return;
    }
    const h = $('#unvollstaendig'); if (h) h.remove();

    gegeben = [];
    richtig = true;
    felder.forEach((inp, i) => {
      const f = t.fields[i];
      const tol = f.tolerance ?? 0.01;
      const k = lesarten(inp.value.trim()).filter(z => !Number.isNaN(z));
      const passt = k.some(z => Math.abs(z - f.answer) <= tol);
      gegeben.push(k[0] ?? null);
      inp.classList.toggle('feld-falsch', !passt);
      inp.classList.toggle('feld-richtig', passt);
      if (!passt) {
        richtig = false;
        /* Feld-eigene Fehlvorstellung schlägt die allgemeine Meldung */
        if (!fehlvorstellung && f.misconceptions) {
          for (const z of k) {
            const m = f.misconceptions.find(m => Math.abs(z - m.value) <= tol);
            if (m) { fehlvorstellung = m; break; }
          }
        }
      }
    });
  }

  if (t.type === 'assign') {
    gegeben = [];
    let vollstaendig = true;
    document.querySelectorAll('.slot').forEach(s => {
      const g = s.querySelector('.opt[aria-pressed="true"]');
      if (!g) vollstaendig = false;
      gegeben.push(g ? Number(g.dataset.i) : null);
    });
    if (!vollstaendig) {
      if (!$('#unvollstaendig')) {
        const m = el('div', 'rueck tipp');
        m.id = 'unvollstaendig';
        m.textContent = 'Ordne jeder Zeile noch einen Wert zu.';
        $('#rueck').append(m);
      }
      S.versuche--;   // zählt nicht als Fehlversuch
      return;
    }
    const hinweis = $('#unvollstaendig');
    if (hinweis) hinweis.remove();
    richtig = gegeben.every((v, i) => v === t.answer[i]);
  }

  melden(richtig, fehlvorstellung);
}

function melde(art, text) {
  const box = el('div', 'rueck ' + art);
  box.innerHTML = text;
  $('#rueck').append(box);
}

function melden(richtig, fehlvorstellung) {
  const t = S.aufgabe;

  /* Der Denkfehler wird lokal notiert — das Warm-up der nächsten Stunde
     zieht daraus die passende Wiederholungskategorie. */
  if (fehlvorstellung) merkeFehler(fehlvorstellung.id);

  track({
    unit: S.daten.unit, task: t.id, path: t.path, step: t.step,
    correct: richtig,
    misconception: fehlvorstellung ? fehlvorstellung.id : null,
    hints_used: S.tippsGenutzt,
    attempts: S.versuche,
    duration_ms: Date.now() - S.start
  });

  if (richtig) {
    S.geloest.add(t.id);
    if (S.versuche === 1) S.aufAnhieb++;
    const box = el('div', 'rueck ok');
    box.innerHTML = '<b>Richtig.</b>' + (t.solution ? `<div class="rechenweg">${t.solution}</div>` : '');
    $('#rueck').append(box);
    $('#pruefen').textContent = 'Weiter';
    $('#pruefen').replaceWith($('#pruefen').cloneNode(true));
    $('#pruefen').addEventListener('click', () => { S.index++; aufgabeZeigen(); });
    if ($('#tipp')) $('#tipp').disabled = true;
    streifenAktualisieren();
    const percent = Math.round(S.geloest.size / (S.reihe.length || 1) * 100);
    Tracker.progress({ unit: S.daten.unit, path: S.pfad, task: t.id, completed: S.geloest.size, total: S.reihe.length, percent, correct: S.aufAnhieb, attempts: S.versuche, status: percent === 100 ? 'completed' : 'active' });
    return;
  }

  /* Der Kern: falsch heißt nicht "leider falsch", sondern Diagnose. */
  if (fehlvorstellung) {
    melde('nope', `<b>Fast.</b> ${fehlvorstellung.feedback}`);
  } else if (S.versuche === 1) {
    melde('nope', 'Noch nicht richtig. Schau dir deinen Rechenweg noch einmal an.');
  }

  if (S.versuche >= 2 && t.solution) {
    const box = el('div', 'rueck tipp');
    box.innerHTML = `<b>So geht es:</b><div class="rechenweg">${t.solution}</div>`;
    $('#rueck').append(box);
    const akt = $('.aktionen');
    if (!$('#weiter')) {
      const w = el('button', 'btn btn-neben', 'Weiter');
      w.id = 'weiter';
      w.addEventListener('click', () => { S.index++; aufgabeZeigen(); });
      akt.append(w);
    }
  }
}

/* ---------- Abschluss ---------- */
function abschluss() {
  Tracker.track(S.daten.pruefung ? 'exam_completed' : 'unit_completed', { completed: S.geloest.size, total: S.reihe.length, correct_first_try: S.aufAnhieb });
  Tracker.progress({ unit: S.daten.unit, path: S.pfad, task: null, completed: S.geloest.size, total: S.reihe.length, percent: 100, correct: S.aufAnhieb, status: 'completed' });
  const b = $('#buehne');
  const karte = el('div', 'karte');

  /* Prüfungsset: Es zählt, was auf Anhieb saß. */
  if (S.daten.pruefung) {
    const n = S.reihe.length;
    const ziel = S.daten.pruefung.ziel;
    const geschafft = S.aufAnhieb >= ziel;
    karte.append(el('h2', 'frage', `${S.aufAnhieb} von ${n} auf Anhieb richtig.`));
    const p = el('p');
    p.innerHTML = geschafft
      ? `Das Ziel waren ${ziel}. <b>Geschafft.</b>`
      : `Das Ziel waren ${ziel}. Noch nicht ganz — aber du weißt jetzt, woran du arbeiten musst.`;
    karte.append(p);

    /* Welche Denkfehler sind heute gehäuft aufgetreten? */
    const heute = fehlerProfil(1).slice(0, 3);
    if (heute.length) {
      const h = el('p');
      h.innerHTML = 'Das ging mehrfach schief:<br>' +
        heute.map(f => `<span class="stufe-pill">${f.id}</span>`).join(' ');
      karte.append(h);
    }

    const akt = el('div', 'aktionen');
    const n2 = el('button', 'btn btn-haupt', 'Neuer Satz');
    n2.addEventListener('click', () => location.reload());
    akt.append(n2);
    const z = el('a', 'btn btn-neben', 'Zur Übersicht');
    z.href = 'index.html';
    z.style.textDecoration = 'none';
    akt.append(z);
    karte.append(akt);
    b.append(karte);
    return;
  }

  karte.append(el('h2', 'frage', `Pfad ${S.pfad} geschafft.`));

  const satz = S.daten.can_do[S.pfad];
  const p = el('p');
  p.innerHTML = `Das kannst du jetzt:<br><b>${satz}</b>`;
  karte.append(p);

  const naechster = { A: 'B', B: 'C', C: null }[S.pfad];
  const akt = el('div', 'aktionen');
  if (naechster) {
    const w = el('button', 'btn btn-haupt', `Weiter auf Pfad ${naechster}`);
    w.addEventListener('click', () => pfadSetzen(naechster));
    akt.append(w);
  }
  const n = el('button', 'btn btn-neben', 'Noch einmal üben');
  n.addEventListener('click', () => pfadSetzen(S.pfad));
  akt.append(n);
  karte.append(akt);
  b.append(karte);
}

/* ---------- Formelkarte ---------- */
function formelkarteBauen() {
  const i = $('#formel-inhalt');
  const k = S.daten.formelkarte || {};

  if (k.formeln) {
    i.append(el('h3', null, 'Formeln'));
    k.formeln.forEach(f => i.append(el('div', 'f', f)));
  }
  if (S.daten.wortspeicher) {
    i.append(el('h3', null, 'Wortspeicher'));
    const ul = el('ul');
    S.daten.wortspeicher.forEach(w => ul.append(el('li', null, w)));
    i.append(ul);
  }
  if (k.saetze) {
    i.append(el('h3', null, 'So sagst du es'));
    const ul = el('ul');
    k.saetze.forEach(s => ul.append(el('li', null, s)));
    i.append(ul);
  }
}

/* Auch dann starten, wenn dieses Skript erst nach DOMContentLoaded
   nachgeladen wurde — der Prüfungstrainer lädt engine.js dynamisch. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
