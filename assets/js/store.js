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
    },
    loesche(k) {
      try {
        if (nutzbar) localStorage.removeItem(k); else delete fallback[k];
      } catch { /* gesperrter Speicher — Unterricht läuft weiter */ }
    }
  };
})();

/* ---------- Lokale Datenstände insgesamt ----------
   Einzelne Strukturen bringen ihre eigene Version mit (siehe `Stand` unten).
   Was bisher fehlte, ist die Klammer darüber: Schlüssel, die umziehen,
   Strukturen, die wegfallen, und Reste, die kein JSON mehr sind.

   Regeln, die hier gelten:
     · Jede Formatänderung bekommt einen Schritt n → n+1. Kein Sprung.
     · Ein Schritt darf scheitern; dann wird genau der betroffene Schlüssel
       verworfen, nicht der ganze Speicher — und die App startet trotzdem.
     · Ein Stand aus der Zukunft (höhere Nummer) wird nicht geraten,
       sondern in Ruhe gelassen.
   Der Bericht landet im Diagnosebericht des Entwicklermenüs; ohne ihn wäre
   „nach dem Update war mein Stand weg" nicht nachvollziehbar. */
const LokalerStand = (() => {
  const FORMAT_SCHLUESSEL = 'mathe9.format';
  const FORMAT = 3;
  const bericht = { von: null, nach: FORMAT, schritte: [], verworfen: [] };

  const MIGRATIONEN = {
    /* 1 → 2: Bearbeitungsstand, Fehlerprofil und Lesezeichen lagen geräteweit.
       Seit der Schüleranmeldung hängen sie an der Kennung. Übernommen wird
       nur in das lokale Profil — ein angemeldetes Kind darf die Reste des
       vorherigen nicht erben. `Stand` und `fehlerDaten` holen den Umzug
       zusätzlich beim ersten Zugriff nach; hier passiert er einmal zentral. */
    1() {
      const kennung = 'lokal';
      const paare = [
        ['mathe9.stand.zuletzt', 'mathe9.stand.' + kennung + '.zuletzt'],
        ['mathe9.fehler', 'mathe9.fehler.' + kennung],
        ['mathe9.lesezeichen', 'mathe9.lesezeichen.' + kennung]
      ];
      let umgezogen = 0;
      for (const [alt, neu] of paare) {
        const wert = Speicher.lies(alt, null);
        if (wert == null) continue;
        if (Speicher.lies(neu, null) == null) { Speicher.schreib(neu, wert); umgezogen++; }
        Speicher.loesche(alt);
      }
      return umgezogen + ' geräteweite Einträge dem lokalen Profil zugeordnet';
    },

    /* 2 → 3: Die erste Trackerwarteschlange kannte weder Sitzungstoken noch
       task_session_id. Solche Ereignisse würde der Server heute ablehnen;
       sie werden verworfen statt endlos erneut gesendet. */
    2() {
      const alt = Speicher.lies('mathe9.tracker.queue', null);
      Speicher.loesche('mathe9.tracker.queue');
      return alt ? 'alte Trackerwarteschlange verworfen (' + (alt.length || 0) + ' Ereignisse)'
                 : 'keine alte Trackerwarteschlange gefunden';
    }
  };

  /* Ein einzelner unlesbarer Eintrag hat früher jede Funktion getroffen, die
     ihn zufällig anfasst. Einmal beim Start aussortieren ist ehrlicher.

     Bewusst eine Positivliste: Nicht alles unter mathe9.* ist JSON — die
     Geräte-ID, der Anzeigename und die dev-Schalter sind reiner Text und
     dürfen nicht daran scheitern, dass sie sich nicht parsen lassen. */
  const JSON_PRAEFIXE = ['mathe9.stand.', 'mathe9.fehler', 'mathe9.lesezeichen', 'mathe9.tracker.queue'];
  /* Nur exakt: „mathe9.student_id" ist eine rohe UUID, „mathe9.student" JSON. */
  const JSON_GENAU = ['mathe9.student', 'mathe9.token', 'mathe9.spiral'];

  function unlesbaresVerwerfen() {
    if (!Speicher.nutzbar) return;
    const kaputt = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!JSON_GENAU.includes(k) && !JSON_PRAEFIXE.some(p => k.startsWith(p))) continue;
      try { JSON.parse(localStorage.getItem(k)); }
      catch { kaputt.push(k); }
    }
    kaputt.forEach(k => { Speicher.loesche(k); bericht.verworfen.push(k); });
  }

  function starten() {
    if (!Speicher.nutzbar) { bericht.schritte.push('Speicher nicht nutzbar — keine Migration'); return bericht; }

    unlesbaresVerwerfen();

    /* Ohne Marke: entweder ein frisch installiertes Gerät (dann ist nichts
       zu tun) oder ein Stand vor Einführung der Marke (dann bei 1 anfangen). */
    let von = Number(Speicher.lies(FORMAT_SCHLUESSEL, 0));
    if (!von) {
      const hatDaten = (() => {
        for (let i = 0; i < localStorage.length; i++) {
          if (String(localStorage.key(i) || '').startsWith('mathe9.')) return true;
        }
        return false;
      })();
      von = hatDaten ? 1 : FORMAT;
    }
    bericht.von = von;

    if (von > FORMAT) {
      bericht.schritte.push('Stand ' + von + ' ist neuer als diese Fassung — unverändert gelassen');
      return bericht;
    }

    while (von < FORMAT) {
      const schritt = MIGRATIONEN[von];
      if (!schritt) { bericht.schritte.push('Kein Schritt von ' + von + ' — abgebrochen'); break; }
      try { bericht.schritte.push(von + '→' + (von + 1) + ': ' + schritt()); }
      catch (e) {
        console.warn('[Mathe9 Migration] Schritt', von, 'fehlgeschlagen:', e);
        bericht.schritte.push(von + '→' + (von + 1) + ': fehlgeschlagen (' + e.message + ')');
      }
      von++;
      Speicher.schreib(FORMAT_SCHLUESSEL, von);
    }
    if (von >= FORMAT) Speicher.schreib(FORMAT_SCHLUESSEL, FORMAT);
    return bericht;
  }

  return { format: FORMAT, bericht: () => bericht, starten };
})();

LokalerStand.starten();

/* ---------- Bearbeitungsstand ----------
   Der DOM-Parkmechanismus rettet den Zustand beim kurzen Sprung zur
   Erklärung. Beim Neuladen, beim Schließen des Tabs oder beim Wechsel in
   eine andere Einheit war er bisher weg. Hier liegt der dauerhafte Stand:
   je Schüler und Einheit, im localStorage dieses Geräts.

   Bewusst lokal: Es sind Zwischenstände, keine Leistungsdaten. Was an das
   Dashboard geht, entscheidet weiterhin tracker.js. */
const Stand = (() => {
  const PRAEFIX = 'mathe9.stand.';
  const ZULETZT_ALT = 'mathe9.stand.zuletzt';
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

  function zuletztSchluessel() {
    return PRAEFIX + wer() + '.zuletzt';
  }

  function zuletztLesen() {
    const aktuell = Speicher.lies(zuletztSchluessel(), null);
    if (aktuell) return aktuell;
    /* Ältere Fassungen speicherten den letzten Ort geräteweit. Nur beim
       lokalen, nicht angemeldeten Profil wird dieser Wert einmal übernommen;
       bei Schülerkonten könnte er sonst von einem anderen Kind stammen. */
    if (wer() !== 'lokal') return null;
    const alt = Speicher.lies(ZULETZT_ALT, null);
    if (alt) {
      Speicher.schreib(zuletztSchluessel(), alt);
      Speicher.loesche(ZULETZT_ALT);
    }
    return alt;
  }

  /* ---------- Format des gespeicherten Standes ----------
     Speicherformate ändern sich; alte Stände auf den Geräten bleiben. Ohne
     Versionsnummer müsste man sie beim nächsten Umbau wegwerfen — mit ihr
     lassen sie sich überführen. Jede Migration ist ein Schritt von n auf
     n+1, damit auch ein zwei Fassungen alter Stand ankommt. */
  const FORMAT = 2;

  const MIGRATIONEN = {
    /* 1 → 2: „fertig" (abgeschlossene Pfade) kam neu dazu. Ältere Stände
       kannten das Feld nicht; ein leeres Feld ist die richtige Annahme. */
    1(d) {
      return { ...d, fertig: Array.isArray(d.fertig) ? d.fertig : [] };
    }
  };

  function migriere(d, einheit) {
    let stand = d;
    let von = Number(stand.version) || 1;
    while (von < FORMAT) {
      const schritt = MIGRATIONEN[von];
      if (!schritt) return null;             // Lücke in der Kette: lieber verwerfen
      try { stand = schritt(stand); }
      catch (e) { console.warn('[Mathe9 Stand] Migration', von, 'fehlgeschlagen:', e); return null; }
      von++;
    }
    if (stand !== d) {
      stand.version = FORMAT;
      Speicher.schreib(schluessel(einheit), stand);
    }
    return stand;
  }

  /* Nach dem Abmelden darf nichts mehr geschrieben werden. Sonst landet
     ein entprellter Speichervorgang, der noch vom vorherigen Kind stammt,
     nach dem Löschen erneut auf der Platte — unter der Kennung „lokal",
     weil die Anmeldung inzwischen weg ist. Genau so sah das nächste Kind
     am selben Gerät den Zwischenstand des vorherigen. */
  let gesperrt = false;

  return {
    kennung: wer,
    format: FORMAT,
    sperren() { gesperrt = true; },
    lies(einheit) {
      const d = Speicher.lies(schluessel(einheit), null);
      if (!d || !d.ts) return null;
      if (Date.now() - d.ts > HALTBAR_TAGE * 86400000) { this.loesche(einheit); return null; }
      /* Neuer als diese Fassung? Dann stammt er von einem späteren Stand
         der Anwendung — nicht raten, sondern ignorieren. */
      if (Number(d.version) > FORMAT) return null;
      return migriere(d, einheit);
    },
    schreib(einheit, daten) {
      if (gesperrt) return;
      const satz = { ...daten, version: FORMAT, ts: Date.now() };
      Speicher.schreib(schluessel(einheit), satz);
      /* Zusätzlich der zuletzt bearbeitete Ort — davon lebt die Kachel
         „Weiterlernen" auf der Startseite. */
      Speicher.schreib(zuletztSchluessel(), {
        einheit, ts: satz.ts,
        pfad: satz.pfad, index: satz.index, gesamt: satz.gesamt,
        titel: satz.titel || ''
      });
    },
    loesche(einheit) {
      Speicher.loesche(schluessel(einheit));
      const z = zuletztLesen();
      if (z && String(z.einheit).toLowerCase() === String(einheit).toLowerCase()) {
        Speicher.loesche(zuletztSchluessel());
      }
    },
    zuletzt() {
      const z = zuletztLesen();
      if (!z || !z.ts) return null;
      if (Date.now() - z.ts > HALTBAR_TAGE * 86400000) {
        Speicher.loesche(zuletztSchluessel());
        return null;
      }
      return z;
    },

    /* Lernstatus einer Einheit für Inhaltsverzeichnis und Startseite:
         'offen'      · noch nicht begonnen
         'begonnen'   · angefangen, kein Pfad fertig
         'fertig'     · mindestens ein Pfad abgeschlossen
         'wiederholen'· abgeschlossen, aber länger als 21 Tage her
       Die Schwierigkeiten kommen nicht von hier, sondern aus dem
       Fehlerprofil — siehe `schwierigkeiten()` weiter unten. */
    status(einheit) {
      const d = this.lies(einheit);
      if (!d) return 'offen';
      const fertig = (d.fertig || []).length > 0;
      if (fertig && Date.now() - d.ts > 21 * 86400000) return 'wiederholen';
      if (fertig) return 'fertig';
      if ((d.geloest || []).length || d.index > 0) return 'begonnen';
      return 'offen';
    }
  };
})();

/* Häufige Denkfehler der letzten zwei Wochen — für das Ausrufezeichen im
   Inhaltsverzeichnis. Ab drei Treffern derselben ID wird es angezeigt. */
function schwierigkeiten(schwelle = 3) {
  try { return fehlerProfil(14).filter(f => f.anzahl >= schwelle); }
  catch { return []; }
}

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
    spaeter.addEventListener('click', () => {
      leiste.remove();
      document.body.classList.remove('m9-update');
    });
    leiste.append(text, jetzt, spaeter);
    document.body.appendChild(leiste);
    /* Solange die Leiste da ist, tritt der Benutzer-Chip zurück — er lag
       sonst genau über dem Knopf. */
    document.body.classList.add('m9-update');
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

  /* Übernimmt die neue Fassung, laden alle Tabs einmal neu.

     Wichtig ist das „neue": Bei der ERSTEN Installation übernimmt der
     Service Worker die Seite ebenfalls (clients.claim im activate) — und
     löste bis V29 denselben Reload aus. Wer die Seite zum ersten Mal
     öffnete, sah sie also grundlos neu laden; wer gerade tippte, verlor
     dabei die Eingabe. Ein Controllerwechsel zählt deshalb nur, wenn
     vorher schon einer da war. */
  const hatteController = Boolean(navigator.serviceWorker.controller);
  let laedtNeu = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hatteController || laedtNeu) return;
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

function fehlerSchluessel() {
  const kennung = typeof Stand !== 'undefined' && Stand.kennung ? Stand.kennung() : 'lokal';
  return 'mathe9.fehler.' + kennung;
}

function fehlerDaten() {
  const key = fehlerSchluessel();
  let p = Speicher.lies(key, null);
  /* Auch das alte Fehlerprofil war geräteweit. Es wird nur für das lokale
     Profil übernommen, niemals in ein angemeldetes Schülerkonto. */
  if (!p && key.endsWith('.lokal')) {
    p = Speicher.lies('mathe9.fehler', null);
    if (p) {
      Speicher.schreib(key, p);
      Speicher.loesche('mathe9.fehler');
    }
  }
  return p || {};
}

function merkeFehler(id) {
  if (!id) return;
  const p = fehlerDaten();
  p[id] = { anzahl: (p[id]?.anzahl || 0) + 1, zuletzt: Date.now() };
  Speicher.schreib(fehlerSchluessel(), p);
}

/* Fehler der letzten 14 Tage, häufigste zuerst */
function fehlerProfil(tage = 14) {
  const p = fehlerDaten();
  const grenze = Date.now() - tage * TAG;
  return Object.entries(p)
    .filter(([, v]) => v.zuletzt >= grenze)
    .sort((a, b) => b[1].anzahl - a[1].anzahl)
    .map(([id, v]) => ({ id, anzahl: v.anzahl }));
}
