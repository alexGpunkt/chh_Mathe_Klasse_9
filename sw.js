/* ============================================================
   sw.js · Offline-Betrieb

   Das Schul-WLAN fällt aus, der Unterricht nicht.
   Der ganze Pool ist unter 100 KB — er passt komplett in den Cache.

   WICHTIG: Nach jeder inhaltlichen Änderung VERSION hochzählen.
   Sonst sehen die Geräte weiter die alte Fassung.
   ============================================================ */

const VERSION = 'mathe9-v2-integrated';

const SCHALE = [
  './',
  'index.html',
  'einheit.html',
  'warmup.html',
  'pruefung.html',
  'arbeitsblatt.html',
  'matrix.html',
  'pruefung-sets.json',
  'units/index.json',
  'spiral/plan.json',
  'assets/css/app.css',
  'assets/js/store.js',
  'assets/js/supabase-config.js',
  'assets/js/tracker.js',
  'assets/js/engine.js',
  'assets/js/spiral.js',
  'assets/js/pruefung.js',
  'assets/js/arbeitsblatt.js',
  'assets/js/matrix.js'
];

const EINHEITEN = ['pz-01','pz-02','pz-03','pz-04','pz-05','pz-06','pz-07',
                   'pz-08','pz-09','pz-10','pz-11','pz-12','pz-13','pz-14']
  .map(u => `units/pz/${u}/tasks.json`);

const SPIRAL = ['w-proz','w-bruch','w-einh','w-kopf','w-sach']
  .map(k => `spiral/${k}.json`);

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

    /* Inhalte: erst Netz (damit Korrekturen ankommen), dann Cache.
       Fällt das WLAN aus, merkt niemand etwas. */
    if (url.pathname.endsWith('.json')) {
      try {
        const netz = await fetch(e.request);
        if (netz.ok) cache.put(e.request, netz.clone());
        return netz;
      } catch {
        const c = await cache.match(e.request);
        if (c) return c;
        throw new Error('offline und nicht im Cache');
      }
    }

    /* Schale: erst Cache (schnell), im Hintergrund auffrischen. */
    const c = await cache.match(e.request);
    const netz = fetch(e.request).then(r => {
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => null);
    return c || (await netz) || new Response('Offline', { status: 503 });
  })());
});
