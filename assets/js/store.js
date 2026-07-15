/* ============================================================
   store.js · Gemeinsamer Speicher für Einheiten und Warm-up
   Muss VOR engine.js und spiral.js geladen werden.
   ============================================================ */

const Speicher = (() => {
  const fallback = {};
  const nutzbar = (() => {
    try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return true; }
    catch { return false; }
  })();
  return {
    nutzbar,
    lies(k, std) {
      try {
        const v = nutzbar ? localStorage.getItem(k) : fallback[k];
        return v == null ? std : JSON.parse(v);
      } catch { return std; }
    },
    schreib(k, v) {
      try {
        const s = JSON.stringify(v);
        if (nutzbar) localStorage.setItem(k, s); else fallback[k] = s;
      } catch { /* Speicher voll oder gesperrt — Unterricht läuft weiter */ }
    }
  };
})();

/* ---------- Zahleneingabe ----------
   Handytastaturen liefern mal ',' und mal '.'. Ohne Komma ist "1.250"
   mehrdeutig: 1250 oder 1,25? Statt zu raten, prüfen wir beide Lesarten.
   Die Lesarten unterscheiden sich um Faktor 1000 — dass die falsche
   zufällig die Lösung trifft, kommt nicht vor. */
function lesarten(s) {
  const t = String(s).replace(/\s|€|%/g, '');
  if (t.includes(',')) {
    return [parseFloat(t.replace(/\./g, '').replace(',', '.'))];
  }
  const alsDezimal = parseFloat(t);                       // 1.250 → 1,25
  const alsTausender = parseFloat(t.replace(/\./g, ''));  // 1.250 → 1250
  return alsDezimal === alsTausender ? [alsDezimal] : [alsDezimal, alsTausender];
}

/* ---------- Offline ----------
   Registrierung nur, wo ein Service Worker überhaupt laufen darf: über
   https (GitHub Pages) oder auf localhost. Bei file:// passiert nichts —
   dort läuft ohnehin nichts, weil der Browser die JSON-Dateien blockt. */
if ('serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' ||
     location.hostname === '127.0.0.1')) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(e => console.warn('[sw] Registrierung fehlgeschlagen:', e.message));
  });
}

/* ---------- Fehlerprofil ----------
   Jede Fehlvorstellung, die in einer Einheit auftritt, wird lokal notiert.
   Das Warm-up der nächsten Stunde zieht daraus die passende Kategorie.
   Es werden nur die IDs gespeichert, keine Namen und keine Aufgabentexte. */

const TAG = 86400000;

function merkeFehler(id) {
  if (!id) return;
  const p = Speicher.lies('mathe9.fehler', {});
  p[id] = { anzahl: (p[id]?.anzahl || 0) + 1, zuletzt: Date.now() };
  Speicher.schreib('mathe9.fehler', p);
}

/* Fehler der letzten 14 Tage, häufigste zuerst */
function fehlerProfil(tage = 14) {
  const p = Speicher.lies('mathe9.fehler', {});
  const grenze = Date.now() - tage * TAG;
  return Object.entries(p)
    .filter(([, v]) => v.zuletzt >= grenze)
    .sort((a, b) => b[1].anzahl - a[1].anzahl)
    .map(([id, v]) => ({ id, anzahl: v.anzahl }));
}
