/* ============================================================
   quiz.js · Abschlussquiz am Ende einer Lerneinheit

   Fünf Fragen, ausschließlich zum Inhalt DIESER Einheit und DIESES
   Pfades. Kein eigener Aufgabenbestand: Das Quiz wird aus dem
   zusammengesetzt, was in der `tasks.json` der Einheit ohnehin steht —
   Merksatz und Erklärung der gewählten Stufe, Formelkarte, Wortspeicher
   samt Worterklärungen und zwei Aufgaben aus dem Pool derselben Stufe.

   Warum kein eigener Fragenbestand?
   Eine zweite Fassung derselben Aussage ist ab der ersten Änderung an
   der Lernkarte falsch, ohne dass es jemand merkt. Ein Quiz, das aus der
   Einheit selbst entsteht, kann gar nicht abweichen — und es kann auch
   nichts abfragen, was in der Einheit nicht vorkam. Genau das ist hier
   die Bedingung: „bezogen ausschließlich auf den Stundeninhalt".

   Wer für eine Einheit dennoch eigene Fragen schreiben will, trägt sie in
   `quiz` der tasks.json ein (Feld ist im Schema vorgesehen); dann treten
   sie an die Stelle der erzeugten.

   Falsche Antwortmöglichkeiten werden nie erfunden. Bei Auswahlaufgaben
   sind es die Ablenker der Aufgabe, bei Rechenaufgaben bleibt das Feld
   frei — eine ausgedachte falsche Zahl trüge keine Fehlvorstellung und
   wäre für die Rückmeldung an die Lehrkraft wertlos.

   Gewertet wird der ERSTE Lauf je Kind und Einheit. Sonst entschiede die
   Zahl der Versuche über die Note. Die Regel steht als eindeutiger Index
   in der Datenbank, nicht nur hier — siehe supabase/setup.sql.

   Geprüft wird das alles von werkzeuge/quiz-pruefen.js, das dieselbe
   Datei in Node ausführt und für alle 54 Einheiten × 3 Pfade baut.
   ============================================================ */

const Quiz = (() => {
  'use strict';

  const ANZAHL = 5;
  const MINDESTENS = 3;

  /* ---------- kleine Helfer ---------- */

  function ce(tag, klasse, text) {
    const n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text != null) n.textContent = text;
    return n;
  }

  function normieren(t) {
    return String(t || '').toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
  }

  /* „der Grundwert" → „Grundwert". Der Artikel steht im Wortspeicher, weil
     das Genus zum Fachwort gehört; in einer Lücke stört er. */
  function ohneArtikel(wort) {
    return String(wort || '').replace(/^(der|die|das)\s+/i, '').trim();
  }

  /* Wortstamm für den Vergleich: „Grundwert" soll auch „Grundwerts"
     treffen, „Wert" aber nicht „Wertetabelle". Deshalb wird von vorn
     verglichen und nur der Wortanfang gekürzt, nie das ganze Wort. */
  function stamm(wort) {
    const w = normieren(ohneArtikel(wort));
    return w.length > 6 ? w.slice(0, w.length - 2) : w;
  }

  function mischen(liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Alle Fachwörter dieser Einheit: Wortspeicher und die Stichwörter der
     Worterklärungen. Beide Listen überschneiden sich, aber nicht ganz —
     und für eine Lücke zählt jedes Wort, das in der Einheit erklärt wurde. */
  function fachwoerter(daten) {
    const alle = [
      ...(daten.wortspeicher || []),
      ...Object.keys(daten.worterklaerungen || {})
    ].map(ohneArtikel).filter(w => w.length >= 3);
    const gesehen = new Set();
    return alle.filter(w => {
      const k = normieren(w);
      if (gesehen.has(k)) return false;
      gesehen.add(k);
      return true;
    });
  }

  /* Sprechsätze der Formelkarte tragen bereits Auslassungen: „Der Anteil
     ist … , das sind … Prozent." Aus so einem Satz noch eine Lücke zu
     schneiden ergäbe eine Frage mit drei Leerstellen, von denen nur eine
     gemeint ist. Solche Sätze bleiben deshalb draußen — sie sind
     Sprachhilfen, keine Prüfsätze. */
  function istPruefsatz(satz) {
    const s = String(satz || '');
    return !s.includes('…') && !s.includes('...');
  }

  /* ---------- Lücke in einen vorhandenen Satz schneiden ----------
     Gesucht wird ein Fachwort dieser Einheit, das im Satz vorkommt. Nur
     ganze Wörter: Ein Treffer mitten in einem längeren Wort würde eine
     Lücke erzeugen, die niemand füllen kann. Und nur Wörter, die genau
     einmal vorkommen — steht die Lösung nach dem Ausschneiden noch im
     Restsatz, ist die Frage keine Frage mehr. */
  function luecke(satz, begriffe) {
    const text = String(satz || '').trim();
    if (text.length < 25 || text.length > 300) return null;
    if (!istPruefsatz(text)) return null;

    /* Längere Begriffe zuerst: „Grundwert" ist die bessere Lücke als
       „Wert", wenn beide im Wortspeicher stehen. */
    const kandidaten = begriffe
      .filter(w => w.length >= 4)
      .slice()
      .sort((a, b) => b.length - a.length);

    const woerter = text.match(/[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*/g) || [];

    for (const begriff of kandidaten) {
      const s = stamm(begriff);
      const passende = woerter.filter(w => normieren(w).startsWith(s)
        && normieren(w).length <= s.length + 4);
      if (passende.length !== 1) continue;      // gar nicht oder mehrfach im Satz

      const treffer = passende[0];
      const stelle = text.indexOf(treffer);
      if (stelle < 0) continue;

      const vorne = text.slice(0, stelle);
      const hinten = text.slice(stelle + treffer.length);
      /* Letzte Sicherung: Auch ein anders gebeugtes Vorkommen verrät die
         Lösung. Dann lieber den nächsten Begriff nehmen. */
      if (normieren(vorne + hinten).includes(normieren(treffer))) continue;

      return { vorne, hinten, loesung: treffer };
    }
    return null;
  }

  /* Drei Ablenker aus dem Wortspeicher derselben Einheit. Ausgeschlossen
     wird, was im Satz ohnehin schon steht — sonst stünde die Lösung
     zweimal zur Wahl oder ein Ablenker wäre schon widerlegt. */
  function ablenker(daten, loesung, satz, anzahl = 3) {
    const sLoesung = stamm(loesung);
    const imSatz = normieren(satz);
    const frei = fachwoerter(daten)
      .filter(w => stamm(w) !== sLoesung)
      .filter(w => !imSatz.includes(normieren(w)));
    return mischen(frei).slice(0, anzahl);
  }

  function frageAusLuecke(satz, daten, art, herkunft) {
    const l = luecke(satz, fachwoerter(daten));
    if (!l) return null;
    const falsche = ablenker(daten, l.loesung, satz);
    if (falsche.length < 2) return null;

    const optionen = mischen([l.loesung, ...falsche]);
    return {
      typ: 'auswahl',
      art,
      frage: 'Welches Wort gehört in die Lücke?',
      satz: { vorne: l.vorne, hinten: l.hinten },
      optionen,
      antwort: optionen.indexOf(l.loesung),
      aufloesung: satz,
      herkunft
    };
  }

  /* ---------- 1 · Merksatz der gewählten Stufe ---------- */
  function merksatzFragen(daten, pfad) {
    const lk = daten.lernkarten?.[pfad] || {};
    const eine = frageAusLuecke(lk.merke || '', daten, 'merksatz', 'Merksatz dieser Einheit');
    return eine ? [eine] : [];
  }

  /* ---------- 2 · Ein Satz aus der Erklärung derselben Stufe ----------
     In Mathematik trägt der Merksatz oft nur Formeln („1/2 = 50 %") und
     kein Fachwort — daraus lässt sich keine Lücke schneiden. Die
     Erklärungsabsätze darüber tragen fast immer eines. Genommen wird der
     einzelne Satz, nicht der ganze Absatz: Eine Lücke in fünf Zeilen Text
     ist eine Suchaufgabe, keine Frage. */
  function erklaerungsFragen(daten, pfad) {
    const lk = daten.lernkarten?.[pfad] || {};
    const saetze = (lk.erklaerung || [])
      .flatMap(absatz => String(absatz).split(/(?<=[.!?])\s+/))
      .map(s => s.trim())
      .filter(s => s.length >= 40 && s.length <= 220);
    return mischen(saetze)
      .map(s => frageAusLuecke(s, daten, 'erklaerung', 'Erklärung deines Pfades'))
      .filter(Boolean);
  }

  /* ---------- 3 · Ein Satz von der Formelkarte ---------- */
  function formelFragen(daten) {
    const saetze = ((daten.formelkarte || {}).saetze || []).filter(istPruefsatz);
    return mischen(saetze)
      .map(s => frageAusLuecke(s, daten, 'formelkarte', 'Formelkarte dieser Einheit'))
      .filter(Boolean);
  }

  /* ---------- 4 · Worterklärung → Fachwort ----------
     Bewusst diese Richtung und nicht die umgekehrte: Für „Fachwort →
     Erklärung" bräuchte es drei weitere Erklärungen aus derselben
     Einheit; manche Einheiten führen nur zwei bis drei. Der Wortspeicher
     trägt dagegen immer mindestens vier Einträge. */
  function fachwortFragen(daten) {
    const erklaerungen = Object.entries(daten.worterklaerungen || {});
    return mischen(erklaerungen).map(([wort, erklaerung]) => {
      const falsche = ablenker(daten, wort, '', 3);
      if (falsche.length < 2) return null;
      const optionen = mischen([ohneArtikel(wort), ...falsche]);
      return {
        typ: 'auswahl',
        art: 'fachwort',
        frage: 'Welches Fachwort ist gemeint?',
        satz: { vorne: '„' + erklaerung + '“', hinten: '' },
        nurText: true,
        optionen,
        antwort: optionen.indexOf(ohneArtikel(wort)),
        aufloesung: ohneArtikel(wort) + ': ' + erklaerung,
        herkunft: 'Wortspeicher dieser Einheit'
      };
    }).filter(Boolean);
  }

  /* ---------- 5 · Aufgaben aus dem Pool derselben Einheit ----------
     Genommen wird, was auf diesem Pfad bearbeitet wurde, mit Vorrang für
     die hinteren Stufen (Frei und Transfer). Das ist ein Abruf, keine
     neue Anforderung: Wer eine Aufgabe zwanzig Minuten später noch einmal
     lösen kann, hat sie behalten — und genau das soll das Quiz messen.

     `multi` und `assign` bleiben draußen. Beide sind mehrteilig; eine
     halb richtige Antwort wäre weder als richtig noch als falsch zu
     verbuchen, und ein Quiz mit Teilpunkten ist kein kurzes Quiz mehr.

     Auswahlaufgaben mit nur zwei Möglichkeiten bleiben ebenfalls draußen.
     In der Einheit sind sie richtig — dort geht es um die Entscheidung
     selbst, und die Rückmeldung folgt sofort. In einem Quiz, das eine
     Note begründet, ist eine Frage mit zwei Möglichkeiten aber ein
     Münzwurf: Wer rät, hat 50 % richtig, und dieselbe Zahl steht dann im
     Dashboard wie bei einem Kind, das es kann. Im Pool sind das 13
     Aufgaben, fast alle auf Pfad A. */
  function aufgabeZuFrage(t) {
    if (t.type === 'choice' && Array.isArray(t.options) && t.options.length >= 3
        && Number.isInteger(t.answer)) {
      return {
        typ: 'auswahl',
        art: 'aufgabe',
        frage: t.prompt,
        optionen: t.options.slice(),
        antwort: t.answer,
        visual: t.visual || null,
        aufloesung: t.solution || '',
        misconceptions: t.misconceptions || [],
        herkunft: 'Aufgabe ' + t.id
      };
    }
    if (t.type === 'numeric' && typeof t.answer === 'number' && Number.isFinite(t.answer)) {
      return {
        typ: 'zahl',
        art: 'aufgabe',
        frage: t.prompt,
        antwort: t.answer,
        toleranz: typeof t.tolerance === 'number' ? t.tolerance : 0.001,
        /* Schätzaufgaben („Schätze: wie viel Prozent …") tragen bewusst
           eine weite Toleranz — sie IST dort das Kriterium. Der Prüflauf
           muss eine gesetzte Toleranz von der Voreinstellung unterscheiden
           können, sonst meldet er die Schätzaufgaben als kaputt. */
        toleranz_gesetzt: typeof t.tolerance === 'number',
        einheit: t.unit_label || '',
        visual: t.visual || null,
        aufloesung: t.solution || '',
        misconceptions: t.misconceptions || [],
        herkunft: 'Aufgabe ' + t.id
      };
    }
    return null;
  }

  /* Reihenfolge der Pfade beim Auffüllen: erst der eigene, dann die
     leichteren, zuletzt der schwerere. Verlassen wird die Einheit dabei
     nie — ein Quiz zur Einheit fragt Dinge aus der Einheit ab, und aus
     keiner anderen. */
  const AUSWEICH = { A: ['A', 'B', 'C'], B: ['B', 'A', 'C'], C: ['C', 'B', 'A'] };

  function aufgabenFragen(daten, pfad) {
    const alle = daten.tasks || [];
    const raus = [];
    for (const stufe of AUSWEICH[pfad] || [pfad]) {
      const passend = alle.filter(t => t.path === stufe);
      /* Erst Transfer, dann Frei, dann der Rest; innerhalb einer Stufe
         zufällig, damit ein zweiter Lauf nicht dieselbe Reihe zeigt. */
      for (const step of [4, 3, 2, 1]) {
        for (const t of mischen(passend.filter(x => x.step === step))) {
          const f = aufgabeZuFrage(t);
          if (f) raus.push(f);
        }
      }
    }
    return raus;
  }

  /* ---------- Zusammensetzen ----------
     Der Sollaufbau ist 1 Merksatz + 1 Erklärung oder Formelkarte +
     1 Fachwort + 2 Aufgaben. Fehlt eine Quelle (ein Merksatz aus lauter
     Formeln, eine Einheit mit nur einer Worterklärung), rückt die
     nächste nach. Aufgefüllt wird nur aus derselben Einheit — eine Frage
     von woanders wäre genau das, was dieses Quiz nicht sein soll. */
  function bauen(daten, pfad) {
    const eigene = (daten.quiz || {})[pfad];
    if (Array.isArray(eigene) && eigene.length) {
      return {
        quelle: 'daten',
        fragen: eigene.slice(0, ANZAHL).map(f => ({
          typ: 'auswahl',
          art: 'eigen',
          frage: f.frage,
          optionen: (f.optionen || []).slice(),
          antwort: f.antwort,
          aufloesung: f.aufloesung || '',
          herkunft: 'Frage zu dieser Einheit'
        }))
      };
    }

    const merksatz = merksatzFragen(daten, pfad);
    const erklaerung = erklaerungsFragen(daten, pfad);
    const formel = formelFragen(daten);
    const fachwort = fachwortFragen(daten);
    const aufgaben = aufgabenFragen(daten, pfad);

    /* Erklärung und Formelkarte teilen sich einen Platz: Beides sind
       Lückenfragen, und drei davon hintereinander lesen sich wie ein
       Lückentext, nicht wie ein Quiz. */
    const satzfragen = mischen([...erklaerung.slice(0, 1), ...formel.slice(0, 1)]);

    const soll = [
      merksatz.slice(0, 1),
      satzfragen.slice(0, 1),
      fachwort.slice(0, 1),
      aufgaben.slice(0, 2)
    ].flat();

    /* Nachrücker in der Reihenfolge, in der sie am meisten prüfen:
       weitere Aufgaben zuerst, dann Wortwissen, dann weitere Lücken. */
    const nachruecker = [
      ...aufgaben.slice(2),
      ...fachwort.slice(1),
      ...satzfragen.slice(1),
      ...erklaerung.slice(1),
      ...formel.slice(1)
    ];

    /* Der Schlüssel muss die Fragen wirklich unterscheiden. Herkunft und
       Fragetext tun das bei den erzeugten Fragen NICHT: Jede Lückenfrage
       heißt „Welches Wort gehört in die Lücke?" und jede Wortfrage
       „Welches Fachwort ist gemeint?". Ein Schlüssel aus beiden hielte
       deshalb jede zweite Frage derselben Art für eine Wiederholung — und
       das Quiz bliebe still bei drei Fragen stehen, statt auf fünf zu
       kommen. Genau das war in LF-09 und LF-15 der Fall. Unterscheidbar
       sind die Fragen an ihrem Satz und ihrer Lösung. */
    const schluesselVon = f => [
      f.herkunft,
      f.frage,
      f.satz ? f.satz.vorne + '␟' + f.satz.hinten : '',
      f.typ === 'zahl' ? String(f.antwort) : String((f.optionen || [])[f.antwort] || '')
    ].join('|');

    const fragen = soll.slice();
    const gesehen = new Set(fragen.map(schluesselVon));
    while (fragen.length < ANZAHL && nachruecker.length) {
      const f = nachruecker.shift();
      const schluessel = schluesselVon(f);
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      fragen.push(f);
    }

    return { quelle: 'erzeugt', fragen: fragen.slice(0, ANZAHL) };
  }

  /* ---------- Nachlesen ----------
     Bei einer falschen Antwort steht hier, wo die Sache in dieser Einheit
     steht. Anders als in der Chemie gibt es hier kein Lehrbuch mit
     Seitenzahlen — der Verweis führt deshalb dorthin, wo das Kind gerade
     herkommt: an die Erklärung seines Pfades und, wenn die Einheit eines
     führt, an das Erklärvideo. Der Satz wird gebaut, nicht gespeichert. */
  function nachlesen(daten, pfad) {
    if (!daten) return null;
    const teile = [];
    const lk = (daten.lernkarten || {})[pfad];
    if (lk && lk.titel) teile.push(`die Erklärung „${lk.titel}“ auf Pfad ${pfad}`);
    else teile.push(`die Erklärung auf Pfad ${pfad}`);
    if ((daten.formelkarte || {}).formeln) teile.push('die Formelkarte');
    const video = (daten.videos || [])[0];
    if (video && video.titel) teile.push(`das Video „${video.titel}“`);
    if (!teile.length) return null;
    const letzte = teile.pop();
    return 'Nachlesen: ' + (teile.length ? teile.join(', ') + ' und ' + letzte : letzte) + '.';
  }

  /* ---------- Lauf ---------- */

  function starten(daten, pfad, ziel, fertig) {
    const satz = bauen(daten, pfad);
    if (satz.fragen.length < MINDESTENS) {
      console.warn('[Mathe9 Quiz] Zu wenig Material in', daten.unit, '— Quiz entfällt.');
      return null;
    }

    const lauf = {
      daten, pfad,
      fragen: satz.fragen,
      quelle: satz.quelle,
      index: 0,
      richtig: 0,
      schwaechen: [],
      beginn: Date.now(),
      gemeldet: false
    };

    ziel.replaceChildren();
    zeigeFrage(lauf, ziel, fertig);
    return lauf;
  }

  function zeigeFrage(lauf, ziel, fertig) {
    const f = lauf.fragen[lauf.index];
    if (!f) { zeigeErgebnis(lauf, ziel, fertig); return; }

    ziel.replaceChildren();

    const karte = ce('div', 'karte quizkarte');

    const kopf = ce('div', 'quiz-kopf');
    kopf.append(ce('span', 'stufe-pill', `Quiz · Pfad ${lauf.pfad}`));
    kopf.append(ce('span', 'quiz-zaehler', `Frage ${lauf.index + 1} von ${lauf.fragen.length}`));
    karte.append(kopf);

    const balken = ce('div', 'quiz-balken');
    const fuell = ce('div', 'quiz-balken-fuell');
    fuell.style.width = Math.round(lauf.index / lauf.fragen.length * 100) + '%';
    balken.append(fuell);
    karte.append(balken);

    karte.append(ce('p', 'frage', f.frage));

    if (f.satz) {
      const s = ce('p', 'quiz-satz');
      s.append(document.createTextNode(f.satz.vorne));
      if (!f.nurText) {
        s.append(ce('span', 'quiz-luecke', ' '));
        s.append(document.createTextNode(f.satz.hinten));
      }
      karte.append(s);
    }

    if (f.visual && typeof visualBlock === 'function') {
      try { karte.append(visualBlock(f.visual)); }
      catch (e) { console.warn('[Mathe9 Quiz] Abbildung übersprungen:', e.message); }
    }

    const rueck = ce('div', 'quiz-rueck');
    rueck.id = 'quiz-rueck';

    if (f.typ === 'zahl') zahlenFeld(lauf, karte, rueck, ziel, fertig, f);
    else auswahlFeld(lauf, karte, rueck, ziel, fertig, f);

    karte.append(ce('p', 'quiz-herkunft', f.herkunft));
    karte.append(rueck);

    ziel.append(karte);
    karte.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function auswahlFeld(lauf, karte, rueck, ziel, fertig, f) {
    const box = ce('div', 'optionen');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Antwortmöglichkeiten');
    const knoepfe = f.optionen.map((text, i) => {
      const b = ce('button', 'opt', text);
      b.type = 'button';
      b.addEventListener('click', () => {
        knoepfe.forEach((k, j) => {
          k.disabled = true;
          if (j === f.antwort) k.classList.add('richtig');
          else if (j === i) k.classList.add('falsch');
        });
        auswerten(lauf, ziel, fertig, rueck, f, i === f.antwort, i);
      });
      box.append(b);
      return b;
    });
    karte.append(box);
  }

  /* Rechenaufgaben bleiben Rechenaufgaben. Vier Zahlen zur Auswahl zu
     stellen hieße, sich drei falsche auszudenken — und eine ausgedachte
     falsche Zahl trägt keine Fehlvorstellung, sagt der Lehrkraft also
     nichts darüber, woran es lag. */
  function zahlenFeld(lauf, karte, rueck, ziel, fertig, f) {
    const zeile = ce('div', 'quiz-zahlzeile');
    const feld = ce('input', 'zahl-feld');
    feld.type = 'text';
    feld.inputMode = 'decimal';
    feld.autocomplete = 'off';
    feld.setAttribute('aria-label', 'Dein Ergebnis');
    zeile.append(feld);
    if (f.einheit) zeile.append(ce('span', 'einheit-label', f.einheit));
    karte.append(zeile);

    const akt = ce('div', 'aktionen');
    const knopf = ce('button', 'btn btn-haupt', 'Antwort prüfen');
    knopf.type = 'button';
    const pruefen = () => {
      const roh = feld.value.trim();
      if (roh === '') return;
      const kandidaten = (typeof lesarten === 'function' ? lesarten(roh) : [parseFloat(roh)])
        .filter(z => !Number.isNaN(z));
      if (!kandidaten.length) {
        rueck.replaceChildren(ce('div', 'rueck nope', 'Das ist keine Zahl. Schreib nur das Ergebnis — ohne Einheit.'));
        return;
      }
      const tol = f.toleranz;
      const richtig = kandidaten.some(z => Math.abs(z - f.antwort) <= tol);
      let getroffen = null;
      if (!richtig) {
        for (const z of kandidaten) {
          const m = (f.misconceptions || []).find(m => Math.abs(z - m.value) <= tol);
          if (m) { getroffen = m; break; }
        }
      }
      feld.disabled = true;
      knopf.disabled = true;
      auswerten(lauf, ziel, fertig, rueck, f, richtig, null, getroffen);
    };
    knopf.addEventListener('click', pruefen);
    feld.addEventListener('keydown', e => { if (e.key === 'Enter') pruefen(); });
    akt.append(knopf);
    karte.append(akt);
    setTimeout(() => feld.focus(), 0);
  }

  function auswerten(lauf, ziel, fertig, rueck, f, richtig, gewaehlt, getroffen) {
    if (f.beantwortet) return;
    f.beantwortet = true;

    if (richtig) lauf.richtig++;
    else lauf.schwaechen.push(schwaecheZu(f, gewaehlt, getroffen));

    const kasten = ce('div', 'rueck ' + (richtig ? 'ok' : 'nope'));
    kasten.append(ce('b', null, richtig ? 'Richtig.' : 'Nicht richtig.'));

    if (!richtig) {
      const mis = getroffen
        || (f.misconceptions || []).find(m => m.value === gewaehlt);
      if (mis && mis.feedback) kasten.append(ce('div', 'quiz-hinweis', mis.feedback));
      if (f.aufloesung) kasten.append(ce('div', 'quiz-hinweis', f.aufloesung));
      const wo = nachlesen(lauf.daten, lauf.pfad);
      if (wo) kasten.append(ce('div', 'quiz-nachlesen', wo));
    } else if (f.aufloesung && f.art !== 'aufgabe') {
      kasten.append(ce('div', 'quiz-hinweis', f.aufloesung));
    }
    rueck.replaceChildren(kasten);

    try {
      Tracker.track('quiz_antwort', {
        unit: lauf.daten.unit, path: lauf.pfad, art: f.art,
        correct: richtig, index: lauf.index, herkunft: f.herkunft
      });
    } catch { /* ohne Tracker läuft das Quiz trotzdem */ }

    const akt = ce('div', 'aktionen');
    const weiter = ce('button', 'btn btn-haupt',
      lauf.index + 1 < lauf.fragen.length ? 'Weiter' : 'Ergebnis anzeigen');
    weiter.type = 'button';
    weiter.addEventListener('click', () => { lauf.index++; zeigeFrage(lauf, ziel, fertig); });
    akt.append(weiter);
    rueck.append(akt);
    weiter.focus();
  }

  /* Woran es lag — nicht „3 von 5", sondern die Sache selbst. Bei
     Pool-Aufgaben ist das die hinterlegte Fehlvorstellung, sonst die Art
     der Frage. Beides geht an das Dashboard. */
  function schwaecheZu(f, gewaehlt, getroffen) {
    if (getroffen && getroffen.id) return getroffen.id;
    const mis = (f.misconceptions || []).find(m => m.value === gewaehlt);
    if (mis && mis.id) return mis.id;
    return 'quiz_' + f.art;
  }

  function zeigeErgebnis(lauf, ziel, fertig) {
    ziel.replaceChildren();
    const n = lauf.fragen.length;
    const quote = lauf.richtig / n;

    const karte = ce('div', 'karte quizkarte');
    karte.append(ce('h2', 'frage', `Quiz beendet: ${lauf.richtig} von ${n} richtig.`));

    const einschaetzung = ce('p');
    einschaetzung.textContent = quote >= 0.8
      ? 'Das sitzt. Der Stoff dieser Einheit ist bei dir angekommen.'
      : quote >= 0.5
        ? 'Der größere Teil sitzt. Sieh dir die Stellen noch einmal an, die danebengingen.'
        : 'Das war noch wackelig. Geh die Erklärung dieser Einheit noch einmal durch.';
    karte.append(einschaetzung);

    const wo = nachlesen(lauf.daten, lauf.pfad);
    if (wo && quote < 0.8) karte.append(ce('p', 'quiz-nachlesen', wo));

    const meldung = ce('p', 'quiz-meldung', 'Das Ergebnis wird gesichert …');
    meldung.id = 'quiz-meldung';
    karte.append(meldung);

    const akt = ce('div', 'aktionen');
    const zurueck = ce('button', 'btn btn-haupt', 'Zurück zum Abschluss');
    zurueck.type = 'button';
    zurueck.addEventListener('click', () => { if (typeof fertig === 'function') fertig(lauf); });
    akt.append(zurueck);

    if (quote < 0.8) {
      const nochmal = ce('button', 'btn btn-neben', 'Quiz wiederholen');
      nochmal.type = 'button';
      nochmal.addEventListener('click', () => {
        const neu = starten(lauf.daten, lauf.pfad, ziel, fertig);
        if (!neu) zeigeErgebnis(lauf, ziel, fertig);
      });
      akt.append(nochmal);
    }
    karte.append(akt);
    ziel.append(karte);
    karte.scrollIntoView({ block: 'start', behavior: 'smooth' });

    ergebnisSichern(lauf).then(antwort => {
      const m = ziel.querySelector('#quiz-meldung');
      if (!m) return;
      if (antwort && antwort.gewertet) {
        m.className = 'quiz-meldung quiz-gewertet';
        m.textContent = 'Das ist dein erster Lauf zu dieser Einheit — er geht in die '
          + 'Bewertung ein. Weitere Läufe zählen als Übung.';
      } else if (antwort) {
        m.className = 'quiz-meldung';
        m.textContent = 'Übungslauf gesichert. Für diese Einheit liegt bereits ein '
          + 'gewerteter Lauf vor; dieser hier verändert die Bewertung nicht.';
      } else {
        m.className = 'quiz-meldung';
        m.textContent = 'Das Ergebnis ist auf diesem Gerät gespeichert. An die Lehrkraft '
          + 'geht es, sobald wieder Verbindung besteht.';
      }
    });
  }

  /* ---------- Sichern ----------
     Lokal immer, an den Server wenn möglich. Ob der Lauf für die Note
     zählt, entscheidet die Datenbank; dieses Gerät meldet nur, was
     passiert ist. */
  async function ergebnisSichern(lauf) {
    if (lauf.gemeldet) return null;
    lauf.gemeldet = true;

    const dauer = Math.round((Date.now() - lauf.beginn) / 1000);
    lokalMerken(lauf, dauer);

    try {
      Tracker.track('quiz_abgeschlossen', {
        unit: lauf.daten.unit, path: lauf.pfad,
        aufgaben: lauf.fragen.length, richtig: lauf.richtig,
        dauer_s: dauer, quelle: lauf.quelle, schwaechen: lauf.schwaechen
      });
    } catch { /* ohne Tracker bleibt der lokale Stand */ }

    try {
      return await (window.Lernmodus?.quizMelden?.({
        p_unit: String(lauf.daten.unit || '').toLowerCase(),
        p_pfad: lauf.pfad,
        p_aufgaben: lauf.fragen.length,
        p_richtig: lauf.richtig,
        p_dauer_s: dauer,
        p_schwaechen: lauf.schwaechen
      }) ?? null);
    } catch (e) {
      console.warn('[Mathe9 Quiz] Ergebnis nicht gemeldet:', e.message);
      return null;
    }
  }

  /* Der eigene Stand soll auch dann sichtbar bleiben, wenn es keinen
     Server gibt — das Projekt läuft ausdrücklich auch ohne Supabase. */
  function lokalMerken(lauf, dauer) {
    try {
      const id = String(lauf.daten.unit || '').toLowerCase();
      const alt = Stand.lies(id) || {};
      const bisher = alt.quiz || {};
      Stand.schreib(lauf.daten.unit, {
        ...alt,
        unit: alt.unit || lauf.daten.unit,
        titel: alt.titel || lauf.daten.title || '',
        pfad: alt.pfad || lauf.pfad,
        quiz: {
          ...bisher,
          [lauf.pfad]: {
            richtig: lauf.richtig,
            gesamt: lauf.fragen.length,
            dauer_s: dauer,
            ts: Date.now(),
            /* Der erste Lauf ist der, der zählt — auch lokal sichtbar. */
            erster: bisher[lauf.pfad] && bisher[lauf.pfad].erster
              ? bisher[lauf.pfad].erster
              : { richtig: lauf.richtig, gesamt: lauf.fragen.length, ts: Date.now() }
          }
        }
      });
    } catch (e) {
      console.warn('[Mathe9 Quiz] lokaler Stand nicht gespeichert:', e.message);
    }
  }

  /* Was für diese Einheit und diesen Pfad lokal vorliegt — die
     Einheitenseite zeigt es im Abschluss an. */
  function stand(unit, pfad) {
    try {
      const d = Stand.lies(String(unit || '').toLowerCase());
      return (d && d.quiz && d.quiz[pfad]) || null;
    } catch { return null; }
  }

  return { bauen, starten, stand, nachlesen, ANZAHL };
})();

window.Quiz = Quiz;
