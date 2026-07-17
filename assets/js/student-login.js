/* ============================================================
   student-login.js · Freigabelisten-Anmeldung
   - Login: nachname.vorname + Lerngruppe
   - Prüfung gegen Supabase RPC mathe9_validate_student_login
   - Erstlogin nur online; bestätigte Anmeldung 7 Tage offline nutzbar
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = window.MATHE9_SUPABASE || {};
  const STORAGE_KEY = 'mathe9.student';
  const MAX_OFFLINE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  let resolveReady;

  window.MATHE9_STUDENT_READY = new Promise(resolve => {
    resolveReady = resolve;
  });

  function baseUrl() {
    return String(CONFIG.url || '').trim().replace(/\/+$/, '');
  }

  function publicHeaders() {
    const key = String(CONFIG.anonKey || '').trim();
    const headers = {
      'Content-Type': 'application/json',
      apikey: key
    };
    if (key && !key.startsWith('sb_publishable_')) {
      headers.Authorization = `Bearer ${key}`;
    }
    return headers;
  }

  function normalizeLogin(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase('de-DE')
      .replace(/\s+/g, '');
  }

  function normalizeGroup(value) {
    return String(value || '').trim();
  }

  function validLoginFormat(value) {
    return /^[a-zäöüßà-ž0-9'-]+\.[a-zäöüßà-ž0-9'-]+$/iu.test(value);
  }

  function readStoredStudent() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return value && value.student_id && value.login_name && value.class_code ? value : null;
    } catch {
      return null;
    }
  }

  function saveStudent(student) {
    const value = {
      student_id: student.student_id,
      login_name: normalizeLogin(student.login_name),
      display_name: String(student.display_name || student.login_name).trim(),
      class_code: normalizeGroup(student.class_code),
      verified_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    /* Rückwärtskompatibilität für Tracker und vorhandene Funktionen. */
    localStorage.setItem('mathe9.name', value.display_name);
    localStorage.setItem('mathe9.student_id', value.student_id);
    localStorage.setItem('mathe9.class_code', value.class_code);
    window.MATHE9_STUDENT = value;
    return value;
  }

  function clearStudent() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('mathe9.name');
    localStorage.removeItem('mathe9.student_id');
    localStorage.removeItem('mathe9.class_code');
    delete window.MATHE9_STUDENT;
  }

  async function validateStudent(loginName, classCode) {
    if (!CONFIG.enabled || !baseUrl() || !CONFIG.anonKey) {
      throw new Error('Die Anmeldung ist noch nicht mit Supabase verbunden.');
    }
    const response = await fetch(`${baseUrl()}/rest/v1/rpc/mathe9_validate_student_login`, {
      method: 'POST',
      headers: publicHeaders(),
      body: JSON.stringify({
        p_login_name: normalizeLogin(loginName),
        p_class_code: normalizeGroup(classCode)
      }),
      cache: 'no-store'
    });
    if (!response.ok) {
      const detail = (await response.text()).trim();
      throw new Error(detail || `Anmeldung fehlgeschlagen (HTTP ${response.status}).`);
    }
    const result = await response.json();
    const row = Array.isArray(result) ? result[0] : result;
    if (!row || !row.student_id) return null;
    return row;
  }

  function addStyles() {
    if (document.querySelector('#mathe9-login-style')) return;
    const style = document.createElement('style');
    style.id = 'mathe9-login-style';
    style.textContent = `
      .m9-login-overlay{position:fixed;inset:0;z-index:10000;background:rgba(21,35,58,.94);display:grid;place-items:center;padding:18px}
      .m9-login-card{width:min(440px,100%);background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 70px #0008;color:#15233a}
      .m9-login-card h2{font-family:var(--f-display,system-ui);font-size:1.7rem;margin:0 0 8px}
      .m9-login-card p{color:#5c6878;margin:0 0 18px;line-height:1.45}
      .m9-login-card label{display:grid;gap:6px;font-weight:700;margin:13px 0}
      .m9-login-card input{width:100%;min-height:48px;border:1px solid #b9c4cf;border-radius:10px;padding:10px 12px;font:inherit}
      .m9-login-card button{width:100%;min-height:48px;border:0;border-radius:10px;background:#15233a;color:#fff;font-weight:800;font-size:1rem;margin-top:8px}
      .m9-login-error{background:#fff0ed;color:#9f2e20;border-left:4px solid #c44d38;padding:10px 12px;border-radius:8px;margin-top:12px}
      .m9-user-chip{position:fixed;right:10px;bottom:10px;z-index:9000;display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #d8e0e7;border-radius:999px;padding:6px 8px 6px 12px;box-shadow:0 4px 18px #15233a22;font:12px system-ui;color:#15233a}
      .m9-user-chip button{border:0;background:#eef2f5;border-radius:999px;padding:6px 9px;font:inherit;cursor:pointer}
    `;
    document.head.appendChild(style);
  }

  function showUserChip(student) {
    document.querySelector('.m9-user-chip')?.remove();
    const chip = document.createElement('div');
    chip.className = 'm9-user-chip';
    chip.innerHTML = `<span>${escapeHtml(student.display_name)} · ${escapeHtml(student.class_code)}</span><button type="button">Abmelden</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      clearStudent();
      location.reload();
    });
    document.body.appendChild(chip);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }

  function showLogin(message = '') {
    addStyles();
    document.querySelector('.m9-login-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'm9-login-overlay';
    overlay.innerHTML = `
      <form class="m9-login-card" novalidate>
        <h2>Anmelden</h2>
        <p>Gib deinen Benutzernamen im Format <b>nachname.vorname</b> und deine Lerngruppe ein. Die Lehrkraft muss dich vorher freigeschaltet haben.</p>
        <label>Benutzername
          <input name="login" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="mustermann.max" required>
        </label>
        <label>Lerngruppe
          <input name="group" autocomplete="organization" placeholder="z. B. M456_9er" required>
        </label>
        <button type="submit">Anmelden</button>
        <div class="m9-login-error" ${message ? '' : 'hidden'}>${escapeHtml(message)}</div>
      </form>`;
    document.body.appendChild(overlay);
    const form = overlay.querySelector('form');
    const loginInput = form.elements.login;
    const groupInput = form.elements.group;
    const button = form.querySelector('button');
    const errorBox = form.querySelector('.m9-login-error');
    loginInput.focus();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const login = normalizeLogin(loginInput.value);
      const group = normalizeGroup(groupInput.value);
      if (!validLoginFormat(login)) {
        errorBox.hidden = false;
        errorBox.textContent = 'Der Benutzername muss das Format nachname.vorname haben.';
        loginInput.focus();
        return;
      }
      if (!group) {
        errorBox.hidden = false;
        errorBox.textContent = 'Bitte gib deine Lerngruppe ein.';
        groupInput.focus();
        return;
      }
      if (!navigator.onLine) {
        errorBox.hidden = false;
        errorBox.textContent = 'Die erste Anmeldung benötigt eine Internetverbindung.';
        return;
      }
      button.disabled = true;
      button.textContent = 'wird geprüft …';
      errorBox.hidden = true;
      try {
        const student = await validateStudent(login, group);
        if (!student) {
          throw new Error('Benutzername oder Lerngruppe ist nicht freigeschaltet.');
        }
        const saved = saveStudent(student);
        overlay.remove();
        showUserChip(saved);
        resolveReady(saved);
        window.dispatchEvent(new CustomEvent('mathe9:student-ready', { detail: saved }));
      } catch (error) {
        errorBox.hidden = false;
        errorBox.textContent = error.message;
      } finally {
        button.disabled = false;
        button.textContent = 'Anmelden';
      }
    });
  }

  async function initialize() {
    addStyles();

    /* Entwicklermodus: Login kontrolliert überspringen. */
    if (CONFIG.devMode === true && CONFIG.skipStudentLogin === true) {
      const devStudent = window.Mathe9DevTools?.saveTestStudent(
        CONFIG.devStudentKey || 'test1'
      ) || {
        student_id: '00000000-0000-4000-8000-000000000001',
        login_name: 'test.schueler1',
        display_name: 'Testschüler 1',
        class_code: CONFIG.devClassCode || 'DEV',
        verified_at: new Date().toISOString(),
        dev_bypass: true
      };
      const saved = saveStudent(devStudent);
      showUserChip(saved);
      resolveReady(saved);
      window.dispatchEvent(new CustomEvent('mathe9:student-ready', { detail: saved }));
      console.info('[Mathe9 DEV] Schülerlogin wurde übersprungen.');
      return;
    }
    const stored = readStoredStudent();
    if (!stored) {
      showLogin();
      return;
    }

    const verifiedAge = Date.now() - new Date(stored.verified_at || 0).getTime();
    if (!navigator.onLine) {
      if (verifiedAge <= MAX_OFFLINE_AGE_MS) {
        window.MATHE9_STUDENT = stored;
        showUserChip(stored);
        resolveReady(stored);
        return;
      }
      clearStudent();
      showLogin('Die gespeicherte Anmeldung ist abgelaufen. Für die erneute Prüfung wird Internet benötigt.');
      return;
    }

    try {
      const verified = await validateStudent(stored.login_name, stored.class_code);
      if (!verified) {
        clearStudent();
        showLogin('Deine Freigabe ist nicht mehr aktiv. Bitte wende dich an die Lehrkraft.');
        return;
      }
      const saved = saveStudent(verified);
      showUserChip(saved);
      resolveReady(saved);
    } catch (error) {
      /* Bei vorübergehendem Serverfehler bleibt eine frische Bestätigung nutzbar. */
      if (verifiedAge <= MAX_OFFLINE_AGE_MS) {
        window.MATHE9_STUDENT = stored;
        showUserChip(stored);
        resolveReady(stored);
      } else {
        showLogin(error.message);
      }
    }
  }

  window.Mathe9StudentLogin = {
    get: readStoredStudent,
    logout() { clearStudent(); location.reload(); },
    validate: validateStudent
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
