/* ============================================================
   spiral.js · Warm-up „Altes Wissen"
   8 Minuten, 5 Aufgaben, jede Stunde.

   Zwei Besonderheiten gegenüber engine.js:
   1. Aufgaben werden aus Generatoren erzeugt, nicht einzeln geschrieben.
      Getrackt wird die FÄHIGKEIT (die Generator-ID), nicht die Zahl.
      „Kann 10 % im Kopf" ist die Information — nicht „kann 10 % von 200".
   2. Die Auswahl folgt zwei Regeln: Leitner-Kartei (was ist fällig?)
      und Fehlerprofil (was ging zuletzt schief?).
   ============================================================ */

const TAG_MS = 86400000;
const $$ = (s, w = document) => w.querySelector(s);

const SP = {
  plan: null,
  kategorien: {},     // code → { title, generators: [] }
  reihe: [],
  index: 0,
  richtig: 0,
  aufgabe: null,
  versuche: 0,
  start: 0,
  level: 'B',
  einheit: null
};

/* ============================================================
   1 · Ausdrucksauswertung ohne eval
   Grammatik: vergleich → ausdruck → term → faktor → primär
   Erlaubt: + - * / ( ) Zahlen, Variablennamen, < > <= >= == !=
   ============================================================ */

function tokenisiere(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      t.push({ art: 'zahl', wert: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      t.push({ art: 'name', wert: s.slice(i, j) });
      i = j; continue;
    }
    const zwei = s.slice(i, i + 2);
    if (['<=', '>=', '==', '!='].includes(zwei)) { t.push({ art: 'op', wert: zwei }); i += 2; continue; }
    if ('+-*/()<>'.includes(c)) { t.push({ art: 'op', wert: c }); i++; continue; }
    throw new Error('Unerwartetes Zeichen: ' + c);
  }
  return t;
}

function werteAus(ausdruck, vars) {
  const t = tokenisiere(ausdruck);
  let i = 0;
  const schau = () => t[i];
  const nimm = () => t[i++];

  function primaer() {
    const k = nimm();
    if (!k) throw new Error('Ausdruck endet zu früh');
    if (k.art === 'zahl') return k.wert;
    if (k.art === 'name') {
      if (!(k.wert in vars)) throw new Error('Unbekannte Variable: ' + k.wert);
      return vars[k.wert];
    }
    if (k.wert === '(') {
      const v = vergleich();
      const zu = nimm();
      if (!zu || zu.wert !== ')') throw new Error('Klammer nicht geschlossen');
      return v;
    }
    throw new Error('Unerwartet: ' + k.wert);
  }
  function faktor() {
    if (schau() && schau().wert === '-') { nimm(); return -faktor(); }
    if (schau() && schau().wert === '+') { nimm(); return faktor(); }
    return primaer();
  }
  function term() {
    let v = faktor();
    while (schau() && (schau().wert === '*' || schau().wert === '/')) {
      const op = nimm().wert;
      const r = faktor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function ausdr() {
    let v = term();
    while (schau() && (schau().wert === '+' || schau().wert === '-')) {
      const op = nimm().wert;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function vergleich() {
    const l = ausdr();
    const k = schau();
    if (k && ['<', '>', '<=', '>=', '==', '!='].includes(k.wert)) {
      nimm();
      const r = ausdr();
      switch (k.wert) {
        case '<':  return l <  r ? 1 : 0;
        case '>':  return l >  r ? 1 : 0;
        case '<=': return l <= r ? 1 : 0;
        case '>=': return l >= r ? 1 : 0;
        case '==': return Math.abs(l - r) < 1e-9 ? 1 : 0;
        case '!=': return Math.abs(l - r) >= 1e-9 ? 1 : 0;
      }
    }
    return l;
  }

  const v = vergleich();
  if (i < t.length) throw new Error('Rest im Ausdruck: ' + t[i].wert);
  return v;
}

/* ============================================================
   2 · Zahlen deutsch formatieren
   ============================================================ */

function fmt(x) {
  if (typeof x !== 'number' || !isFinite(x)) return String(x);
  const g = Math.round(x * 1e6) / 1e6;
  let s = Number.isInteger(g) ? String(g) : String(g).replace('.', ',');
  const [ganz, rest] = s.split(',');
  const mitTrenner = ganz.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return rest ? mitTrenner + ',' + rest : mitTrenner;
}

/* Geld hat immer zwei Nachkommastellen. "3,6 €" liest sich falsch. */
function fmtGeld(x) {
  const s = Math.abs(x).toFixed(2).replace('.', ',');
  const [ganz, rest] = s.split(',');
  return (x < 0 ? '-' : '') + ganz.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + rest;
}

/* Platzhalter dürfen rechnen: {G} genauso wie {100-p} oder {1+p/100}.
   Mit :€ als Zusatz wird als Geldbetrag formatiert — {pa:€} → "3,60".
   Das spart Hilfsvariablen in jedem Generator. */
function fuelle(vorlage, vars) {
  return String(vorlage).replace(/\{([^{}:]+)(?::(€))?\}/g, (ganz, ausdruck, flagge) => {
    try {
      const w = werteAus(ausdruck, vars);
      return flagge === '€' ? fmtGeld(w) : fmt(w);
    } catch { return ganz; }
  });
}

/* ============================================================
   3 · Aus einem Generator eine konkrete Aufgabe würfeln
   ============================================================ */

function zufallVar(def) {
  if (def.aus) return def.aus[Math.floor(Math.random() * def.aus.length)];
  const schritt = def.schritt || 1;
  const n = Math.floor((def.bis - def.von) / schritt) + 1;
  return def.von + Math.floor(Math.random() * n) * schritt;
}

function baue(gen) {
  let vars = null;
  for (let versuch = 0; versuch < 200; versuch++) {
    const v = {};
    for (const [name, def] of Object.entries(gen.vars || {})) v[name] = zufallVar(def);
    for (const [name, ausdruck] of Object.entries(gen.berechnet || {})) {
      v[name] = werteAus(ausdruck, v);
    }
    if (gen.bedingung && !werteAus(gen.bedingung, v)) continue;
    vars = v; break;
  }
  if (!vars) throw new Error(`Generator ${gen.id}: Bedingung nie erfüllt`);

  const roh = werteAus(gen.answer, vars);
  const stellen = gen.round ?? 2;
  const antwort = Math.round(roh * 10 ** stellen) / 10 ** stellen;
  vars.ergebnis = antwort;

  const mis = (gen.misconceptions || []).map(m => ({
    id: m.id,
    value: Math.round(werteAus(m.value, vars) * 10 ** stellen) / 10 ** stellen,
    feedback: fuelle(m.feedback, vars)
  })).filter(m => Math.abs(m.value - antwort) > (gen.tolerance ?? 0.005));

  return {
    genId: gen.id,
    kategorie: gen.kategorie,
    skill: gen.skill,
    prompt: fuelle(gen.template, vars),
    answer: antwort,
    unit_label: gen.unit_label || '',
    tolerance: gen.tolerance ?? 0.005,
    hint: gen.hint ? fuelle(gen.hint, vars) : null,
    solution: gen.solution ? fuelle(gen.solution, vars) : null,
    misconceptions: mis
  };
}

/* ============================================================
   4 · Leitner-Kartei
   ============================================================ */

function kartei() { return Speicher.lies('mathe9.spiral', {}); }

function karteiSchreib(k) { Speicher.schreib('mathe9.spiral', k); }

function notiere(genId, richtig) {
  const k = kartei();
  const e = k[genId] || { box: 1, faellig: 0, gesehen: 0, falsch: 0 };
  const iv = SP.plan.intervalle_tage;
  if (richtig) {
    e.box = Math.min(e.box + 1, iv.length - 1);
  } else {
    e.box = 1;
    e.falsch++;
  }
  e.gesehen++;
  e.faellig = Date.now() + iv[e.box] * TAG_MS;
  k[genId] = e;
  karteiSchreib(k);
}

/* ============================================================
   5 · Auswahl: Was kommt heute dran?
   ============================================================ */

function boostKategorien() {
  const boost = new Set();
  /* a) Verzahnung: Was braucht die heutige Einheit? */
  if (SP.einheit && SP.plan.verzahnung[SP.einheit]) {
    SP.plan.verzahnung[SP.einheit].forEach(k => boost.add(k));
  }
  /* b) Fehlerprofil: Was ging zuletzt schief? */
  const gruende = new Map();
  for (const f of fehlerProfil(14)) {
    const kat = SP.plan.fehlerprofil[f.id];
    if (kat) {
      boost.add(kat);
      gruende.set(kat, (gruende.get(kat) || 0) + f.anzahl);
    }
  }
  return { boost, gruende };
}

function waehle(anzahl = 5) {
  const jetzt = Date.now();
  const k = kartei();
  const { boost } = boostKategorien();

  const kandidaten = [];
  for (const kat of Object.values(SP.kategorien)) {
    for (const g of kat.generators) {
      if (g.level !== SP.level) continue;
      const e = k[g.id];
      let punkte = Math.random() * 2;                       // Losentscheid bei Gleichstand
      if (!e) punkte += 20;                                 // noch nie dran
      else {
        const ueberfaellig = (jetzt - e.faellig) / TAG_MS;
        if (ueberfaellig >= 0) punkte += Math.min(ueberfaellig, 30);
        else punkte -= 50;                                  // noch nicht fällig
        punkte += (6 - e.box) * 3;                          // niedrige Box = wackelig
        punkte += Math.min(e.falsch, 5) * 4;                // wiederholt falsch
      }
      if (boost.has(g.kategorie)) punkte += 100;
      kandidaten.push({ gen: g, punkte });
    }
  }
  kandidaten.sort((a, b) => b.punkte - a.punkte);

  /* Höchstens 3 aus derselben Kategorie — sonst wird das Warm-up einseitig */
  const gewaehlt = [];
  const proKat = {};
  for (const c of kandidaten) {
    if (gewaehlt.length >= anzahl) break;
    const kat = c.gen.kategorie;
    if ((proKat[kat] || 0) >= 3) continue;
    proKat[kat] = (proKat[kat] || 0) + 1;
    gewaehlt.push(c.gen);
  }
  /* Falls die Kategorie-Grenze zu streng war: auffüllen */
  for (const c of kandidaten) {
    if (gewaehlt.length >= anzahl) break;
    if (!gewaehlt.includes(c.gen)) gewaehlt.push(c.gen);
  }
  return gewaehlt;
}

/* ============================================================
   6 · Ablauf
   ============================================================ */

async function starte() {
  const p = new URLSearchParams(location.search);
  SP.einheit = p.get('u');
  SP.level = Speicher.lies('mathe9.pfad', 'B');

  try {
    SP.plan = await (await fetch('spiral/plan.json', { cache: 'no-cache' })).json();
    for (const code of SP.plan.kategorien) {
      const datei = 'spiral/' + code.toLowerCase() + '.json';
      const antwort = await fetch(datei, { cache: 'no-cache' });
      if (!antwort.ok) continue;                 // Kategorie noch nicht gebaut
      const d = await antwort.json();
      d.generators.forEach(g => { g.kategorie = d.category; });
      SP.kategorien[d.category] = d;
    }
  } catch (e) {
    $$('#buehne').innerHTML = `<div class="fehler">
      <strong>Das Warm-up konnte nicht geladen werden.</strong>
      <p>${e.message}. Starte im Projektordner <code>python -m http.server 8000</code>
      und öffne die Seite über <code>http://localhost:8000</code>.</p></div>`;
    return;
  }

  document.documentElement.style.setProperty('--pfad', `var(--${SP.level.toLowerCase()})`);
  document.documentElement.style.setProperty('--pfad-bg', `var(--${SP.level.toLowerCase()}-bg)`);

  Tracker.setContext({ page: 'warmup', unit: 'WARMUP', path: SP.level, progress: 0 });
  SP.reihe = waehle(5).map(baue);
  if (!SP.reihe.length) {
    $$('#buehne').innerHTML = `<div class="karte"><p class="frage">Für Pfad ${SP.level}
      sind noch keine Wiederholungsaufgaben hinterlegt.</p></div>`;
    return;
  }
  zeige();
}

function zeige() {
  const b = $$('#buehne');
  b.innerHTML = '';
  const anteil = Math.round(SP.index / SP.reihe.length * 100);
  $$('#fuell').style.width = anteil + '%';
  $$('#zaehler').textContent = `${SP.index} von ${SP.reihe.length}`;
  $$('.streifen').setAttribute('aria-valuenow', anteil);

  if (SP.index >= SP.reihe.length) { fertig(); return; }

  const a = SP.reihe[SP.index];
  SP.aufgabe = a;
  SP.versuche = 0;
  SP.start = Date.now();
  Tracker.setContext({ unit: 'WARMUP', path: SP.level, task: a.genId, progress: Math.round(SP.index / (SP.reihe.length || 1) * 100) });
  Tracker.track('task_view', { index: SP.index + 1, total: SP.reihe.length, generator: a.genId });

  const zeile = document.createElement('div');
  zeile.className = 'stufe-zeile';
  zeile.innerHTML = `<span class="stufe-pill">${a.kategorie}</span><span>${a.skill}</span>`;
  b.append(zeile);

  const karte = document.createElement('div');
  karte.className = 'karte';
  karte.innerHTML = `
    <p class="frage">${a.prompt}</p>
    <div class="eingabe-zeile">
      <input class="zahl-feld" type="text" inputmode="decimal" enterkeyhint="done"
             autocomplete="off" aria-label="Ergebnis eingeben">
      ${a.unit_label ? `<span class="einheit-label">${a.unit_label}</span>` : ''}
    </div>
    <div class="aktionen">
      <button class="btn btn-haupt" id="pruefen">Prüfen</button>
      ${a.hint ? '<button class="btn btn-neben" id="tipp">Tipp</button>' : ''}
    </div>
    <div id="rueck"></div>`;
  b.append(karte);

  $$('#pruefen').addEventListener('click', pruefe);
  $$('.zahl-feld').addEventListener('keydown', e => { if (e.key === 'Enter') pruefe(); });
  if ($$('#tipp')) $$('#tipp').addEventListener('click', () => {
    melde('tipp', `<b>Tipp:</b> ${a.hint}`);
    $$('#tipp').disabled = true;
    Tracker.track('hint_opened', { hint_number: 1, task: a.genId });
  });
  $$('.zahl-feld').focus({ preventScroll: true });
}

function melde(art, html) {
  const d = document.createElement('div');
  d.className = 'rueck ' + art;
  d.innerHTML = html;
  $$('#rueck').append(d);
}

function pruefe() {
  const a = SP.aufgabe;
  const roh = $$('.zahl-feld').value.trim();
  if (roh === '') return;
  SP.versuche++;

  const k = lesarten(roh).filter(z => !Number.isNaN(z));
  if (!k.length) { melde('nope', 'Das ist keine Zahl. Schreib nur das Ergebnis.'); return; }

  const richtig = k.some(z => Math.abs(z - a.answer) <= a.tolerance);
  let mis = null;
  if (!richtig) {
    for (const z of k) {
      const m = a.misconceptions.find(m => Math.abs(z - m.value) <= a.tolerance);
      if (m) { mis = m; break; }
    }
  }
  if (mis) merkeFehler(mis.id);

  track({
    unit: 'WARMUP', task: a.genId, path: SP.level, step: 0,
    correct: richtig, misconception: mis ? mis.id : null,
    hints_used: $$('#tipp') && $$('#tipp').disabled ? 1 : 0,
    attempts: SP.versuche, duration_ms: Date.now() - SP.start
  });

  if (richtig) {
    if (SP.versuche === 1) SP.richtig++;
    notiere(a.genId, SP.versuche === 1);
    melde('ok', '<b>Richtig.</b>' + (a.solution ? `<div class="rechenweg">${a.solution}</div>` : ''));
    weiterKnopf();
    return;
  }

  if (mis) melde('nope', `<b>Fast.</b> ${mis.feedback}`);
  else if (SP.versuche === 1) melde('nope', 'Noch nicht. Versuch es nochmal.');

  if (SP.versuche >= 2) {
    notiere(a.genId, false);
    const wert = a.unit_label === '€' ? fmtGeld(a.answer) : fmt(a.answer);
    melde('tipp', `<b>Die Lösung:</b> ${wert} ${a.unit_label}` +
      (a.solution ? `<div class="rechenweg">${a.solution}</div>` : ''));
    weiterKnopf();
  }
}

function weiterKnopf() {
  const alt = $$('#pruefen');
  const neu = alt.cloneNode(false);
  neu.className = 'btn btn-haupt';
  neu.id = 'pruefen';
  neu.textContent = 'Weiter';
  alt.replaceWith(neu);
  neu.addEventListener('click', () => {
    SP.index++;
    Tracker.progress({ unit: 'WARMUP', path: SP.level, task: a.genId, completed: SP.index, total: SP.reihe.length, percent: Math.round(SP.index / (SP.reihe.length || 1) * 100), correct: SP.richtig, status: SP.index >= SP.reihe.length ? 'completed' : 'active' });
    zeige();
  });
  if ($$('#tipp')) $$('#tipp').disabled = true;
  $$('.zahl-feld').disabled = true;
  neu.focus();
}

function fertig() {
  Tracker.track('warmup_completed', { correct_first_try: SP.richtig, total: SP.reihe.length });
  Tracker.progress({ unit: 'WARMUP', path: SP.level, task: null, completed: SP.reihe.length, total: SP.reihe.length, percent: 100, correct: SP.richtig, status: 'completed' });
  const b = $$('#buehne');
  const karte = document.createElement('div');
  karte.className = 'karte';
  const ziel = SP.einheit ? `einheit.html?u=${SP.einheit}` : 'index.html';
  karte.innerHTML = `
    <p class="frage">Aufgewärmt. <b>${SP.richtig} von ${SP.reihe.length}</b> auf Anhieb richtig.</p>
    <p>Was heute schiefging, kommt morgen wieder. Was saß, erst in ein paar Wochen.</p>
    <div class="aktionen">
      <a class="btn btn-haupt" href="${ziel}" style="text-decoration:none">
        ${SP.einheit ? 'Weiter zur Stunde' : 'Zur Übersicht'}</a>
      <button class="btn btn-neben" id="nochmal">Noch fünf</button>
    </div>`;
  b.append(karte);
  $$('#nochmal').addEventListener('click', () => {
    SP.reihe = waehle(5).map(baue);
    SP.index = 0; SP.richtig = 0;
    zeige();
  });
}

/* Auch dann starten, wenn dieses Skript erst nach DOMContentLoaded
   nachgeladen wurde — der Prüfungstrainer lädt engine.js dynamisch. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', starte);
else starte();
