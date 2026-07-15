'use strict';

const CONFIG = window.MATHE9_SUPABASE || {};
const $ = selector => document.querySelector(selector);

const REFRESH_INTERVAL_MS = 5000;
const ACTIVE_THRESHOLD_MS = 60000;
const MAX_PROGRESS_ROWS = 500;
const MAX_EVENT_ROWS = 2000;

let refreshTimer = null;
let requestRunning = false;

/**
 * Erstellt die benötigten Header für die Supabase REST API.
 *
 * Unterstützt:
 * - Legacy anon JWT: eyJ...
 * - neuen Publishable Key: sb_publishable_...
 */
function createHeaders() {
  const key = String(CONFIG.anonKey || '').trim();

  const headers = {
    apikey: key,
    Accept: 'application/json'
  };

  /*
   * Ein Legacy-anon-Key ist ein JWT und kann als Bearer-Token
   * verwendet werden. Ein neuer sb_publishable_-Key wird nur
   * im apikey-Header übertragen.
   */
  if (key && !key.startsWith('sb_publishable_')) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

/**
 * Liefert die Basisadresse der Supabase REST API.
 */
function getRestBaseUrl() {
  const url = String(CONFIG.url || '').trim().replace(/\/+$/, '');
  return `${url}/rest/v1/`;
}

/**
 * Wandelt einen Zeitstempel in eine kurze deutsche Zeitangabe um.
 */
function formatTimeAgo(isoDate) {
  if (!isoDate) {
    return '–';
  }

  const timestamp = new Date(isoDate).getTime();

  if (!Number.isFinite(timestamp)) {
    return '–';
  }

  const seconds = Math.max(
    0,
    Math.round((Date.now() - timestamp) / 1000)
  );

  if (seconds < 10) {
    return 'gerade eben';
  }

  if (seconds < 60) {
    return `${seconds} s`;
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h`;
  }

  return `${Math.floor(seconds / 86400)} Tg.`;
}

/**
 * Verhindert, dass Daten aus Supabase ungefiltert als HTML
 * in die Seite eingefügt werden.
 */
function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );
}

/**
 * Begrenzt eine Zahl auf einen vorgegebenen Bereich.
 */
function clamp(value, minimum, maximum) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.min(maximum, Math.max(minimum, number));
}

/**
 * Liest ein payload-Feld zuverlässig als Objekt.
 *
 * Supabase liefert jsonb normalerweise bereits als Objekt.
 * Diese Funktion unterstützt zusätzlich versehentlich als String
 * gespeicherte JSON-Daten.
 */
function parsePayload(payload) {
  if (!payload) {
    return {};
  }

  if (typeof payload === 'object') {
    return payload;
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      return {};
    }
  }

  return {};
}

/**
 * Führt eine GET-Anfrage an Supabase aus.
 */
async function supabaseGet(path) {
  const response = await fetch(`${getRestBaseUrl()}${path}`, {
    method: 'GET',
    headers: createHeaders(),
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = '';

    try {
      const body = await response.text();
      message = body.trim();
    } catch (error) {
      message = '';
    }

    throw new Error(
      message || `HTTP ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Prüft, ob die Supabase-Konfiguration vollständig ist.
 */
function validateConfiguration() {
  if (!CONFIG.enabled) {
    return 'Supabase ist in assets/js/supabase-config.js deaktiviert.';
  }

  if (!String(CONFIG.url || '').trim()) {
    return 'In assets/js/supabase-config.js fehlt die Supabase-Projekt-URL.';
  }

  if (!String(CONFIG.anonKey || '').trim()) {
    return 'In assets/js/supabase-config.js fehlt der öffentliche API-Key.';
  }

  return '';
}

/**
 * Erstellt einen URL-Filter für die Klasse.
 */
function buildClassFilter(classCode) {
  const value = String(classCode || '').trim();

  if (!value) {
    return '';
  }

  return `&class_code=eq.${encodeURIComponent(value)}`;
}

/**
 * Liefert für jedes Gerät das zeitlich jüngste Ereignis.
 *
 * Dadurch basiert die Aktivitätsanzeige auf Heartbeats und anderen
 * aktuellen Ereignissen und nicht nur auf Fortschrittsänderungen.
 */
function getLatestEventByDevice(events) {
  const latestEvents = new Map();

  events.forEach(event => {
    if (!event.device_id || !event.ts) {
      return;
    }

    const existing = latestEvents.get(event.device_id);

    if (
      !existing ||
      new Date(event.ts).getTime() > new Date(existing.ts).getTime()
    ) {
      latestEvents.set(event.device_id, event);
    }
  });

  return latestEvents;
}

/**
 * Liefert für jede Kombination aus Gerät, Einheit und Pfad
 * den neuesten Fortschrittsdatensatz.
 */
function getLatestProgressRows(progressRows) {
  const latestProgress = new Map();

  progressRows.forEach(row => {
    const key = [
      row.device_id || '',
      row.unit || '',
      row.path || ''
    ].join('|');

    const existing = latestProgress.get(key);

    if (
      !existing ||
      new Date(row.updated_at || row.ts).getTime() >
        new Date(existing.updated_at || existing.ts).getTime()
    ) {
      latestProgress.set(key, row);
    }
  });

  return [...latestProgress.values()];
}

/**
 * Prüft, ob ein Gerät innerhalb der letzten 60 Sekunden
 * ein Ereignis gesendet hat.
 */
function isDeviceActive(deviceId, latestEventsByDevice) {
  const latestEvent = latestEventsByDevice.get(deviceId);

  if (!latestEvent || !latestEvent.ts) {
    return false;
  }

  const age = Date.now() - new Date(latestEvent.ts).getTime();

  return age >= 0 && age < ACTIVE_THRESHOLD_MS;
}

/**
 * Bestimmt den besten Zeitstempel für die Anzeige
 * "zuletzt aktiv".
 */
function getLastActivityTimestamp(progressRow, latestEventsByDevice) {
  const latestEvent = latestEventsByDevice.get(progressRow.device_id);

  if (latestEvent?.ts) {
    return latestEvent.ts;
  }

  return progressRow.updated_at || progressRow.ts || null;
}

/**
 * Lädt alle Dashboard-Daten.
 */
async function loadDashboard() {
  if (requestRunning) {
    return;
  }

  const configurationError = validateConfiguration();

  if (configurationError) {
    showError(configurationError);
    setConnectionStatus(false, 'nicht verbunden');
    return;
  }

  requestRunning = true;

  const refreshButton = $('#refresh');

  if (refreshButton) {
    refreshButton.disabled = true;
  }

  try {
    const rangeMinutes = Number($('#range')?.value || 1440);
    const since = new Date(
      Date.now() - rangeMinutes * 60 * 1000
    ).toISOString();

    const classCode = $('#classFilter')?.value || '';
    const classFilter = buildClassFilter(classCode);

    const progressPath =
      `mathe9_progress` +
      `?select=*` +
      `&updated_at=gte.${encodeURIComponent(since)}` +
      classFilter +
      `&order=updated_at.desc` +
      `&limit=${MAX_PROGRESS_ROWS}`;

    const eventsPath =
      `mathe9_events` +
      `?select=*` +
      `&ts=gte.${encodeURIComponent(since)}` +
      classFilter +
      `&order=ts.desc` +
      `&limit=${MAX_EVENT_ROWS}`;

    const [progressRows, eventRows] = await Promise.all([
      supabaseGet(progressPath),
      supabaseGet(eventsPath)
    ]);

    renderDashboard(progressRows, eventRows);

    setConnectionStatus(
      true,
      `live · ${new Date().toLocaleTimeString('de-DE')}`
    );

    hideError();
  } catch (error) {
    console.error('[Mathe9 Dashboard]', error);

    showError(
      `Dashboard konnte die Supabase-Daten nicht laden: ${error.message}`
    );

    setConnectionStatus(false, 'Verbindungsfehler');
  } finally {
    requestRunning = false;

    if (refreshButton) {
      refreshButton.disabled = false;
    }
  }
}

/**
 * Aktualisiert sämtliche Dashboard-Bereiche.
 */
function renderDashboard(progressRows, eventRows) {
  const progress = Array.isArray(progressRows) ? progressRows : [];
  const events = Array.isArray(eventRows) ? eventRows : [];

  const latestEventsByDevice = getLatestEventByDevice(events);
  const latestProgressRows = getLatestProgressRows(progress);

  renderKeyFigures(
    latestProgressRows,
    events,
    latestEventsByDevice
  );

  renderStudentsTable(
    latestProgressRows,
    latestEventsByDevice
  );

  renderMisconceptions(events);
  renderAnswerFeed(events);
}

/**
 * Zeigt die vier Kennzahlen im oberen Bereich an.
 */
function renderKeyFigures(
  progressRows,
  events,
  latestEventsByDevice
) {
  const activeDeviceIds = new Set();

  latestEventsByDevice.forEach((event, deviceId) => {
    if (isDeviceActive(deviceId, latestEventsByDevice)) {
      activeDeviceIds.add(deviceId);
    }
  });

  /*
   * Für die Geräteanzahl berücksichtigen wir sowohl Ereignisse
   * als auch Fortschrittsdatensätze. Dadurch bleiben Geräte sichtbar,
   * selbst wenn in einem Zeitraum nur Fortschrittsdaten vorhanden sind.
   */
  const allDeviceIds = new Set();

  events.forEach(event => {
    if (event.device_id) {
      allDeviceIds.add(event.device_id);
    }
  });

  progressRows.forEach(row => {
    if (row.device_id) {
      allDeviceIds.add(row.device_id);
    }
  });

  const answerEvents = events.filter(
    event => event.event_type === 'answer'
  );

  const correctAnswers = answerEvents.filter(event => {
    const payload = parsePayload(event.payload);
    return payload.correct === true;
  }).length;

  $('#activeNow').textContent = String(activeDeviceIds.size);
  $('#studentsToday').textContent = String(allDeviceIds.size);
  $('#answers').textContent = String(answerEvents.length);

  $('#correctRate').textContent = answerEvents.length
    ? `${Math.round(
        (correctAnswers / answerEvents.length) * 100
      )} %`
    : '–';
}

/**
 * Rendert die Tabelle mit Schüleraktivität und Lernfortschritt.
 */
function renderStudentsTable(progressRows, latestEventsByDevice) {
  const tableBody = $('#studentsBody');

  if (!tableBody) {
    return;
  }

  if (!progressRows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="muted">
          Noch keine Fortschrittsdaten im gewählten Zeitraum.
        </td>
      </tr>
    `;
    return;
  }

  /*
   * Aktive Geräte zuerst, danach nach jüngster Aktivität.
   */
  const sortedRows = [...progressRows].sort((a, b) => {
    const activeA = isDeviceActive(
      a.device_id,
      latestEventsByDevice
    );

    const activeB = isDeviceActive(
      b.device_id,
      latestEventsByDevice
    );

    if (activeA !== activeB) {
      return activeA ? -1 : 1;
    }

    const timeA = new Date(
      getLastActivityTimestamp(a, latestEventsByDevice) || 0
    ).getTime();

    const timeB = new Date(
      getLastActivityTimestamp(b, latestEventsByDevice) || 0
    ).getTime();

    return timeB - timeA;
  });

  tableBody.innerHTML = sortedRows.map(row => {
    const active = isDeviceActive(
      row.device_id,
      latestEventsByDevice
    );

    const progressPercent = clamp(
      row.progress_percent,
      0,
      100
    );

    const completedTasks = Math.max(
      0,
      Number(row.completed_tasks) || 0
    );

    const totalTasks = Math.max(
      0,
      Number(row.total_tasks) || 0
    );

    const lastActivity = getLastActivityTimestamp(
      row,
      latestEventsByDevice
    );

    const studentName = row.student || 'anonym';
    const unit = row.unit || '–';
    const path = row.path || '–';
    const currentTask = row.current_task || '–';

    return `
      <tr>
        <td>
          <span class="badge">
            <i class="dot ${active ? 'active' : ''}"></i>
            ${active ? 'aktiv' : 'inaktiv'}
          </span>
        </td>

        <td>${escapeHtml(studentName)}</td>

        <td>${escapeHtml(unit)}</td>

        <td>${escapeHtml(path)}</td>

        <td>
          <div
            class="progress"
            role="progressbar"
            aria-label="Lernfortschritt"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${progressPercent}"
          >
            <i style="width: ${progressPercent}%"></i>
          </div>

          <small>
            ${completedTasks}/${totalTasks}
            · ${progressPercent} %
          </small>
        </td>

        <td>${escapeHtml(currentTask)}</td>

        <td title="${escapeHtml(lastActivity || '')}">
          ${formatTimeAgo(lastActivity)}
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Rendert die häufigsten diagnostizierten Fehlvorstellungen.
 */
function renderMisconceptions(events) {
  const container = $('#misconceptions');

  if (!container) {
    return;
  }

  const misconceptions = {};

  events
    .filter(event => event.event_type === 'answer')
    .forEach(event => {
      const payload = parsePayload(event.payload);
      const misconception = String(
        payload.misconception || ''
      ).trim();

      if (!misconception) {
        return;
      }

      misconceptions[misconception] =
        (misconceptions[misconception] || 0) + 1;
    });

  const sorted = Object.entries(misconceptions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!sorted.length) {
    container.innerHTML = `
      <p class="muted">
        Noch keine diagnostizierten Denkfehler.
      </p>
    `;
    return;
  }

  const maximum = sorted[0][1] || 1;

  container.innerHTML = sorted.map(
    ([misconception, count]) => `
      <div class="bar">
        <span>${escapeHtml(misconception)}</span>

        <div class="barTrack">
          <i style="width: ${(count / maximum) * 100}%"></i>
        </div>

        <b>${count}</b>
      </div>
    `
  ).join('');
}

/**
 * Rendert die letzten Antwortereignisse.
 */
function renderAnswerFeed(events) {
  const feed = $('#feed');

  if (!feed) {
    return;
  }

  const answerEvents = events
    .filter(event => event.event_type === 'answer')
    .sort(
      (a, b) =>
        new Date(b.ts).getTime() - new Date(a.ts).getTime()
    )
    .slice(0, 20);

  if (!answerEvents.length) {
    feed.innerHTML = `
      <p class="muted">
        Noch keine Antworten.
      </p>
    `;
    return;
  }

  feed.innerHTML = answerEvents.map(event => {
    const payload = parsePayload(event.payload);
    const correct = payload.correct === true;

    const attempts = Math.max(
      1,
      Number(payload.attempts) || 1
    );

    const misconception = String(
      payload.misconception || ''
    ).trim();

    const student = event.student || 'anonym';
    const unit = event.unit || '–';
    const task = event.task || '–';

    return `
      <div class="feedItem">
        <b class="${correct ? 'ok' : 'no'}">
          ${correct ? 'richtig' : 'noch falsch'}
        </b>

        · ${escapeHtml(student)}
        · ${escapeHtml(unit)}
        / ${escapeHtml(task)}

        <br>

        <span class="muted">
          ${formatTimeAgo(event.ts)}
          · ${attempts}. Versuch
          ${
            misconception
              ? ` · ${escapeHtml(misconception)}`
              : ''
          }
        </span>
      </div>
    `;
  }).join('');
}

/**
 * Aktualisiert die Verbindungsanzeige.
 */
function setConnectionStatus(isLive, text) {
  const statusElement = document.querySelector('.status');
  const statusText = $('#statusText');

  if (statusElement) {
    statusElement.classList.toggle('live', isLive);
  }

  if (statusText) {
    statusText.textContent = text;
  }
}

/**
 * Zeigt eine Fehlermeldung an.
 */
function showError(message) {
  const errorElement = $('#error');

  if (!errorElement) {
    return;
  }

  errorElement.textContent = message;
  errorElement.hidden = false;
}

/**
 * Blendet die Fehlermeldung aus.
 */
function hideError() {
  const errorElement = $('#error');

  if (!errorElement) {
    return;
  }

  errorElement.hidden = true;
  errorElement.textContent = '';
}

/**
 * Startet die regelmäßige Aktualisierung.
 */
function startAutoRefresh() {
  stopAutoRefresh();

  refreshTimer = window.setInterval(() => {
    /*
     * Wenn das Dashboard nicht sichtbar ist, werden keine unnötigen
     * Anfragen erzeugt. Beim Zurückkehren wird sofort neu geladen.
     */
    if (document.visibilityState === 'visible') {
      loadDashboard();
    }
  }, REFRESH_INTERVAL_MS);
}

/**
 * Stoppt die regelmäßige Aktualisierung.
 */
function stopAutoRefresh() {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Ereignisse registrieren.
 */
function initializeDashboard() {
  const refreshButton = $('#refresh');
  const rangeSelect = $('#range');
  const classFilter = $('#classFilter');

  refreshButton?.addEventListener('click', loadDashboard);
  rangeSelect?.addEventListener('change', loadDashboard);
  classFilter?.addEventListener('change', loadDashboard);

  /*
   * Enter im Klassenfeld lädt die Ansicht ebenfalls neu.
   */
  classFilter?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      loadDashboard();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadDashboard();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });

  window.addEventListener('beforeunload', stopAutoRefresh);

  loadDashboard();
  startAutoRefresh();
}

initializeDashboard();
