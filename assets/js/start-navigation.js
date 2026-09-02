/* ============================================================
   Startseite: Themen-Drawer und schrittweise Stundenfreigabe
   ============================================================ */

(() => {
  'use strict';

  const themen = [
    { id: 'ef', name: 'Ebene Figuren', prefix: 'EF-' },
    { id: 'pz', name: 'Prozent & Zinsrechnung', prefix: 'PZ-' },
    { id: 'lf', name: 'Lineare Funktionen', prefix: 'LF-' },
    { id: 'kp', name: 'Prismen & Zylinder', prefix: 'KP-' },
    { id: 'sk', name: 'Spitzkörper', prefix: 'SK-' }
  ];

  const main = document.querySelector('main');
  const hero = document.querySelector('.hero');
  const drawer = document.querySelector('#themen-drawer');
  const schatten = document.querySelector('#drawer-schatten');
  const oeffnen = document.querySelector('#drawer-oeffnen');
  const schliessen = document.querySelector('#drawer-schliessen');
  const navigation = document.querySelector('#themen-navigation');
  if (!main || !drawer || !navigation) return;

  const alleEintraege = [...main.querySelectorAll('a.eintrag[href*="einheit.html?u="]')];

  const gruppen = themen.map(thema => ({
    ...thema,
    stunden: alleEintraege.filter(link => {
      const code = link.querySelector('.nr')?.textContent.trim().toUpperCase() || '';
      return code.startsWith(thema.prefix);
    })
  }));

  const ansicht = document.createElement('section');
  ansicht.className = 'themen-ansicht';
  ansicht.setAttribute('aria-live', 'polite');

  /* Die ursprüngliche lange Liste bleibt als Datenquelle im Dokument,
     wird aber durch die fokussierte Themenansicht ersetzt. */
  [...main.children].forEach(element => { element.hidden = true; });
  main.append(ansicht);

  function codeVon(link) {
    return link.querySelector('.nr')?.textContent.trim().toUpperCase() || '';
  }

  function istAbgeschlossen(code) {
    const stand = typeof Stand !== 'undefined' ? Stand.lies(code) : null;
    return Boolean(stand && Array.isArray(stand.fertig) && stand.fertig.length);
  }

  function drawerSetzen(offen) {
    drawer.classList.toggle('offen', offen);
    drawer.setAttribute('aria-hidden', String(!offen));
    oeffnen.setAttribute('aria-expanded', String(offen));
    schatten.hidden = !offen;
    document.body.classList.toggle('drawer-offen', offen);
    if (offen) schliessen.focus();
  }

  function status(thema) {
    const fertig = thema.stunden.filter(link => istAbgeschlossen(codeVon(link))).length;
    return `${fertig} von ${thema.stunden.length} abgeschlossen`;
  }

  function navigationBauen(aktiv) {
    navigation.replaceChildren();
    gruppen.forEach((thema, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thema-option';
      button.classList.toggle('aktiv', thema.id === aktiv);
      button.setAttribute('aria-current', thema.id === aktiv ? 'page' : 'false');
      button.innerHTML = `<span class="thema-nummer">${String(index + 1).padStart(2, '0')}</span>` +
        `<span><strong>${thema.name}</strong><small>${status(thema)}</small></span>`;
      button.addEventListener('click', () => {
        zeigen(thema.id);
        drawerSetzen(false);
      });
      navigation.append(button);
    });
  }

  function linkKlonen(link, klasse) {
    const klon = link.cloneNode(true);
    klon.classList.add(klasse);
    klon.hidden = false;
    klon.removeAttribute('style');
    return klon;
  }

  function zeigen(id) {
    const thema = gruppen.find(item => item.id === id) || gruppen[0];
    const ersterOffener = thema.stunden.findIndex(link => !istAbgeschlossen(codeVon(link)));
    const aktuellIndex = ersterOffener === -1
      ? Math.max(0, thema.stunden.length - 1)
      : ersterOffener;
    const vergangen = thema.stunden.slice(0, aktuellIndex).filter(link => istAbgeschlossen(codeVon(link)));
    const aktuell = thema.stunden[aktuellIndex];

    ansicht.replaceChildren();
    const kopf = document.createElement('div');
    kopf.className = 'themen-kopf';
    kopf.innerHTML = `<span class="themen-label">Ausgewähltes Thema</span>` +
      `<h2>${thema.name}</h2><p>${status(thema)}</p>`;
    ansicht.append(kopf);

    const warmup = main.querySelector('a.eintrag[href="warmup.html"]');
    if (warmup) {
      const start = document.createElement('div');
      start.className = 'stunden-block warmup-block';
      start.innerHTML = '<h3>Jede Stunde zuerst</h3>';
      start.append(linkKlonen(warmup, 'warmup-eintrag'));
      ansicht.append(start);
    }

    if (aktuell) {
      const block = document.createElement('div');
      block.className = 'stunden-block aktuelle-stunde';
      block.innerHTML = '<span class="stunden-status">Jetzt bearbeiten</span><h3>Aktuelle Unterrichtsstunde</h3>';
      block.append(linkKlonen(aktuell, 'aktuell-eintrag'));
      ansicht.append(block);
    }

    if (vergangen.length) {
      const details = document.createElement('details');
      details.className = 'vergangene-stunden';
      details.innerHTML = `<summary>Zurückliegende Einzelstunden <span>${vergangen.length}</span></summary>`;
      const liste = document.createElement('div');
      liste.className = 'liste';
      vergangen.forEach(link => liste.append(linkKlonen(link, 'vergangen-eintrag')));
      details.append(liste);
      ansicht.append(details);
    }

    const hinweis = document.createElement('p');
    hinweis.className = 'freischalt-hinweis';
    hinweis.textContent = ersterOffener === -1
      ? 'Dieses Thema ist vollständig bearbeitet.'
      : 'Die nächste Stunde wird nach dem Abschluss der aktuellen Stunde sichtbar.';
    ansicht.append(hinweis);

    if (hero) hero.querySelector('p').textContent = `${thema.name}: Arbeite die Stunden nacheinander. Zurückliegende Stunden kannst du jederzeit wiederholen.`;
    document.title = `${thema.name} · Mathe 9`;
    history.replaceState(null, '', `#${thema.id}`);
    navigationBauen(thema.id);
  }

  oeffnen.addEventListener('click', () => drawerSetzen(true));
  schliessen.addEventListener('click', () => drawerSetzen(false));
  schatten.addEventListener('click', () => drawerSetzen(false));
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('offen')) drawerSetzen(false);
  });

  const startId = location.hash.slice(1).toLowerCase();
  zeigen(gruppen.some(item => item.id === startId) ? startId : 'ef');
})();
