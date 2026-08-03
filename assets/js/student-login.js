/* ============================================================
   student-login.js · Freigabelisten-Anmeldung
   - Login: nachname.vorname + Lerngruppe
   - Sichere Token-Anmeldung über mathe9_student_anmelden
   - Vorhandene Sitzung wird geprüft statt bei jedem Seitenwechsel erneuert
   - Erstlogin nur online; bestätigte Anmeldung 7 Tage offline lesbar
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = window.MATHE9_SUPABASE || {};
  const STORAGE_KEY = 'mathe9.student';
  const MAX_OFFLINE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const TOKEN_CHECK_INTERVAL_MS = 15 * 60 * 1000;
  let resolveReady;
  let tokenRefreshPromise = null;

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

  /* ---------- Sitzungstoken ----------
     Ein kurzlebiges, serverseitig geprüftes Token bindet Schreibzugriffe an
     genau das angemeldete Kind. Ein vorhandenes Token wird zwischen den
     Seiten wiederverwendet und höchstens alle 15 Minuten serverseitig
     überprüft. So entstehen nicht bei jedem Seitenwechsel neue Tokens. */
  const TOKEN_KEY = 'mathe9.token';

  function tokenInfoLesen() {
    try {
      const wert = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
      if (!wert || !wert.token) return null;
      const ablauf = wert.gueltig_bis ? new Date(wert.gueltig_bis).getTime() : 0;
      if (ablauf && ablauf <= Date.now()) { tokenLoeschen(); return null; }
      return wert;
    } catch { return null; }
  }

  function tokenSpeichern(token, gueltigBis, studentId, checkedAt = Date.now()) {
    if (!token) return;
    const wert = {
      token,
      gueltig_bis: gueltigBis || null,
      student_id: studentId || readStoredStudent()?.student_id || null,
      checked_at: new Date(checkedAt).toISOString()
    };
    try { localStorage.setItem(TOKEN_KEY, JSON.stringify(wert)); }
    catch { /* Speicher gesperrt — dann gilt es nur für diese Sitzung */ }
    window.MATHE9_TOKEN = token;
  }

  function tokenLesen() {
    const wert = tokenInfoLesen();
    if (!wert) { delete window.MATHE9_TOKEN; return null; }
    window.MATHE9_TOKEN = wert.token;
    return wert.token;
  }

  function tokenLoeschen() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* egal */ }
    delete window.MATHE9_TOKEN;
  }

  async function rpc(name, body = {}, token = null) {
    const response = await fetch(`${baseUrl()}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: token ? { ...publicHeaders(), 'x-mathe9-token': token } : publicHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    if (!response.ok) {
      const detail = (await response.text()).trim();
      const error = new Error(detail || `Anfrage fehlgeschlagen (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  /* Beim Abmelden das Token auch serverseitig entwerten — sonst bliebe es
     bis zum Ablauf gültig, obwohl das Kind das Gerät weitergegeben hat. */
  async function tokenEntwerten() {
    const token = tokenLesen();
    if (!token || !CONFIG.enabled || !baseUrl()) { tokenLoeschen(); return; }
    try { await rpc('mathe9_student_abmelden', {}, token); }
    catch { /* offline: läuft spätestens von selbst ab */ }
    tokenLoeschen();
  }

  async function validateStudent(loginName, classCode) {
    if (!CONFIG.enabled || !baseUrl() || !CONFIG.anonKey) {
      throw new Error('Die Anmeldung ist noch nicht mit Supabase verbunden.');
    }
    let row;
    try {
      row = await rpc('mathe9_student_anmelden', {
        p_login_name: normalizeLogin(loginName),
        p_class_code: normalizeGroup(classCode)
      });
    } catch (error) {
      if (error.status === 404) {
        throw new Error('Die Datenbank ist noch nicht auf die sichere Schüleranmeldung aktualisiert. Bitte zuerst supabase/setup.sql ausführen.');
      }
      throw error;
    }
    if (!row || !row.student_id || !row.token) return null;
    tokenSpeichern(row.token, row.gueltig_bis, row.student_id);
    return row;
  }

  async function tokenPruefen(token) {
    try {
      return await rpc('mathe9_student_sitzung', {}, token);
    } catch (error) {
      if (error.status === 404) {
        throw new Error('Die Datenbank kennt die Sitzungsprüfung noch nicht. Bitte supabase/setup.sql aktualisieren.');
      }
      throw error;
    }
  }

  async function ensureToken(options = {}) {
    if (CONFIG.devMode === true && CONFIG.skipStudentLogin === true) return null;
    if (!CONFIG.enabled || !baseUrl() || !CONFIG.anonKey) return tokenLesen();
    if (!navigator.onLine) return tokenLesen();
    if (tokenRefreshPromise) return tokenRefreshPromise;

    tokenRefreshPromise = (async () => {
      const stored = readStoredStudent();
      if (!stored) return null;
      const info = tokenInfoLesen();
      const passend = info && (!info.student_id || info.student_id === stored.student_id);
      const zuletzt = passend && info.checked_at ? new Date(info.checked_at).getTime() : 0;

      if (passend && !options.force && Date.now() - zuletzt < TOKEN_CHECK_INTERVAL_MS) {
        return info.token;
      }

      if (passend) {
        try {
          const row = await tokenPruefen(info.token);
          if (row && row.student_id === stored.student_id) {
            tokenSpeichern(info.token, row.gueltig_bis || info.gueltig_bis, row.student_id);
            saveStudent(row);
            return info.token;
          }
          tokenLoeschen();
        } catch (error) {
          /* 401/403 oder eine leere Sitzung bedeutet: Token erneuern. Ein
             echter Server-/Migrationsfehler soll dagegen sichtbar bleiben. */
          if (error.status !== 401 && error.status !== 403) throw error;
          tokenLoeschen();
        }
      }

      const neu = await validateStudent(stored.login_name, stored.class_code);
      if (!neu) return null;
      saveStudent(neu);
      return tokenLesen();
    })().finally(() => { tokenRefreshPromise = null; });

    return tokenRefreshPromise;
  }

  function addStyles() {
    if (document.querySelector('#mathe9-login-style')) return;
    const style = document.createElement('style');
    style.id = 'mathe9-login-style';
    style.textContent = `
      .m9-login-overlay{position:fixed;inset:0;z-index:10000;background:rgba(21,35,58,.94);display:grid;place-items:center;padding:18px}
      .m9-login-card{width:min(440px,100%);background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 70px #0008;color:#15233a}
      .m9-login-card h2{font-family:var(--f-display,system-ui);font-size:1.7rem;margin:0 0 8px}
      .m9-abmelden-aktionen{display:grid;gap:8px;margin-top:16px}
      .m9-btn{min-height:48px;padding:10px 16px;border-radius:10px;border:2px solid #C8D2D8;background:#fff;color:#15233a;font:700 15px/1.3 system-ui,sans-serif;cursor:pointer;text-align:left}
      .m9-btn:hover{border-color:#2563A8}
      .m9-btn:focus-visible{outline:3px solid #2563A8;outline-offset:2px}
      .m9-btn-warn{border-color:#C62F26;color:#8d211a}
      .m9-btn-still{border-color:transparent;color:#4A5A70;font-weight:400}
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
    /* Fragt nach: nur abmelden oder auch die lokalen Lernstände entfernen. */
    chip.querySelector('button').addEventListener('click', () => abmeldeDialog());
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
      const token = await ensureToken();
      const verified = readStoredStudent();
      if (!token || !verified) {
        tokenLoeschen();
        clearStudent();
        showLogin('Deine Freigabe ist nicht mehr aktiv. Bitte wende dich an die Lehrkraft.');
        return;
      }
      showUserChip(verified);
      resolveReady(verified);
      window.dispatchEvent(new CustomEvent('mathe9:student-ready', { detail: verified }));
    } catch (error) {
      /* Bei vorübergehendem Serverfehler bleibt eine frische Bestätigung
         offline lesbar. Schreibzugriffe warten, bis ein gültiges Token
         erneut geprüft oder ausgestellt werden kann. */
      if (verifiedAge <= MAX_OFFLINE_AGE_MS) {
        window.MATHE9_STUDENT = stored;
        showUserChip(stored);
        resolveReady(stored);
      } else {
        showLogin(error.message);
      }
    }
  }

  /* ---------- Abmelden ----------
     Auf einem Gerät, das die nächste Klasse benutzt, ist der zurückgelassene
     Lernstand ein Problem: Das nächste Kind sieht fremde Zwischenstände und
     fremde Fehlerprofile. Deshalb wird beim Abmelden gefragt statt still
     das eine oder das andere zu tun. */
  function lokaleLernstaendeLoeschen() {
    let n = 0;
    try {
      /* Vor dem Abmelden bestimmen: danach ist die Kennung wieder „lokal“
         und die eigenen Schlüssel wären nicht mehr auffindbar. */
      const kennung = (typeof Stand !== 'undefined' && Stand.kennung) ? Stand.kennung() : 'lokal';
      const eigene = [
        'mathe9.stand.' + kennung + '.',     // Bearbeitungsstände und „zuletzt“
        'mathe9.fehler.' + kennung,          // Fehlerprofil
        'mathe9.lesezeichen.' + kennung,     // Lesezeichen im Buchmodus
        'mathe9.lernmodus.' + kennung,       // zwischengespeicherte Unterrichtsfreigaben
        'mathe9.lernzeit.offen.' + kennung   // noch nicht übertragene Lernzeit je Einheit
      ];
      /* Geräteweite Reste älterer Fassungen kommen mit, wenn niemand
         angemeldet war — sonst gehörten sie einem anderen Kind. */
      const geraeteweit = kennung === 'lokal'
        ? ['mathe9.stand.zuletzt', 'mathe9.fehler', 'mathe9.lesezeichen', 'mathe9.spiral', 'mathe9.pfad']
        : ['mathe9.spiral', 'mathe9.pfad'];

      const zuLoeschen = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (eigene.some(p => k === p || k.startsWith(p)) || geraeteweit.includes(k)) zuLoeschen.push(k);
      }
      zuLoeschen.forEach(k => { localStorage.removeItem(k); n++; });
    } catch { /* Speicher gesperrt */ }
    return n;
  }

  function abmeldeDialog() {
    if (document.querySelector('.m9-abmelden')) return;
    const overlay = document.createElement('div');
    overlay.className = 'm9-login-overlay m9-abmelden';
    overlay.innerHTML = `
      <div class="m9-login-card" role="dialog" aria-modal="true" aria-labelledby="m9AbmeldeTitel">
        <h2 id="m9AbmeldeTitel">Abmelden</h2>
        <p>Auf einem Gerät, das mehrere benutzen, kannst du deine Lernstände
           gleich mit entfernen. Sie liegen nur auf diesem Gerät.</p>
        <div class="m9-abmelden-aktionen">
          <button type="button" class="m9-btn" data-nur>Nur abmelden</button>
          <button type="button" class="m9-btn m9-btn-warn" data-alles>Abmelden und meine lokalen Lernstände löschen</button>
          <button type="button" class="m9-btn m9-btn-still" data-zurueck>Zurück</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const schliessen = () => overlay.remove();
    overlay.querySelector('[data-zurueck]').addEventListener('click', schliessen);
    overlay.querySelector('[data-nur]').addEventListener('click', () => abmelden(false));
    overlay.querySelector('[data-alles]').addEventListener('click', () => abmelden(true));
    overlay.querySelector('[data-nur]').focus();
  }

  async function abmelden(auchLoeschen) {
    /* Noch offene Lernzeit nach Möglichkeit unter der aktuellen
       Schülerkennung übertragen, bevor Token oder lokale Profildaten
       verschwinden. Offline bleibt sie nur dann erhalten, wenn ausdrücklich
       „Nur abmelden“ gewählt wurde. */
    try { await window.Lernmodus?.vorAbmelden?.(); }
    catch { /* Abmelden darf an einer Zeitmeldung nicht scheitern. */ }

    /* Erst die Schreibvorgänge stoppen, dann löschen. Sonst schreibt ein
       noch laufender, entprellter Speichervorgang den gerade gelöschten
       Stand wieder hin — und zwar unter „lokal", weil die Anmeldung dann
       schon weg ist. Für das nächste Kind am selben Gerät wäre er damit
       sichtbar. */
    if (auchLoeschen) {
      if (typeof Stand !== 'undefined' && Stand.sperren) Stand.sperren();
      lokaleLernstaendeLoeschen();
    }
    await tokenEntwerten();
    clearStudent();
    /* Ein Nachzügler kann in der Zwischenzeit trotzdem etwas angelegt
       haben — etwa aus einem zweiten Tab. Deshalb noch einmal nachsehen. */
    if (auchLoeschen) lokaleLernstaendeLoeschen();
    location.href = 'index.html';
  }

  window.Mathe9StudentLogin = {
    get: readStoredStudent,
    /* Ohne Argument wird gefragt; mit `true`/`false` direkt gehandelt. */
    logout(auchLoeschen) {
      if (auchLoeschen === undefined) { abmeldeDialog(); return; }
      return abmelden(!!auchLoeschen);
    },
    validate: validateStudent,
    token: tokenLesen,
    ensureToken
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
