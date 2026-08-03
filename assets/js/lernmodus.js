/* ============================================================
   lernmodus.js · Übungsmodus, Bewertungsmodus und aktive Lernzeit

   Der Modus und die offenen Lernzeitblöcke werden je Schülerprofil
   gespeichert. Das ist auf gemeinsam genutzten Geräten entscheidend:
   Freigaben oder noch nicht übertragene Sekunden eines Kindes dürfen nie
   beim nächsten Kind erscheinen.
   ============================================================ */

const Lernmodus = (() => {
  'use strict';

  const CONFIG = window.MATHE9_SUPABASE || {};
  const ZUSTAND_PRAEFIX = 'mathe9.lernmodus.';
  const ZEIT_PRAEFIX = 'mathe9.lernzeit.offen.';

  const RUHE_MS = 90000;
  const TAKT_MS = 5000;
  const MELDUNG_MS = 120000;
  const PRUEFUNG_MS = 180000;

  let aktuelleEinheit = null;
  let letzteAktivitaet = Date.now();
  let externOffen = false;
  let laeuft = false;
  let aktiveKennung = kennungLesen();
  let zustand = zustandLesen(aktiveKennung);

  function standardZustand() {
    return { modus: 'uebung', freigegeben: [], gilt_bis: null, lernzeit_heute: 0, geprueft: 0 };
  }

  function lies(schluessel, standard) {
    try {
      const wert = localStorage.getItem(schluessel);
      return wert == null ? standard : JSON.parse(wert);
    } catch { return standard; }
  }

  function schreib(schluessel, wert) {
    try { localStorage.setItem(schluessel, JSON.stringify(wert)); }
    catch { /* privater/gesperrter Speicher */ }
  }

  function loesche(schluessel) {
    try { localStorage.removeItem(schluessel); } catch { /* egal */ }
  }

  function student() {
    return window.Mathe9StudentLogin?.get?.() || window.MATHE9_STUDENT || null;
  }

  function kennungLesen() {
    const id = student()?.student_id || student()?.login_name || 'lokal';
    return String(id).replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  function zustandSchluessel(kennung) { return ZUSTAND_PRAEFIX + kennung; }
  function zeitSchluessel(kennung) { return ZEIT_PRAEFIX + kennung; }

  function zustandLesen(kennung) {
    const wert = lies(zustandSchluessel(kennung), standardZustand());
    return {
      ...standardZustand(),
      ...wert,
      freigegeben: Array.isArray(wert?.freigegeben) ? wert.freigegeben : []
    };
  }

  function zeitLesen(kennung = aktiveKennung) {
    const roh = lies(zeitSchluessel(kennung), {});
    const sauber = {};
    if (roh && typeof roh === 'object' && !Array.isArray(roh)) {
      for (const [unit, sekunden] of Object.entries(roh)) {
        const n = Number(sekunden);
        if (Number.isFinite(n) && n > 0) sauber[String(unit || '—')] = Math.min(n, 86400);
      }
    }
    return sauber;
  }

  function zeitSchreiben(kennung, bloecke) {
    const hatWerte = Object.values(bloecke || {}).some(v => Number(v) > 0);
    if (hatWerte) schreib(zeitSchluessel(kennung), bloecke);
    else loesche(zeitSchluessel(kennung));
  }

  function profilAbgleichen({ erzwingen = false } = {}) {
    const neu = kennungLesen();
    if (!erzwingen && neu === aktiveKennung) return false;
    aktiveKennung = neu;
    zustand = zustandLesen(aktiveKennung);
    return true;
  }

  /* Alte V30-Schlüssel waren geräteweit. Sie werden bewusst nicht einem
     beliebigen aktuell angemeldeten Kind zugeordnet. Das würde Freigaben
     und Lernzeit zwischen Schülern vermischen. */
  loesche('mathe9.lernmodus');
  loesche('mathe9.lernzeit.offen');

  function konfiguriert() {
    return Boolean(CONFIG.enabled && CONFIG.url && CONFIG.anonKey);
  }

  function entwicklerfrei() {
    return CONFIG.devMode === true &&
      (CONFIG.skipStudentLogin === true || CONFIG.devSupabaseDisabled === true);
  }

  function kopf() {
    const key = String(CONFIG.anonKey || '').trim();
    const h = { 'Content-Type': 'application/json', apikey: key };
    if (key && !key.startsWith('sb_publishable_')) h.Authorization = `Bearer ${key}`;
    const token = window.Mathe9StudentLogin?.token?.() || window.MATHE9_TOKEN || null;
    if (token) h['x-mathe9-token'] = token;
    return h;
  }

  async function rpc(name, koerper = {}, wiederholen = true) {
    if (window.Mathe9StudentLogin?.ensureToken) {
      await window.Mathe9StudentLogin.ensureToken({ force: false });
    }
    const basis = String(CONFIG.url || '').replace(/\/+$/, '');
    const antwort = await fetch(`${basis}/rest/v1/rpc/${name}`, {
      method: 'POST', headers: kopf(), body: JSON.stringify(koerper), cache: 'no-store'
    });
    if (!antwort.ok) {
      if (wiederholen && (antwort.status === 401 || antwort.status === 403)
          && window.Mathe9StudentLogin?.ensureToken) {
        await window.Mathe9StudentLogin.ensureToken({ force: true });
        return rpc(name, koerper, false);
      }
      const fehler = new Error((await antwort.text()).trim() || `HTTP ${antwort.status}`);
      fehler.status = antwort.status;
      throw fehler;
    }
    const daten = await antwort.json();
    return Array.isArray(daten) ? daten[0] : daten;
  }

  async function aktualisieren({ erzwingen = false } = {}) {
    const gewechselt = profilAbgleichen();
    if (!student() || !konfiguriert() || entwicklerfrei()) return zustand;
    if (!navigator.onLine) return zustand;
    if (!erzwingen && !gewechselt && Date.now() - (zustand.geprueft || 0) < PRUEFUNG_MS) {
      return zustand;
    }

    try {
      const zeile = await rpc('mathe9_lernmodus');
      if (zeile) {
        zustand = {
          modus: zeile.modus === 'bewertung' ? 'bewertung' : 'uebung',
          gilt_bis: zeile.gilt_bis || null,
          freigegeben: (zeile.freigegeben || []).map(u => String(u).toLowerCase()),
          lernzeit_heute: Number(zeile.lernzeit_heute) || 0,
          geprueft: Date.now()
        };
        schreib(zustandSchluessel(aktiveKennung), zustand);
        window.dispatchEvent(new CustomEvent('mathe9:lernmodus', { detail: { ...zustand } }));
      }
    } catch (fehler) {
      console.warn('[Mathe9 Lernmodus] nicht abrufbar:', fehler.message);
    }
    return zustand;
  }

  function darfOeffnen(einheit) {
    profilAbgleichen();
    if (entwicklerfrei() || !konfiguriert()) return { erlaubt: true, grund: 'entwicklung' };

    /* Ein abgelaufener Bewertungsmodus fällt auch offline in den offenen
       Zustand zurück. V30 prüfte das nur serverseitig und konnte ein Gerät
       ohne Netz deshalb unnötig weiter sperren. */
    if (zustand.modus === 'bewertung' && zustand.gilt_bis) {
      const ende = new Date(zustand.gilt_bis).getTime();
      if (Number.isFinite(ende) && ende <= Date.now()) {
        zustand = { ...zustand, modus: 'uebung', freigegeben: [] };
        schreib(zustandSchluessel(aktiveKennung), zustand);
      }
    }

    if (zustand.modus !== 'bewertung') return { erlaubt: true, grund: 'uebungsmodus' };
    const id = String(einheit || '').toLowerCase();
    if (!id) return { erlaubt: true, grund: 'ohne einheit' };
    if ((zustand.freigegeben || []).includes(id)) return { erlaubt: true, grund: 'freigegeben' };

    try {
      if (typeof Stand !== 'undefined' && Stand.status && Stand.status(id) !== 'offen') {
        return { erlaubt: true, grund: 'begonnen' };
      }
    } catch { /* ohne Stand */ }

    return { erlaubt: false, grund: 'gesperrt' };
  }

  function uebungsblattPfad(einheit) {
    const id = String(einheit || '').toLowerCase();
    const bereich = id.split('-')[0];
    return `units/${bereich}/${id}/uebungsblatt.pdf`;
  }

  function sperreAnzeigen(einheit, ziel) {
    const kasten = document.createElement('div');
    kasten.className = 'lernsperre';
    kasten.setAttribute('role', 'status');

    const h = document.createElement('h2');
    h.textContent = 'Diese Einheit ist noch nicht freigegeben';
    const p = document.createElement('p');
    p.textContent = 'Im Unterricht geht es weiter, wenn deine Lehrkraft das '
      + 'Übungsblatt der letzten Einheit gesehen hat. Zeig ihr, was du von Hand '
      + 'gerechnet hast — danach wird hier freigeschaltet.';
    const p2 = document.createElement('p');
    p2.className = 'lernsperre-klein';
    p2.textContent = 'Nach dem Unterricht kannst du frei weiterarbeiten.';

    const zurueck = document.createElement('a');
    zurueck.className = 'btn btn-haupt';
    zurueck.href = 'index.html';
    zurueck.textContent = 'Zur Übersicht';

    const blatt = document.createElement('a');
    blatt.className = 'btn btn-neben';
    blatt.href = uebungsblattPfad(einheit);
    blatt.target = '_blank';
    blatt.rel = 'noopener noreferrer';
    blatt.textContent = 'Übungsblatt dieser Einheit öffnen';

    const knoepfe = document.createElement('div');
    knoepfe.className = 'aktionen';
    knoepfe.append(zurueck, blatt);
    kasten.append(h, p, p2, knoepfe);
    (ziel || document.querySelector('main') || document.body).replaceChildren(kasten);
  }

  function aktivitaet(quelle) {
    letzteAktivitaet = Date.now();
    if (quelle === 'extern-auf') externOffen = true;
    if (quelle === 'extern-zu') externOffen = false;
  }

  function istAktiv() {
    if (document.visibilityState !== 'visible') return false;
    const grenze = externOffen ? RUHE_MS * 10 : RUHE_MS;
    return Date.now() - letzteAktivitaet < grenze;
  }

  function einheitNormiert() {
    return String(aktuelleEinheit || '—').trim().toLowerCase() || '—';
  }

  function takt() {
    profilAbgleichen();
    if (!student() || !konfiguriert() || entwicklerfrei() || !istAktiv()) return;
    const bloecke = zeitLesen();
    const unit = einheitNormiert();
    bloecke[unit] = (Number(bloecke[unit]) || 0) + TAKT_MS / 1000;
    zeitSchreiben(aktiveKennung, bloecke);
  }

  async function melden() {
    profilAbgleichen();
    if (!student() || !konfiguriert() || entwicklerfrei() || !navigator.onLine) return;
    const kennungBeimStart = aktiveKennung;
    const snapshot = zeitLesen(kennungBeimStart);

    for (const [unit, offen] of Object.entries(snapshot)) {
      const menge = Math.min(Math.floor(Number(offen) || 0), 900);
      if (menge < 5) continue;
      try {
        await rpc('mathe9_lernzeit_melden', { p_unit: unit, p_sekunden: menge });
        const aktuell = zeitLesen(kennungBeimStart);
        aktuell[unit] = Math.max(0, (Number(aktuell[unit]) || 0) - menge);
        if (aktuell[unit] < 1) delete aktuell[unit];
        zeitSchreiben(kennungBeimStart, aktuell);
      } catch (fehler) {
        console.warn('[Mathe9 Lernzeit] Meldung fehlgeschlagen:', fehler.message);
        break;
      }
    }
  }

  function starten(einheit) {
    aktuelleEinheit = einheit || null;
    profilAbgleichen({ erzwingen: true });
    if (laeuft) return aktualisieren({ erzwingen: true });
    laeuft = true;

    ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel'].forEach(art => {
      addEventListener(art, () => aktivitaet(art), { passive: true });
    });
    addEventListener('scroll', () => aktivitaet('scroll'), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') aktivitaet('sichtbar');
      else melden();
    });
    addEventListener('pagehide', () => { melden(); });
    addEventListener('online', () => { melden(); aktualisieren({ erzwingen: true }); });
    addEventListener('mathe9:student-ready', () => {
      profilAbgleichen({ erzwingen: true });
      aktualisieren({ erzwingen: true });
    });

    setInterval(takt, TAKT_MS);
    setInterval(melden, MELDUNG_MS);
    setInterval(() => aktualisieren(), PRUEFUNG_MS);
    return aktualisieren({ erzwingen: true });
  }

  function offeneSekunden() {
    return Object.values(zeitLesen()).reduce((summe, wert) => summe + (Number(wert) || 0), 0);
  }

  return {
    starten,
    aktualisieren,
    darfOeffnen,
    sperreAnzeigen,
    uebungsblattPfad,
    aktivitaet,
    vorAbmelden: melden,
    zustand: () => ({
      ...zustand,
      offene_sekunden: offeneSekunden(),
      extern_offen: externOffen,
      profil: aktiveKennung
    })
  };
})();

window.Lernmodus = Lernmodus;
