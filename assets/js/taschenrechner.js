/* ============================================================
   taschenrechner.js · Vollbildrechner neben der laufenden Aufgabe

   Die Regel aus der Anforderung, wörtlich genommen: Bei eingeblendetem
   Rechner ist alles ausgeblendet außer der zuletzt gewählten Aufgabe samt
   Eingabefeld und der Rechneroberfläche. Breite und Höhe betragen 100 %,
   Scrollen ist weder möglich noch nötig.

   Zwei Entscheidungen, die daraus folgen:

   1. Die Aufgabe wird NICHT kopiert, sondern bleibt, wo sie ist. Ein
      Klon hätte eigene Eingabefelder — und engine.js sucht seine Werte
      über `#buehne .zahl-feld`. Mit zwei Sätzen Feldern prüfte der Knopf
      „Prüfen" den falschen. Ausgeblendet wird deshalb per CSS, und die
      Aufgabe selbst rührt niemand an.

   2. „Kein Scrollen nötig" ist eine Zusage, die man messen muss. Nach
      jedem Öffnen und bei jeder Größenänderung wird geprüft, ob die
      Aufgabe in ihre Spalte passt; wenn nicht, verkleinert sich die
      Schrift schrittweise. Erst wenn auch das nicht reicht, weicht die
      Abbildung. Der Text der Aufgabe bleibt immer vollständig sichtbar.

   Rechnen ohne eval: Die Inhaltssicherheitsregel der Seite verbietet
   `unsafe-eval`, und selbst ohne sie wäre eval hier falsch. Der Rechner
   bringt seinen eigenen kleinen Parser mit.
   ============================================================ */

const Taschenrechner = (() => {
  'use strict';

  const KLASSE_OFFEN = 'rechner-offen';
  const FOKUS_ATTR = 'data-rechner-fokus';
  const SPEICHER_SCHLUESSEL = 'mathe9.rechner.verlauf';

  let wurzel = null;          // die Rechneroberfläche
  let anzeigeEingabe = null;  // Zeile mit dem getippten Ausdruck
  let anzeigeErgebnis = null; // Zeile mit dem Ergebnis
  let verlaufsBox = null;
  let knopf = null;           // der Aufrufknopf am Bildschirmrand
  let offen = false;
  let ausdruck = '';
  let letztesErgebnis = null;
  let verlauf = [];
  let fokusVorher = null;
  let nachAuswertung = false;   // nach '=': Zahl beginnt neu, Operator rechnet weiter

  /* ============================================================
     1 · Rechnen
     Grammatik:  summe → produkt → potenz → vorzeichen → primär
     Erlaubt: + − · : ( ) , . Zahlen, √, π, ², ^, % (als „von hundert")
     ============================================================ */

  function tokenisiere(text) {
    const marken = [];
    let i = 0;
    const s = String(text)
      .replace(/−/g, '-')   /* typografisches Minus */
      .replace(/[·×]/g, '*')
      .replace(/[:÷]/g, '/')
      .replace(/,/g, '.');

    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const zahl = Number(s.slice(i, j));
        if (!Number.isFinite(zahl)) throw new Error('Das ist keine Zahl: ' + s.slice(i, j));
        marken.push({ art: 'zahl', wert: zahl });
        i = j; continue;
      }
      if (c === 'π') { marken.push({ art: 'zahl', wert: Math.PI }); i++; continue; }
      if (c === '√') { marken.push({ art: 'op', wert: '√' }); i++; continue; }
      if (c === '²') { marken.push({ art: 'op', wert: '²' }); i++; continue; }
      if ('+-*/()^%'.includes(c)) { marken.push({ art: 'op', wert: c }); i++; continue; }
      throw new Error('Damit kann ich nicht rechnen: ' + c);
    }
    return marken;
  }

  function rechne(text) {
    const t = tokenisiere(text);
    let i = 0;
    const schau = () => t[i];
    const nimm = () => t[i++];

    function primaer() {
      const k = nimm();
      if (!k) throw new Error('Da fehlt noch etwas.');
      if (k.art === 'zahl') return nachstellig(k.wert);
      if (k.wert === '(') {
        const v = summe();
        const zu = nimm();
        if (!zu || zu.wert !== ')') throw new Error('Eine Klammer ist nicht geschlossen.');
        return nachstellig(v);
      }
      if (k.wert === '√') return Math.sqrt(vorzeichen());
      throw new Error('Unerwartet: ' + k.wert);
    }

    /* Zeichen, die HINTER der Zahl stehen: 5² und 20 %. Das Prozentzeichen
       teilt schlicht durch hundert — genau so, wie es im Unterricht
       eingeführt wird (25 % = 0,25). */
    function nachstellig(v) {
      let wert = v;
      while (schau() && (schau().wert === '²' || schau().wert === '%')) {
        wert = nimm().wert === '²' ? wert * wert : wert / 100;
      }
      return wert;
    }

    /* Potenzen binden stärker als ein führendes Vorzeichen. Damit gilt
       die übliche mathematische Lesart -2^2 = -(2^2) = -4. Der Exponent
       wird wiederum als Vorzeichenausdruck gelesen, damit 2^-2 und
       2^3^2 weiterhin funktionieren. */
    function potenz() {
      const basis = primaer();
      if (schau() && schau().wert === '^') { nimm(); return Math.pow(basis, vorzeichen()); }
      return basis;
    }

    function vorzeichen() {
      if (schau() && schau().wert === '-') { nimm(); return -vorzeichen(); }
      if (schau() && schau().wert === '+') { nimm(); return vorzeichen(); }
      if (schau() && schau().wert === '√') { nimm(); return Math.sqrt(vorzeichen()); }
      return potenz();
    }

    function produkt() {
      let v = vorzeichen();
      while (schau() && (schau().wert === '*' || schau().wert === '/')) {
        const op = nimm().wert;
        const r = vorzeichen();
        if (op === '/' && r === 0) throw new Error('Durch null darf man nicht teilen.');
        v = op === '*' ? v * r : v / r;
      }
      return v;
    }

    function summe() {
      let v = produkt();
      while (schau() && (schau().wert === '+' || schau().wert === '-')) {
        const op = nimm().wert;
        const r = produkt();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }

    const wert = summe();
    if (i < t.length) throw new Error('Das gehört nicht mehr dazu: ' + t[i].wert);
    if (!Number.isFinite(wert)) throw new Error('Das ergibt keine Zahl.');
    return wert;
  }

  /* Deutsche Schreibweise, aber ohne Tausenderpunkte: Was hier steht,
     soll sich unverändert ins Antwortfeld übernehmen lassen. */
  function formatiere(x) {
    if (!Number.isFinite(x)) return '—';
    const gerundet = Math.round(x * 1e9) / 1e9;
    if (Number.isInteger(gerundet)) return String(gerundet).replace('-', '−');
    return String(gerundet).replace('.', ',').replace('-', '−');
  }

  /* Was ins Eingabefeld der Aufgabe geschrieben wird: dieselbe Zahl,
     aber mit gewöhnlichem Minus — engine.js liest das zuverlässiger. */
  function fuerFeld(x) {
    if (!Number.isFinite(x)) return '';
    const gerundet = Math.round(x * 1e9) / 1e9;
    return String(gerundet).replace('.', ',');
  }

  /* ============================================================
     2 · Oberfläche
     ============================================================ */

  const TASTEN = [
    ['C', 'loeschen', 'funktion'], ['(', 'zeichen', 'funktion'], [')', 'zeichen', 'funktion'], ['←', 'zurueck', 'funktion'],
    ['7', 'zeichen', ''], ['8', 'zeichen', ''], ['9', 'zeichen', ''], [':', 'zeichen', 'op'],
    ['4', 'zeichen', ''], ['5', 'zeichen', ''], ['6', 'zeichen', ''], ['·', 'zeichen', 'op'],
    ['1', 'zeichen', ''], ['2', 'zeichen', ''], ['3', 'zeichen', ''], ['−', 'zeichen', 'op'],
    ['0', 'zeichen', ''], [',', 'zeichen', ''], ['±', 'vorzeichen', ''], ['+', 'zeichen', 'op'],
    ['√', 'zeichen', 'wiss'], ['x²', 'quadrat', 'wiss'], ['π', 'zeichen', 'wiss'], ['%', 'zeichen', 'wiss'],
    ['^', 'zeichen', 'wiss'], ['1/x', 'kehrwert', 'wiss'], ['Ans', 'ans', 'wiss'], ['=', 'gleich', 'gleich']
  ];

  function el(tag, klasse, text) {
    const n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text != null) n.textContent = text;
    return n;
  }

  function bauen() {
    if (wurzel) return wurzel;

    wurzel = el('div', 'tr');
    wurzel.id = 'taschenrechner';
    wurzel.setAttribute('role', 'dialog');
    wurzel.setAttribute('aria-label', 'Taschenrechner');
    wurzel.setAttribute('aria-modal', 'false');
    wurzel.hidden = true;

    const kopf = el('div', 'tr-kopf');
    kopf.append(el('span', 'tr-titel', 'Taschenrechner'));
    const zu = el('button', 'tr-schliessen', '✕');
    zu.type = 'button';
    zu.setAttribute('aria-label', 'Taschenrechner schließen (Esc)');
    zu.addEventListener('click', () => schliessen());
    kopf.append(zu);
    wurzel.append(kopf);

    verlaufsBox = el('div', 'tr-verlauf');
    verlaufsBox.setAttribute('aria-label', 'Bisherige Rechnungen');
    wurzel.append(verlaufsBox);

    const anzeige = el('div', 'tr-anzeige');
    anzeigeEingabe = el('div', 'tr-eingabe');
    anzeigeEingabe.setAttribute('aria-live', 'off');
    anzeigeErgebnis = el('div', 'tr-ergebnis');
    anzeigeErgebnis.setAttribute('role', 'status');
    anzeige.append(anzeigeEingabe, anzeigeErgebnis);
    wurzel.append(anzeige);

    const feld = el('div', 'tr-tasten');
    TASTEN.forEach(([beschriftung, aktion, extra]) => {
      const b = el('button', 'tr-taste' + (extra ? ' tr-' + extra : ''), beschriftung);
      b.type = 'button';
      b.dataset.aktion = aktion;
      b.dataset.wert = beschriftung;
      b.addEventListener('click', () => taste(aktion, beschriftung));
      feld.append(b);
    });
    wurzel.append(feld);

    const fuss = el('div', 'tr-fuss');
    const uebernehmen = el('button', 'tr-uebernehmen', 'Ergebnis ins Antwortfeld');
    uebernehmen.type = 'button';
    uebernehmen.id = 'tr-uebernehmen';
    uebernehmen.addEventListener('click', ergebnisUebernehmen);
    fuss.append(uebernehmen);
    wurzel.append(fuss);

    document.body.append(wurzel);
    verlaufZeichnen();
    return wurzel;
  }

  function knopfBauen() {
    if (knopf) return knopf;
    knopf = el('button', 'tr-aufruf');
    knopf.type = 'button';
    knopf.id = 'tr-aufruf';
    knopf.innerHTML = '<span class="tr-aufruf-symbol" aria-hidden="true">🖩</span><span class="tr-aufruf-text">Rechner</span>';
    knopf.setAttribute('aria-label', 'Taschenrechner einblenden (Taste R)');
    knopf.setAttribute('aria-expanded', 'false');
    knopf.title = 'Taschenrechner einblenden — Taste R oder Alt + R';
    knopf.addEventListener('click', () => umschalten());
    document.body.append(knopf);
    return knopf;
  }

  /* ============================================================
     3 · Tastenlogik
     ============================================================ */

  function taste(aktion, wert) {
    /* Nach '=' beginnt eine Zahl bzw. Konstante eine neue Rechnung.
       Operatoren, Quadrat, Kehrwert, Vorzeichen und Rücktaste arbeiten
       dagegen am Ergebnis weiter. Das entspricht der Beschriftung und dem
       Verhalten eines üblichen Schulrechners; zuvor wurde aus 2+3=, dann 4
       fälschlich 54. */
    if (nachAuswertung && aktion !== 'gleich') {
      const fortsetzen =
        (aktion === 'zeichen' && ['+', '−', '·', ':', '^', '%'].includes(wert)) ||
        ['quadrat', 'kehrwert', 'vorzeichen', 'zurueck'].includes(aktion);
      if (!fortsetzen) ausdruck = '';
      nachAuswertung = false;
    }

    switch (aktion) {
      case 'zeichen':
        ausdruck += wert === ',' ? ',' : wert;
        break;
      case 'quadrat':
        ausdruck += '²';
        break;
      case 'zurueck':
        ausdruck = ausdruck.slice(0, -1);
        break;
      case 'loeschen':
        ausdruck = '';
        nachAuswertung = false;
        anzeigeErgebnis.textContent = '';
        anzeigeErgebnis.className = 'tr-ergebnis';
        break;
      case 'vorzeichen':
        /* Kein Umschalten am Gesamtausdruck, sondern an der zuletzt
           getippten Zahl — sonst wird aus 12 + 5 plötzlich −(12 + 5). */
        ausdruck = vorzeichenWechseln(ausdruck);
        break;
      case 'kehrwert':
        ausdruck = ausdruck ? '1:(' + ausdruck + ')' : '1:';
        break;
      case 'ans':
        if (letztesErgebnis != null) ausdruck += fuerFeld(letztesErgebnis).replace(',', ',');
        break;
      case 'gleich':
        auswerten();
        return;
      default:
        break;
    }
    anzeigen();
  }

  function vorzeichenWechseln(text) {
    const treffer = text.match(/(−?)([0-9,]+)$/);
    if (!treffer) return text + '−';
    const vorne = text.slice(0, treffer.index);
    return vorne + (treffer[1] ? '' : '−') + treffer[2];
  }

  function anzeigen() {
    anzeigeEingabe.textContent = ausdruck || ' ';
    /* Mitlaufendes Zwischenergebnis, solange der Ausdruck aufgeht. Das
       ist der Unterschied zwischen „ich tippe blind" und „ich sehe, was
       ich tue" — und es fängt Vertipper früh ab. */
    if (!ausdruck.trim()) {
      anzeigeErgebnis.textContent = '';
      anzeigeErgebnis.className = 'tr-ergebnis';
      return;
    }
    try {
      const wert = rechne(ausdruck);
      anzeigeErgebnis.textContent = '= ' + formatiere(wert);
      anzeigeErgebnis.className = 'tr-ergebnis tr-vorschau';
    } catch {
      anzeigeErgebnis.textContent = '';
      anzeigeErgebnis.className = 'tr-ergebnis';
    }
  }

  function auswerten() {
    if (!ausdruck.trim()) return;
    try {
      const wert = rechne(ausdruck);
      letztesErgebnis = wert;
      anzeigeErgebnis.textContent = '= ' + formatiere(wert);
      anzeigeErgebnis.className = 'tr-ergebnis tr-fertig';
      verlauf.unshift({ ausdruck, ergebnis: formatiere(wert) });
      verlauf = verlauf.slice(0, 12);
      verlaufSpeichern();
      verlaufZeichnen();
      window.Tracker?.track?.('rechner_rechnung', {
        zeichen: ausdruck.length,
        unit: window.MATHE9_DIAGNOSE_STATE?.().unit || null
      });
      /* Der nächste Tastendruck beginnt eine neue Rechnung, ein Operator
         rechnet dagegen mit dem Ergebnis weiter. Das ist das Verhalten,
         das ein Taschenrechner aus dem Mathematikunterricht zeigt. */
      ausdruck = fuerFeld(wert).replace('-', '−');
      nachAuswertung = true;
    } catch (fehler) {
      anzeigeErgebnis.textContent = fehler.message;
      anzeigeErgebnis.className = 'tr-ergebnis tr-fehler';
    }
  }

  function verlaufSpeichern() {
    try { localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(verlauf)); }
    catch { /* gesperrter Speicher — der Verlauf ist Beiwerk */ }
  }

  function verlaufLesen() {
    try {
      const roh = JSON.parse(localStorage.getItem(SPEICHER_SCHLUESSEL) || '[]');
      return Array.isArray(roh) ? roh.slice(0, 12) : [];
    } catch { return []; }
  }

  function verlaufZeichnen() {
    if (!verlaufsBox) return;
    verlaufsBox.replaceChildren();
    if (!verlauf.length) {
      verlaufsBox.append(el('div', 'tr-verlauf-leer', 'Noch nichts gerechnet.'));
      return;
    }
    verlauf.forEach(eintrag => {
      const zeile = el('button', 'tr-verlauf-zeile');
      zeile.type = 'button';
      zeile.title = 'Diese Rechnung noch einmal aufnehmen';
      zeile.append(el('span', 'tr-verlauf-ausdruck', eintrag.ausdruck));
      zeile.append(el('span', 'tr-verlauf-ergebnis', '= ' + eintrag.ergebnis));
      zeile.addEventListener('click', () => { ausdruck = eintrag.ausdruck; anzeigen(); });
      verlaufsBox.append(zeile);
    });
  }

  /* ============================================================
     4 · Die Aufgabe, die sichtbar bleibt
     ============================================================ */

  /* Die „zuletzt ausgewählte Aufgabe" ist die Karte, in der die Engine
     gerade arbeitet. Sie enthält das Eingabefeld und den Prüfknopf. */
  function aufgabenKarte() {
    const buehne = document.querySelector('#buehne');
    if (!buehne) return null;
    const mitFeld = [...buehne.querySelectorAll('.karte')].reverse()
      .find(k => k.querySelector('.zahl-feld, .optionen, .slot, #pruefen'));
    return mitFeld || buehne.querySelector('.karte') || null;
  }

  function fokusSetzen() {
    document.querySelectorAll('[' + FOKUS_ATTR + ']')
      .forEach(n => n.removeAttribute(FOKUS_ATTR));
    const karte = aufgabenKarte();
    if (karte) karte.setAttribute(FOKUS_ATTR, '');
    return karte;
  }

  /* ---------- Einpassen ----------
     Solange die Aufgabe höher ist als ihre Spalte, wird die Schrift
     verkleinert. Reicht das bis zur Untergrenze nicht, weicht die
     Abbildung: Ein Bild, das man nicht ganz sieht, hilft ohnehin nicht,
     der Aufgabentext dagegen ist unverzichtbar. */
  function einpassen() {
    const karte = document.querySelector('[' + FOKUS_ATTR + ']');
    const spalte = document.querySelector('#buehne');
    if (!karte || !spalte) return;

    karte.style.removeProperty('--tr-skala');
    karte.classList.remove('tr-ohne-bild');

    const passt = () => karte.scrollHeight <= spalte.clientHeight
      && karte.scrollWidth <= spalte.clientWidth;

    if (passt()) return;

    for (let skala = 0.95; skala >= 0.62; skala -= 0.05) {
      karte.style.setProperty('--tr-skala', String(skala));
      if (passt()) return;
    }

    karte.classList.add('tr-ohne-bild');
    for (let skala = 0.95; skala >= 0.55; skala -= 0.05) {
      karte.style.setProperty('--tr-skala', String(skala));
      if (passt()) return;
    }
    /* Selbst dann noch zu groß: Die Untergrenze bleibt stehen. Lieber
       eine kleine Schrift als eine abgeschnittene Aufgabe. */
  }

  function ergebnisUebernehmen() {
    if (letztesErgebnis == null) {
      /* Noch kein „=" gedrückt? Dann zählt das, was gerade dasteht. */
      try { letztesErgebnis = rechne(ausdruck); }
      catch { return meldung('Erst rechnen — dann übernehmen.'); }
    }
    const karte = document.querySelector('[' + FOKUS_ATTR + ']') || aufgabenKarte();
    const felder = karte ? [...karte.querySelectorAll('.zahl-feld:not(.lk-luecke-feld)')] : [];
    if (!felder.length) return meldung('Diese Aufgabe hat kein Zahlenfeld.');

    /* Bei mehreren Feldern das zuletzt benutzte, sonst das erste leere,
       sonst das erste. Alles andere wäre Raten. */
    const ziel = felder.find(f => f === fokusVorher)
      || felder.find(f => !f.value.trim())
      || felder[0];
    ziel.value = fuerFeld(letztesErgebnis);
    ziel.dispatchEvent(new Event('input', { bubbles: true }));
    meldung('Übernommen: ' + formatiere(letztesErgebnis));
    window.Tracker?.track?.('rechner_uebernommen', {});
  }

  function meldung(text) {
    anzeigeErgebnis.textContent = text;
    anzeigeErgebnis.className = 'tr-ergebnis tr-hinweis';
  }

  /* ============================================================
     5 · Öffnen und Schließen
     ============================================================ */

  function oeffnen() {
    if (offen) return;
    bauen();
    const karte = fokusSetzen();
    if (!karte) {
      /* Ohne laufende Aufgabe gibt es nichts, was sichtbar bleiben müsste.
         Der Rechner öffnet trotzdem — nur eben allein. */
      document.documentElement.classList.add('rechner-ohne-aufgabe');
    }
    fokusVorher = document.activeElement?.classList?.contains('zahl-feld')
      ? document.activeElement : null;

    offen = true;
    wurzel.hidden = false;
    document.documentElement.classList.add(KLASSE_OFFEN);
    knopf?.setAttribute('aria-expanded', 'true');

    /* Erst nach dem Umschalten messen — vorher stimmen die Höhen nicht. */
    requestAnimationFrame(() => { einpassen(); requestAnimationFrame(einpassen); });

    anzeigen();
    window.Tracker?.track?.('rechner_geoeffnet', {
      unit: window.MATHE9_DIAGNOSE_STATE?.().unit || null,
      task: window.MATHE9_DIAGNOSE_STATE?.().task || null
    });
    window.Lernmodus?.aktivitaet?.('rechner');
  }

  function schliessen() {
    if (!offen) return;
    offen = false;
    wurzel.hidden = true;
    document.documentElement.classList.remove(KLASSE_OFFEN, 'rechner-ohne-aufgabe');
    knopf?.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('[' + FOKUS_ATTR + ']').forEach(n => {
      n.removeAttribute(FOKUS_ATTR);
      n.style.removeProperty('--tr-skala');
      n.classList.remove('tr-ohne-bild');
    });
    window.Tracker?.track?.('rechner_geschlossen', {});
    (fokusVorher || knopf)?.focus?.({ preventScroll: true });
  }

  function umschalten() { offen ? schliessen() : oeffnen(); }

  /* ============================================================
     6 · Tastatur
     „Sehr schnell einblenden" heißt: ohne zu zielen. R genügt, solange
     nicht gerade in ein Feld getippt wird; Alt + R und F2 wirken immer.
     ============================================================ */

  const ZEICHEN = {
    '*': '·', 'x': '·', '/': ':', '.': ',', 'p': 'π', 'q': '√'
  };

  function inEingabefeld(ziel) {
    return ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA'
      || ziel.isContentEditable);
  }

  function tastatur(e) {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); umschalten(); return; }
    if (e.key === 'F2') { e.preventDefault(); umschalten(); return; }

    if (!offen) {
      if ((e.key === 'r' || e.key === 'R') && !inEingabefeld(e.target)
          && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); oeffnen();
      }
      return;
    }

    if (e.key === 'Escape') { e.preventDefault(); schliessen(); return; }

    /* Bei geöffnetem Rechner darf trotzdem ins Antwortfeld getippt werden.
       Dann gehören die Tasten dem Feld, nicht dem Rechner. */
    if (inEingabefeld(e.target)) return;

    if (/^[0-9]$/.test(e.key)) { taste('zeichen', e.key); e.preventDefault(); return; }
    if ('+-'.includes(e.key)) { taste('zeichen', e.key === '-' ? '−' : '+'); e.preventDefault(); return; }
    if (e.key in ZEICHEN) { taste('zeichen', ZEICHEN[e.key]); e.preventDefault(); return; }
    if (e.key === ',' ) { taste('zeichen', ','); e.preventDefault(); return; }
    if ('()^%'.includes(e.key)) { taste('zeichen', e.key); e.preventDefault(); return; }
    if (e.key === 'Enter' || e.key === '=') { taste('gleich'); e.preventDefault(); return; }
    if (e.key === 'Backspace') { taste('zurueck'); e.preventDefault(); return; }
    if (e.key === 'Delete') { taste('loeschen'); e.preventDefault(); }
  }

  /* ============================================================
     7 · Start
     ============================================================ */

  function starten() {
    if (!document.querySelector('#buehne')) return;
    verlauf = verlaufLesen();
    knopfBauen();
    bauen();
    addEventListener('keydown', tastatur);
    addEventListener('resize', () => { if (offen) einpassen(); });
    addEventListener('orientationchange', () => { if (offen) requestAnimationFrame(einpassen); });

    /* Wechselt die Engine die Aufgabe, während der Rechner offen ist,
       muss die neue Karte sichtbar werden — sonst bliebe der Bildschirm
       leer, bis jemand schließt. */
    const beobachter = new MutationObserver(() => {
      if (!offen) return;
      fokusSetzen();
      requestAnimationFrame(einpassen);
    });
    beobachter.observe(document.querySelector('#buehne'), { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', starten, { once: true });
  } else starten();

  return { oeffnen, schliessen, umschalten, rechne, formatiere, istOffen: () => offen };
})();

window.Taschenrechner = Taschenrechner;
