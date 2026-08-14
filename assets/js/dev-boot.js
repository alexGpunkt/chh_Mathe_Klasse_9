/* ============================================================
   dev-boot.js · Entwicklereinstellungen anwenden, Menü nachladen

   Diese Datei liegt auf JEDER Seite. Jedes Byte hier zahlt jedes Kind
   bei jedem Seitenaufruf — deshalb steht die ausführliche Begründung im
   CHANGELOG (v34) und nicht hier.

   Die eine Sache, die man wissen muss, bevor man etwas verschiebt:
   Was CONFIG ändert oder window.MATHE9_STUDENT setzt, MUSS hier stehen
   und synchron laufen. student-login.js ruft beim Laden
   Mathe9DevTools.saveTestStudent() auf; tracker.js und lernmodus.js
   lesen CONFIG.skipStudentLogin und CONFIG.devTrackerDisabled ebenfalls
   beim Laden. Nachgeladen käme das zu spät.

   Das Menü selbst (dev-tools.js, 9 KB) baut erst auf DOMContentLoaded
   auf und wird deshalb unten nachgeholt — nur bei devMode. Auf master
   fordert es niemand an.
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = window.MATHE9_SUPABASE || {};
  const PREFIX = 'mathe9.dev.';
  const STUDENT_KEY = 'mathe9.student';

  /* App-Wurzel aus dem eigenen Pfad: So stimmen die Links sowohl aus
     /dashboard/ als auch aus dem Hauptverzeichnis. */
  const SCRIPT_URL = document.currentScript?.src ||
    new URL('assets/js/dev-boot.js', location.href).href;
  const APP_ROOT_URL = new URL('../../', SCRIPT_URL);
  const IS_DASHBOARD = /\/dashboard(?:\/index\.html)?\/?$/i.test(location.pathname);

  /* Drei Testschüler, erzeugt statt ausgeschrieben — dieselben Werte,
     rund 400 Byte weniger auf jedem Seitenaufruf. */
  const TEST_STUDENTS = {};
  for (let i = 1; i <= 3; i++) {
    TEST_STUDENTS['test' + i] = {
      student_id: '00000000-0000-4000-8000-00000000000' + i,
      login_name: 'test.schueler' + i,
      display_name: 'Testschüler ' + i,
      class_code: 'DEV'
    };
  }

  const enabled = CONFIG.devMode === true;

  function appUrl(path = '') {
    return new URL(path, APP_ROOT_URL).href;
  }

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

    CONFIG.devMode = true;
    CONFIG.skipStudentLogin = readBool('skipLogin', true);
    CONFIG.devTrackerDisabled = readBool('trackerDisabled', true);
    CONFIG.devStudentKey = readText('student', 'test1');

    /* Das Lehrerdashboard benötigt Supabase zwingend. Dort darf die
       lokale Schüler-Testeinstellung CONFIG.enabled nicht abschalten. */
    if (!IS_DASHBOARD && readBool('supabaseDisabled', true)) {
      CONFIG.enabled = false;
      CONFIG.devSupabaseDisabled = true;
    }

    if (!IS_DASHBOARD && CONFIG.skipStudentLogin) {
      saveTestStudent(CONFIG.devStudentKey);
    }
  }

  applyRuntimeSettings();

  /* Dieselbe Schnittstelle wie bisher: student-login.js greift beim Laden
     darauf zu, und das Menü baut darauf auf, statt die Helfer ein zweites
     Mal zu definieren. */
  window.Mathe9DevTools = {
    enabled, appUrl, readBool, writeBool, readText, writeText,
    testStudent, saveTestStudent, clearStudent,
    istDashboard: IS_DASHBOARD,
    testSchueler: TEST_STUDENTS,
    appRootUrl: APP_ROOT_URL
  };

  if (!enabled) return;

  /* Ein eingehängtes <script>-Tag statt import(): Die CSP erlaubt Skripte
     eigener Herkunft, und dev-tools.js ist ein klassisches Skript. */
  const menue = document.createElement('script');
  menue.src = new URL('assets/js/dev-tools.js', APP_ROOT_URL).href;
  menue.async = true;
  menue.addEventListener('error', () => {
    console.warn('[Mathe9 DEV] dev-tools.js nicht ladbar — Einstellungen gelten, Menü fehlt.');
  });
  (document.head || document.documentElement).appendChild(menue);
})();
