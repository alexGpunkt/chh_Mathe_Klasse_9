/* ============================================================
   dev-tools.js · Entwicklermenü für den develop-Branch

   Sichtbar nur, wenn MATHE9_SUPABASE.devMode === true.
   Einstellungen werden lokal im Browser gespeichert.
   Vor dem Merge nach master devMode unbedingt auf false setzen.
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = window.MATHE9_SUPABASE || {};
  const PREFIX = 'mathe9.dev.';
  const STUDENT_KEY = 'mathe9.student';

  const TEST_STUDENTS = {
    test1: {
      student_id: '00000000-0000-4000-8000-000000000001',
      login_name: 'test.schueler1',
      display_name: 'Testschüler 1',
      class_code: 'DEV'
    },
    test2: {
      student_id: '00000000-0000-4000-8000-000000000002',
      login_name: 'test.schueler2',
      display_name: 'Testschüler 2',
      class_code: 'DEV'
    },
    test3: {
      student_id: '00000000-0000-4000-8000-000000000003',
      login_name: 'test.schueler3',
      display_name: 'Testschüler 3',
      class_code: 'DEV'
    }
  };

  const enabled = CONFIG.devMode === true;

  function readBool(name, fallback = false) {
    const value = localStorage.getItem(PREFIX + name);
    if (value === null) return fallback;
    return value === 'true';
  }

  function writeBool(name, value) {
    localStorage.setItem(PREFIX + name, String(Boolean(value)));
  }

  function readText(name, fallback = '') {
    return localStorage.getItem(PREFIX + name) || fallback;
  }

  function writeText(name, value) {
    localStorage.setItem(PREFIX + name, String(value));
  }

  function testStudent(key = readText('student', 'test1')) {
    return TEST_STUDENTS[key] || TEST_STUDENTS.test1;
  }

  function saveTestStudent(key) {
    const student = {
      ...testStudent(key),
      class_code: CONFIG.devClassCode || testStudent(key).class_code,
      verified_at: new Date().toISOString(),
      dev_bypass: true
    };

    localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
    localStorage.setItem('mathe9.name', student.display_name);
    localStorage.setItem('mathe9.student_id', student.student_id);
    localStorage.setItem('mathe9.class_code', student.class_code);
    window.MATHE9_STUDENT = student;
    return student;
  }

  function clearStudent() {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem('mathe9.name');
    localStorage.removeItem('mathe9.student_id');
    localStorage.removeItem('mathe9.class_code');
    delete window.MATHE9_STUDENT;
  }

  function applyRuntimeSettings() {
    if (!enabled) return;

    if (readBool('supabaseDisabled', true)) {
      CONFIG.enabled = false;
      CONFIG.devSupabaseDisabled = true;
    }

    CONFIG.devMode = true;
    CONFIG.skipStudentLogin = readBool('skipLogin', true);
    CONFIG.devTrackerDisabled = readBool('trackerDisabled', true);
    CONFIG.devStudentKey = readText('student', 'test1');

    if (CONFIG.skipStudentLogin) {
      saveTestStudent(CONFIG.devStudentKey);
    }
  }

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
      .m9-dev-panel{position:fixed;left:10px;bottom:64px;z-index:12000;width:min(360px,calc(100vw - 20px));max-height:calc(100vh - 84px);overflow:auto;background:#fff;color:#172033;border:1px solid #d7dce4;border-radius:16px;box-shadow:0 16px 55px #0006;padding:16px;font:14px/1.4 system-ui,sans-serif}
      .m9-dev-panel[hidden]{display:none}
      .m9-dev-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
      .m9-dev-head h2{font-size:18px;margin:0}.m9-dev-head button{border:0;background:#eef0f4;border-radius:8px;padding:6px 9px;cursor:pointer}
      .m9-dev-warning{background:#fff4cf;border-left:4px solid #e0a800;padding:9px 10px;border-radius:7px;margin:0 0 12px}
      .m9-dev-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #edf0f4}.m9-dev-row:first-of-type{border-top:0}
      .m9-dev-row label{font-weight:650}.m9-dev-row small{display:block;color:#687384;font-weight:400}
      .m9-dev-row input[type=checkbox]{width:22px;height:22px}
      .m9-dev-row select{max-width:160px;padding:8px;border:1px solid #bdc6d1;border-radius:8px;background:#fff}
      .m9-dev-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.m9-dev-actions button,.m9-dev-actions a{display:flex;align-items:center;justify-content:center;min-height:42px;border:0;border-radius:9px;background:#edf1f5;color:#172033;font-weight:700;text-decoration:none;padding:8px;text-align:center;cursor:pointer}
      .m9-dev-actions .primary{background:#5b2b82;color:#fff}.m9-dev-status{margin-top:10px;min-height:20px;color:#425169}.m9-dev-status.error{color:#a82d20}.m9-dev-badge{position:fixed;left:62px;bottom:18px;z-index:11999;background:#5b2b82;color:#fff;border-radius:999px;padding:5px 9px;font:700 11px system-ui;pointer-events:none}
      @media(max-width:520px){.m9-dev-actions{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  async function clearOfflineCache() {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }
  }

  async function updateServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker wird von diesem Browser nicht unterstützt.');
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (!registrations.length) {
      await navigator.serviceWorker.register('sw.js');
      return;
    }
    await Promise.all(registrations.map(registration => registration.update()));
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

      <div class="m9-dev-row"><label>Login überspringen<small>Verwendet einen lokalen Testschüler</small></label><input type="checkbox" data-setting="skipLogin"></div>
      <div class="m9-dev-row"><label>Tracker deaktivieren<small>Keine Events oder Fortschritte senden</small></label><input type="checkbox" data-setting="trackerDisabled"></div>
      <div class="m9-dev-row"><label>Supabase deaktivieren<small>Login/Tracking nur lokal testen</small></label><input type="checkbox" data-setting="supabaseDisabled"></div>
      <div class="m9-dev-row"><label>Testschüler<small>Separate IDs für Paralleltests</small></label>
        <select data-student>
          <option value="test1">Testschüler 1</option>
          <option value="test2">Testschüler 2</option>
          <option value="test3">Testschüler 3</option>
        </select>
      </div>

      <div class="m9-dev-actions">
        <button type="button" class="primary" data-reload>Änderungen anwenden</button>
        <button type="button" data-testdata>Testdaten erzeugen</button>
        <button type="button" data-clearcache>Offlinecache löschen</button>
        <button type="button" data-updatesw>Service Worker aktualisieren</button>
        <a href="dashboard/" target="_blank" rel="noopener">Dashboard öffnen</a>
        <button type="button" data-real-login>Echten Login testen</button>
      </div>
      <div class="m9-dev-status" aria-live="polite"></div>
    `;

    document.body.append(button, badge, panel);

    const status = panel.querySelector('.m9-dev-status');
    const setStatus = (message, error = false) => {
      status.textContent = message;
      status.classList.toggle('error', error);
    };

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
      if (readBool('skipLogin', true)) saveTestStudent(studentSelect.value);
    });

    const toggle = show => {
      panel.hidden = show === undefined ? !panel.hidden : !show;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    };

    button.addEventListener('click', () => toggle());
    panel.querySelector('[data-close]').addEventListener('click', () => toggle(false));

    panel.querySelector('[data-reload]').addEventListener('click', () => {
      if (readBool('skipLogin', true)) saveTestStudent(studentSelect.value);
      else clearStudent();
      location.reload();
    });

    panel.querySelector('[data-real-login]').addEventListener('click', () => {
      writeBool('skipLogin', false);
      writeBool('supabaseDisabled', false);
      writeBool('trackerDisabled', false);
      clearStudent();
      location.reload();
    });

    panel.querySelector('[data-testdata]').addEventListener('click', async () => {
      setStatus('Testdaten werden erzeugt …');
      try {
        await generateTestData();
        setStatus('Testevent und Testfortschritt wurden erzeugt.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });

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

  applyRuntimeSettings();

  window.Mathe9DevTools = {
    enabled,
    readBool,
    writeBool,
    testStudent,
    saveTestStudent,
    clearStudent
  };

  if (!enabled) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildMenu, { once: true });
  } else {
    buildMenu();
  }
})();
