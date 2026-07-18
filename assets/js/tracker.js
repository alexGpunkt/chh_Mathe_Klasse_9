/* ============================================================
   tracker.js · Aktivität, Antworten und Lernfortschritt
   - anonyme stabile Geräte-ID + neue Sitzungs-ID pro Browser-Tab
   - Heartbeat nur bei sichtbarer/aktiver Seite
   - Ereignisse gebündelt, bei Netzfehler lokal zwischengespeichert
   - Fortschritt als Upsert für das Lehrerdashboard
   ============================================================ */

const TRACKER_CONFIG = Object.assign({
  url: '', anonKey: '', enabled: false, heartbeatSeconds: 20, classCode: '9'
}, window.MATHE9_SUPABASE || {});

const Tracker = (() => {
  const QUEUE_KEY = 'mathe9.tracker.queue.v2';
  const DEVICE_KEY = 'mathe9.device_id';
  const SESSION_KEY = 'mathe9.session_id';
  const MAX_QUEUE = 500;
  let queue = readJson(QUEUE_KEY, []);
  let flushTimer = null;
  let heartbeatTimer = null;
  let lastInteraction = Date.now();
  let currentContext = { page: pageName(), unit: null, path: null, task: null, progress: null };
  let sending = false;

  function uuid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function readJson(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Unterricht läuft weiter */ }
  }
  function getOrCreate(key, sessionOnly = false) {
    const storage = sessionOnly ? sessionStorage : localStorage;
    try {
      let id = storage.getItem(key);
      if (!id) { id = uuid(); storage.setItem(key, id); }
      return id;
    } catch { return uuid(); }
  }
  function studentRecord() {
    try {
      const saved = JSON.parse(localStorage.getItem('mathe9.student') || 'null');
      return saved && saved.student_id ? saved : null;
    } catch { return null; }
  }
  function studentName() {
    const student = studentRecord();
    return student?.display_name || student?.login_name || 'anonym';
  }
  function pageName() {
    const file = location.pathname.split('/').pop() || 'index.html';
    return file.replace('.html', '') || 'index';
  }
  function configured() {
    return Boolean(
      TRACKER_CONFIG.enabled &&
      TRACKER_CONFIG.devTrackerDisabled !== true &&
      TRACKER_CONFIG.url &&
      TRACKER_CONFIG.anonKey
    );
  }
  function headers(prefer = 'return=minimal') {
    const key = String(TRACKER_CONFIG.anonKey || '').trim();
    const result = {
      'Content-Type': 'application/json',
      apikey: key,
      Prefer: prefer
    };
    if (key && !key.startsWith('sb_publishable_')) {
      result.Authorization = 'Bearer ' + key;
    }
    return result;
  }
  function base() {
    return String(TRACKER_CONFIG.url).replace(/\/$/, '') + '/rest/v1/';
  }
  function wholeNumber(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }
    return Math.max(
      0,
      Math.round(number)
    );
  }
  function percentage(value) {
    return Math.min(
      100,
      wholeNumber(value, 0)
    );
  }
  function common() {
    const student = studentRecord();
    return {
      student_id: student?.student_id || null,
      student: studentName(),
      device_id: getOrCreate(DEVICE_KEY),
      session_id: getOrCreate(SESSION_KEY, true),
      class_code: student?.class_code || TRACKER_CONFIG.classCode || null,
      page: currentContext.page,
      unit: currentContext.unit,
      path: currentContext.path,
      task: currentContext.task,
      ts: new Date().toISOString()
    };
  }
function enqueue(type, payload = {}) {
  const event = {
    event_type: type,
    ...common(),
    payload
  };
  if (!configured()) {
    console.debug('[Mathe9 tracker]', event);
    return;
  }
  if (!event.student_id) {
    console.warn(
      '[Mathe9 tracker] Kein gültiger Schüler angemeldet.'
    );
    return;
  }
  queue.push(event);
  function scheduleFlush(delay) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, delay);
  }
  async function flush() {
    if (!configured() || sending || !queue.length || !navigator.onLine) return;
    sending = true;
    const batch = queue.slice(0, 50);
    try {
      const response = await fetch(base() + 'mathe9_events', {
        method: 'POST', headers: headers(), body: JSON.stringify(batch), keepalive: true
      });
      if (!response.ok) throw new Error('Tracking HTTP ' + response.status);
      queue.splice(0, batch.length);
      writeJson(QUEUE_KEY, queue);
      if (queue.length) scheduleFlush(250);
    } catch (error) {
      console.warn('[Mathe9 tracker] Versand fehlgeschlagen:', error.message);
    } finally { sending = false; }
  }
  async function progress(snapshot = {}) {
    currentContext = { ...currentContext, ...snapshot };
    if (!configured()) { console.debug('[Mathe9 progress]', snapshot); return; }

    const student = studentRecord();
    if (!student?.student_id) {
      console.warn('[Mathe9 progress] Kein gültiger Schüler angemeldet.');
      return;
    }

    const row = {
      ...common(),
      current_task: snapshot.task ?? currentContext.task ?? null,
      completed_tasks: wholeNumber(snapshot.completed, 0),
      total_tasks: wholeNumber(snapshot.total, 0),
      progress_percent: percentage(snapshot.percent),
      correct_count: wholeNumber(snapshot.correct, 0),
      attempts_count: wholeNumber(snapshot.attempts, 0),
      status: snapshot.status === 'completed' ? 'completed' : 'active',
      updated_at: new Date().toISOString()
    };
    delete row.task;

    try {
      const q = new URLSearchParams({ on_conflict: 'student_id,unit,path' });
      const response = await fetch(base() + 'mathe9_progress?' + q, {
        method: 'POST',
        headers: headers('resolution=merge-duplicates,return=minimal'),
        body: JSON.stringify(row),
        keepalive: true
      });
      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Progress HTTP ${response.status}${details ? `: ${details}` : ''}`);
      }
    } catch (error) {
      console.warn('[Mathe9 progress]', error.message);
    }
  }
  function setContext(context = {}) { currentContext = { ...currentContext, ...context }; }
  function heartbeat(reason = 'interval') {
    const idleSeconds = Math.round((Date.now() - lastInteraction) / 1000);
    if (document.visibilityState !== 'visible') return;
    enqueue('heartbeat', { reason, idle_seconds: idleSeconds, progress: currentContext.progress });
  }
  function interaction(kind) {
    lastInteraction = Date.now();
    if (kind) currentContext.lastInteraction = kind;
  }
  function start() {
    ['pointerdown', 'keydown', 'input', 'touchstart'].forEach(type =>
      addEventListener(type, () => interaction(type), { passive: true }));
    addEventListener('online', flush);
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') heartbeat('visible');
      else enqueue('visibility', { state: 'hidden' });
    });
    addEventListener('pagehide', () => { enqueue('session_end', {}); flush(); });
    enqueue('session_start', { referrer: document.referrer || null });
    const seconds = Math.max(10, Number(TRACKER_CONFIG.heartbeatSeconds) || 20);
    heartbeatTimer = setInterval(() => heartbeat('interval'), seconds * 1000);
    flush();
  }
  return { start, track: enqueue, progress, setContext, flush, heartbeat, studentName };
})();

/* Für Entwicklermenü und Diagnose explizit freigeben. */
window.Tracker = Tracker;

/* Rückwärtskompatibel für engine.js und spiral.js */
function track(event) {
  const { unit, task, path, step, correct, misconception, hints_used, attempts, duration_ms, ...extra } = event;
  Tracker.setContext({ unit, task, path });
  Tracker.track('answer', { step, correct, misconception, hints_used, attempts, duration_ms, ...extra });
}

document.addEventListener('DOMContentLoaded', () => {
  const ready = window.MATHE9_STUDENT_READY || Promise.resolve();
  ready.then(() => Tracker.start()).catch(error =>
    console.warn('[Mathe9 tracker] Anmeldung nicht bereit:', error));
}, { once: true });
