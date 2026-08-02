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
  versucheGesamt: 0,
  start: 0,
  geloest: new Set(),
  aufAnhieb: 0,
  /* Fehlvorstellungen, zu denen bereits nachgefasst wurde — jede Diagnose
     bekommt genau eine Nachfassaufgabe, sonst dreht sich das Kind im Kreis. */
  nachgefasst: new Set(),
  selbst: null,           // Selbsteinschätzung vor den Aufgaben
  /* Die Leistungsrückmeldung soll nur die ursprünglich gewählten Aufgaben
     bewerten. Eingeschobene Nachfassaufgaben sind Lernhilfe, keine heimliche
     Verschärfung der Empfehlung. */
  kernIds: new Set(),
  kernGesamt: 0,
  kernAufAnhieb: 0,
  /* Beim Sprung zur Erklärung bleibt die laufende Aufgabe mitsamt Eingaben,
     Versuchen, Tipps, Rückmeldungen und Zeitmessung erhalten. */
  rueckkehrDom: null
};

const $ = (s, w = document) => w.querySelector(s);
const el = (tag, klasse, text) => {
  const n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (text != null) n.textContent = text;
  return n;
};

const STUFEN = { 1: 'Einstieg', 2: 'Geführt', 3: 'Frei', 4: 'Transfer' };

function htmlSicher(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attrSicher(text) {
  return htmlSicher(text).replace(/`/g, '&#96;');
}

function animationenAufraeumen(root) {
  try { window.ANIM?.aufraeumen?.(root); }
  catch (error) { console.warn('[Mathe9 Animation aufräumen]', error); }
}

function buehneLeeren(root = $('#buehne')) {
  if (!root) return;
  animationenAufraeumen(root);
  root.replaceChildren();
}

function geparkteAufgabeVerwerfen() {
  if (!S.rueckkehrDom) return;
  animationenAufraeumen(S.rueckkehrDom.fragment);
  S.rueckkehrDom = null;
}

function aufgabeParken() {
  const b = $('#buehne');
  if (!b || S.rueckkehrDom) return;
  try { window.ANIM?.pausieren?.(b); } catch { /* optional */ }
  const fragment = document.createDocumentFragment();
  while (b.firstChild) fragment.appendChild(b.firstChild);
  S.rueckkehrDom = {
    fragment,
    scrollY: window.scrollY,
    task: S.aufgabe?.id || null,
    index: S.index
  };
}

function aufgabeZurueckholen() {
  const gespeichert = S.rueckkehrDom;
  if (!gespeichert) { aufgabeZeigen(); return; }
  const b = $('#buehne');
  buehneLeeren(b);
  b.appendChild(gespeichert.fragment);
  S.rueckkehrDom = null;
  streifenAktualisieren();
  Tracker.track('task_return', {
    task: gespeichert.task,
    index: gespeichert.index + 1,
    attempts: S.versuche,
    hints_used: S.tippsGenutzt
  });
  requestAnimationFrame(() => window.scrollTo({ top: gespeichert.scrollY, behavior: 'smooth' }));
}

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
  uebungskarteBauen();
  pfadSetzen(S.daten.pfad_fest || S.pfad);
}

function zeigeFehler(pfad, e) {
  buehneLeeren($('#buehne'));
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
  geparkteAufgabeVerwerfen();
  S.pfad = p;
  if (!S.daten.pfad_fest) Speicher.schreib('mathe9.pfad', p);
  document.documentElement.style.setProperty('--pfad', `var(--${p.toLowerCase()})`);
  document.documentElement.style.setProperty('--pfad-bg', `var(--${p.toLowerCase()}-bg)`);
  document.querySelectorAll('.pfad-btn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.p === p)));

  S.reihe = S.daten.tasks.filter(t => t.path === p);
  /* Der Prüfungstrainer hat seine Reihenfolge schon festgelegt. */
  if (!S.daten.reihenfolge_fest) S.reihe.sort((a, b) => a.step - b.step);
  S.kernIds = new Set(S.reihe.map(t => t.id));
  S.kernGesamt = S.reihe.length;
  S.kernAufAnhieb = 0;
  S.index = 0;
  S.geloest = new Set();
  S.aufAnhieb = 0;
  S.versucheGesamt = 0;
  S.nachgefasst = new Set();
  S.selbst = null;
  /* Über alle Aufgaben, nicht nur die aktuelle Reihe: die Objekte werden
     zwischen den Pfaden wiederverwendet, sonst bliebe die Markierung kleben. */
  (S.daten.tasks || []).forEach(t => { delete t.nachfass; delete t.nachfass_leichter; });
  Tracker.setContext({ unit: S.daten.unit, path: p, task: null, progress: 0 });
  Tracker.track('path_selected', { path: p, source: S.daten.pruefung ? 'pruefung' : 'einheit' });
  Tracker.progress({
    unit: S.daten.unit,
    path: p,
    task: null,
    completed: 0,
    total: S.reihe.length,
    percent: 0,
    correct: 0,
    attempts: 0,
    status: 'active'
  });
  /* Vor den Aufgaben: die Lernkarte dieser Niveaustufe — Hinführung,
     Erklärung, Bild, Beispielrechnung. Nur wenn sie hinterlegt ist und
     wir nicht im Prüfungsset stecken. */
  if (!S.daten.pruefung && S.daten.lernkarten && S.daten.lernkarten[p]) lernkarteZeigen('start');
  else aufgabeZeigen();
}

/* ---------- Lernkarte (Hinführung je Niveaustufe) ----------
   Erscheint beim Wählen eines Pfades vor der ersten Aufgabe und lässt
   sich später über „📖 Erklärung" jederzeit wieder öffnen.
   modus = 'start'  → Knopf „Los geht's" beginnt bei Aufgabe 1
   modus = 'wieder' → Knopf „Zurück zu den Aufgaben" kehrt zur laufenden
                      Aufgabe zurück, ohne den Fortschritt zu verlieren. */
const NIVEAU = { A: 'Basis', B: 'Standard', C: 'Vertiefung' };

function lernkarteZeigen(modus, ziel) {
  const lk = S.daten.lernkarten && S.daten.lernkarten[S.pfad];
  if (!lk) {
    if (modus === 'wieder') aufgabeZurueckholen(); else aufgabeZeigen();
    return;
  }
  const sprungziele = {};

  const b = $('#buehne');
  if (modus === 'wieder') aufgabeParken();
  else buehneLeeren(b);
  streifenAktualisieren();
  Tracker.track('lernkarte_view', { path: S.pfad, modus });

  const zeile = el('div', 'stufe-zeile');
  zeile.append(el('span', 'stufe-pill', `Pfad ${S.pfad} · ${NIVEAU[S.pfad] || ''}`));
  zeile.append(el('span', null, 'Erklärung'));
  b.append(zeile);

  const karte = el('div', 'karte lernkarte');
  /* Die Karte sofort einhängen. Falls ein Bild-Renderer ausfällt,
     bleibt der bereits erzeugte Erklärungstext sichtbar. */
  b.append(karte);

  if (lk.titel) karte.append(el('h2', 'lk-titel', lk.titel));

  if (lk.hinfuehrung) {
    const p = el('p', 'lk-hin');
    p.innerHTML = markiereWorte(lk.hinfuehrung);
    karte.append(p);
  }

  if (lk.visual && lk.bild_oben !== false) sprungziele.animation = karte.appendChild(visualBlockSicher(lk.visual));

  (lk.erklaerung || []).forEach((absatz, i) => {
    const p = el('p', 'lk-erkl');
    p.innerHTML = markiereWorte(absatz);
    karte.append(p);
    sprungziele['absatz' + i] = p;
  });

  if (lk.visual && lk.bild_oben === false) sprungziele.animation = karte.appendChild(visualBlockSicher(lk.visual));

  if (lk.beispiel) karte.append(beispielBlock(lk.beispiel));

  if (lk.merke) {
    const m = el('div', 'lk-merke');
    m.innerHTML = '<b>Merke:</b> ' + markiereWorte(lk.merke);
    karte.append(m);
    sprungziele.merke = m;
  }

  /* Selbsteinschätzung vor den Aufgaben — am Ende wird sie mit dem
     tatsächlichen Ergebnis verglichen. Wer sich unterschätzt hat, soll das
     schwarz auf weiß sehen; das ist oft der eigentliche Zugewinn. */
  if (modus === 'start' && !S.daten.pruefung && S.daten.can_do && S.daten.can_do[S.pfad]) {
    karte.append(selbstcheckBlock());
  }

  const akt = el('div', 'aktionen');
  const los = el('button', 'btn btn-haupt',
    modus === 'wieder' ? 'Zurück zu den Aufgaben' : "Los geht's – Aufgaben starten");
  los.addEventListener('click', () => {
    if (modus === 'wieder') aufgabeZurueckholen();
    else aufgabeZeigen();
  });
  akt.append(los);

  /* Auf einen anderen Pfad wechseln, ohne erst durch die Aufgaben zu müssen. */
  const wechsel = { A: 'B', B: 'C', C: 'A' }[S.pfad];
  if (!S.daten.pfad_fest && S.daten.lernkarten[wechsel]) {
    const w = el('button', 'btn btn-neben', `Erklärung Pfad ${wechsel} ansehen`);
    w.addEventListener('click', () => pfadSetzen(wechsel));
    akt.append(w);
  }
  karte.append(akt);

  /* Kam der Aufruf aus einer Rückmeldung, wird die passende Stelle
     hervorgehoben und angesteuert — sonst beginnt die Karte oben. */
  const sprung = ziel && (Number.isInteger(ziel.absatz) ? sprungziele['absatz' + ziel.absatz]
    : ziel.animation ? (sprungziele.animation || sprungziele.merke)
    : ziel.merke ? sprungziele.merke : null);
  if (sprung) {
    sprung.classList.add('lk-hervor');
    requestAnimationFrame(() => sprung.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* ---------- Beispielrechnung ----------
   Auf Pfad A wird der letzte Schritt zur Lücke. Ein fertig vorgerechnetes
   Beispiel liest man; ein Beispiel mit einer Lücke rechnet man mit. Das
   Ergebnis bleibt jederzeit über „Schritt zeigen" erreichbar — die Lücke
   darf niemanden aussperren. */
function beispielBlock(bsp) {
  const box = el('div', 'lk-beispiel');
  box.append(el('div', 'lk-beispiel-kopf', bsp.titel || 'Beispiel'));
  if (bsp.aufgabe) {
    const a = el('p', 'lk-beispiel-aufgabe');
    a.innerHTML = markiereWorte(bsp.aufgabe);
    box.append(a);
  }

  const schritte = (bsp.schritte || []).slice();
  const luecke = S.pfad === 'A' && !S.daten.pruefung ? lueckeAusSchritt(schritte[schritte.length - 1]) : null;

  if (schritte.length) {
    const rw = el('div', 'lk-rechenweg');
    rw.textContent = (luecke ? schritte.slice(0, -1) : schritte).join('\n');
    box.append(rw);
  }

  if (luecke) {
    const zeile = el('div', 'lk-luecke');
    zeile.append(el('span', 'lk-luecke-text', luecke.vorne + ' ='));
    const inp = el('input', 'zahl-feld lk-luecke-feld');
    inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
    inp.setAttribute('aria-label', 'Fehlendes Ergebnis des letzten Schritts');
    zeile.append(inp);
    const knopf = el('button', 'btn btn-neben', 'Prüfen');
    knopf.type = 'button';
    const zeigen = el('button', 'btn btn-neben', 'Schritt zeigen');
    zeigen.type = 'button';
    const echo = el('div', 'lk-luecke-echo');

    const aufloesen = (selbst) => {
      zeile.replaceWith(Object.assign(el('div', 'lk-rechenweg lk-luecke-fertig'), { textContent: luecke.ganz }));
      echo.className = 'lk-luecke-echo ' + (selbst ? 'gut' : 'neutral');
      echo.textContent = selbst ? 'Richtig — genau dieser Schritt fehlte.' : 'So geht der letzte Schritt.';
      Tracker.track('lueckenbeispiel', { path: S.pfad, geloest: !!selbst });
    };
    knopf.addEventListener('click', () => {
      const k = lesarten(inp.value.trim()).filter(z => !Number.isNaN(z));
      if (!k.length) { echo.className = 'lk-luecke-echo neutral'; echo.textContent = 'Schreib nur die Zahl.'; return; }
      if (k.some(z => Math.abs(z - luecke.wert) <= Math.max(0.01, Math.abs(luecke.wert) * 0.001))) aufloesen(true);
      else { echo.className = 'lk-luecke-echo schlecht'; echo.textContent = 'Noch nicht. Schau dir die Zeile darüber an.'; }
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') knopf.click(); });
    zeigen.addEventListener('click', () => aufloesen(false));

    const knoepfe = el('div', 'lk-luecke-knoepfe');
    knoepfe.append(knopf); knoepfe.append(zeigen);
    box.append(zeile); box.append(knoepfe); box.append(echo);
  }

  if (bsp.ergebnis && !luecke) {
    const e = el('div', 'lk-ergebnis');
    e.innerHTML = '<b>Ergebnis:</b> ' + markiereWorte(bsp.ergebnis);
    box.append(e);
  }
  return box;
}

/* Der letzte Schritt wird nur dann zur Lücke, wenn rechts vom letzten
   Gleichheitszeichen wirklich eine Zahl steht. Sonst bleibt alles beim Alten. */
function lueckeAusSchritt(zeile) {
  if (!zeile || typeof zeile !== 'string') return null;
  const pos = zeile.lastIndexOf('=');
  if (pos < 1) return null;
  const rechts = zeile.slice(pos + 1).trim();
  const zahl = rechts.match(/^[−-]?[\d.,]+/);
  if (!zahl) return null;
  const werte = lesarten(zahl[0]).filter(z => !Number.isNaN(z));
  if (!werte.length) return null;
  return { vorne: zeile.slice(0, pos).trimEnd(), wert: werte[0], ganz: zeile };
}

/* ---------- Selbsteinschätzung ---------- */
function selbstcheckBlock() {
  const box = el('div', 'selbstcheck');
  box.append(el('div', 'selbstcheck-frage', 'Kannst du das schon?'));
  box.append(el('div', 'selbstcheck-satz', S.daten.can_do[S.pfad]));
  const wahl = el('div', 'selbstcheck-wahl');
  [['ja', 'Ja, das kann ich'], ['teils', 'Ein bisschen'], ['nein', 'Noch nicht']].forEach(([wert, text]) => {
    const b = el('button', 'opt selbstcheck-opt', text);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(S.selbst === wert));
    b.addEventListener('click', () => {
      S.selbst = wert;
      wahl.querySelectorAll('.selbstcheck-opt').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      Tracker.track('selbstcheck_vorher', { path: S.pfad, wert });
    });
    wahl.append(b);
  });
  box.append(wahl);
  return box;
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
  geparkteAufgabeVerwerfen();
  const b = $('#buehne');
  buehneLeeren(b);
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
  /* Erklärung dieser Niveaustufe jederzeit wieder aufrufbar. */
  if (S.daten.lernkarten && S.daten.lernkarten[t.path]) {
    const erk = el('button', 'erklaerung-link', '📖 Erklärung');
    erk.type = 'button';
    erk.addEventListener('click', () => lernkarteZeigen('wieder'));
    zeile.append(erk);
  }
  b.append(zeile);

  const karte = el('div', 'karte');
  /* Sofort einhängen: Ein Fehler in einer optionalen Visualisierung
     darf die eigentliche Aufgabe nicht unsichtbar machen. */
  b.append(karte);

  /* Nachfassaufgabe: Der Grund, warum sie jetzt kommt, gehört dazu.
     Sonst wirkt sie wie eine Strafe statt wie eine zweite Chance. */
  if (t.nachfass) {
    const hinweis = el('div', 'nachfass-hinweis');
    hinweis.innerHTML = t.nachfass_leichter
      ? '<b>Noch einmal dasselbe</b> — eine Stufe einfacher. '
        + 'Hier ist eben der Denkfehler passiert; so wird er sichtbar.'
      : '<b>Noch einmal dasselbe</b> — mit anderen Zahlen. '
        + 'Hier ist eben der Denkfehler passiert; jetzt sitzt er wahrscheinlich.';
    karte.append(hinweis);
  }

  const frage = el('p', 'frage');
  frage.innerHTML = markiereWorte(t.prompt);
  karte.append(frage);

  if (t.visual) karte.append(visualBlockSicher(t.visual));

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

  const feld = $('.zahl-feld');
  if (feld) feld.focus({ preventScroll: true });
}

/* Optionale Bilder dürfen nie die Aufgabe oder Erklärung blockieren. */
function visualBlockSicher(v) {
  try {
    if (typeof visualBlock !== 'function') {
      throw new Error('visualBlock ist nicht verfügbar');
    }
    const block = visualBlock(v);
    if (!block) throw new Error('Visualisierung lieferte kein Element');
    return block;
  } catch (error) {
    console.error('[Mathe9 Visualisierung]', error);
    const hinweis = el('div', 'bild visual-fehler');
    hinweis.textContent = 'Die Abbildung konnte nicht geladen werden. Die Aufgabe kann trotzdem bearbeitet werden.';

    /* Im develop-Modus die technische Ursache anzeigen. Dadurch lässt sich
       ein Cache- oder Rendererfehler direkt erkennen, ohne die Konsole zu öffnen. */
    if (window.MATHE9_SUPABASE?.devMode === true) {
      const detail = el('small', 'visual-fehler-detail');
      detail.textContent = `Technischer Hinweis: ${error?.message || String(error)}`;
      hinweis.append(detail);
    }

    return hinweis;
  }
}

function regexSicher(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ---------- Wortspeicher ----------
   Die Begriffe waren schon markiert, aber die Erklärung steckte in einem
   `title`-Attribut — auf dem Handy unerreichbar, und sie wiederholte nur
   das Wort selbst. Jetzt lässt sich jedes markierte Wort antippen und
   erklärt sich in einem Satz. Die Sätze stehen in der tasks.json:

     "wortspeicher": ["der Grundwert", …],
     "worterklaerungen": { "Grundwert": "Das Ganze. Der Grundwert sind 100 %." }

   Fehlt eine Erklärung, bleibt es beim reinen Hervorheben. */
function worterklaerung(kern) {
  const q = S.daten.worterklaerungen || {};
  if (q[kern]) return String(q[kern]);
  const treffer = Object.keys(q).find(k => k.toLowerCase() === kern.toLowerCase());
  return treffer ? String(q[treffer]) : null;
}

function markiereWorte(text) {
  let out = String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  (S.daten.wortspeicher || []).forEach(wort => {
    const w = String(wort ?? '');
    const kern = w.replace(/^(der|die|das)\s+/i, '').trim();
    if (!kern) return;

    const erkl = worterklaerung(kern);
    const titel = attrSicher(erkl || w);
    const klasse = erkl ? 'wort wort-tippbar' : 'wort';
    const tag = erkl ? 'button' : 'span';
    const zusatz = erkl ? ` type="button" data-wort="${attrSicher(kern)}"` : '';

    try {
      out = out.replace(
        new RegExp(`\\b(${regexSicher(kern)})\\b`, 'gi'),
        `<${tag} class="${klasse}" title="${titel}"${zusatz}>$1</${tag}>`
      );
    } catch (error) {
      console.warn('[Mathe9 Wortspeicher]', kern, error);
    }
  });

  return out;
}

/* Ein Tipp auf ein markiertes Wort zeigt den Satz direkt darunter —
   nicht als Systemtooltip, den ein Touchgerät nie anzeigt. */
document.addEventListener('click', e => {
  const knopf = e.target.closest('.wort-tippbar');
  if (!knopf || !S.daten) return;
  const kern = knopf.dataset.wort;
  const erkl = worterklaerung(kern);
  if (!erkl) return;

  const offen = document.querySelector('.wort-erklaerung');
  const warSelbes = offen && offen.dataset.wort === kern;
  if (offen) offen.remove();
  if (warSelbes) return;

  const box = el('div', 'wort-erklaerung');
  box.dataset.wort = kern;
  box.append(el('b', null, kern + ':'), document.createTextNode(' ' + erkl));
  const zu = el('button', 'wort-erklaerung-x', '✕');
  zu.type = 'button';
  zu.setAttribute('aria-label', 'Erklärung schließen');
  zu.addEventListener('click', () => box.remove());
  box.append(zu);

  const traeger = knopf.closest('p, div, li') || knopf.parentElement;
  traeger.after(box);
  Tracker.track('wort_erklaerung', { wort: kern, unit: S.daten.unit, path: S.pfad });
});

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
    if (!g) { S.versuche--; return; }
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
  S.versucheGesamt++;

  /* Der Denkfehler wird lokal notiert — das Warm-up der nächsten Stunde
     zieht daraus die passende Wiederholungskategorie. */
  if (fehlvorstellung) merkeFehler(fehlvorstellung.id);

  track({
    unit: S.daten.unit, task: t.id, path: t.path, step: t.step,
    correct: richtig,
    misconception: fehlvorstellung ? fehlvorstellung.id : null,
    hints_used: S.tippsGenutzt,
    attempts: S.versuche,
    total_attempts: S.versucheGesamt,
    duration_ms: Date.now() - S.start
  });

  if (richtig) {
    S.geloest.add(t.id);
    if (S.versuche === 1) {
      S.aufAnhieb++;
      if (S.kernIds.has(t.id)) S.kernAufAnhieb++;
    }
    const aktiv = document.activeElement;
    if (aktiv && aktiv.matches?.('.zahl-feld')) aktiv.blur();
    const percent = Math.round(S.geloest.size / (S.reihe.length || 1) * 100);
    Tracker.setContext({ progress: percent });
    Tracker.progress({
      unit: S.daten.unit,
      path: S.pfad,
      task: t.id,
      completed: S.geloest.size,
      total: S.reihe.length,
      percent,
      correct: S.aufAnhieb,
      attempts: S.versucheGesamt,
      status: S.geloest.size >= S.reihe.length ? 'completed' : 'active'
    });
    const box = el('div', 'rueck ok');
    box.innerHTML = '<b>Richtig.</b>' + (t.solution ? `<div class="rechenweg">${t.solution}</div>` : '');
    $('#rueck').append(box);
    $('#pruefen').textContent = 'Weiter';
    $('#pruefen').replaceWith($('#pruefen').cloneNode(true));
    $('#pruefen').addEventListener('click', () => { S.index++; aufgabeZeigen(); });
    if ($('#tipp')) $('#tipp').disabled = true;
    streifenAktualisieren();
    return;
  }

  /* Der Kern: falsch heißt nicht "leider falsch", sondern Diagnose. */
  if (fehlvorstellung) {
    melde('nope', `<b>Fast.</b> ${fehlvorstellung.feedback}`);
    erklaerungsverweis(fehlvorstellung);
    /* Bisher wurde der Denkfehler nur notiert und tauchte frühestens im
       Warm-up der nächsten Stunde wieder auf. Jetzt kommt direkt danach
       dieselbe Sache mit anderen Zahlen — dort, wo der Fehler noch frisch
       ist und die Korrektur wirklich ankommt. */
    nachfassEinreihen(fehlvorstellung.id);
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

/* ---------- Verweis auf die passende Erklärstelle ----------
   „📖 Erklärung" öffnete bisher immer die ganze Lernkarte. Die Rückmeldung
   weiß aber genau, worum es geht — also springt sie an die Stelle, die zu
   diesem Denkfehler gehört. Optional steuerbar über das Feld

     "misconceptions": [{ "id": "…", "value": …, "feedback": "…",
                          "verweis": { "absatz": 1 } }]

   Ohne Angabe wird die Animation der eigenen Niveaustufe angesteuert; hat
   die Karte keine, der Merksatz. */
function erklaerungsverweis(fehlvorstellung) {
  const lk = S.daten.lernkarten && S.daten.lernkarten[S.pfad];
  if (!lk) return;
  const v = fehlvorstellung.verweis || {};
  const ziel = Number.isInteger(v.absatz) ? { absatz: v.absatz }
    : (v.animation === true || lk.visual) ? { animation: true }
    : { merke: true };
  const b = el('button', 'btn btn-neben verweis-btn', '📖 Dazu die Erklärung');
  b.type = 'button';
  b.addEventListener('click', () => {
    Tracker.track('erklaerung_verweis', { path: S.pfad, misconception: fehlvorstellung.id });
    lernkarteZeigen('wieder', ziel);
  });
  $('#rueck').append(b);
}

/* ---------- Nachfassen: dieselbe Sache, andere Zahlen ---------- */
function fehlvorstellungIn(t, id) {
  if ((t.misconceptions || []).some(m => m.id === id)) return true;
  return (t.fields || []).some(f => (f.misconceptions || []).some(m => m.id === id));
}

const LEICHTER = { A: [], B: ['A'], C: ['B', 'A'] };

function nachfassEinreihen(id) {
  if (!id || S.daten.pruefung || S.nachgefasst.has(id)) return;
  const passt = (t, pfad) => t !== S.aufgabe && t.path === pfad
    && !S.geloest.has(t.id) && fehlvorstellungIn(t, id);

  /* Zuerst in der eigenen Reihe: dann bleibt die Gesamtzahl gleich und die
     Aufgabe rückt nur nach vorn. */
  const idx = S.reihe.findIndex((t, i) => i > S.index && passt(t, S.pfad));
  let treffer = null, leichter = false;
  if (idx > -1) {
    treffer = S.reihe.splice(idx, 1)[0];
  } else {
    treffer = (S.daten.tasks || []).find(t => passt(t, S.pfad) && !S.reihe.includes(t)) || null;
    /* Kein passender Zwilling auf dem eigenen Pfad? Dann tut es eine Aufgabe
       eine Stufe darunter — nach einem Denkfehler ist das ohnehin der
       bessere Ansatz als dasselbe Niveau noch einmal. */
    if (!treffer) {
      for (const p of (LEICHTER[S.pfad] || [])) {
        treffer = (S.daten.tasks || []).find(t => passt(t, p) && !S.reihe.includes(t)) || null;
        if (treffer) { leichter = true; break; }
      }
    }
  }
  /* Führt der Pool zu dieser Fehlvorstellung keine zweite Aufgabe, bleibt
     alles wie bisher — lieber keine Nachfassaufgabe als eine unpassende. */
  if (!treffer) return;

  treffer.nachfass = id;
  treffer.nachfass_leichter = leichter;
  S.reihe.splice(S.index + 1, 0, treffer);
  S.nachgefasst.add(id);
  Tracker.track('nachfass_eingereiht', { path: S.pfad, misconception: id, task: treffer.id, leichter });
  melde('tipp', leichter
    ? 'Gleich danach kommt <b>dieselbe Sache noch einmal</b> — eine Stufe einfacher.'
    : 'Gleich danach kommt <b>dieselbe Sache noch einmal</b> — mit anderen Zahlen.');
}

/* ---------- Abschluss ---------- */
function abschluss() {
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

  const gesamt = S.kernGesamt || S.reihe.length || 1;
  const aufAnhieb = S.kernGesamt ? S.kernAufAnhieb : S.aufAnhieb;
  const quote = aufAnhieb / gesamt;

  /* Selbsteinschätzung gegen das Ergebnis halten. Wer sich unterschätzt
     hat, erfährt es hier — das ist häufig der eigentliche Zugewinn. */
  if (S.selbst) {
    const kasten = el('div', 'selbstcheck selbstcheck-fazit');
    const stark = quote >= .8, schwach = quote < .5;
    let text;
    if (S.selbst === 'nein' && stark) text = 'Vorhin hast du „noch nicht“ angekreuzt — und dann <b>' + aufAnhieb + ' von ' + gesamt + '</b> auf Anhieb richtig gehabt. Du kannst mehr, als du dachtest.';
    else if (S.selbst === 'teils' && stark) text = 'Du warst dir unsicher, hattest aber <b>' + aufAnhieb + ' von ' + gesamt + '</b> auf Anhieb richtig. Das saß besser als gedacht.';
    else if (S.selbst === 'ja' && schwach) text = 'Du warst dir sicher, auf Anhieb saßen aber <b>' + aufAnhieb + ' von ' + gesamt + '</b>. Schau dir die Erklärung noch einmal an — dann passt es.';
    else text = 'Deine Einschätzung vorher und dein Ergebnis (<b>' + aufAnhieb + ' von ' + gesamt + '</b> auf Anhieb) passen zusammen.';
    kasten.innerHTML = text;
    karte.append(kasten);
    Tracker.track('selbstcheck_nachher', { path: S.pfad, vorher: S.selbst, auf_anhieb: aufAnhieb, gesamt });
  }

  /* Empfehlung statt bloßer Wahlmöglichkeit: Die App weiß, wie es lief. */
  const naechster = { A: 'B', B: 'C', C: null }[S.pfad];
  const vorheriger = { A: null, B: 'A', C: 'B' }[S.pfad];
  const hoch = naechster && quote >= .8 && S.daten.lernkarten && S.daten.lernkarten[naechster];
  const runter = vorheriger && quote < .5 && S.daten.lernkarten && S.daten.lernkarten[vorheriger];
  if (hoch || runter) {
    const rat = el('div', 'empfehlung');
    rat.innerHTML = hoch
      ? `<b>Vorschlag:</b> ${aufAnhieb} von ${gesamt} auf Anhieb — Pfad ${naechster} passt jetzt zu dir.`
      : `<b>Vorschlag:</b> Das war zäh (${aufAnhieb} von ${gesamt} auf Anhieb). Auf Pfad ${vorheriger} wird die Grundlage noch einmal ruhig aufgebaut.`;
    karte.append(rat);
  }

  const akt = el('div', 'aktionen');
  if (naechster) {
    const w = el('button', 'btn ' + (hoch ? 'btn-haupt' : 'btn-neben'), `Weiter auf Pfad ${naechster}`);
    w.addEventListener('click', () => pfadSetzen(naechster));
    akt.append(w);
  }
  if (runter) {
    const z = el('button', 'btn btn-haupt', `Zurück auf Pfad ${vorheriger}`);
    z.addEventListener('click', () => pfadSetzen(vorheriger));
    akt.append(z);
  }
  const n = el('button', 'btn btn-neben', 'Noch einmal üben');
  n.addEventListener('click', () => pfadSetzen(S.pfad));
  akt.append(n);

  /* Verteiltes Wiederholen: drei Aufgaben von früher gehören ans Ende der
     Stunde, nicht nur an den Anfang der nächsten. Auswahl, Leitner-Kartei
     und Fehlerprofil kommen unverändert aus dem Warm-up. */
  if (!S.daten.pruefung) {
    const w = el('a', 'btn btn-neben', '3 Aufgaben von früher');
    w.href = 'warmup.html?n=3&u=' + encodeURIComponent(String(S.daten.unit || '').toLowerCase());
    w.style.textDecoration = 'none';
    w.addEventListener('click', () => Tracker.track('wiederholung_am_ende', { unit: S.daten.unit, path: S.pfad }));
    akt.append(w);
  }

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
    S.daten.wortspeicher.forEach(w => {
      const k = String(w).replace(/^(der|die|das)\s+/i, '').trim();
      const erkl = worterklaerung(k);
      const li = el('li');
      /* Der Wortspeicher listete bisher nur die Begriffe. Wer sie nicht
         kennt, hat davon nichts — deshalb steht die Erklärung gleich dabei. */
      if (erkl) {
        li.append(el('b', null, w), document.createElement('br'));
        li.append(el('span', 'fk-erkl', erkl));
      } else {
        li.textContent = String(w);
      }
      ul.append(li);
    });
    i.append(ul);
  }
  if (k.saetze) {
    i.append(el('h3', null, 'So sagst du es'));
    const ul = el('ul');
    k.saetze.forEach(s => ul.append(el('li', null, s)));
    i.append(ul);
  }
}


/* ---------- Externe Übungen ----------
   Datengetrieben aus tasks.json:
   "uebungslinks": [
     {
       "titel": "...",
       "url": "https://...",
       "typ": "app"|"sammlung",
       "quelle": "LearningApps"|"Serlo"|"H5P"|"Learningsnacks"|"Quizlet"|"ZUM"
     }
   ]
   Fehlt der Schlüssel, bleibt die Karte vollständig ausgeblendet.
   Nur bekannte HTTPS-Plattformen werden gerendert. */
const UEBUNGSQUELLEN = [
  { key: 'learningapps', label: 'LearningApps', hosts: ['learningapps.org'] },
  { key: 'serlo', label: 'Serlo', hosts: ['serlo.org'] },
  { key: 'h5p', label: 'H5P', hosts: ['h5p.org', 'schule-bw.de'] },
  { key: 'learningsnacks', label: 'Learningsnacks', hosts: ['learningsnacks.de'] },
  { key: 'quizlet', label: 'Quizlet', hosts: ['quizlet.com'] },
  { key: 'zum', label: 'ZUM', hosts: ['zum.de'] }
];

function hostPasst(host, basis) {
  return host === basis || host.endsWith('.' + basis);
}

function uebungsquelleFuerUrl(url) {
  const host = String(url.hostname || '').toLowerCase();
  return UEBUNGSQUELLEN.find(quelle =>
    quelle.hosts.some(basis => hostPasst(host, basis))
  ) || null;
}

function uebungskarteBauen() {
  const box = $('#uebungskarte');
  const inhalt = $('#uebung-inhalt');
  if (!box || !inhalt) return;

  const liste = Array.isArray(S.daten.uebungslinks)
    ? S.daten.uebungslinks
    : [];

  inhalt.innerHTML = '';
  if (!liste.length) {
    box.hidden = true;
    return;
  }

  const gesehen = new Set();
  const gueltigeLinks = liste.map(eintrag => {
    try {
      const url = new URL(String(eintrag?.url || ''), location.href);
      const quelle = uebungsquelleFuerUrl(url);
      const titel = String(eintrag?.titel || '').trim();
      const typ = eintrag?.typ === 'sammlung' ? 'sammlung' : 'app';
      const schluessel = `${titel}\n${url.href}\n${typ}`;

      if (url.protocol !== 'https:' || !quelle || !titel || gesehen.has(schluessel)) {
        return null;
      }
      gesehen.add(schluessel);

      return {
        titel,
        url: url.href,
        typ,
        quelle
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (!gueltigeLinks.length) {
    box.hidden = true;
    return;
  }

  box.hidden = false;
  inhalt.append(el(
    'p',
    'ua-hinweis',
    'Externe interaktive Übungen öffnen in einem neuen Tab. Inhalte und Verfügbarkeit können sich ändern – bitte vor dem Unterricht kurz prüfen.'
  ));

  const ul = el('ul', 'ua-liste');
  gueltigeLinks.forEach(eintrag => {
    const li = el('li');

    const quelle = el(
      'span',
      `ua-q ua-q-${eintrag.quelle.key}`,
      eintrag.quelle.label
    );
    li.append(quelle);

    const a = el('a', 'ua-link', eintrag.titel);
    a.href = eintrag.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.addEventListener('click', () => {
      Tracker.track('external_practice_open', {
        provider: eintrag.quelle.key,
        title: eintrag.titel,
        link_type: eintrag.typ
      });
    });
    li.append(a);

    if (eintrag.typ === 'sammlung') {
      li.append(el('span', 'ua-tag', 'Sammlung'));
    }
    ul.append(li);
  });
  inhalt.append(ul);
}

/* Fallback für ältere Android-WebViews ohne zuverlässiges :has().
   Während die Bildschirmtastatur offen ist, fahren die festen unteren
   Leisten aus dem Weg. */
document.addEventListener('focusin', e => {
  if (e.target?.matches?.('.zahl-feld')) document.body.classList.add('tastatur-aktiv');
});
document.addEventListener('focusout', () => {
  setTimeout(() => {
    if (!document.activeElement?.matches?.('.zahl-feld')) {
      document.body.classList.remove('tastatur-aktiv');
    }
  }, 0);
});

/* Auch dann starten, wenn dieses Skript erst nach DOMContentLoaded
   nachgeladen wurde — der Prüfungstrainer lädt engine.js dynamisch. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
