/* ============================================================
   uebungsrahmen.js · Externe Übungen innerhalb der Anwendung öffnen

   Der Rahmen entsteht erst nach einem ausdrücklichen Klick. Vorher wird
   keine Verbindung zum externen Anbieter aufgebaut. Manche Plattformen
   verbieten eine Einbettung; deshalb bleibt „In neuem Tab öffnen“ immer
   sichtbar und der Hinweis verspricht keine automatische Fehlererkennung.

   Der Rahmen ist als modaler Dialog umgesetzt: Hintergrund und Fokus sind
   währenddessen gesperrt, Escape schließt den Dialog und der Fokus kehrt
   anschließend zum auslösenden Übungslink zurück.
   ============================================================ */

(() => {
  'use strict';

  const ERLAUBTE_HOSTS = [
    'learningapps.org', 'serlo.org', 'h5p.org', 'schule-bw.de',
    'learningsnacks.de', 'quizlet.com', 'zum.de'
  ];

  function hostErlaubt(url) {
    const host = String(url.hostname || '').toLowerCase();
    return ERLAUBTE_HOSTS.some(basis => host === basis || host.endsWith('.' + basis));
  }

  function stileSetzen() {
    if (document.querySelector('#m9-rahmen-stil')) return;
    const stil = document.createElement('style');
    stil.id = 'm9-rahmen-stil';
    stil.textContent = `
      .m9-rahmen{position:fixed;inset:0;z-index:11000;display:flex;flex-direction:column;background:#15233A}
      .m9-rahmen-kopf{display:flex;align-items:center;gap:10px;padding:8px 10px;
        padding-top:calc(8px + env(safe-area-inset-top));background:#15233A;color:#fff;flex-wrap:wrap}
      .m9-rahmen-titel{flex:1 1 auto;min-width:0;font:700 14px/1.3 system-ui,sans-serif;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .m9-rahmen-kopf button,.m9-rahmen-kopf a{flex:0 0 auto;min-height:44px;padding:0 12px;border:0;
        border-radius:9px;background:#ffffff22;color:#fff;font:700 13px system-ui,sans-serif;
        cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
      .m9-rahmen-kopf .m9-rahmen-zu{background:#fff;color:#15233A}
      .m9-rahmen-hinweis{padding:7px 12px;background:#FFF4CF;color:#5a4600;font:13px/1.4 system-ui,sans-serif}
      .m9-rahmen iframe{flex:1 1 auto;width:100%;border:0;background:#fff}
      .m9-rahmen-fuss{padding:6px 12px;padding-bottom:calc(6px + env(safe-area-inset-bottom));
        background:#0f1a2b;color:#c8d2d8;font:12px/1.4 system-ui,sans-serif}
      .m9-rahmen :focus-visible{outline:3px solid #ffd75a;outline-offset:2px}
    `;
    document.head.appendChild(stil);
  }

  function fokusElemente(rahmen) {
    return [...rahmen.querySelectorAll(
      'button:not([disabled]),a[href],iframe,[tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.hidden && el.getAttribute('aria-hidden') !== 'true');
  }

  function oeffnen({ url, titel, quelle, linkType, ausloeser }) {
    let ziel;
    try { ziel = new URL(url, location.href); } catch { return false; }
    if (ziel.protocol !== 'https:' || !hostErlaubt(ziel)) return false;

    stileSetzen();
    document.querySelector('.m9-rahmen')?.querySelector('[data-schliessen]')?.click();

    const vorherigerFokus = ausloeser || document.activeElement;
    const vorherOverflow = document.documentElement.style.overflow;
    const hintergrund = [...document.body.children].map(element => ({
      element,
      inert: Boolean(element.inert)
    }));

    const rahmen = document.createElement('div');
    rahmen.className = 'm9-rahmen';
    rahmen.setAttribute('role', 'dialog');
    rahmen.setAttribute('aria-modal', 'true');
    rahmen.setAttribute('aria-labelledby', 'm9-rahmen-titel');

    const kopf = document.createElement('div');
    kopf.className = 'm9-rahmen-kopf';

    const zu = document.createElement('button');
    zu.type = 'button';
    zu.className = 'm9-rahmen-zu';
    zu.dataset.schliessen = 'true';
    zu.textContent = '← Zurück zur Einheit';

    const name = document.createElement('div');
    name.id = 'm9-rahmen-titel';
    name.className = 'm9-rahmen-titel';
    name.textContent = (quelle ? quelle + ' · ' : '') + (titel || ziel.hostname);

    const neuerTab = document.createElement('a');
    neuerTab.href = ziel.href;
    neuerTab.target = '_blank';
    neuerTab.rel = 'noopener noreferrer';
    neuerTab.textContent = 'In neuem Tab öffnen';

    kopf.append(zu, name, neuerTab);

    const hinweis = document.createElement('div');
    hinweis.className = 'm9-rahmen-hinweis';
    hinweis.id = 'm9-rahmen-hinweis';
    hinweis.textContent = 'Bleibt der Bereich leer oder erscheint eine Fehlermeldung, '
      + 'verhindert der Anbieter wahrscheinlich die Einbettung. Nutze dann '
      + '„In neuem Tab öffnen“.';

    const feld = document.createElement('iframe');
    feld.src = ziel.href;
    feld.title = titel || 'Externe Übung';
    feld.setAttribute('aria-describedby', 'm9-rahmen-hinweis');
    /* Kein allow-top-navigation: Die fremde Seite darf die Anwendung nicht
       unter dem Kind wegziehen. */
    feld.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    feld.setAttribute('referrerpolicy', 'no-referrer');
    feld.setAttribute('loading', 'eager');

    const fuss = document.createElement('div');
    fuss.className = 'm9-rahmen-fuss';
    fuss.textContent = 'Diese Übung kommt von ' + ziel.hostname
      + '. Dort gelten die Datenschutz- und Nutzungsregeln des Anbieters.';

    rahmen.append(kopf, hinweis, feld, fuss);
    document.body.appendChild(rahmen);

    hintergrund.forEach(eintrag => { eintrag.element.inert = true; });
    document.documentElement.style.overflow = 'hidden';

    window.Lernmodus?.aktivitaet?.('extern-auf');
    window.Tracker?.track?.('external_practice_open', {
      provider: quelle || ziel.hostname,
      title: titel || '',
      link_type: linkType || 'app',
      mode: 'rahmen'
    });

    const beginn = Date.now();
    let geschlossen = false;

    const schliessen = () => {
      if (geschlossen) return;
      geschlossen = true;
      const dauer = Date.now() - beginn;
      document.removeEventListener('keydown', beiTaste, true);
      hintergrund.forEach(eintrag => { eintrag.element.inert = eintrag.inert; });
      document.documentElement.style.overflow = vorherOverflow;
      rahmen.remove();
      window.Lernmodus?.aktivitaet?.('extern-zu');
      window.Tracker?.track?.('external_practice_close', {
        provider: quelle || ziel.hostname,
        title: titel || '',
        link_type: linkType || 'app',
        duration_ms: dauer
      });
      if (vorherigerFokus && vorherigerFokus.isConnected && typeof vorherigerFokus.focus === 'function') {
        vorherigerFokus.focus();
      }
    };

    const beiTaste = ereignis => {
      if (ereignis.key === 'Escape') {
        ereignis.preventDefault();
        schliessen();
        return;
      }
      if (ereignis.key !== 'Tab') return;
      const elemente = fokusElemente(rahmen);
      if (!elemente.length) {
        ereignis.preventDefault();
        zu.focus();
        return;
      }
      const erstes = elemente[0];
      const letztes = elemente[elemente.length - 1];
      if (ereignis.shiftKey && document.activeElement === erstes) {
        ereignis.preventDefault();
        letztes.focus();
      } else if (!ereignis.shiftKey && document.activeElement === letztes) {
        ereignis.preventDefault();
        erstes.focus();
      }
    };

    zu.addEventListener('click', schliessen);
    document.addEventListener('keydown', beiTaste, true);
    zu.focus();
    return true;
  }

  /* Ein normaler Klick öffnet den Rahmen. Mittelklick und Tastenkürzel
     behalten die gewohnte Browserfunktion und werden bereits am Link als
     neuer Tab protokolliert. */
  document.addEventListener('click', ereignis => {
    if (ereignis.defaultPrevented || ereignis.button !== 0 || ereignis.metaKey
        || ereignis.ctrlKey || ereignis.shiftKey || ereignis.altKey) return;
    const link = ereignis.target.closest?.('a.ua-link');
    if (!link || link.closest('.m9-rahmen')) return;

    const erfolg = oeffnen({
      url: link.href,
      titel: link.textContent.trim(),
      quelle: link.dataset.provider || link.previousElementSibling?.textContent?.trim() || '',
      linkType: link.dataset.linkType
        || (link.parentElement?.querySelector('.ua-tag') ? 'sammlung' : 'app'),
      ausloeser: link
    });
    if (erfolg) ereignis.preventDefault();
  });

  window.Mathe9Uebungsrahmen = { oeffnen };
})();
