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
  /* Nicht nur wie viele, sondern in welcher Reihenfolge: true = auf Anhieb.
     Eine Quote von 4 aus 6 heißt etwas anderes, wenn die letzten beiden
     danebengingen, als wenn es die ersten beiden waren. */
  kernVerlauf: [],
  /* Beim Sprung zur Erklärung bleibt die laufende Aufgabe mitsamt Eingaben,
     Versuchen, Tipps, Rückmeldungen und Zeitmessung erhalten. */
  rueckkehrDom: null,
  /* Eine ID je gezeigter Aufgabe. Ohne sie lassen sich Antwortversuche nicht
     sicher zuordnen, sobald offline nachgeliefert wird, mehrere Tabs offen
     sind oder dieselbe Aufgabe erneut bearbeitet wird. */
  taskSession: null,
  /* Abgeschlossene Pfade dieser Einheit */
  fertig: new Set(),
  /* Wie oft insgesamt ein Tipp geholt wurde — geht in die Frage ein,
     wie belastbar die Pfadempfehlung ist. */
  tippsInsgesamt: 0,
  einstufung: false,
  entwurfWartet: null,
  /* Laufender Aufgabenstand, der nach einem Neuladen auf genau dieselbe
     Aufgabe zurückgespielt wird (Versuche, Tipps, Zeit und Sitzungs-ID). */
  aufgabenStandWartet: null,
  letzteFehlvorstellung: null
};

/* Datensparsame Schnittstelle für den Diagnoseexport. Der vollständige
   interne Zustand bleibt gekapselt. */
window.MATHE9_DIAGNOSE_STATE = () => ({
  unit: S.daten?.unit || null,
  path: S.pfad || null,
  task: S.aufgabe?.id || null,
  task_session_id: S.taskSession || null,
  index: S.index,
  total: S.reihe.length
});

function neueId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch { /* ältere Browser */ }
  return 'ts-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

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

/* ============================================================
   Bearbeitungsstand · dauerhaft
   Gespeichert wird, was zum Weitermachen nötig ist: Pfad, Position,
   gelöste Aufgaben, genutzte Tipps, Selbsteinschätzung und die bereits
   getippten, aber noch nicht geprüften Eingaben. Prüfungssets speichern
   nichts — dort wäre ein Zwischenstand eine Einladung zum Nachbessern.
   ============================================================ */
function standSpeichern() {
  if (!S.daten || S.daten.pruefung) return;
  try {
    const aktuelleId = S.reihe[S.index]?.id || null;
    const schonGeloest = Boolean(aktuelleId && S.geloest.has(aktuelleId));
    const amEnde = S.index >= S.reihe.length;
    const speicherIndex = schonGeloest ? Math.min(S.index + 1, S.reihe.length) : S.index;
    const nachfassMeta = {};
    S.reihe.forEach(t => {
      if (t.nachfass) nachfassMeta[t.id] = {
        misconception: t.nachfass,
        leichter: t.nachfass_leichter === true
      };
    });
    /* Seit V36 schreibt nicht mehr nur die Engine in diesen Datensatz:
       quiz.js legt unter `quiz` das Ergebnis des Abschlussquiz ab. Diese
       Funktion schreibt aber ein vollständiges Objekt und würde ein Feld,
       das sie nicht kennt, beim nächsten Speichern stillschweigend
       löschen — und das nächste Speichern kommt sofort, nämlich im
       Abschluss direkt nach dem Quiz. Offline ist dieser Eintrag die
       einzige Spur des Laufs; er muss die Runde überstehen. */
    const bisher = Stand.lies(S.daten.unit) || {};
    Stand.schreib(S.daten.unit, {
      version: 2,
      unit: S.daten.unit,
      ...(bisher.quiz ? { quiz: bisher.quiz } : {}),
      titel: S.daten.title || '',
      pfad: S.pfad,
      index: speicherIndex,
      gesamt: S.reihe.length,
      aufgabe: schonGeloest || amEnde ? null : (S.aufgabe?.id || aktuelleId),
      reihe_ids: S.reihe.map(t => t.id),
      nachgefasst: [...S.nachgefasst],
      nachfass_meta: nachfassMeta,
      geloest: [...S.geloest],
      auf_anhieb: S.aufAnhieb,
      kern_auf_anhieb: S.kernAufAnhieb,
      kern_verlauf: S.kernVerlauf,
      versuche_gesamt: S.versucheGesamt,
      versuche_aktuell: schonGeloest || amEnde ? 0 : S.versuche,
      tipps_aktuell: schonGeloest || amEnde ? 0 : S.tippsGenutzt,
      tipps_insgesamt: S.tippsInsgesamt,
      elapsed_ms: schonGeloest || amEnde || !S.start ? 0 : Math.max(0, Date.now() - S.start),
      task_session_id: schonGeloest || amEnde ? null : S.taskSession,
      letzte_fehlvorstellung: schonGeloest || amEnde ? null : S.letzteFehlvorstellung,
      selbst: S.selbst,
      fertig: [...S.fertig],
      entwurf: schonGeloest || amEnde ? null : entwurfLesen()
    });
  } catch (error) {
    console.warn('[Mathe9 Stand]', error);
  }
}

/* Die bereits getippten Zahlen der laufenden Aufgabe. */
function entwurfLesen() {
  const felder = [...document.querySelectorAll('#buehne .zahl-feld:not(.lk-luecke-feld)')];
  if (felder.length) return { typ: 'zahlen', werte: felder.map(f => f.value) };
  const gewaehlt = [...document.querySelectorAll('#buehne .slot')].map(s => {
    const o = s.querySelector('.opt[aria-pressed="true"]');
    return o ? Number(o.dataset.i) : null;
  });
  if (gewaehlt.length) return { typ: 'zuordnung', werte: gewaehlt };
  const eine = document.querySelector('#buehne .optionen .opt[aria-pressed="true"]');
  if (eine) return { typ: 'auswahl', werte: [Number(eine.dataset.i)] };
  return null;
}

function entwurfSetzen(entwurf) {
  if (!entwurf || !entwurf.werte) return;
  if (entwurf.typ === 'zahlen') {
    const felder = [...document.querySelectorAll('#buehne .zahl-feld:not(.lk-luecke-feld)')];
    entwurf.werte.forEach((w, i) => { if (felder[i] && w != null) felder[i].value = String(w); });
    return;
  }
  if (entwurf.typ === 'zuordnung') {
    document.querySelectorAll('#buehne .slot').forEach((s, i) => {
      const wahl = entwurf.werte[i];
      if (wahl == null) return;
      const o = s.querySelector(`.opt[data-i="${wahl}"]`);
      if (o) { s.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-pressed', 'false')); o.setAttribute('aria-pressed', 'true'); }
    });
    return;
  }
  if (entwurf.typ === 'auswahl') {
    const o = document.querySelector(`#buehne .optionen .opt[data-i="${entwurf.werte[0]}"]`);
    if (o) { document.querySelectorAll('#buehne .optionen .opt').forEach(x => x.setAttribute('aria-pressed', 'false')); o.setAttribute('aria-pressed', 'true'); }
  }
}

/* Nicht bei jedem Tastendruck schreiben — das Gerät hat Besseres zu tun. */
let standTimer = null;
function standSpeichernBald() {
  clearTimeout(standTimer);
  standTimer = setTimeout(standSpeichern, 500);
}

document.addEventListener('input', e => {
  if (e.target.closest?.('#buehne')) standSpeichernBald();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') standSpeichern();
});
window.addEventListener('pagehide', standSpeichern);

/* Wiederaufnahme anbieten statt stillschweigend fortzusetzen: Wer die
   Einheit bewusst neu beginnen will, soll das auch können. */
function standAbfrage(stand) {
  const b = $('#buehne');
  buehneLeeren(b);
  const karte = el('div', 'karte stand-karte');
  karte.append(el('h2', 'frage', 'Weiterlernen?'));
  const wann = new Date(stand.ts);
  const p = el('p');
  p.innerHTML = `Du warst zuletzt bei <b>Aufgabe ${Math.min(stand.index + 1, stand.gesamt || 1)} von ${stand.gesamt || '?'}</b> `
    + `auf Pfad <b>${stand.pfad}</b> (${wann.toLocaleDateString('de-DE')}, ${wann.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr).`;
  karte.append(p);

  const akt = el('div', 'aktionen');
  const weiter = el('button', 'btn btn-haupt', 'Dort weiterlernen');
  weiter.addEventListener('click', () => {
    Tracker.track('stand_fortgesetzt', { unit: S.daten.unit, path: stand.pfad, index: stand.index });
    pfadSetzen(stand.pfad, stand);
  });
  akt.append(weiter);

  const neu = el('button', 'btn btn-neben', 'Von vorn beginnen');
  neu.addEventListener('click', () => {
    Stand.loesche(S.daten.unit);
    S.fertig = new Set();
    S.entwurfWartet = null;
    S.aufgabenStandWartet = null;
    S.letzteFehlvorstellung = null;
    Tracker.track('stand_verworfen', { unit: S.daten.unit, path: stand.pfad });
    pfadSetzen(S.daten.pfad_fest || stand.pfad || S.pfad);
  });
  akt.append(neu);
  karte.append(akt);
  b.append(karte);
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

  /* Seit V34 liegt je Lernbereich eine eigene Animationsdatei vor, die
     animationen-laden.js anhand von ?u= nachholt. Der Download läuft
     parallel zu dem der tasks.json — hier ist er deshalb fast immer
     schon fertig. Gewartet wird trotzdem: Ohne den Block stünde in der
     Lernkarte „Animation nicht gefunden" statt des Bildes.

     Schlägt das Laden fehl, liefert das Versprechen `false` und die
     Einheit baut ohne Bilder auf. Eine fehlende Abbildung darf niemanden
     an der Aufgabe hindern. */
  try { await window.ANIM?.bereit; }
  catch (fehler) { console.warn('[Mathe9 Animation]', fehler); }

  kopfBauen();
  formelkarteBauen();
  uebungskarteBauen();
  videokarteBauen();
  blattkarteBauen();

  /* ---------- Bewertungsmodus ----------
     Während des Unterrichts öffnet sich eine neue Einheit erst nach
     Freigabe durch die Lehrkraft. Entschieden wird das serverseitig; hier
     steht nur, was das Kind sieht. Der Aufruf wartet bewusst NICHT auf die
     Antwort, bevor der Rest der Seite baut — sonst stünde bei jedem
     Seitenaufruf erst einmal nichts da. Kommt die Sperre eine Sekunde
     später, ist das früh genug. */
  if (window.Lernmodus) {
    Promise.resolve(
      Lernmodus.starten(S.daten.unit ? String(S.daten.unit).toLowerCase() : null)
    ).then(() => {
      const id = String(S.daten.unit || '').toLowerCase();
      const urteil = Lernmodus.darfOeffnen(id);
      if (!urteil.erlaubt) {
        Tracker.track('einheit_gesperrt', { unit: id });
        Lernmodus.sperreAnzeigen(id, document.querySelector('#buehne'));
        document.querySelector('#uebungskarte')?.setAttribute('hidden', '');
        document.querySelector('#videokarte')?.setAttribute('hidden', '');
      }
    });
  }

  /* Ein Deep-Link der Lehrkraft schlägt den gespeicherten Stand: Wer per
     Link an eine bestimmte Stelle geschickt wird, soll dort landen. */
  const ziel = deepLink();
  /* Die eindeutige Aufgaben-ID verrät ihren Pfad. Dadurch funktioniert ein
     Lehrerlink auch ohne zusätzliches `p=`. */
  if (ziel.aufgabe) {
    const zielAufgabe = (S.daten.tasks || []).find(t => t.id === ziel.aufgabe);
    if (zielAufgabe) ziel.pfad = zielAufgabe.path;
  }
  if (ziel.pfad && !S.daten.pfad_fest && S.daten.lernkarten?.[ziel.pfad]) S.pfad = ziel.pfad;

  const stand = S.daten.pruefung ? null : Stand.lies(S.daten.unit);
  /* Abgeschlossene Pfade gelten für die ganze Einheit — sie bleiben auch
     dann bekannt, wenn gar keine Wiederaufnahme angeboten wird. */
  if (stand) S.fertig = new Set(stand.fertig || []);
  const lohntSich = stand && (stand.index > 0 || (stand.geloest || []).length > 0 || stand.aufgabe || stand.entwurf || (stand.versuche_aktuell | 0) > 0 || (stand.tipps_aktuell | 0) > 0);
  /* Ein Deep-Link auf eine Aufgabe oder eine Stelle der Erklärung schlägt den
     gespeicherten Stand — dorthin soll man ja geschickt werden. Ein reines
     `?p=` tut das nicht: Es wählt nur den Pfad vor, und wer auf genau diesem
     Pfad einen Stand hat, soll ihn trotzdem angeboten bekommen. Zeigt der
     Link dagegen auf einen anderen Pfad, ist das eine bewusste Umleitung. */
  const linkUebersteuert = !!(ziel.aufgabe || ziel.abschnitt
    || (ziel.pfad && stand && ziel.pfad !== stand.pfad));
  if (lohntSich && !linkUebersteuert) { standAbfrage(stand); return; }

  pfadSetzen(S.daten.pfad_fest || S.pfad, null, ziel);
}

/* ---------- Deep-Links für die Lehrkraft ----------
   einheit.html?u=lf-04&p=B&aufgabe=LF04-B2-003
   einheit.html?u=pz-05&p=A&abschnitt=beispiel
   Damit lässt sich eine Klasse im Unterricht an eine bestimmte Stelle
   schicken, ohne dass alle erst hinklicken müssen. */
function deepLink() {
  const q = new URLSearchParams(location.search);
  const pfad = String(q.get('p') || '').toUpperCase();
  return {
    pfad: ['A', 'B', 'C'].includes(pfad) ? pfad : null,
    aufgabe: q.get('aufgabe') || null,
    abschnitt: q.get('abschnitt') || null
  };
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

function pfadSetzen(p, stand, ziel) {
  geparkteAufgabeVerwerfen();
  S.pfad = p;
  if (!S.daten.pfad_fest) Speicher.schreib('mathe9.pfad', p);
  document.documentElement.style.setProperty('--pfad', `var(--${p.toLowerCase()})`);
  document.documentElement.style.setProperty('--pfad-bg', `var(--${p.toLowerCase()}-bg)`);
  document.querySelectorAll('.pfad-btn').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.p === p)));
  /* Videos, externe Übungen und das Übungsblatt hängen am Lernweg — beim
     Wechsel neu bauen. Sonst zeigt die Seite nach einem Wechsel von B auf A
     weiter das B-Blatt und die für den Basisweg ausgeblendeten Sammlungen. */
  videokarteBauen();
  uebungskarteBauen();
  blattkarteBauen();

  S.reihe = S.daten.tasks.filter(t => t.path === p);
  /* Der Prüfungstrainer hat seine Reihenfolge schon festgelegt. */
  if (!S.daten.reihenfolge_fest) S.reihe.sort((a, b) => a.step - b.step);
  S.kernIds = new Set(S.reihe.map(t => t.id));
  S.kernGesamt = S.reihe.length;
  S.kernAufAnhieb = 0;
  S.kernVerlauf = [];
  S.index = 0;
  S.geloest = new Set();
  S.aufAnhieb = 0;
  S.versucheGesamt = 0;
  S.nachgefasst = new Set();
  S.selbst = null;
  S.tippsInsgesamt = 0;
  S.einstufung = false;
  S.entwurfWartet = null;
  S.aufgabenStandWartet = null;
  S.letzteFehlvorstellung = null;
  S.aufgabe = null;
  S.taskSession = null;
  /* Über alle Aufgaben, nicht nur die aktuelle Reihe: die Objekte werden
     zwischen den Pfaden wiederverwendet, sonst bliebe die Markierung kleben. */
  (S.daten.tasks || []).forEach(t => { delete t.nachfass; delete t.nachfass_leichter; });
  Tracker.setContext({ unit: S.daten.unit, path: p, task: null, progress: 0 });
  Tracker.track('path_selected', { path: p, source: S.daten.pruefung ? 'pruefung' : 'einheit' });
  /* Gespeicherten Stand einspielen — danach geht es direkt an der Aufgabe
     weiter, an der zuletzt gearbeitet wurde. */
  if (stand && stand.pfad === p) {
    const pool = new Map((S.daten.tasks || []).map(t => [t.id, t]));
    const ids = Array.isArray(stand.reihe_ids) ? stand.reihe_ids : [];
    const gespeichert = ids.map(id => pool.get(id)).filter(Boolean);
    if (gespeichert.length) S.reihe = gespeichert;

    const meta = stand.nachfass_meta || {};
    Object.entries(meta).forEach(([id, m]) => {
      const t = pool.get(id);
      if (!t || !m) return;
      t.nachfass = m.misconception || null;
      t.nachfass_leichter = m.leichter === true;
    });
    S.nachgefasst = new Set(stand.nachgefasst || []);
    S.geloest = new Set((stand.geloest || []).filter(id => pool.has(id)));
    S.index = Math.min(Math.max(0, stand.index | 0), S.reihe.length);
    while (S.index < S.reihe.length && S.geloest.has(S.reihe[S.index].id)) S.index++;
    S.aufAnhieb = stand.auf_anhieb | 0;
    S.kernAufAnhieb = stand.kern_auf_anhieb | 0;
    S.kernVerlauf = Array.isArray(stand.kern_verlauf) ? stand.kern_verlauf.map(Boolean) : [];
    S.versucheGesamt = stand.versuche_gesamt | 0;
    S.selbst = stand.selbst || null;
    S.fertig = new Set(stand.fertig || []);
    S.tippsInsgesamt = stand.tipps_insgesamt | 0;
    S.entwurfWartet = null;
    const aktuelle = S.reihe[S.index];
    if (aktuelle && (!stand.aufgabe || stand.aufgabe === aktuelle.id)) {
      S.entwurfWartet = stand.entwurf || null;
      S.aufgabenStandWartet = {
        task: aktuelle.id,
        versuche: Math.max(0, stand.versuche_aktuell | 0),
        tipps: Math.max(0, stand.tipps_aktuell ?? stand.tipps ?? 0),
        elapsed: Math.max(0, Number(stand.elapsed_ms) || 0),
        session: stand.task_session_id || null,
        misconception: stand.letzte_fehlvorstellung || null
      };
    }
    const fortschritt = Math.round(S.geloest.size / Math.max(1, S.reihe.length) * 100);
    Tracker.setContext({ progress: fortschritt });
    Tracker.progress({
      unit: S.daten.unit, path: p, task: aktuelle?.id || null,
      completed: S.geloest.size, total: S.reihe.length, percent: fortschritt,
      correct: S.aufAnhieb, attempts: S.versucheGesamt,
      status: S.index >= S.reihe.length ? 'completed' : 'active'
    });
    aufgabeZeigen();
    return;
  }

  /* Nur ein wirklich neu begonnener Pfad wird im Dashboard auf null gesetzt.
     Bei einer Wiederaufnahme wurde oben der gespeicherte Stand übertragen. */
  Tracker.progress({
    unit: S.daten.unit, path: p, task: null,
    completed: 0, total: S.reihe.length, percent: 0,
    correct: 0, attempts: 0, status: 'active'
  });

  /* Deep-Link auf eine bestimmte Aufgabe: dorthin springen. */
  if (ziel && ziel.aufgabe) {
    const i = S.reihe.findIndex(t => t.id === ziel.aufgabe);
    if (i > -1) {
      S.index = i;
      Tracker.track('deeplink_aufgabe', { path: p, task: ziel.aufgabe });
      aufgabeZeigen();
      return;
    }
  }

  /* Vor den Aufgaben: die Lernkarte dieser Niveaustufe — Hinführung,
     Erklärung, Bild, Beispielrechnung. Nur wenn sie hinterlegt ist und
     wir nicht im Prüfungsset stecken. */
  if (!S.daten.pruefung && S.daten.lernkarten && S.daten.lernkarten[p]) {
    lernkarteZeigen('start', ziel && ziel.abschnitt ? { abschnitt: ziel.abschnitt } : null);
  } else aufgabeZeigen();
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

  if (lk.beispiel) sprungziele.beispiel = karte.appendChild(beispielBlock(lk.beispiel));

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
  /* `abschnitt` kommt aus einem Lehrer-Deep-Link (…&abschnitt=beispiel),
     `absatz`/`animation`/`merke` aus einer Rückmeldung. */
  const abschnitt = ziel && ziel.abschnitt
    ? ({ beispiel: sprungziele.beispiel, merke: sprungziele.merke,
         animation: sprungziele.animation, erklaerung: sprungziele.absatz0 }[ziel.abschnitt] || null)
    : null;
  const sprung = abschnitt || (ziel && (Number.isInteger(ziel.absatz) ? sprungziele['absatz' + ziel.absatz]
    : ziel.animation ? (sprungziele.animation || sprungziele.merke)
    : ziel.merke ? sprungziele.merke : null));
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
  const luecke = S.pfad === 'A' && !S.daten.pruefung ? lueckeBestimmen(bsp) : null;

  if (schritte.length) {
    const vor = luecke ? schritte.slice(0, luecke.index) : schritte;
    if (vor.length) {
      const rw = el('div', 'lk-rechenweg');
      rw.textContent = vor.join('\n');
      box.append(rw);
    }
  }

  if (luecke) {
    const zeile = el('div', 'lk-luecke');
    zeile.append(el('span', 'lk-luecke-text', luecke.vorne));
    const inp = el('input', 'zahl-feld lk-luecke-feld');
    inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
    inp.setAttribute('aria-label', 'Fehlende Zahl in der Rechnung');
    zeile.append(inp);
    if (luecke.einheit) zeile.append(el('span', 'einheit-label', luecke.einheit));
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

    /* Steht die Lücke nicht am Ende, folgen die restlichen Schritte darunter. */
    const rest = schritte.slice(luecke.index + 1);
    if (rest.length) {
      const rw = el('div', 'lk-rechenweg');
      rw.textContent = rest.join('\n');
      box.append(rw);
    }
  }

  if (bsp.ergebnis && !luecke) {
    const e = el('div', 'lk-ergebnis');
    e.innerHTML = '<b>Ergebnis:</b> ' + markiereWorte(bsp.ergebnis);
    box.append(e);
  }
  return box;
}

/* ---------- Welche Zahl fehlt? ----------
   Vorrang hat die Angabe der fachlichen Autorenschaft in der tasks.json:

     "beispiel": { "schritte": [...],
                   "luecke": { "schritt": 2, "wert": 60, "einheit": "€" } }

   Damit entscheidet nicht mehr eine Zeichenkettenregel, welcher Wert
   ergänzt werden soll. Fehlt das Feld, greift wie bisher die Heuristik auf
   den letzten Schritt — so funktionieren neue Einheiten sofort, ohne dass
   die Lücke pflicht wäre. Wo beides nichts liefert (Benennungs- und
   Zuordnungsbeispiele ohne Rechenergebnis), gibt es bewusst keine Lücke. */
function lueckeBestimmen(bsp) {
  const schritte = bsp.schritte || [];
  const vorgabe = bsp.luecke;

  if (vorgabe && typeof vorgabe.wert === 'number' && Number.isFinite(vorgabe.wert)) {
    const i = Number.isInteger(vorgabe.schritt) ? vorgabe.schritt : schritte.length - 1;
    const zeile = schritte[i];
    if (typeof zeile === 'string') {
      const teil = letzteZahlTrennen(zeile);
      return {
        index: i,
        vorne: teil ? teil.vorne : zeile,
        wert: vorgabe.wert,
        einheit: vorgabe.einheit || (teil ? teil.nach : ''),
        ganz: zeile
      };
    }
  }

  const alt = lueckeAusSchritt(schritte[schritte.length - 1]);
  return alt
    ? { index: schritte.length - 1, vorne: alt.vorne + ' =', wert: alt.wert, einheit: '', ganz: alt.ganz }
    : null;
}

/* Trennt die letzte Zahl einer Zeile ab — funktioniert bei „= 15 cm²"
   genauso wie bei „· 8   8 Brötchen → 3,20 €". */
function letzteZahlTrennen(zeile) {
  const treffer = [...String(zeile).matchAll(/[−-]?\d[\d.,]*/g)];
  if (!treffer.length) return null;
  const letzter = treffer[treffer.length - 1];
  return {
    vorne: zeile.slice(0, letzter.index).replace(/\s+$/, ' '),
    nach: zeile.slice(letzter.index + letzter[0].length).trim()
  };
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
      standSpeichern();
    });
    wahl.append(b);
  });
  box.append(wahl);
  return box;
}

/* ---------- Fortschritt an das Dashboard ----------
   Eine Stelle, an der der Stand zusammengesetzt wird. Vorher stand
   derselbe Block dreimal im Code und wurde nur bei einer richtigen
   Antwort gesendet; jetzt melden auch Aufgabenwechsel, Fehlversuche und
   der Takt in tracker.js denselben Stand. */
function fortschrittMelden(zusatz = {}) {
  if (!S.daten) return;
  const gesamt = S.reihe.length || 0;
  const percent = Math.round(S.geloest.size / (gesamt || 1) * 100);
  Tracker.setContext({ progress: percent });
  Tracker.progressWennNeu({
    unit: S.daten.unit,
    path: S.pfad,
    task: S.aufgabe?.id || S.reihe[S.index]?.id || null,
    completed: S.geloest.size,
    total: gesamt,
    percent,
    correct: S.aufAnhieb,
    attempts: S.versucheGesamt,
    status: gesamt && S.geloest.size >= gesamt ? 'completed' : 'active',
    ...zusatz
  });
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
  const wieder = S.aufgabenStandWartet && S.aufgabenStandWartet.task === t.id
    ? S.aufgabenStandWartet : null;
  S.aufgabenStandWartet = null;
  S.tippsGenutzt = Math.min(t.hints?.length || 0, wieder?.tipps || 0);
  S.versuche = Math.max(0, wieder?.versuche || 0);
  S.start = Date.now() - Math.max(0, wieder?.elapsed || 0);
  S.letzteFehlvorstellung = wieder?.misconception || null;
  /* Beim Wiederaufnehmen bleibt die Sitzungs-ID erhalten. Nur eine wirklich
     neue Aufgabenbearbeitung erhält eine neue ID. */
  S.taskSession = wieder?.session || neueId();

  Tracker.setContext({
    unit: S.daten.unit, path: t.path, task: t.id,
    task_session_id: S.taskSession,
    progress: Math.round(S.geloest.size / (S.reihe.length || 1) * 100)
  });
  if (wieder) {
    Tracker.track('task_resume', {
      step: t.step, index: S.index + 1, total: S.reihe.length,
      attempts: S.versuche, hints_used: S.tippsGenutzt
    });
  } else {
    Tracker.track('task_view', { step: t.step, index: S.index + 1, total: S.reihe.length, source: S.daten.pruefung ? 'pruefung' : 'einheit' });
  }

  /* Auch das bloße Aufschlagen einer Aufgabe ist Fortschritt: Das
     Dashboard und die Beameransicht sollen zeigen, WO jemand steht, nicht
     erst, wenn er etwas richtig gelöst hat. */
  fortschrittMelden();

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

  if (wieder) {
    for (let i = 0; i < S.tippsGenutzt; i++) {
      const box = el('div', 'rueck tipp');
      box.innerHTML = `<b>Tipp ${i + 1}:</b> ${t.hints[i]}`;
      rueck.append(box);
    }
    if ($('#tipp') && S.tippsGenutzt >= (t.hints?.length || 0)) $('#tipp').disabled = true;
    if (S.versuche > 0) {
      melde('tipp', `<b>Weiterlernen:</b> Deine bisherigen ${S.versuche === 1 ? 'Eingabe war' : S.versuche + ' Eingaben waren'} noch nicht richtig. Der nächste richtige Versuch zählt daher nicht als „auf Anhieb".`);
    }
    if (S.versuche >= 2 && t.solution) {
      const box = el('div', 'rueck tipp');
      box.innerHTML = `<b>So geht es:</b><div class="rechenweg">${t.solution}</div>`;
      rueck.append(box);
      const w = el('button', 'btn btn-neben', 'Weiter');
      w.id = 'weiter';
      w.addEventListener('click', () => { S.index++; aufgabeZeigen(); });
      akt.append(w);
    }
  }

  /* Bereits getippte, aber noch nicht geprüfte Eingaben zurückholen. */
  if (S.entwurfWartet) { entwurfSetzen(S.entwurfWartet); S.entwurfWartet = null; }

  const feld = $('.zahl-feld');
  if (feld) feld.focus({ preventScroll: true });
  standSpeichern();
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
      standSpeichernBald();
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
        standSpeichernBald();
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
  S.tippsInsgesamt++;
  if (S.tippsGenutzt >= t.hints.length) $('#tipp').disabled = true;
  standSpeichern();
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
      S.versuche--;
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
  S.letzteFehlvorstellung = fehlvorstellung?.id || null;
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
    const warSchonGeloest = S.geloest.has(t.id);
    S.geloest.add(t.id);
    if (!warSchonGeloest && S.versuche === 1) {
      S.aufAnhieb++;
      if (S.kernIds.has(t.id)) S.kernAufAnhieb++;
    }
    if (!warSchonGeloest && S.kernIds.has(t.id)) S.kernVerlauf.push(S.versuche === 1);
    const aktiv = document.activeElement;
    if (aktiv && aktiv.matches?.('.zahl-feld')) aktiv.blur();
    fortschrittMelden();
    const box = el('div', 'rueck ok');
    box.innerHTML = '<b>Richtig.</b>' + (t.solution ? `<div class="rechenweg">${t.solution}</div>` : '');
    $('#rueck').append(box);
    $('#pruefen').textContent = 'Weiter';
    $('#pruefen').replaceWith($('#pruefen').cloneNode(true));
    $('#pruefen').addEventListener('click', () => { S.index++; aufgabeZeigen(); });
    if ($('#tipp')) $('#tipp').disabled = true;
    streifenAktualisieren();
    standSpeichern();
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
  /* Auch ein Fehlversuch verschiebt den Stand: Die Zahl der Versuche geht
     ins Dashboard ein und ist dort das Signal „hier hakt es". */
  fortschrittMelden();
  standSpeichern();
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

/* ---------- Nachfassen: dieselbe Sache, andere Zahlen ----------
   Manche Denkfehler tragen kontextbedingt leicht verschiedene IDs
   (`mal_statt_geteilt` und `mal_statt_geteilt_vol`, `vorzeichen` und
   `vorzeichen_fehlt`). Für die Diagnose bleiben sie getrennt — für die
   Nachfassaufgabe zählen sie als dieselbe Sache. Zusammengeführt wird nur
   über den gemeinsamen Wortstamm, nicht über Vermutungen. */
function fehlerStamm(id) {
  return String(id || '').replace(
    /_(vol|volumen|flaeche|bei_volumen|bei_flaeche|fehlt|uebersehen|vertauscht|beim_teilen)$/, '');
}

/* Alle Fehlvorstellungen einer Aufgabe, auch die an einzelnen Feldern. */
function alleFehlvorstellungen(t) {
  const alle = [...(t.misconceptions || [])];
  (t.fields || []).forEach(f => alle.push(...(f.misconceptions || [])));
  return alle;
}

/* Drei Stufen der Ähnlichkeit, in dieser Reihenfolge:
     'exakt'   dieselbe ID
     'konzept' dasselbe Feld "konzeptfehler" — eine fachliche Aussage aus
               der tasks.json, nicht geraten
     'stamm'   gleicher Wortstamm, letzter Notnagel für ungepflegte IDs */
function fehlvorstellungIn(t, id, konzept, art) {
  return alleFehlvorstellungen(t).some(m => {
    if (art === 'exakt') return m.id === id;
    if (art === 'konzept') return !!konzept && m.konzeptfehler === konzept;
    return fehlerStamm(m.id) === fehlerStamm(id);
  });
}

const LEICHTER = { A: [], B: ['A'], C: ['B', 'A'] };

function nachfassEinreihen(id) {
  if (!id || S.daten.pruefung || S.nachgefasst.has(id)) return;
  /* Zu welchem Konzept gehört dieser Denkfehler? Steht es in den Daten,
     zählt es mehr als jede Namensähnlichkeit. */
  const konzept = (alleFehlvorstellungen(S.aufgabe)
    .find(m => m.id === id) || {}).konzeptfehler || null;

  const passt = (t, pfad, art) => t !== S.aufgabe && t.path === pfad
    && !S.geloest.has(t.id) && fehlvorstellungIn(t, id, konzept, art);

  let treffer = null, leichter = false;
  /* Suchreihenfolge: gleiche ID → gleiches Konzept → gleicher Wortstamm;
     jeweils erst der eigene Pfad, dann eine Stufe darunter. */
  for (const art of ['exakt', 'konzept', 'stamm']) {
    if (art === 'konzept' && !konzept) continue;
    const idx = S.reihe.findIndex((t, i) => i > S.index && passt(t, S.pfad, art));
    if (idx > -1) { treffer = S.reihe.splice(idx, 1)[0]; break; }
    treffer = (S.daten.tasks || []).find(t => passt(t, S.pfad, art) && !S.reihe.includes(t)) || null;
    if (treffer) break;
    /* Kein passender Zwilling auf dem eigenen Pfad? Dann tut es eine Aufgabe
       eine Stufe darunter — nach einem Denkfehler ist das ohnehin der
       bessere Ansatz als dasselbe Niveau noch einmal. */
    for (const p of (LEICHTER[S.pfad] || [])) {
      treffer = (S.daten.tasks || []).find(t => passt(t, p, art) && !S.reihe.includes(t)) || null;
      if (treffer) { leichter = true; break; }
    }
    if (treffer) break;
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

/* ---------- Schwellen der Pfadempfehlung ----------
   An einer Stelle, damit sie nachjustierbar sind, ohne den Code zu
   durchsuchen. Die Werte sind plausibel gewählt, aber **nicht empirisch
   belegt**: Sie stammen aus der Überlegung, dass „vier von fünf auf Anhieb"
   für die nächste Stufe spricht und „weniger als die Hälfte" gegen die
   aktuelle. Jede Empfehlung wird zusammen mit den Schwellen protokolliert
   (`pfadempfehlung`), damit sie später an tatsächlichen Ergebnissen
   überprüft werden können — siehe Tafel „Pfadempfehlungen" im Dashboard. */
const EMPFEHLUNG = {
  hoch: 0.8,           // ab dieser Quote wird die nächsthöhere Stufe empfohlen
  runter: 0.5,         // darunter die nächstniedrigere
  mindestAufgaben: 4,  // weniger sind kein verlässliches Bild
  tippsJeAufgabe: 1,   // ab so vielen Tipps je Aufgabe gilt die Quote als gestützt
  sprungHaelften: 0.5, // Unterschied zwischen erster und zweiter Hälfte
  nachfassAnteil: 0.5  // ab so vielen Nachfassaufgaben je Kernaufgabe
};

/* Wie belastbar ist die Quote? Vier Gründe sprechen dagegen — und alle vier
   kommen im Unterricht regelmäßig vor:

     1. zu wenige Aufgaben,
     2. Ergebnisse, die überwiegend mit Tipps zustande kamen,
     3. ein uneinheitlicher Verlauf: erste Hälfte glatt, zweite zäh (oder
        umgekehrt). Die Quote ist dann ein Mittelwert über zwei verschiedene
        Zustände und beschreibt keinen davon,
     4. viele eingeschobene Nachfassaufgaben. Die Kernquote sieht dann besser
        aus, als der Weg dorthin war.

   In allen vier Fällen wird die Empfehlung als Vermutung formuliert und eine
   kurze Einstufung angeboten, statt Sicherheit vorzutäuschen. */
function empfehlungSicherheit(gesamt) {
  if (gesamt < EMPFEHLUNG.mindestAufgaben) {
    return { sicher: false, grund: `Das waren nur ${gesamt} Aufgaben — zu wenige für ein verlässliches Bild.` };
  }
  const tippQuote = S.tippsInsgesamt / Math.max(1, gesamt);
  if (tippQuote >= EMPFEHLUNG.tippsJeAufgabe) {
    return { sicher: false, grund: 'Du hast oft einen Tipp gebraucht — allein sieht es vielleicht anders aus.' };
  }

  const verlauf = S.kernVerlauf || [];
  if (verlauf.length >= EMPFEHLUNG.mindestAufgaben) {
    const mitte = Math.floor(verlauf.length / 2);
    const anteil = teil => teil.filter(Boolean).length / Math.max(1, teil.length);
    const erste = anteil(verlauf.slice(0, mitte));
    const zweite = anteil(verlauf.slice(mitte));
    if (Math.abs(zweite - erste) >= EMPFEHLUNG.sprungHaelften) {
      return {
        sicher: false,
        grund: zweite < erste
          ? 'Der Anfang lief deutlich besser als das Ende — vielleicht war es einfach genug für heute.'
          : 'Am Anfang hakte es, am Ende lief es — das sieht nach „gerade verstanden" aus.'
      };
    }
  }

  const nachfassQuote = (S.nachgefasst?.size || 0) / Math.max(1, gesamt);
  if (nachfassQuote >= EMPFEHLUNG.nachfassAnteil) {
    return { sicher: false, grund: 'Zwischendurch kamen mehrere Nachfassaufgaben — die haben mitgeholfen.' };
  }

  return { sicher: true, grund: '' };
}

/* Eine kurze Einstufung auf dem vorgeschlagenen Pfad: drei Aufgaben,
   Stufe 1 und 2, ohne Lernkarte davor. Danach steht die Empfehlung auf
   eigenen Füßen. */
function einstufungStarten(pfad) {
  const kandidaten = (S.daten.tasks || []).filter(t => t.path === pfad && t.step <= 2);
  if (kandidaten.length < 2) { pfadSetzen(pfad); return; }
  Tracker.track('einstufung_gestartet', { von: S.pfad, nach: pfad });
  pfadSetzen(pfad);
  S.reihe = kandidaten.slice(0, 3);
  S.kernIds = new Set(S.reihe.map(t => t.id));
  S.kernGesamt = S.reihe.length;
  S.kernAufAnhieb = 0;
  S.kernVerlauf = [];
  S.index = 0;
  S.geloest = new Set();
  S.einstufung = true;
  aufgabeZeigen();
}

/* ---------- Abschluss ---------- */
/* `wieder` ist wahr, wenn der Abschluss nach dem Abschlussquiz erneut
   aufgebaut wird. Angezeigt wird dann dasselbe, gemeldet aber nichts:
   Selbstcheck-Fazit und Pfadempfehlung sind Ereignisse der Auswertung,
   keine der Anzeige — ein zweiter Eintrag würde die spätere Kalibrierung
   der Schwellen verfälschen. */
function abschluss(wieder = false) {
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

  /* Kurze Einstufung: Sie schließt keinen Pfad ab, sondern beantwortet nur
     die eine Frage, für die sie gestartet wurde. */
  if (S.einstufung) {
    const n = S.reihe.length, gut = S.kernAufAnhieb;
    karte.append(el('h2', 'frage', 'Einstufung: ' + gut + ' von ' + n + ' auf Anhieb'));
    const p = el('p');
    p.innerHTML = gut >= Math.ceil(n * 0.67)
      ? `Das reicht. <b>Pfad ${S.pfad} passt zu dir.</b>`
      : `Noch wackelig. <b>Bleib zunächst auf dem bisherigen Pfad</b> — das ist keine Niederlage, sondern die passende Stufe.`;
    karte.append(p);
    Tracker.track('einstufung_ergebnis', { path: S.pfad, auf_anhieb: gut, gesamt: n });
    const akt = el('div', 'aktionen');
    const w = el('button', 'btn btn-haupt', `Auf Pfad ${S.pfad} weiterarbeiten`);
    w.addEventListener('click', () => { S.einstufung = false; pfadSetzen(S.pfad); });
    akt.append(w);
    const z = el('a', 'btn btn-neben', 'Zur Übersicht');
    z.href = 'index.html'; z.style.textDecoration = 'none';
    akt.append(z);
    karte.append(akt);
    b.append(karte);
    return;
  }

  karte.append(el('h2', 'frage', `Pfad ${S.pfad} geschafft.`));
  S.fertig.add(S.pfad);
  standSpeichern();

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
    if (!wieder) Tracker.track('selbstcheck_nachher', { path: S.pfad, vorher: S.selbst, auf_anhieb: aufAnhieb, gesamt });
  }

  /* Das Abschlussquiz steht vor der Empfehlung: Es ist der einzige Teil
     des Abschlusses, dessen Ergebnis die Lehrkraft erreicht — und es
     prüft, was in dieser Einheit stand, nicht wie gut der Weg dorthin
     lief. */
  quizEinladung(karte);

  /* Empfehlung statt bloßer Wahlmöglichkeit: Die App weiß, wie es lief.
     Sie weiß es aber nicht immer gut genug — bei wenigen Kernaufgaben oder
     vielen genutzten Tipps steht die Quote auf dünnem Grund. Dann wird die
     Empfehlung als Vermutung formuliert und mit einem kurzen Einstufungs-
     angebot verbunden, statt Sicherheit vorzutäuschen. */
  const naechster = { A: 'B', B: 'C', C: null }[S.pfad];
  const vorheriger = { A: null, B: 'A', C: 'B' }[S.pfad];
  const hoch = naechster && quote >= EMPFEHLUNG.hoch && S.daten.lernkarten && S.daten.lernkarten[naechster];
  const runter = vorheriger && quote < EMPFEHLUNG.runter && S.daten.lernkarten && S.daten.lernkarten[vorheriger];
  const sicherheit = empfehlungSicherheit(gesamt);
  /* Mitschreiben, was empfohlen wurde und auf welcher Grundlage — nur so
     lassen sich die Schwellen später an echten Ergebnissen kalibrieren. */
  if (!wieder) Tracker.track('pfadempfehlung', {
    von: S.pfad,
    empfohlen: hoch ? naechster : (runter ? vorheriger : null),
    quote: Math.round(quote * 100) / 100,
    auf_anhieb: aufAnhieb,
    gesamt,
    tipps: S.tippsInsgesamt,
    nachgefasst: S.nachgefasst?.size || 0,
    verlauf: S.kernVerlauf || [],
    sicher: sicherheit.sicher,
    schwellen: EMPFEHLUNG
  });
  if (hoch || runter) {
    const rat = el('div', 'empfehlung' + (sicherheit.sicher ? '' : ' empfehlung-vage'));
    const kern = hoch
      ? `${aufAnhieb} von ${gesamt} auf Anhieb — Pfad ${naechster} passt jetzt zu dir.`
      : `Das war zäh (${aufAnhieb} von ${gesamt} auf Anhieb). Auf Pfad ${vorheriger} wird die Grundlage noch einmal ruhig aufgebaut.`;
    rat.innerHTML = sicherheit.sicher
      ? `<b>Vorschlag:</b> ${kern}`
      : `<b>Eher ein Eindruck als ein Ergebnis:</b> ${hoch
          ? `Dein Ergebnis spricht für Pfad ${naechster}.`
          : `Dein Ergebnis spricht eher für Pfad ${vorheriger}.`}`
        + ` <span class="empfehlung-grund">${sicherheit.grund}</span>`;
    karte.append(rat);

    if (!sicherheit.sicher) {
      const probe = el('button', 'btn btn-neben', 'Kurze Einstufung (3 Aufgaben)');
      probe.addEventListener('click', () => einstufungStarten(hoch ? naechster : vorheriger));
      rat.append(probe);
    }
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

/* ---------- Abschlussquiz zur Einheit ----------
   Fünf Fragen, ausschließlich zum Inhalt dieser Einheit und dieses
   Pfades. Der Bestand dafür ist die `tasks.json` selbst; zusammengesetzt
   wird er in `quiz.js`.

   Der erste Lauf je Einheit ist der gewertete. Deshalb steht hier, bevor
   das Kind auf „Starten" drückt, ob es der erste ist — eine Prüfung,
   deren Bedingungen man erst hinterher erfährt, ist keine faire
   Prüfung. */
function quizEinladung(karte) {
  if (S.daten.pruefung || typeof Quiz === 'undefined') return;

  const satz = Quiz.bauen(S.daten, S.pfad);
  if (!satz || satz.fragen.length < 3) return;

  const bisher = Quiz.stand(S.daten.unit, S.pfad);
  const kasten = el('div', 'quizeinladung' + (bisher ? ' quizeinladung-erledigt' : ''));

  kasten.append(el('strong', null, bisher
    ? `Abschlussquiz: ${bisher.richtig} von ${bisher.gesamt} richtig.`
    : `Abschlussquiz zu dieser Einheit · ${satz.fragen.length} Fragen`));

  const p = el('p');
  p.innerHTML = bisher
    ? `Gewertet ist dein <b>erster</b> Lauf (${bisher.erster ? bisher.erster.richtig : bisher.richtig} `
      + `von ${bisher.erster ? bisher.erster.gesamt : bisher.gesamt}). Üben kannst du weiter, `
      + 'so oft du willst — an der Bewertung ändert sich dadurch nichts.'
    : 'Gefragt wird nur, was in <b>dieser</b> Einheit stand: der Merksatz deines Pfades, '
      + 'die Formelkarte, der Wortspeicher und zwei Aufgaben von vorhin. '
      + '<b>Dein erster Lauf zählt</b> und geht an deine Lehrkraft — die weiteren sind Übung.';
  kasten.append(p);

  const knopf = el('button', 'btn ' + (bisher ? 'btn-neben' : 'btn-haupt'),
    bisher ? 'Quiz noch einmal üben' : `Quiz starten (${satz.fragen.length} Fragen)`);
  knopf.type = 'button';
  knopf.addEventListener('click', () => {
    Tracker.track('quiz_start', {
      unit: S.daten.unit, path: S.pfad,
      fragen: satz.fragen.length, quelle: satz.quelle, wiederholung: Boolean(bisher)
    });
    const b = $('#buehne');
    buehneLeeren(b);
    const lauf = Quiz.starten(S.daten, S.pfad, b, () => { buehneLeeren(b); abschluss(true); });
    if (!lauf) { buehneLeeren(b); abschluss(true); }
  });
  kasten.append(knopf);

  karte.append(kasten);
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

  einstellungenBauen(i);
}

/* ---------- Einstellungen ----------
   Die Systemeinstellung „Bewegung reduzieren" ist auf einem Schulgerät für
   niemanden auffindbar. Deshalb steht der Schalter dort, wo er gebraucht
   wird: in der Schublade, die auf jeder Aufgabenseite erreichbar ist. */
function einstellungenBauen(ziel) {
  if (!window.ANIM || !window.ANIM.autostart) return;
  ziel.append(el('h3', null, 'Einstellungen'));

  const zeile = el('label', 'fk-schalter');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = window.ANIM.autostart.an();
  box.addEventListener('change', () => {
    window.ANIM.autostart.setzen(box.checked);
    Tracker.track('einstellung_autostart', { an: box.checked });
    hinweis.textContent = box.checked
      ? 'Animationen starten von selbst, sobald sie im Bild sind.'
      : 'Animationen starten erst auf „▶ Abspielen".';
  });
  zeile.append(box);
  zeile.append(el('span', null, 'Animationen automatisch starten'));
  ziel.append(zeile);

  const hinweis = el('div', 'fk-hinweis', box.checked
    ? 'Animationen starten von selbst, sobald sie im Bild sind.'
    : 'Animationen starten erst auf „▶ Abspielen".');
  ziel.append(hinweis);

  /* Wer die Bewegung im Betriebssystem abgestellt hat, soll wissen, warum
     der Schalter hier nichts bewirkt. */
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    ziel.append(el('div', 'fk-hinweis',
      'Dein Gerät ist auf „Bewegung reduzieren" eingestellt. Animationen bleiben deshalb immer stehen.'));
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
      /* Wie bei den Videos: Ein Ziel, das nicht zum Lernweg passt, hilft
         dort nicht. Ohne "pfade" gilt der Verweis auf allen Wegen — das
         ist der Normalfall und bleibt es. Eingeschränkt wird nur, was ein
         Kind auf dem Basisweg erst sortieren müsste: offene Übersichts-
         und Ordnerseiten ohne Bezug zu genau dieser Einheit. */
      const pfade = Array.isArray(eintrag?.pfade) ? eintrag.pfade : null;
      const passt = !pfade || pfade.includes(S.pfad);

      if (url.protocol !== 'https:' || !quelle || !titel || !passt || gesehen.has(schluessel)) {
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
    'Externe interaktive Übungen öffnen zunächst innerhalb der Anwendung. Über „In neuem Tab öffnen“ bleibt der direkte Aufruf möglich. Inhalte und Verfügbarkeit können sich ändern – bitte vor dem Unterricht kurz prüfen.'
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
    a.dataset.provider = eintrag.quelle.key;
    a.dataset.linkType = eintrag.typ;

    /* Der normale Klick wird vom Übungsrahmen genau einmal protokolliert.
       Nur bewusste Tab-Aufrufe umgehen den Rahmen und werden hier erfasst. */
    const trackNeuerTab = () => Tracker.track('external_practice_open', {
      provider: eintrag.quelle.key,
      title: eintrag.titel,
      link_type: eintrag.typ,
      mode: 'neuer_tab'
    });
    a.addEventListener('click', ereignis => {
      if (ereignis.metaKey || ereignis.ctrlKey || ereignis.shiftKey || ereignis.altKey) {
        trackNeuerTab();
      }
    });
    a.addEventListener('auxclick', ereignis => {
      if (ereignis.button === 1) trackNeuerTab();
    });
    li.append(a);

    if (eintrag.typ === 'sammlung') {
      li.append(el('span', 'ua-tag', 'Sammlung'));
    }
    ul.append(li);
  });
  inhalt.append(ul);
}


/* ---------- Handschriftliches Übungsblatt ----------
   Der digitale Weg prüft Ergebnisse, nicht Rechenwege. Wer nur tippt, übt
   das Aufschreiben nicht — und in der Klassenarbeit wird aufgeschrieben.
   Deshalb steht am Ende jeder Einheit ein Blatt zum Ausdrucken: gleiches
   Thema, andere Zahlen, andere Einkleidung.

   Die PDFs liegen fertig im Repository (werkzeuge/uebungsblaetter.js) und
   nicht im Offlinecache: Gedruckt wird ohnehin dort, wo es Netz gibt, und
   54 PDFs im Installationspaket würden die Erstinstallation im Schul-WLAN
   spürbar verlängern. */
function blattkarteBauen() {
  const karte = $('#blattkarte');
  const link = $('#blattkarte-link');
  if (!karte || !link) return;

  const id = String(S.daten.unit || '').toLowerCase();
  if (!id) { karte.hidden = true; return; }

  const bereich = id.split('-')[0];
  /* Je Lernweg ein eigenes Blatt: A vier Aufgaben mit glatten Zahlen,
     C sechs mit unbequemen. Ein Kind auf dem Basisweg soll nicht an
     Aufgaben scheitern, die für den Vertiefungsweg gedacht sind. */
  const stufe = String(S.pfad || 'B').toLowerCase();
  link.href = `units/${bereich}/${id}/uebungsblatt-${stufe}.pdf`;
  link.removeAttribute('download');
  karte.hidden = false;

  /* Die Karte wird bei jedem Lernwegwechsel neu gebaut. Ohne diese Sperre
     käme bei jedem Wechsel ein weiterer Zuhörer dazu und ein einziger Klick
     würde mehrfach gemeldet. */
  if (!link.dataset.gebunden) {
    link.dataset.gebunden = '1';
    link.addEventListener('click', () => {
      Tracker.track('uebungsblatt_geoeffnet', { unit: id, path: S.pfad });
    });
  }
}


/* ---------- Erklärvideos ----------
   Datengetrieben aus tasks.json:
   "videos": [
     { "titel": "…", "url": "https://www.youtube.com/watch?v=…",
       "quelle": "Lehrerschmidt", "pfad": "A" }   // pfad ist optional
   ]

   Warum verlinkt und nicht eingebettet: Ein eingebettetes YouTube-Fenster
   lädt beim Öffnen der Einheit Skripte und setzt Kennungen — auch bei
   Kindern, die das Video gar nicht ansehen wollen. Die Content-Security-
   Policy verbietet es deshalb ausdrücklich (frame-src 'none'). Ein Link
   ist eine Entscheidung des Kindes und bleibt eine.

   Warum überhaupt: Die Lernkarte erklärt es einmal. Wenn genau diese
   Erklärung nicht ankommt, hilft es wenig, sie noch einmal zu lesen —
   dann hilft eine andere Stimme und ein anderer Weg. Offline funktioniert
   das nicht; deshalb steht der Hinweis dabei. */
const VIDEOQUELLEN = {
  Lehrerschmidt: { key: 'lehrerschmidt', label: 'Lehrerschmidt' }
};
const VIDEO_MUSTER = /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/;

function videokarteBauen() {
  const box = $('#videokarte');
  const inhalt = $('#video-inhalt');
  if (!box || !inhalt) return;

  const liste = Array.isArray(S.daten.videos) ? S.daten.videos : [];
  inhalt.innerHTML = '';

  const gesehen = new Set();
  const gueltig = liste.filter(eintrag => {
    const url = String(eintrag?.url || '');
    const titel = String(eintrag?.titel || '').trim();
    const quelle = VIDEOQUELLEN[eintrag?.quelle];
    /* Ein Video für Pfad C hilft auf Pfad A nicht weiter — es verunsichert. */
    const passt = !eintrag?.pfad || eintrag.pfad === S.pfad;
    if (!VIDEO_MUSTER.test(url) || !titel || !quelle || !passt || gesehen.has(url)) return false;
    gesehen.add(url);
    return true;
  });

  if (!gueltig.length) { box.hidden = true; return; }
  box.hidden = false;

  inhalt.append(el('p', 'ua-hinweis',
    'Öffnet YouTube in einem neuen Tab — dafür brauchst du Internet. '
    + 'Die Videos gehören nicht zu dieser Seite; dort gelten die Regeln von YouTube.'));

  const ul = el('ul', 'ua-liste');
  gueltig.forEach(eintrag => {
    const quelle = VIDEOQUELLEN[eintrag.quelle];
    const li = el('li');
    li.append(el('span', `ua-q ua-q-${quelle.key}`, quelle.label));

    const a = el('a', 'ua-link', eintrag.titel.trim());
    a.href = eintrag.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.addEventListener('click', () => {
      Tracker.track('video_open', {
        provider: quelle.key,
        title: eintrag.titel.trim(),
        unit: S.daten.unit,
        path: S.pfad
      });
    });
    li.append(a);
    if (eintrag.pfad) li.append(el('span', 'ua-tag', 'Pfad ' + eintrag.pfad));
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
