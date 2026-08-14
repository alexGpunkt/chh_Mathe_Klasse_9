/* ============================================================
   dev-tools.js · Entwicklermenü für den develop-Branch

   Sichtbar nur, wenn MATHE9_SUPABASE.devMode === true.
   Einstellungen werden lokal im Browser gespeichert.
   Vor dem Merge nach master devMode unbedingt auf false setzen.

   Diese Datei steht seit V34 in KEINEM HTML mehr. Sie wird von
   assets/js/dev-boot.js nachgeladen, und zwar nur dann, wenn devMode
   eingeschaltet ist. Auf master wird sie nie angefordert — das spart
   9,4 KB gzip auf jeder Seite.

   Alles, was vor den übrigen Skripten laufen muss (CONFIG-Überschreibungen,
   der Testschüler), liegt deshalb in dev-boot.js und nicht mehr hier.
   Hier steht nur noch das Menü selbst.
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = window.MATHE9_SUPABASE || {};

  /* Die Helfer kommen aus dev-boot.js. Sie hier ein zweites Mal zu
     definieren hieße, zwei Fassungen desselben Testschülers zu pflegen. */
  const BOOT = window.Mathe9DevTools;
  if (!BOOT) {
    console.warn('[Mathe9 DEV] dev-boot.js fehlt — das Entwicklermenü bleibt aus.');
    return;
  }

  const {
    appUrl, readBool, writeBool, readText, writeText,
    testStudent, saveTestStudent, clearStudent
  } = BOOT;

  const IS_DASHBOARD = BOOT.istDashboard;
  const TEST_STUDENTS = BOOT.testSchueler;
  const APP_ROOT_URL = BOOT.appRootUrl;
  const enabled = BOOT.enabled;

  const FALLBACK_AREAS = [
    {
      code: 'pz',
      title: 'Prozent & Zinsrechnung',
      anchor: 'bereich-pz',
      count: 14
    },
    {
      code: 'lf',
      title: 'Lineare Funktionen',
      anchor: 'bereich-lf',
      count: 16
    },
    {
      code: 'kp',
      title: 'Körper, Prismen & Zylinder',
      anchor: 'bereich-kp',
      count: 12
    },
    {
      code: 'sk',
      title: 'Spitzkörper',
      anchor: 'bereich-sk',
      count: 12
    }
  ];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function addStyles() {
    if (document.querySelector('#m9-dev-style')) return;
    const style = document.createElement('style');
    style.id = 'm9-dev-style';
    style.textContent = `
      .m9-dev-button{position:fixed;left:10px;bottom:10px;z-index:12000;width:46px;height:46px;border:0;border-radius:50%;background:#5b2b82;color:#fff;font-size:22px;box-shadow:0 5px 22px #0005;cursor:pointer}
      .m9-dev-panel{position:fixed;left:10px;bottom:64px;z-index:12000;width:min(430px,calc(100vw - 20px));max-height:calc(100vh - 84px);overflow:auto;background:#fff;color:#172033;border:1px solid #d7dce4;border-radius:16px;box-shadow:0 16px 55px #0006;padding:16px;font:14px/1.4 system-ui,sans-serif}
      .m9-dev-panel[hidden]{display:none}
      .m9-dev-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
      .m9-dev-head h2{font-size:18px;margin:0}.m9-dev-head button{border:0;background:#eef0f4;border-radius:8px;padding:6px 9px;cursor:pointer}
      .m9-dev-warning{background:#fff4cf;border-left:4px solid #e0a800;padding:9px 10px;border-radius:7px;margin:0 0 12px}
      .m9-dev-section{border-top:1px solid #e6eaf0;padding-top:13px;margin-top:13px}
      .m9-dev-section h3{font-size:14px;margin:0 0 9px;color:#25344a}
      .m9-dev-area-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .m9-dev-area-link{display:flex;align-items:center;gap:8px;min-height:44px;border:1px solid #d9dfe7;border-radius:9px;padding:7px 9px;color:#172033;text-decoration:none;background:#f7f8fa}
      .m9-dev-area-link:hover,.m9-dev-area-link:focus-visible{border-color:#5b2b82;background:#f5effa;outline:none}
      .m9-dev-area-link[aria-current=true]{border-color:#5b2b82;background:#f1e7f8}
      .m9-dev-area-code{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:28px;border-radius:7px;background:#5b2b82;color:#fff;font-weight:800;font-size:12px}
      .m9-dev-area-link span:last-child{font-size:12px;font-weight:700;line-height:1.2}
      .m9-dev-nav-selects{display:grid;grid-template-columns:1fr 1.35fr;gap:8px;margin-top:10px}
      .m9-dev-nav-selects label{display:grid;gap:4px;font-weight:700;font-size:12px;color:#425169}
      .m9-dev-nav-selects select{width:100%;min-width:0;padding:9px;border:1px solid #bdc6d1;border-radius:8px;background:#fff;color:#172033}
      .m9-dev-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #edf0f4}.m9-dev-row:first-of-type{border-top:0}
      .m9-dev-row label{font-weight:650}.m9-dev-row small{display:block;color:#687384;font-weight:400}
      .m9-dev-row input[type=checkbox]{width:22px;height:22px}
      .m9-dev-row select{max-width:160px;padding:8px;border:1px solid #bdc6d1;border-radius:8px;background:#fff}
      .m9-dev-betrieb{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;margin:0;font-size:13px}
      .m9-dev-betrieb dt{color:#687384}.m9-dev-betrieb dd{margin:0;font-weight:650;overflow-wrap:anywhere}
      .m9-dev-betrieb dd.warn{color:#a82d20}
      .m9-dev-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.m9-dev-actions button,.m9-dev-actions a{display:flex;align-items:center;justify-content:center;min-height:44px;border:0;border-radius:9px;background:#edf1f5;color:#172033;font-weight:700;text-decoration:none;padding:8px;text-align:center;cursor:pointer}
      .m9-dev-actions .primary{background:#5b2b82;color:#fff}.m9-dev-status{margin-top:10px;min-height:20px;color:#425169}.m9-dev-status.error{color:#a82d20}.m9-dev-badge{position:fixed;left:62px;bottom:18px;z-index:11999;background:#5b2b82;color:#fff;border-radius:999px;padding:5px 9px;font:700 11px system-ui;pointer-events:none}
      @media(max-width:520px){.m9-dev-actions,.m9-dev-area-grid,.m9-dev-nav-selects{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function fallbackAreas() {
    return FALLBACK_AREAS.map(area => ({
      ...area,
      einheiten: Array.from({ length: area.count }, (_, index) => {
        const number = String(index + 1).padStart(2, '0');
        return {
          id: `${area.code}-${number}`,
          title: `${area.code.toUpperCase()}-${number}`
        };
      })
    }));
  }

  async function loadAreas() {
    try {
      const response = await fetch(appUrl('units/index.json'), {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const anchors = Object.fromEntries(
        FALLBACK_AREAS.map(area => [area.code, area.anchor])
      );
      const areas = (data.bereiche || []).filter(area =>
        ['pz', 'lf', 'kp', 'sk'].includes(String(area.code).toLowerCase())
      );
      if (!areas.length) throw new Error('Keine Lernbereiche gefunden.');
      return areas.map(area => ({
        code: String(area.code).toLowerCase(),
        title: area.title,
        anchor: anchors[String(area.code).toLowerCase()],
        einheiten: area.einheiten || []
      }));
    } catch (error) {
      console.warn('[Mathe9 Dev-Navigation] units/index.json:', error);
      return fallbackAreas();
    }
  }

  function currentUnitId() {
    return new URLSearchParams(location.search).get('u') || '';
  }

  function currentAreaCode() {
    const unit = currentUnitId();
    if (unit.includes('-')) return unit.split('-')[0].toLowerCase();

    const areaParam = new URLSearchParams(location.search).get('bereich');
    if (areaParam) return areaParam.toLowerCase();

    const hashMatch = location.hash.match(/^#(?:bereich-)?(pz|lf|kp|sk)$/i);
    if (hashMatch) return hashMatch[1].toLowerCase();

    return readText('navArea', 'pz').toLowerCase();
  }

  async function setupNavigation(panel, setStatus) {
    const areaSelect = panel.querySelector('[data-nav-area]');
    const unitSelect = panel.querySelector('[data-nav-unit]');
    const areaLinks = [...panel.querySelectorAll('[data-area-link]')];
    const areas = await loadAreas();

    areaSelect.innerHTML = areas.map(area =>
      `<option value="${escapeHtml(area.code)}">${escapeHtml(area.title)}</option>`
    ).join('');

    function selectedArea() {
      return areas.find(area => area.code === areaSelect.value) || areas[0];
    }

    function renderUnits(preferredUnit = '') {
      const area = selectedArea();
      const units = area?.einheiten || [];
      unitSelect.innerHTML = units.map(unit =>
        `<option value="${escapeHtml(unit.id)}">${escapeHtml(unit.id.toUpperCase())} · ${escapeHtml(unit.title)}</option>`
      ).join('');

      const savedUnit = readText('navUnit', '');
      const target = [preferredUnit, savedUnit].find(id =>
        units.some(unit => unit.id === id)
      );
      if (target) unitSelect.value = target;
      else if (units[0]) unitSelect.value = units[0].id;

      writeText('navArea', area.code);
      if (unitSelect.value) writeText('navUnit', unitSelect.value);

      areaLinks.forEach(link => {
        link.setAttribute('aria-current', String(link.dataset.areaLink === area.code));
      });
    }

    const initialArea = currentAreaCode();
    areaSelect.value = areas.some(area => area.code === initialArea)
      ? initialArea
      : areas[0].code;
    renderUnits(currentUnitId());

    areaSelect.addEventListener('change', () => renderUnits());
    unitSelect.addEventListener('change', () => writeText('navUnit', unitSelect.value));

    panel.querySelector('[data-open-unit]').addEventListener('click', () => {
      if (!unitSelect.value) {
        setStatus('Keine Einheit ausgewählt.', true);
        return;
      }
      writeText('navArea', areaSelect.value);
      writeText('navUnit', unitSelect.value);
      location.href = appUrl(`einheit.html?u=${encodeURIComponent(unitSelect.value)}`);
    });

    panel.querySelector('[data-open-animations]').addEventListener('click', () => {
      writeText('navArea', areaSelect.value);
      location.href = appUrl(`animationen.html?bereich=${encodeURIComponent(areaSelect.value.toUpperCase())}`);
    });

    panel.querySelector('[data-open-exercises]').addEventListener('click', () => {
      writeText('navArea', areaSelect.value);
      location.href = appUrl(`uebungen.html#${encodeURIComponent(areaSelect.value)}`);
    });
  }

  async function clearOfflineCache() {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('mathe9-')).map(name => caches.delete(name)));
    }
  }

  async function updateServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker wird von diesem Browser nicht unterstützt.');
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter(registration => {
      const script = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || '';
      return script === appUrl('sw.js') || registration.scope === APP_ROOT_URL.href;
    });
    if (!appRegistrations.length) {
      await navigator.serviceWorker.register(appUrl('sw.js'), {
        scope: APP_ROOT_URL.pathname
      });
      return;
    }
    await Promise.all(appRegistrations.map(registration => registration.update()));
  }

  /* ---------- Diagnosebericht ----------
     Eine Fehlermeldung wie „geht nicht" ist von einem Schülergerät kaum
     nachvollziehbar. Dieser Bericht sammelt genau das, was zur Eingrenzung
     nötig ist — und bewusst nichts darüber hinaus: kein Klarname, keine
     Antworten, keine Aufgabentexte. */
  const letzteFehler = [];
  window.addEventListener('error', e => {
    letzteFehler.push({
      art: 'error', zeit: new Date().toISOString(),
      text: String(e.message || ''),
      quelle: String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0)
    });
    if (letzteFehler.length > 20) letzteFehler.shift();
  });
  window.addEventListener('unhandledrejection', e => {
    letzteFehler.push({
      art: 'promise', zeit: new Date().toISOString(),
      text: String(e.reason && e.reason.message ? e.reason.message : e.reason)
    });
    if (letzteFehler.length > 20) letzteFehler.shift();
  });

  /* Zustand des Datenversands. Ohne Tracker auf der Seite (Arbeitsblatt,
     Matrix) bleibt der Aufruf trotzdem beantwortbar. */
  function betriebsdaten() {
    try {
      if (window.Tracker && typeof window.Tracker.status === 'function') {
        return window.Tracker.status();
      }
    } catch { /* Tracker noch nicht bereit */ }
    return {
      konfiguriert: false, online: navigator.onLine, wartend: 0,
      aeltestes: null, zuletzt_gesendet: null, letzter_fehler: null
    };
  }

  function zeitKurz(iso) {
    if (!iso) return '–';
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms)) return '–';
    if (ms < 60000) return Math.max(0, Math.round(ms / 1000)) + ' s';
    if (ms < 3600000) return Math.round(ms / 60000) + ' min';
    return Math.round(ms / 3600000) + ' h';
  }

  async function diagnoseSammeln() {
    /* Das Manifest beantwortet die erste Frage jeder Fehlermeldung:
       Welche Fassung läuft da überhaupt? */
    let manifest = null;
    try {
      const r = await fetch(appUrl('version.json'), { cache: 'no-store' });
      if (r.ok) manifest = await r.json();
    } catch { /* offline oder noch kein Release */ }

    const caches_ = 'caches' in window ? await caches.keys() : [];
    let swZustand = 'nicht unterstützt';
    let swSkript = '';
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      swZustand = regs.length
        ? regs.map(r => [r.active && 'aktiv', r.waiting && 'wartet', r.installing && 'installiert']
            .filter(Boolean).join('+')).join(', ')
        : 'nicht registriert';
      swSkript = regs[0]?.active?.scriptURL || '';
    }
    const q = new URLSearchParams(location.search);
    let angemeldet = 'nein';
    try {
      const s = JSON.parse(localStorage.getItem('mathe9.student') || 'null');
      angemeldet = s?.student_id ? 'ja' : 'nein';
    } catch { /* egal */ }
    let diagnose = {};
    try { diagnose = window.MATHE9_DIAGNOSE_STATE?.() || {}; } catch { diagnose = {}; }

    const betrieb = betriebsdaten();
    const migration = (typeof LokalerStand !== 'undefined' && LokalerStand.bericht)
      ? LokalerStand.bericht() : null;

    return [
      'Mathe 9 · Diagnosebericht',
      'erstellt: ' + new Date().toLocaleString('de-DE'),
      '',
      '--- Anwendung ---',
      'Seite:            ' + location.pathname,
      'Einheit:          ' + (q.get('u') || '—'),
      'Pfad:             ' + (localStorage.getItem('mathe9.pfad') || '—').replace(/"/g, ''),
      'aktuelle Aufgabe: ' + (diagnose.task || '—'),
      'Aufgabensitzung:  ' + (diagnose.task_session_id || '—'),
      'Schüler angemeldet: ' + angemeldet,
      '',
      '--- Fassung ---',
      'Projektversion:   ' + (manifest ? manifest.version : '(kein version.json)'),
      'Commit:           ' + (manifest ? manifest.source_commit : '—'),
      'Zweig:            ' + (manifest ? manifest.source_branch : '—') +
        (manifest && manifest.source_dirty ? ' (nicht eingecheckte Änderungen)' : ''),
      'gebaut am:        ' + (manifest ? manifest.gebaut_am : '—'),
      'Tracking laut Manifest: ' + (manifest ? String(manifest.tracking_aktiv) : '—'),
      'Cache laut Datei: ' + (manifest ? manifest.cache_version : '—'),
      'Service Worker:   ' + swZustand,
      'SW-Skript:        ' + swSkript,
      'Caches:           ' + (caches_.join(', ') || '(keiner)'),
      'devMode:          ' + String(!!(window.MATHE9_SUPABASE && window.MATHE9_SUPABASE.devMode)),
      '',
      '--- Betrieb ---',
      'Verbindung:       ' + (betrieb.online ? 'online' : 'offline'),
      'Tracker:          ' + (betrieb.konfiguriert ? 'sendet' : 'deaktiviert oder nicht konfiguriert'),
      'Warteschlange:    ' + betrieb.wartend + ' Ereignis(se)' +
        (betrieb.aeltestes ? ', ältestes ' + betrieb.aeltestes : ''),
      'letzte Synchron.: ' + (betrieb.zuletzt_gesendet || '(noch keine)'),
      'letzter Fehler:   ' + (betrieb.letzter_fehler || '(keiner)'),
      '',
      '--- Lokale Datenstände ---',
      'Format:           ' + (migration ? migration.von + ' → ' + migration.nach : '—'),
      'Migration:        ' + (migration && migration.schritte.length
        ? migration.schritte.join('; ') : '(nichts zu tun)'),
      'verworfen:        ' + (migration && migration.verworfen.length
        ? migration.verworfen.join(', ') : '(nichts)'),
      '',
      '--- Gerät ---',
      'User-Agent:       ' + navigator.userAgent,
      'Sprache:          ' + navigator.language,
      'Bildschirm:       ' + window.innerWidth + '×' + window.innerHeight +
        ' (Gerät ' + screen.width + '×' + screen.height + ', DPR ' + (window.devicePixelRatio || 1) + ')',
      'Ausrichtung:      ' + (window.innerWidth > window.innerHeight ? 'quer' : 'hoch'),
      'online:           ' + navigator.onLine,
      'dunkler Modus:    ' + (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'ja' : 'nein'),
      'Bewegung reduz.:  ' + (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'ja' : 'nein'),
      'Speicher nutzbar: ' + (typeof Speicher !== 'undefined' ? String(Speicher.nutzbar) : '?'),
      '',
      '--- letzte JavaScript-Fehler (' + letzteFehler.length + ') ---',
      letzteFehler.length
        ? letzteFehler.map(f => `${f.zeit} [${f.art}] ${f.text}${f.quelle ? ' @ ' + f.quelle : ''}`).join('\n')
        : '(keine)',
      ''
    ].join('\n');
  }

  function diagnoseSpeichern(text) {
    const datei = 'mathe9-diagnose-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.txt';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = datei;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return datei;
  }

  async function generateTestData() {
    if (CONFIG.devTrackerDisabled) {
      throw new Error('Der Tracker ist deaktiviert. Aktiviere ihn zuerst.');
    }
    if (!window.Tracker) {
      throw new Error('Der Tracker ist auf dieser Seite noch nicht bereit.');
    }

    const unit = new URLSearchParams(location.search).get('u') || 'DEV-TEST';
    window.Tracker.setContext({ unit, path: 'B', task: 'DEV-TEST-001' });
    window.Tracker.track('answer', {
      step: 1,
      correct: true,
      misconception: null,
      hints_used: 0,
      attempts: 1,
      duration_ms: 12000,
      generated_by_dev_menu: true
    });
    await window.Tracker.progress({
      unit,
      path: 'B',
      task: 'DEV-TEST-001',
      completed: 3,
      total: 10,
      percent: 30,
      correct: 3,
      attempts: 4,
      status: 'active'
    });
    window.Tracker.heartbeat('dev_menu');
    await window.Tracker.flush();
  }

  function buildMenu() {
    addStyles();

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'm9-dev-button';
    button.setAttribute('aria-label', 'Entwicklermenü öffnen');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '🐞';

    const badge = document.createElement('div');
    badge.className = 'm9-dev-badge';
    badge.textContent = 'DEV';

    const panel = document.createElement('section');
    panel.className = 'm9-dev-panel';
    panel.hidden = true;

    panel.innerHTML = `
      <div class="m9-dev-head"><h2>🐞 Entwicklermenü</h2><button type="button" data-close>✕</button></div>
      <p class="m9-dev-warning"><b>Nur Testphase.</b> Vor dem Merge nach <code>master</code> in <code>supabase-config.js</code> unbedingt <code>devMode: false</code> setzen.</p>

      <section class="m9-dev-section" aria-labelledby="m9-dev-nav-title">
        <h3 id="m9-dev-nav-title">Schnellnavigation</h3>
        <div class="m9-dev-area-grid">
          ${FALLBACK_AREAS.map(area => `
            <a class="m9-dev-area-link" data-area-link="${area.code}" href="${appUrl(`index.html#${area.anchor}`)}">
              <span class="m9-dev-area-code">${area.code.toUpperCase()}</span>
              <span>${escapeHtml(area.title)}</span>
            </a>
          `).join('')}
        </div>
        <div class="m9-dev-nav-selects">
          <label>Lernbereich<select data-nav-area aria-label="Lernbereich wählen"></select></label>
          <label>Einheit<select data-nav-unit aria-label="Einheit wählen"></select></label>
        </div>
        <div class="m9-dev-actions">
          <button type="button" class="primary" data-open-unit>Einheit öffnen</button>
          <button type="button" data-open-animations>Animationen</button>
          <button type="button" data-open-exercises>Externe Übungen</button>
          <a href="${appUrl('index.html')}">Gesamtübersicht</a>
          <a href="${appUrl('dashboard/')}">Lehrerdashboard</a>
        </div>
      </section>

      <section class="m9-dev-section" aria-labelledby="m9-dev-betrieb-title">
        <h3 id="m9-dev-betrieb-title">Betrieb</h3>
        <dl class="m9-dev-betrieb" data-betrieb></dl>
      </section>

      <section class="m9-dev-section" aria-labelledby="m9-dev-test-title">
        <h3 id="m9-dev-test-title">Testeinstellungen</h3>
        <div class="m9-dev-row"><label>Login überspringen<small>Verwendet einen lokalen Testschüler</small></label><input type="checkbox" data-setting="skipLogin"></div>
        <div class="m9-dev-row"><label>Tracker deaktivieren<small>Keine Events oder Fortschritte senden</small></label><input type="checkbox" data-setting="trackerDisabled"></div>
        <div class="m9-dev-row"><label>Supabase deaktivieren<small>Login/Tracking nur lokal testen; das Dashboard bleibt online</small></label><input type="checkbox" data-setting="supabaseDisabled"></div>
        <div class="m9-dev-row"><label>Testschüler<small>Separate IDs für Paralleltests</small></label>
          <select data-student>
            <option value="test1">Testschüler 1</option>
            <option value="test2">Testschüler 2</option>
            <option value="test3">Testschüler 3</option>
          </select>
        </div>
      </section>

      <div class="m9-dev-actions">
        <button type="button" class="primary" data-reload>Änderungen anwenden</button>
        <button type="button" data-testdata>Testdaten erzeugen</button>
        <button type="button" data-clearcache>Offlinecache löschen</button>
        <button type="button" data-updatesw>Service Worker aktualisieren</button>
        <button type="button" data-diagnose>Diagnose speichern</button>
        <button type="button" data-real-login>Echten Schülerlogin testen</button>
        <a href="${appUrl('warmup.html')}">Warm-up öffnen</a>
      </div>
      <div class="m9-dev-status" aria-live="polite"></div>
    `;

    document.body.append(button, badge, panel);

    const status = panel.querySelector('.m9-dev-status');
    const setStatus = (message, error = false) => {
      status.textContent = message;
      status.classList.toggle('error', error);
    };

    setupNavigation(panel, setStatus).catch(error => {
      setStatus(`Navigation konnte nicht geladen werden: ${error.message}`, true);
    });

    /* ---------- Betriebsanzeige ----------
       Die erste Frage bei jeder Störung ist immer dieselbe: Welche Fassung
       läuft, ist das Gerät online, und liegt noch etwas in der
       Warteschlange? Das hier ist die Antwort, ohne dass jemand erst einen
       Bericht erzeugen muss. */
    const betriebListe = panel.querySelector('[data-betrieb]');
    let manifestGemerkt = null;
    let aktiverCache = '';

    (async () => {
      try {
        const r = await fetch(appUrl('version.json'), { cache: 'no-store' });
        if (r.ok) manifestGemerkt = await r.json();
      } catch { /* offline: dann steht dort ein Strich */ }
      try {
        if ('caches' in window) {
          aktiverCache = (await caches.keys()).filter(n => n.startsWith('mathe9-')).join(', ');
        }
      } catch { /* Cache-API gesperrt */ }
      betriebZeichnen();
    })();

    function betriebZeichnen() {
      const b = betriebsdaten();
      const m = manifestGemerkt;
      const zeilen = [
        ['Version', m ? `${m.version} · ${m.source_commit || '?'}${m.source_dirty ? ' (dirty)' : ''}` : '–'],
        ['gebaut', m && m.gebaut_am ? `${m.gebaut_am.slice(0, 16).replace('T', ' ')} (vor ${zeitKurz(m.gebaut_am)})` : '–'],
        ['Cache (Datei)', m ? m.cache_version || '–' : '–'],
        ['Cache (Gerät)', aktiverCache || '(keiner)'],
        ['Verbindung', b.online ? 'online' : 'offline', !b.online],
        ['Warteschlange', String(b.wartend), b.wartend > 0],
        ['letzte Sync.', b.zuletzt_gesendet ? 'vor ' + zeitKurz(b.zuletzt_gesendet) : '(noch keine)'],
        ['letzter Fehler', b.letzter_fehler || '(keiner)', Boolean(b.letzter_fehler)]
      ];
      betriebListe.textContent = '';
      for (const [name, wert, warnen] of zeilen) {
        const dt = document.createElement('dt');
        dt.textContent = name;
        const dd = document.createElement('dd');
        dd.textContent = wert;
        if (warnen) dd.className = 'warn';
        betriebListe.append(dt, dd);
      }
    }

    betriebZeichnen();
    /* Nur nachführen, solange jemand hinsieht. */
    setInterval(() => { if (!panel.hidden) betriebZeichnen(); }, 4000);
    addEventListener('online', betriebZeichnen);
    addEventListener('offline', betriebZeichnen);

    const checkboxes = [...panel.querySelectorAll('[data-setting]')];
    checkboxes.forEach(input => {
      input.checked = readBool(
        input.dataset.setting,
        ['skipLogin', 'trackerDisabled', 'supabaseDisabled'].includes(input.dataset.setting)
      );
      input.addEventListener('change', () => writeBool(input.dataset.setting, input.checked));
    });

    const studentSelect = panel.querySelector('[data-student]');
    studentSelect.value = readText('student', 'test1');
    studentSelect.addEventListener('change', () => {
      writeText('student', studentSelect.value);
      if (!IS_DASHBOARD && readBool('skipLogin', true)) {
        saveTestStudent(studentSelect.value);
      }
    });

    const toggle = forceOpen => {
      const open = forceOpen === undefined ? panel.hidden : Boolean(forceOpen);
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    };

    button.addEventListener('click', () => toggle());
    panel.querySelector('[data-close]').addEventListener('click', () => toggle(false));

    panel.querySelector('[data-reload]').addEventListener('click', () => {
      if (!IS_DASHBOARD) {
        if (readBool('skipLogin', true)) saveTestStudent(studentSelect.value);
        else clearStudent();
      }
      location.reload();
    });

    panel.querySelector('[data-real-login]').addEventListener('click', () => {
      writeBool('skipLogin', false);
      writeBool('supabaseDisabled', false);
      writeBool('trackerDisabled', false);
      clearStudent();
      location.href = appUrl('index.html');
    });

    panel.querySelector('[data-diagnose]').addEventListener('click', async () => {
      setStatus('Diagnose wird gesammelt …');
      try {
        const text = await diagnoseSammeln();
        const datei = diagnoseSpeichern(text);
        /* Zusätzlich in die Zwischenablage — auf Mobilgeräten ist das oft
           der schnellere Weg in eine Nachricht. */
        try { await navigator.clipboard.writeText(text); } catch { /* ohne */ }
        setStatus('Gespeichert als ' + datei + ' (und in der Zwischenablage).');
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    const testDataButton = panel.querySelector('[data-testdata]');
    if (IS_DASHBOARD) {
      testDataButton.hidden = true;
    } else {
      testDataButton.addEventListener('click', async () => {
        setStatus('Testdaten werden erzeugt …');
        try {
          await generateTestData();
          setStatus('Testevent und Testfortschritt wurden erzeugt.');
        } catch (error) {
          setStatus(error.message, true);
        }
      });
    }

    panel.querySelector('[data-clearcache]').addEventListener('click', async () => {
      setStatus('Cache wird gelöscht …');
      try {
        await clearOfflineCache();
        setStatus('Alle Cache-Speicher wurden gelöscht.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    panel.querySelector('[data-updatesw]').addEventListener('click', async () => {
      setStatus('Service Worker wird aktualisiert …');
      try {
        await updateServiceWorker();
        setStatus('Update wurde angefordert. Seite bei Bedarf neu laden.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }

  /* Die Einstellungen hat dev-boot.js bereits angewandt, und
     window.Mathe9DevTools steht dort. Hier bleibt nur der Aufbau. */
  if (!enabled) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildMenu, { once: true });
  } else {
    buildMenu();
  }
})();
