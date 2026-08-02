/* ============================================================
   sw.js · Offline-Betrieb

   Das Schul-WLAN fällt aus, der Unterricht nicht.
   Der vollständige Pool liegt bei rund 1 MB und passt komplett in den Cache.

   WICHTIG: Nach jeder inhaltlichen Änderung VERSION hochzählen.
   Sonst sehen die Geräte weiter die alte Fassung.
   ============================================================ */

const VERSION = 'mathe9-v23-stufe-a-animationen-develop';

const SCHALE = [
  './',
  'index.html',
  'einheit.html',
  'warmup.html',
  'pruefung.html',
  'arbeitsblatt.html',
  'matrix.html',
  'animationen.html',
  'uebungen.html',
  'dashboard/index.html',
  'dashboard/dashboard.css',
  'dashboard/dashboard.js',
  'pruefung-sets.json',
  'assets/js/dev-tools.js',
  'units/index.json',
  'spiral/plan.json',
  'assets/css/app.css',
  'assets/css/anim.css',
  'assets/css/buch.css',
  'assets/js/store.js',
  'assets/js/supabase-config.js',
  'assets/js/student-login.js',
  'assets/js/zeichnen.js',
  'assets/js/animationen.js',
  'assets/js/tracker.js',
  'assets/js/engine.js',
  'assets/js/buch.js',
  'assets/js/spiral.js',
  'assets/js/pruefung.js',
  'assets/js/arbeitsblatt.js',
  'assets/js/matrix.js'
];

const EINHEITEN = [
  'units/pz/pz-01/tasks.json',
  'units/pz/pz-02/tasks.json',
  'units/pz/pz-03/tasks.json',
  'units/pz/pz-04/tasks.json',
  'units/pz/pz-05/tasks.json',
  'units/pz/pz-06/tasks.json',
  'units/pz/pz-07/tasks.json',
  'units/pz/pz-08/tasks.json',
  'units/pz/pz-09/tasks.json',
  'units/pz/pz-10/tasks.json',
  'units/pz/pz-11/tasks.json',
  'units/pz/pz-12/tasks.json',
  'units/pz/pz-13/tasks.json',
  'units/pz/pz-14/tasks.json',
  'units/lf/lf-01/tasks.json',
  'units/lf/lf-02/tasks.json',
  'units/lf/lf-03/tasks.json',
  'units/lf/lf-04/tasks.json',
  'units/lf/lf-05/tasks.json',
  'units/lf/lf-06/tasks.json',
  'units/lf/lf-07/tasks.json',
  'units/lf/lf-08/tasks.json',
  'units/lf/lf-09/tasks.json',
  'units/lf/lf-10/tasks.json',
  'units/lf/lf-11/tasks.json',
  'units/lf/lf-12/tasks.json',
  'units/lf/lf-13/tasks.json',
  'units/lf/lf-14/tasks.json',
  'units/lf/lf-15/tasks.json',
  'units/lf/lf-16/tasks.json',
  'units/kp/kp-01/tasks.json',
  'units/kp/kp-02/tasks.json',
  'units/kp/kp-03/tasks.json',
  'units/kp/kp-04/tasks.json',
  'units/kp/kp-05/tasks.json',
  'units/kp/kp-06/tasks.json',
  'units/kp/kp-07/tasks.json',
  'units/kp/kp-08/tasks.json',
  'units/kp/kp-09/tasks.json',
  'units/kp/kp-10/tasks.json',
  'units/kp/kp-11/tasks.json',
  'units/kp/kp-12/tasks.json',
  'units/sk/sk-01/tasks.json',
  'units/sk/sk-02/tasks.json',
  'units/sk/sk-03/tasks.json',
  'units/sk/sk-04/tasks.json',
  'units/sk/sk-05/tasks.json',
  'units/sk/sk-06/tasks.json',
  'units/sk/sk-07/tasks.json',
  'units/sk/sk-08/tasks.json',
  'units/sk/sk-09/tasks.json',
  'units/sk/sk-10/tasks.json',
  'units/sk/sk-11/tasks.json',
  'units/sk/sk-12/tasks.json'
];

const SPIRAL = [
  'spiral/w-proz.json',
  'spiral/w-bruch.json',
  'spiral/w-einh.json',
  'spiral/w-kopf.json',
  'spiral/w-sach.json',
  'spiral/w-fkt.json',
  'spiral/w-term.json',
  'spiral/w-geo.json'
];

const ALLES = [...SCHALE, ...EINHEITEN, ...SPIRAL];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    /* Einzeln, damit eine fehlende Datei nicht die ganze Installation kippt. */
    await Promise.all(ALLES.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(err =>
        console.warn('[sw] nicht gecacht:', u, err.message))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n !== VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  /* Fremde Hosts (Fonts, Supabase) nie aus dem Cache bedienen. */
  if (url.origin !== location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);

    /* Programmcode und Inhalte: online immer die aktuelle Fassung laden,
       offline auf den vollständigen Cache zurückfallen. Das verhindert nach
       größeren Updates gemischte Versionen von engine.js und zeichnen.js. */
    const istAktualitaetskritisch =
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('/');

    if (istAktualitaetskritisch) {
      try {
        const netz = await fetch(e.request, { cache: 'no-store' });
        if (netz.ok) cache.put(e.request, netz.clone());
        return netz;
      } catch {
        const c = await cache.match(e.request);
        if (c) return c;
        return new Response('Offline und nicht im Cache', { status: 503 });
      }
    }

    /* Sonstige lokale Ressourcen: Cache zuerst, Netz als Rückfall. */
    const c = await cache.match(e.request);
    if (c) return c;

    try {
      const netz = await fetch(e.request);
      if (netz.ok) cache.put(e.request, netz.clone());
      return netz;
    } catch {
      return new Response('Offline', { status: 503 });
    }
  })());
});
