/* ============================================================
   buch.js · Buchähnlicher Lesemodus für einheit.html
   - eine Lernseite je Einheit, Zurück/Weiter durch alle Einheiten
   - ausklappbares Inhaltsverzeichnis, Sprung per Seite/Kürzel
   - Fortschrittsanzeige + Lesezeichen (localStorage)
   - dezente Seitenwechsel-Animation (Blättereffekt auf großen Schirmen)
   Greift NICHT in die Aufgaben-Engine ein.
   ============================================================ */
(function () {
  'use strict';

  var LZ_KEY = 'mathe9.lesezeichen';
  var reduce = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function q(s, w) { return (w || document).querySelector(s); }
  function ce(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function lzLies() {
    try {
      var wert = JSON.parse(localStorage.getItem(LZ_KEY));
      return Array.isArray(wert) ? wert.filter(function (id) { return typeof id === 'string'; }) : [];
    } catch (e) { return []; }
  }
  function lzSchreib(a) {
    try { localStorage.setItem(LZ_KEY, JSON.stringify(a)); } catch (e) {}
  }

  var PAGES = [];          // [{id,title,bcode,btitle}]
  var idxVon = {};         // id -> Position
  var aktID = null;
  var aktIdx = -1;
  var tocOeffner = null;
  var tocGesperrt = [];

  function aktuelleId() {
    var p = new URLSearchParams(location.search).get('u');
    return p || 'pz-05';
  }

  function track(name, payload) {
    try {
      if (window.Tracker && typeof window.Tracker.track === 'function') {
        window.Tracker.track(name, payload || {});
      }
    } catch (e) {}
  }

  function gehe(zielId) {
    if (!zielId || zielId === aktID) return;
    var zi = idxVon[zielId];
    var dir = (zi != null && zi < aktIdx) ? 'prev' : 'next';
    var url = 'einheit.html?u=' + encodeURIComponent(zielId);
    track('book_page_turn', { from_unit: aktID, to_unit: zielId, direction: dir });
    if (reduce) { location.href = url; return; }
    try { sessionStorage.setItem('buch-dir', dir); } catch (e) {}
    document.body.classList.add(dir === 'prev' ? 'buch-leave-prev' : 'buch-leave-next');
    setTimeout(function () { location.href = url; }, 190);
  }

  /* ---------- Kopf-Werkzeuge (Lesezeichen · Inhalt) ---------- */
  function baueKopf() {
    var zeile = q('.kopf-zeile');
    if (!zeile) return;
    var tools = ce('div', 'buch-kopf-tools');

    var lz = ce('button', 'buch-tool', '☆');
    lz.id = 'lesezeichenBtn';
    lz.setAttribute('aria-label', 'Lesezeichen für diese Seite');
    lz.addEventListener('click', function () {
      var a = lzLies();
      var i = a.indexOf(aktID);
      var gesetzt;
      if (i >= 0) { a.splice(i, 1); gesetzt = false; }
      else { a.push(aktID); gesetzt = true; }
      lzSchreib(a);
      track('book_bookmark_toggle', { unit: aktID, bookmarked: gesetzt });
      lzAnzeige();
      if (q('#buchToc') && !q('#buchToc').hidden) baueListe();
    });

    var toc = ce('button', 'buch-tool', '☰');
    toc.id = 'tocBtn';
    toc.setAttribute('aria-label', 'Inhaltsverzeichnis öffnen');
    toc.setAttribute('aria-expanded', 'false');
    toc.addEventListener('click', tocAuf);

    tools.appendChild(lz);
    tools.appendChild(toc);
    zeile.appendChild(tools);
  }

  function lzAnzeige() {
    var b = q('#lesezeichenBtn');
    if (!b) return;
    var gesetzt = lzLies().indexOf(aktID) >= 0;
    b.textContent = gesetzt ? '★' : '☆';
    b.setAttribute('aria-pressed', String(gesetzt));
  }

  /* ---------- Untere Navigationsleiste ---------- */
  function baueNav() {
    var nav = ce('nav', 'buch-nav');
    nav.id = 'buchNav';
    nav.setAttribute('aria-label', 'Seitennavigation');

    var fort = ce('div', 'buch-nav-fortschritt');
    fort.setAttribute('role', 'progressbar');
    fort.setAttribute('aria-label', 'Buchposition');
    fort.setAttribute('aria-valuemin', '1');
    fort.setAttribute('aria-valuemax', String(PAGES.length));
    fort.setAttribute('aria-valuenow', String(aktIdx + 1));
    var fuell = ce('div', 'buch-nav-fuell'); fuell.id = 'buchFuell';
    fort.appendChild(fuell);

    var zeile = ce('div', 'buch-nav-zeile');

    var prev = ce('button', 'buch-btn buch-prev');
    prev.innerHTML = '<span class="pfeil">‹</span><span class="wort">Zurück</span>';
    prev.addEventListener('click', function () { if (aktIdx > 0) gehe(PAGES[aktIdx - 1].id); });

    var mitte = ce('button', 'buch-mitte'); mitte.id = 'buchMitte';
    mitte.setAttribute('aria-haspopup', 'dialog');
    var code = ce('span', 'buch-code'); code.id = 'buchCode'; code.textContent = '–';
    var seite = ce('span', 'buch-seite'); seite.id = 'buchSeite'; seite.textContent = 'Seite –';
    mitte.appendChild(code); mitte.appendChild(seite);
    mitte.addEventListener('click', tocAuf);

    var next = ce('button', 'buch-btn buch-next');
    next.innerHTML = '<span class="wort">Weiter</span><span class="pfeil">›</span>';
    next.addEventListener('click', function () { if (aktIdx < PAGES.length - 1) gehe(PAGES[aktIdx + 1].id); });

    zeile.appendChild(prev); zeile.appendChild(mitte); zeile.appendChild(next);
    nav.appendChild(fort); nav.appendChild(zeile);
    document.body.appendChild(nav);

    prev.disabled = aktIdx <= 0;
    next.disabled = aktIdx >= PAGES.length - 1;

    var n = PAGES.length, pos = aktIdx + 1;
    code.textContent = aktID;
    seite.textContent = 'Seite ' + pos + ' / ' + n;
    fuell.style.width = (pos / n * 100) + '%';
  }

  /* ---------- Inhaltsverzeichnis ---------- */
  function baueToc() {
    var overlay = ce('div', 'buch-toc'); overlay.id = 'buchToc'; overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Inhaltsverzeichnis');
    overlay.addEventListener('click', function (e) { if (e.target === overlay) tocZu(); });

    var panel = ce('div', 'buch-toc-panel');

    var kopf = ce('div', 'buch-toc-kopf');
    kopf.appendChild(ce('strong', null, 'Inhalt'));
    var x = ce('button', 'buch-toc-x', '✕');
    x.setAttribute('aria-label', 'Schließen');
    x.addEventListener('click', tocZu);
    kopf.appendChild(x);

    var sprung = ce('div', 'buch-sprung');
    var feld = ce('input'); feld.id = 'sprungFeld'; feld.type = 'text';
    feld.setAttribute('inputmode', 'text');
    feld.placeholder = 'Seite (1–' + PAGES.length + ') oder Kürzel (z. B. lf-04)';
    feld.setAttribute('aria-label', 'Zu Seite oder Einheit springen');
    feld.addEventListener('keydown', function (e) { if (e.key === 'Enter') springe(); });
    var los = ce('button', null, 'Los'); los.id = 'sprungBtn';
    los.addEventListener('click', springe);
    sprung.appendChild(feld); sprung.appendChild(los);

    var liste = ce('div', 'buch-toc-liste'); liste.id = 'tocListe';

    panel.appendChild(kopf); panel.appendChild(sprung); panel.appendChild(liste);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function baueListe() {
    var liste = q('#tocListe'); if (!liste) return;
    liste.innerHTML = '';

    /* Lesezeichen-Bereich */
    var lz = lzLies().filter(function (id) { return idxVon[id] != null; });
    if (lz.length) {
      var box = ce('div', 'buch-lz');
      box.appendChild(ce('div', 'buch-lz-titel', '★ Lesezeichen'));
      lz.forEach(function (id) { box.appendChild(eintrag(PAGES[idxVon[id]], true)); });
      liste.appendChild(box);
    }

    /* Bereiche als aufklappbare Gruppen */
    var bereiche = {};
    var reihenfolge = [];
    PAGES.forEach(function (p) {
      if (!bereiche[p.bcode]) { bereiche[p.bcode] = { titel: p.btitle, items: [] }; reihenfolge.push(p.bcode); }
      bereiche[p.bcode].items.push(p);
    });
    reihenfolge.forEach(function (code) {
      var b = bereiche[code];
      var grp = ce('details', 'buch-grp');
      if (b.items.some(function (p) { return p.id === aktID; })) grp.open = true;
      var sum = ce('summary');
      sum.appendChild(ce('span', 'grp-titel', b.titel));
      grp.appendChild(sum);
      b.items.forEach(function (p) { grp.appendChild(eintrag(p, false)); });
      liste.appendChild(grp);
    });
  }

  function eintrag(p, imLz) {
    var b = ce('button', 'buch-eintrag' + (p.id === aktID ? ' aktuell' : ''));
    if (p.id === aktID) b.setAttribute('aria-current', 'page');
    b.appendChild(ce('span', 'e-code', p.id));
    b.appendChild(ce('span', 'e-titel', p.title));
    if (!imLz && lzLies().indexOf(p.id) >= 0) b.appendChild(ce('span', 'e-stern', '★'));
    b.addEventListener('click', function () { tocZu(); gehe(p.id); });
    return b;
  }

  function springe() {
    var feld = q('#sprungFeld'); if (!feld) return;
    var v = (feld.value || '').trim().toLowerCase();
    if (!v) return;
    var ziel = null;
    if (/^\d+$/.test(v)) {
      var n = parseInt(v, 10);
      if (n >= 1 && n <= PAGES.length) ziel = PAGES[n - 1].id;
    } else {
      if (idxVon[v] != null) ziel = v;
      else {
        var m = v.match(/^([a-z]+)[-\s]?(\d+)$/);   // "lf4" -> "lf-04"
        if (m) {
          var kand = m[1] + '-' + (m[2].length < 2 ? '0' + m[2] : m[2]);
          if (idxVon[kand] != null) ziel = kand;
        }
      }
    }
    if (ziel) { track('book_jump', { from_unit: aktID, to_unit: ziel, query: v }); tocZu(); gehe(ziel); }
    else { feld.style.outline = '2px solid var(--korr)'; setTimeout(function () { feld.style.outline = ''; }, 900); }
  }

  function tocAuf(e) {
    var o = q('#buchToc'); if (!o || !o.hidden) return;
    tocOeffner = (e && e.currentTarget) || document.activeElement;
    baueListe();
    o.hidden = false;
    document.documentElement.classList.add('buch-toc-offen');
    tocGesperrt = [];
    Array.prototype.forEach.call(document.body.children, function (n) {
      if (n !== o && !n.inert) { n.inert = true; tocGesperrt.push(n); }
    });
    var b = q('#tocBtn'); if (b) b.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', tocTasten);
    track('book_toc_open', { unit: aktID });
    setTimeout(function () {
      var feld = q('#sprungFeld');
      if (feld) feld.focus();
    }, 0);
  }
  function tocZu() {
    var o = q('#buchToc'); if (!o || o.hidden) return;
    o.hidden = true;
    document.documentElement.classList.remove('buch-toc-offen');
    tocGesperrt.forEach(function (n) { n.inert = false; });
    tocGesperrt = [];
    var b = q('#tocBtn'); if (b) b.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', tocTasten);
    var rueck = tocOeffner; tocOeffner = null;
    if (rueck && typeof rueck.focus === 'function') rueck.focus();
  }
  function tocTasten(e) {
    if (e.key === 'Escape') { e.preventDefault(); tocZu(); return; }
    if (e.key !== 'Tab') return;
    var panel = q('.buch-toc-panel'); if (!panel) return;
    var fokus = Array.prototype.slice.call(panel.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
    )).filter(function (n) { return n.offsetParent !== null; });
    if (!fokus.length) return;
    var first = fokus[0], last = fokus[fokus.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Eintritts-Animation (Fortsetzung des Blätterns) ---------- */
  function eintrittsAnimation() {
    if (reduce) return;
    var dir = null;
    try { dir = sessionStorage.getItem('buch-dir'); sessionStorage.removeItem('buch-dir'); } catch (e) {}
    if (!dir) return;
    var cls = dir === 'prev' ? 'buch-enter-prev' : 'buch-enter-next';
    document.body.classList.add(cls);
    setTimeout(function () { document.body.classList.remove(cls); }, 460);
  }

  /* ---------- Start ---------- */
  function init(data) {
    if (window.__buchInit || document.getElementById('buchNav')) return;
    window.__buchInit = true;
    (data.bereiche || []).forEach(function (b) {
      (b.einheiten || []).forEach(function (e) {
        idxVon[e.id] = PAGES.length;
        PAGES.push({ id: e.id, title: e.title, bcode: b.code, btitle: b.title });
      });
    });
    aktID = aktuelleId();
    aktIdx = idxVon[aktID];
    if (aktIdx == null) return;   // Einheit nicht im Verzeichnis (z. B. Sonderfall): Buch-Navi aus

    document.documentElement.classList.add('buch-aktiv');
    baueKopf();
    baueNav();
    baueToc();
    lzAnzeige();
    eintrittsAnimation();
  }

  window.addEventListener('pageshow', function () {
    document.body.classList.remove('buch-leave-prev', 'buch-leave-next');
  });

  document.addEventListener('DOMContentLoaded', function () {
    fetch('units/index.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) init(d); })
      .catch(function () { /* ohne Verzeichnis kein Buch-Modus – still */ });
  });
})();
