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

/* ---------- Bearbeitungsstand ----------
   Der DOM-Parkmechanismus rettet den Zustand beim kurzen Sprung zur
   Erklärung. Beim Neuladen, beim Schließen des Tabs oder beim Wechsel in
   eine andere Einheit war er bisher weg. Hier liegt der dauerhafte Stand:
   je Schüler und Einheit, im localStorage dieses Geräts.

   Bewusst lokal: Es sind Zwischenstände, keine Leistungsdaten. Was an das
   Dashboard geht, entscheidet weiterhin tracker.js. */
const Stand = (() => {
  const PRAEFIX = 'mathe9.stand.';
  const ZULETZT = 'mathe9.stand.zuletzt';
  const HALTBAR_TAGE = 45;

  /* Ein Gerät, mehrere Kinder: der Stand hängt an der Schülerkennung, sonst
     sieht das nächste Kind den Zwischenstand des vorherigen. */
  function wer() {
    try {
      const s = JSON.parse(localStorage.getItem('mathe9.student') || 'null');
      return s?.student_id || s?.login_name || 'lokal';
    } catch { return 'lokal'; }
  }

  function schluessel(einheit) {
    return PRAEFIX + wer() + '.' + String(einheit || '').toLowerCase();
  }

  return {
    lies(einheit) {
      const d = Speicher.lies(schluessel(einheit), null);
      if (!d || !d.ts) return null;
      if (Date.now() - d.ts > HALTBAR_TAGE * 86400000) { this.loesche(einheit); return null; }
      return d;
    },
    schreib(einheit, daten) {
      const satz = { ...daten, ts: Date.now() };
      Speicher.schreib(schluessel(einheit), satz);
      /* Zusätzlich der zuletzt bearbeitete Ort — davon lebt die Kachel
         „Weiterlernen" auf der Startseite. */
      Speicher.schreib(ZULETZT, {
        einheit, ts: satz.ts,
        pfad: satz.pfad, index: satz.index, gesamt: satz.gesamt,
        titel: satz.titel || ''
      });
    },
    loesche(einheit) {
      Speicher.schreib(schluessel(einheit), null);
      const z = Speicher.lies(ZULETZT, null);
      if (z && String(z.einheit).toLowerCase() === String(einheit).toLowerCase()) {
        Speicher.schreib(ZULETZT, null);
      }
    },
    zuletzt() { return Speicher.lies(ZULETZT, null); }
  };
})();

/* ---------- Zahleneingabe ----------
   Handytastaturen liefern mal ',' und mal '.'. Ohne Komma ist "1.250"
   mehrdeutig: 1250 oder 1,25? Statt zu raten, prüfen wir beide Lesarten.
   Die Lesarten unterscheiden sich um Faktor 1000 — dass die falsche
   zufällig die Lösung trifft, kommt nicht vor. */
function lesarten(s) {
  /* Manche kopieren die Zahl aus dem Aufgabentext — dort steht ein
     typografisches Minus (\u2212), das parseFloat nicht kennt. */
  const t = String(s).replace(/\u2212/g, '-').replace(/\s|€|%/g, '');
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
      .then(reg => aktualisierungBeobachten(reg))
      .catch(e => console.warn('[sw] Registrierung fehlgeschlagen:', e.message));
  });
}

/* ---------- Updatehinweis ----------
   Vorher übernahm eine neue Fassung sofort (skipWaiting im Install). Mitten
   in einer Aufgabe konnten so alte und neue Dateien aufeinandertreffen, und
   wer davon nichts merkte, musste den Cache von Hand löschen.

   Jetzt wartet die neue Fassung, meldet sich sichtbar und übernimmt erst
   nach Zustimmung — dann aber in allen offenen Tabs gleichzeitig. */
function aktualisierungBeobachten(reg) {
  if (!reg) return;

  const anbieten = worker => {
    if (!worker || document.querySelector('.update-leiste')) return;
    const leiste = document.createElement('div');
    leiste.className = 'update-leiste';
    leiste.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = 'Eine neue Fassung ist da.';
    const jetzt = document.createElement('button');
    jetzt.type = 'button';
    jetzt.className = 'update-btn';
    jetzt.textContent = 'Jetzt aktualisieren';
    jetzt.addEventListener('click', () => {
      jetzt.disabled = true;
      jetzt.textContent = 'wird geladen …';
      worker.postMessage({ typ: 'uebernehmen' });
    });
    const spaeter = document.createElement('button');
    spaeter.type = 'button';
    spaeter.className = 'update-btn update-btn-neben';
    spaeter.textContent = 'Später';
    spaeter.addEventListener('click', () => leiste.remove());
    leiste.append(text, jetzt, spaeter);
    document.body.appendChild(leiste);
  };

  /* Wartet schon eine Fassung? Dann sofort fragen. */
  if (reg.waiting && navigator.serviceWorker.controller) anbieten(reg.waiting);

  reg.addEventListener('updatefound', () => {
    const neu = reg.installing;
    if (!neu) return;
    neu.addEventListener('statechange', () => {
      /* Ohne Controller ist es die Erstinstallation — da gibt es nichts zu melden. */
      if (neu.state === 'installed' && navigator.serviceWorker.controller) anbieten(neu);
    });
  });

  /* Übernimmt die neue Fassung, laden alle Tabs einmal neu. */
  let laedtNeu = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (laedtNeu) return;
    laedtNeu = true;
    location.reload();
  });

  /* Beim Zurückkehren auf die Seite nachsehen, ob es etwas Neues gibt —
     im Unterricht wird selten neu geladen. */
  const nachsehen = () => { try { reg.update(); } catch { /* offline */ } };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') nachsehen();
  });
  setInterval(nachsehen, 30 * 60 * 1000);
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
