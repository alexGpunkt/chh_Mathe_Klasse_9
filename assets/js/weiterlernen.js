/* ============================================================
   weiterlernen.js · Kachel „Weiterlernen" auf der Startseite

   Wer eine Einheit angefangen hat, soll sie nicht in einer Liste von
   54 Einträgen wiederfinden müssen. Die Kachel führt direkt zurück an die
   Stelle, an der zuletzt gearbeitet wurde.

   Braucht store.js (Stand). Ohne gespeicherten Stand erscheint nichts —
   die Startseite bleibt dann genau wie vorher.
   ============================================================ */
(function () {
  'use strict';
  if (typeof Stand === 'undefined') return;

  /* Baustein für beide Fälle — weitermachen und weitergehen. */
  function kachelBauen({ ueberschrift, id, titel, zeile, klasse, pfad }) {
    const kopf = document.createElement('div');
    kopf.className = 'abschnitt-titel';
    kopf.textContent = ueberschrift;

    const liste = document.createElement('div');
    liste.className = 'liste';

    const a = document.createElement('a');
    a.className = 'eintrag ' + klasse;
    a.href = 'einheit.html?u=' + encodeURIComponent(id) + (pfad ? '&p=' + encodeURIComponent(pfad) : '');

    const nr = document.createElement('span');
    nr.className = 'nr';
    nr.textContent = id.toUpperCase();

    const txt = document.createElement('span');
    txt.className = 'txt';
    const stark = document.createElement('strong');
    stark.textContent = titel;
    const klein = document.createElement('span');
    klein.textContent = zeile;
    txt.append(stark, klein);

    const pfeil = document.createElement('span');
    pfeil.className = 'pfeil';
    pfeil.textContent = '→';

    a.append(nr, txt, pfeil);
    a.setAttribute('aria-label', ueberschrift + ': ' + nr.textContent + ', ' + titel + ', ' + zeile);
    liste.appendChild(a);
    return { kopf, liste, a };
  }

  /* Die nächste Einheit kommt aus units/index.json — dieselbe Reihenfolge,
     die auch das Inhaltsverzeichnis verwendet. */
  async function naechsteAnbieten(fertigeId, hauptteil) {
    let index;
    try {
      const r = await fetch('units/index.json', { cache: 'no-cache' });
      if (!r.ok) return;
      index = await r.json();
    } catch { return; }

    const alle = [];
    (index.bereiche || index.areas || []).forEach(b => {
      (b.einheiten || b.units || []).forEach(e => {
        alle.push({ id: String(e.id || e).toLowerCase(), titel: e.title || e.titel || '' });
      });
    });
    if (!alle.length) return;

    const i = alle.findIndex(e => e.id === fertigeId);
    if (i < 0 || i + 1 >= alle.length) return;

    /* Die nächste, die noch nicht abgeschlossen ist. */
    const naechste = alle.slice(i + 1).find(e => Stand.status(e.id) !== 'fertig');
    if (!naechste) return;

    const angefangen = Stand.status(naechste.id) === 'begonnen';
    const { kopf, liste, a } = kachelBauen({
      ueberschrift: 'Als Nächstes',
      id: naechste.id,
      titel: naechste.titel || naechste.id.toUpperCase(),
      zeile: angefangen ? 'Schon begonnen — dort weiter' : 'Neu · direkt anfangen',
      klasse: 'weiterlernen weiterlernen-naechste'
    });
    hauptteil.prepend(kopf, liste);
    a.addEventListener('click', () => {
      if (window.Tracker) Tracker.track('naechste_einheit_kachel', { von: fertigeId, nach: naechste.id });
    });
  }

  const zuletzt = Stand.zuletzt();
  if (!zuletzt || !zuletzt.einheit) return;

  const id = String(zuletzt.einheit).toLowerCase();
  const stand = Stand.lies(id);
  if (!stand) return;

  const hauptteil = document.querySelector('main');
  if (!hauptteil) return;

  const status = Stand.status(id);

  /* Ist die Einheit durch, endet der Faden nicht — dann führt die Kachel zur
     nächsten Einheit. Vorher verschwand sie einfach, und wer weitermachen
     wollte, musste die richtige Zeile in einer Liste von 54 suchen. */
  if (status === 'fertig') { naechsteAnbieten(id, hauptteil); return; }
  if (status !== 'begonnen' && status !== 'wiederholen') return;

  const wann = new Date(zuletzt.ts);
  const heute = new Date();
  const gleicherTag = wann.toDateString() === heute.toDateString();
  const zeit = gleicherTag
    ? 'heute, ' + wann.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
    : wann.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });

  const wo = status === 'wiederholen'
    ? 'Länger nicht angesehen — Zeit für eine Wiederholung'
    : `Aufgabe ${Math.min((stand.index | 0) + 1, stand.gesamt || 1)} von ${stand.gesamt || '?'} · Pfad ${stand.pfad}`;

  const titel = document.createElement('div');
  titel.className = 'abschnitt-titel';
  titel.textContent = 'Weiterlernen';

  const liste = document.createElement('div');
  liste.className = 'liste';

  const kachel = document.createElement('a');
  kachel.className = 'eintrag weiterlernen';
  /* Der Pfad wandert mit in den Link — sonst landet man auf dem zuletzt
     global gewählten Pfad statt auf dem dieser Einheit. */
  kachel.href = 'einheit.html?u=' + encodeURIComponent(id)
    + (stand.pfad ? '&p=' + encodeURIComponent(stand.pfad) : '');

  const nr = document.createElement('span');
  nr.className = 'nr';
  nr.textContent = String(zuletzt.einheit).toUpperCase();

  const txt = document.createElement('span');
  txt.className = 'txt';
  const stark = document.createElement('strong');
  stark.textContent = zuletzt.titel || 'Zuletzt bearbeitet';
  const klein = document.createElement('span');
  klein.textContent = wo + ' · ' + zeit;
  txt.append(stark, klein);

  const pfeil = document.createElement('span');
  pfeil.className = 'pfeil';
  pfeil.textContent = '→';

  kachel.append(nr, txt, pfeil);
  kachel.setAttribute('aria-label',
    'Weiterlernen: ' + nr.textContent + ', ' + stark.textContent + ', ' + wo);
  liste.appendChild(kachel);

  /* Ganz nach oben — vor „Jede Stunde zuerst". */
  hauptteil.prepend(titel, liste);

  kachel.addEventListener('click', () => {
    if (window.Tracker) Tracker.track('weiterlernen_kachel', { unit: zuletzt.einheit, path: stand.pfad });
  });
})();
