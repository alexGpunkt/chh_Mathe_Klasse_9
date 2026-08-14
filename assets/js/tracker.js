/* ============================================================
   tracker.js · Aktivität, Antworten und Lernfortschritt

   - stabile anonyme Geräte-ID
   - neue Sitzungs-ID pro Browser-Tab
   - Heartbeat nur bei sichtbarer Seite
   - Ereignisse werden gebündelt versendet
   - Netzfehler werden lokal zwischengespeichert
   - Fortschritt wird per Upsert gespeichert
   ============================================================ */

const TRACKER_CONFIG = Object.assign(
  {
    url: '',
    anonKey: '',
    enabled: false,
    heartbeatSeconds: 20,
    classCode: '9'
  },
  window.MATHE9_SUPABASE || {}
);

const Tracker = (() => {
  const QUEUE_KEY = 'mathe9.tracker.queue.v2';
  const SYNC_KEY = 'mathe9.tracker.sync';
  const DEVICE_KEY = 'mathe9.device_id';
  const SESSION_KEY = 'mathe9.session_id';
  const MAX_QUEUE = 500;

  let queue = readJson(QUEUE_KEY, []);
  let flushTimer = null;
  let heartbeatTimer = null;
  let lastInteraction = Date.now();
  let sending = false;
  /*
   * Für die Betriebsdiagnose: Wie viel liegt noch hier,
   * wann ging zuletzt etwas durch, und woran hakt es?
   */
  let lastError = null;

  /* ---------- Ping-Gesundheit ----------
     Die Beameransicht soll auf einen Blick zeigen, wessen Gerät gerade
     nicht durchkommt. Dafür zählt das Gerät seine eigenen erfolglosen
     Sendeversuche mit und hängt den Stand an jeden Herzschlag.

     Wichtig zu wissen: Diese Zahl erreicht das Dashboard erst, wenn wieder
     etwas durchgeht. Ein Gerät ohne Netz kann nicht melden, dass es kein
     Netz hat. Die verlässliche Größe bleibt deshalb die serverseitige:
     wie lange der letzte angekommene Ping her ist. Der Zähler ergänzt sie
     um die Vorgeschichte — kurze Aussetzer werden dadurch sichtbar, die
     sonst zwischen zwei Herzschlägen verschwinden. */
  let sendeFehler = 0;
  let fehlerSeitLetztemErfolg = 0;
  let letzterErfolg = null;

  /* ---------- Dauersendung des Fortschritts ----------
     Bis V33 ging eine Fortschrittszeile nur bei Pfadwahl, Wiederaufnahme
     und richtiger Antwort raus. Wer zehn Minuten an derselben Aufgabe saß,
     stand im Dashboard mit einem zehn Minuten alten Stand — und in der
     Beameransicht wäre das Strichmännchen stehengeblieben, ohne dass
     erkennbar war, ob das Kind arbeitet oder das Gerät weg ist.

     Deshalb wird der zuletzt gemeldete Stand im Takt erneut gesendet.
     Das ist bewusst ein Upsert auf dieselbe Zeile: Es entsteht kein
     Datenberg, nur ein frisches updated_at. */
  const FORTSCHRITT_TAKT_MS = 20000;
  let letzterFortschritt = null;
  let letzteFortschrittsSendung = 0;
  let fortschrittTimer = null;

  let currentContext = {
    page: pageName(),
    unit: null,
    path: null,
    task: null,
    progress: null
  };

  function uuid() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      character => {
        const random = Math.random() * 16 | 0;

        const value =
          character === 'x'
            ? random
            : (random & 0x3) | 0x8;

        return value.toString(16);
      }
    );
  }

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch {
      /*
       * Die Lernanwendung soll auch dann weiterlaufen,
       * wenn der lokale Speicher voll oder gesperrt ist.
       */
    }
  }

  function getOrCreate(key, sessionOnly = false) {
    const storage = sessionOnly
      ? sessionStorage
      : localStorage;

    try {
      let id = storage.getItem(key);

      if (!id) {
        id = uuid();
        storage.setItem(key, id);
      }

      return id;
    } catch {
      return uuid();
    }
  }

  function studentRecord() {
    try {
      const saved = JSON.parse(
        localStorage.getItem('mathe9.student') || 'null'
      );

      return saved?.student_id
        ? saved
        : null;
    } catch {
      return null;
    }
  }

  function studentName() {
    const student = studentRecord();

    return (
      student?.display_name ||
      student?.login_name ||
      'anonym'
    );
  }

  function pageName() {
    const file =
      location.pathname
        .split('/')
        .pop() ||
      'index.html';

    return (
      file.replace('.html', '') ||
      'index'
    );
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
    const key = String(
      TRACKER_CONFIG.anonKey || ''
    ).trim();

    const result = {
      'Content-Type': 'application/json',
      apikey: key,
      Prefer: prefer
    };

    /*
     * Klassische Supabase-Anon-Keys benötigen zusätzlich
     * den Authorization-Header.
     */
    if (
      key &&
      !key.startsWith('sb_publishable_')
    ) {
      result.Authorization = `Bearer ${key}`;
    }

    /*
     * Sitzungstoken der Schüleranmeldung. Die Datenbank lässt einen
     * Schreibzugriff nur für genau das Kind zu, dessen Token mitkommt —
     * der anon-Key allein genügt nicht mehr.
     */
    const token =
      (window.Mathe9StudentLogin &&
        typeof window.Mathe9StudentLogin.token === 'function' &&
        window.Mathe9StudentLogin.token()) ||
      window.MATHE9_TOKEN ||
      null;

    if (token) {
      result['x-mathe9-token'] = token;
    }

    return result;
  }

  function base() {
    return (
      String(TRACKER_CONFIG.url)
        .replace(/\/$/, '') +
      '/rest/v1/'
    );
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
      student_id:
        student?.student_id ||
        null,

      student:
        studentName(),

      device_id:
        getOrCreate(DEVICE_KEY),

      session_id:
        getOrCreate(
          SESSION_KEY,
          true
        ),

      class_code:
        student?.class_code ||
        TRACKER_CONFIG.classCode ||
        null,

      page:
        currentContext.page,

      unit:
        currentContext.unit,

      path:
        currentContext.path,

      task:
        currentContext.task,

      ts:
        new Date().toISOString()
    };
  }

  function enqueue(type, payload = {}) {
    /* Die Aufgaben-Sitzungs-ID reist in der Nutzlast mit — so braucht es
       keine Änderung am Tabellenschema, und die Auswertung bleibt trotzdem
       eindeutig, wenn Ereignisse verspätet, doppelt oder aus einem zweiten
       Tab eintreffen. Ein Index auf diesen Schlüssel steht in setup.sql. */
    const angereichert = currentContext.task_session_id
      ? { task_session_id: currentContext.task_session_id, ...payload }
      : payload;

    const event = {
      event_type: type,
      ...common(),
      payload: angereichert
    };

    if (!configured()) {
      console.debug(
        '[Mathe9 tracker]',
        event
      );

      return;
    }

    if (!event.student_id) {
      console.warn(
        '[Mathe9 tracker] Kein gültiger Schüler angemeldet.'
      );

      return;
    }

    queue.push(event);

    if (queue.length > MAX_QUEUE) {
      queue = queue.slice(-MAX_QUEUE);
    }

    writeJson(
      QUEUE_KEY,
      queue
    );

    scheduleFlush(
      type === 'answer'
        ? 400
        : 1800
    );
  }

  function scheduleFlush(delay) {
    clearTimeout(flushTimer);

    flushTimer = setTimeout(
      flush,
      delay
    );
  }

  async function schreibTokenSichern(force = false) {
    const login = window.Mathe9StudentLogin;
    if (!login || typeof login.ensureToken !== 'function') {
      return Boolean(headers()['x-mathe9-token']);
    }
    const token = await login.ensureToken({ force });
    return Boolean(token);
  }

  async function flush() {
    if (
      !configured() ||
      sending ||
      !queue.length ||
      !navigator.onLine
    ) {
      return;
    }

    sending = true;

    const batch = queue.slice(0, 50);

    try {
      if (!await schreibTokenSichern()) {
        throw new Error('Kein gültiges Schüler-Sitzungstoken. Die Daten bleiben in der Offline-Warteschlange.');
      }
      let response = await fetch(
        base() + 'mathe9_events',
        {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(batch),
          keepalive: true
        }
      );
      if ((response.status === 401 || response.status === 403) && await schreibTokenSichern(true)) {
        response = await fetch(base() + 'mathe9_events', {
          method: 'POST', headers: headers(), body: JSON.stringify(batch), keepalive: true
        });
      }

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Tracking HTTP ${response.status}` +
          (
            details
              ? `: ${details}`
              : ''
          )
        );
      }

      queue.splice(
        0,
        batch.length
      );

      writeJson(
        QUEUE_KEY,
        queue
      );

      lastError = null;
      letzterErfolg = Date.now();
      fehlerSeitLetztemErfolg = sendeFehler;
      sendeFehler = 0;

      writeJson(
        SYNC_KEY,
        new Date().toISOString()
      );

      if (queue.length) {
        scheduleFlush(250);
      }
    } catch (error) {
      lastError = error.message;
      sendeFehler++;

      console.warn(
        '[Mathe9 tracker] Versand fehlgeschlagen:',
        error.message
      );
    } finally {
      sending = false;
    }
  }

  /*
   * Zustand des Versands — für das Entwicklermenü und den
   * Diagnosebericht. Bewusst nur Zählwerte und Zeitpunkte:
   * Der Inhalt der Warteschlange gehört nicht in einen Bericht,
   * der weitergegeben wird.
   */
  function status() {
    return {
      konfiguriert: configured(),
      online: navigator.onLine,
      wartend: queue.length,
      aeltestes: queue[0]?.ts || null,
      zuletzt_gesendet: readJson(SYNC_KEY, null),
      letzter_fehler: lastError,
      ...pingZustand(),
      fortschritt_gemerkt: letzterFortschritt
        ? `${letzterFortschritt.unit} ${letzterFortschritt.path} · ${letzterFortschritt.percent} %`
        : null,
      fortschritt_gesendet_vor_ms: letzteFortschrittsSendung
        ? Date.now() - letzteFortschrittsSendung
        : null
    };
  }

  /* Ob sich am gemeldeten Stand etwas geändert hat. Nur dafür lohnt ein
     Schreibzugriff außer der Reihe; für die Frische sorgt der Takt. */
  function fortschrittGleich(a, b) {
    if (!a || !b) return false;
    return ['unit', 'path', 'task', 'completed', 'total', 'percent', 'correct', 'attempts', 'status']
      .every(feld => a[feld] === b[feld]);
  }

  async function progress(snapshot = {}) {
    currentContext = {
      ...currentContext,
      ...snapshot
    };

    /* Den Stand merken, auch wenn gerade nichts gesendet werden kann —
       der Takt holt es nach, sobald wieder Netz da ist. */
    if (snapshot && Object.keys(snapshot).length) {
      letzterFortschritt = {
        unit: snapshot.unit ?? letzterFortschritt?.unit ?? currentContext.unit ?? null,
        path: snapshot.path ?? letzterFortschritt?.path ?? currentContext.path ?? null,
        task: snapshot.task ?? null,
        completed: snapshot.completed ?? letzterFortschritt?.completed ?? 0,
        total: snapshot.total ?? letzterFortschritt?.total ?? 0,
        percent: snapshot.percent ?? letzterFortschritt?.percent ?? 0,
        correct: snapshot.correct ?? letzterFortschritt?.correct ?? 0,
        attempts: snapshot.attempts ?? letzterFortschritt?.attempts ?? 0,
        status: snapshot.status ?? letzterFortschritt?.status ?? 'active'
      };
    }

    if (!configured()) {
      console.debug(
        '[Mathe9 progress]',
        snapshot
      );

      return;
    }

    const student = studentRecord();

    if (!student?.student_id) {
      console.warn(
        '[Mathe9 progress] Kein gültiger Schüler angemeldet.'
      );

      return;
    }

    /*
     * Gesendet wird immer der gemerkte Gesamtstand, nicht der übergebene
     * Ausschnitt. Der Takt ruft progress() ohne Argumente auf — würde die
     * Zeile aus dem leeren Ausschnitt gebaut, schriebe er alle Zählwerte
     * auf null und das Dashboard sähe einen Rückschritt.
     */
    const stand = letzterFortschritt || {};

    const row = {
      ...common(),

      unit:
        stand.unit ??
        currentContext.unit ??
        null,

      path:
        stand.path ??
        currentContext.path ??
        '',

      current_task:
        stand.task ??
        currentContext.task ??
        null,

      completed_tasks:
        wholeNumber(
          stand.completed,
          0
        ),

      total_tasks:
        wholeNumber(
          stand.total,
          0
        ),

      progress_percent:
        percentage(
          stand.percent
        ),

      correct_count:
        wholeNumber(
          stand.correct,
          0
        ),

      attempts_count:
        wholeNumber(
          stand.attempts,
          0
        ),

      status:
        stand.status === 'completed'
          ? 'completed'
          : 'active',

      updated_at:
        new Date().toISOString()
    };

    /*
     * Ohne Einheit gibt es nichts zu melden — mathe9_progress.unit ist
     * NOT NULL, und eine Zeile ohne Einheit wäre im Dashboard ohnehin
     * nicht zuzuordnen.
     */
    if (!row.unit) return;

    /*
     * common() liefert das Ereignisfeld "task".
     * In mathe9_progress heißt dieses Feld "current_task".
     */
    delete row.task;

    try {
      if (!await schreibTokenSichern()) {
        throw new Error('Kein gültiges Schüler-Sitzungstoken. Der Fortschritt wird später erneut gesendet.');
      }
      const query = new URLSearchParams({
        on_conflict:
          'student_id,unit,path'
      });

      const ziel = base() + 'mathe9_progress?' + query;
      const optionen = () => ({
        method: 'POST',
        headers: headers('resolution=merge-duplicates,return=minimal'),
        body: JSON.stringify(row),
        keepalive: true
      });
      let response = await fetch(ziel, optionen());
      if ((response.status === 401 || response.status === 403) && await schreibTokenSichern(true)) {
        response = await fetch(ziel, optionen());
      }

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          `Progress HTTP ${response.status}` +
          (
            details
              ? `: ${details}`
              : ''
          )
        );
      }

      letzteFortschrittsSendung = Date.now();
      letzterErfolg = Date.now();
      fehlerSeitLetztemErfolg = sendeFehler;
      sendeFehler = 0;
    } catch (error) {
      sendeFehler++;

      console.warn(
        '[Mathe9 progress]',
        error.message
      );
    }
  }

  /* ---------- Fortschritt im Takt nachsenden ----------
     Läuft nur bei sichtbarer Seite: Ein Tab im Hintergrund arbeitet nicht,
     und ein Strichmännchen, das für ein weggelegtes Gerät weiterläuft,
     wäre eine Falschaussage. Genau dafür ist der Ping-Status da. */
  function fortschrittTakt() {
    if (!letzterFortschritt) return;
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - letzteFortschrittsSendung < FORTSCHRITT_TAKT_MS - 1000) return;
    progress({});
  }

  /* Meldet denselben Stand sofort, wenn er sich geändert hat — sonst
     überlässt es dem Takt. So kostet ein Aufgabenwechsel einen Schreib-
     zugriff, ein Tastendruck aber keinen. */
  function progressWennNeu(snapshot = {}) {
    const vorher = letzterFortschritt;
    const gleich = fortschrittGleich(vorher, {
      unit: snapshot.unit ?? vorher?.unit ?? null,
      path: snapshot.path ?? vorher?.path ?? null,
      task: snapshot.task ?? null,
      completed: snapshot.completed ?? vorher?.completed ?? 0,
      total: snapshot.total ?? vorher?.total ?? 0,
      percent: snapshot.percent ?? vorher?.percent ?? 0,
      correct: snapshot.correct ?? vorher?.correct ?? 0,
      attempts: snapshot.attempts ?? vorher?.attempts ?? 0,
      status: snapshot.status ?? vorher?.status ?? 'active'
    });
    if (gleich) return Promise.resolve();
    return progress(snapshot);
  }

  function pingZustand() {
    return {
      ping_fails: sendeFehler,
      ping_fails_vorher: fehlerSeitLetztemErfolg,
      queue_pending: queue.length,
      seit_erfolg_ms: letzterErfolg ? Date.now() - letzterErfolg : null
    };
  }

  function setContext(context = {}) {
    currentContext = {
      ...currentContext,
      ...context
    };
    if (Object.prototype.hasOwnProperty.call(context, 'task') && context.task == null &&
        !Object.prototype.hasOwnProperty.call(context, 'task_session_id')) {
      currentContext.task_session_id = null;
    }
  }

  function heartbeat(reason = 'interval') {
    const idleSeconds = Math.round(
      (
        Date.now() -
        lastInteraction
      ) / 1000
    );

    if (
      document.visibilityState !==
      'visible'
    ) {
      return;
    }

    enqueue(
      'heartbeat',
      {
        reason,
        idle_seconds: idleSeconds,
        progress:
          currentContext.progress,

        ...pingZustand()
      }
    );

    /* Der Herzschlag ist auch der Auslöser für die Dauersendung des
       Fortschritts. Beides im selben Takt zu halten heißt: Wenn im
       Dashboard ein Ping ankommt, ist der Fortschritt daneben genauso alt. */
    fortschrittTakt();
  }

  function interaction(kind) {
    lastInteraction = Date.now();

    if (kind) {
      currentContext.lastInteraction = kind;
    }
  }

  function start() {
    [
      'pointerdown',
      'keydown',
      'input',
      'touchstart'
    ].forEach(type => {
      addEventListener(
        type,
        () => interaction(type),
        {
          passive: true
        }
      );
    });

    addEventListener(
      'online',
      () => flush()
    );

    addEventListener(
      'visibilitychange',
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          heartbeat('visible');
        } else {
          enqueue(
            'visibility',
            {
              state: 'hidden'
            }
          );
        }
      }
    );

    addEventListener(
      'pagehide',
      () => {
        enqueue(
          'session_end',
          {}
        );

        flush();
      }
    );

    enqueue(
      'session_start',
      {
        referrer:
          document.referrer ||
          null
      }
    );

    const seconds = Math.max(
      10,
      Number(
        TRACKER_CONFIG
          .heartbeatSeconds
      ) || 20
    );

    heartbeatTimer = setInterval(
      () => heartbeat('interval'),
      seconds * 1000
    );

    /* Eigener Takt neben dem Herzschlag: Der Herzschlag kann länger
       ausfallen als der Fortschritt alt werden darf, wenn heartbeatSeconds
       hochgesetzt wird. */
    fortschrittTimer = setInterval(
      fortschrittTakt,
      FORTSCHRITT_TAKT_MS
    );

    /* Beim Verlassen der Seite den letzten Stand mitnehmen. Ohne das
       stünde im Dashboard der Stand von vor bis zu 20 Sekunden. */
    addEventListener(
      'pagehide',
      () => {
        if (letzterFortschritt) progress({});
      }
    );

    flush();
  }

  return {
    start,
    track: enqueue,
    progress,
    progressWennNeu,
    setContext,
    flush,
    heartbeat,
    status,
    pingZustand,
    studentName
  };
})();

/*
 * Für das Entwicklermenü und Diagnosezwecke freigeben.
 */
window.Tracker = Tracker;

/*
 * Rückwärtskompatible Funktion für engine.js und spiral.js.
 */
function track(event) {
  const {
    unit,
    task,
    path,
    step,
    correct,
    misconception,
    hints_used,
    attempts,
    duration_ms,
    ...extra
  } = event;

  Tracker.setContext({
    unit,
    task,
    path
  });

  Tracker.track(
    'answer',
    {
      step,
      correct,
      misconception,
      hints_used,
      attempts,
      duration_ms,
      ...extra
    }
  );
}

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const ready =
      window.MATHE9_STUDENT_READY ||
      Promise.resolve();

    ready
      .then(() => {
        Tracker.start();
      })
      .catch(error => {
        console.warn(
          '[Mathe9 tracker] Anmeldung nicht bereit:',
          error
        );
      });
  },
  {
    once: true
  }
);
