/* ============================================================
   animationen-kern.js · Grundlage aller Animationen
   Enthält, was jede Animation braucht: Palette, Koordinatenfeld,
   Laufwerk, Bedienleiste, Schieberegler, Vorhersagefragen, die Registry
   und die öffentliche Schnittstelle window.ANIM.

   Dazu die Schrägbild-Helfer (svgb, pfad, txt, boxTeile …). Sie standen
   bis V34 im KP-Block, werden aber auch von SK gebraucht — im Kern
   gehören sie an genau eine Stelle.

   Ebenfalls hier: die Signalwort-Animation. Sie ist die einzige, die
   nicht zu einem Lernbereich gehört, sondern zu den Prüfungseinheiten
   aller vier — also gemeinsamer Bestand.

   Die Lernbereichsdateien (animationen-lf.js, -pz.js, -kp.js, -sk.js)
   hängen sich über window.ANIM._intern hier ein. Diese Datei allein
   zeigt noch nichts; sie stellt nur bereit.
   ============================================================ */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- Palette ----------
     Zwei Sätze mit denselben Rollen. Läuft das Gerät im dunklen Modus,
     blieben die SVG-Flächen sonst weiß in dunkler Umgebung. FARBE ist
     bewusst dasselbe Objekt (die Animationen lesen es beim Bauen aus) —
     beim Umschalten werden die Werte ersetzt und die Bilder neu gebaut. */
  const HELL = {
    ink: '#15233A', weich: '#4A5A70', faint: '#687789', gitter: '#DDE3E8',
    a: '#1F6849', b: '#205B9C', c: '#6B3FA0', korr: '#A8231C', ok: '#1F6849',
    paper: '#F3F5F4', weiss: '#FFFFFF', gelb: '#C98A12', neutral: '#C8D2D8'
  };
  const DUNKEL = {
    ink: '#E7EDF3', weich: '#B0BDC9', faint: '#8595A3', gitter: '#2E3A47',
    a: '#5CBE92', b: '#6FA8E8', c: '#B08CE0', korr: '#F08A82', ok: '#5CBE92',
    paper: '#212B36', weiss: '#1A222C', gelb: '#E3B14C', neutral: '#46545F'
  };
  const FARBE = {};
  const STUFE_NAME = { A: 'Basis', B: 'Standard', C: 'Vertiefung' };
  const STUFE_FARBE = {};
  const mqDunkel = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  function paletteSetzen(dunkel) {
    Object.assign(FARBE, dunkel ? DUNKEL : HELL);
    STUFE_FARBE.A = FARBE.a; STUFE_FARBE.B = FARBE.b; STUFE_FARBE.C = FARBE.c;
  }
  paletteSetzen(!!(mqDunkel && mqDunkel.matches));

  /* ---------- Eigene Bewegungseinstellung ----------
     Die Systemeinstellung „Bewegung reduzieren" kennen viele nicht und
     finden sie auf einem Schulgerät auch nicht. Deshalb gibt es zusätzlich
     einen sichtbaren Schalter in der Formelkarte. Er kann Bewegung nur
     abschalten, nie erzwingen: Wer sie im System abgestellt hat, bekommt
     sie hier nicht zurück. */
  const AUTOSTART_SCHLUESSEL = 'mathe9.autostart';
  function autostartErlaubt() {
    try {
      if (typeof Speicher !== 'undefined') return Speicher.lies(AUTOSTART_SCHLUESSEL, true) !== false;
      return localStorage.getItem(AUTOSTART_SCHLUESSEL) !== 'false';
    } catch { return true; }
  }

  const REDUCED = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Helfer ---------- */
  function fmt(x) { const g = Math.round(x * 100) / 100; return String(g).replace('.', ','); }
  function el(name, attrs, text) {
    const e = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function h(name, cls, text) {
    const e = document.createElement(name);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function osz(t, p) { const u = (t % p) / p; return u < 0.5 ? u * 2 : 2 - u * 2; }
  function stufeVon(o) { return (o && o.stufe ? String(o.stufe) : 'B').toUpperCase().charAt(0); }

  /* Diese Bilder erzählen langsame Vorgänge — 25 Bilder je Sekunde reichen
     dafür vollkommen. Bei 60 Hz würde ein Schulgerät dieselbe Zeichnung
     mehr als doppelt so oft erneuern, ohne dass jemand es sieht. */
  const BILDABSTAND = 1 / 25;

  function Loop(step) {
    let raf = null, last = 0, elapsed = 0, gezeigt = -1, running = false;
    function frame(ts) {
      if (!running) return;
      if (!last) last = ts;
      elapsed += (ts - last) / 1000; last = ts;
      if (gezeigt < 0 || elapsed - gezeigt >= BILDABSTAND) { gezeigt = elapsed; step(elapsed); }
      raf = requestAnimationFrame(frame);
    }
    return {
      play() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); },
      pause() { running = false; if (raf) cancelAnimationFrame(raf); },
      reset() { this.pause(); elapsed = 0; gezeigt = -1; step(0); },
      toggle() { running ? this.pause() : this.play(); },
      get running() { return running; }
    };
  }

  /* Nette Achsenschritte: höchstens etwa zehn Beschriftungen, und zwar
     bei 1, 2, 5, 10, 20, 50 … statt bei krummen Zwischenwerten. */
  function nettSchritt(spanne) {
    const roh = spanne / 10;
    const pot = Math.pow(10, Math.floor(Math.log10(roh)));
    const n = roh / pot;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pot;
  }

  /* ---------- Koordinatenfeld ---------- */
  function Feld(opt) {
    opt = opt || {};
    const xmin = opt.xmin ?? -1, xmax = opt.xmax ?? 7;
    const ymin = opt.ymin ?? -1, ymax = opt.ymax ?? 7;
    const breite = opt.breite ?? 320, R = 20;
    /* Ein Feld darf nicht beliebig hoch werden. Bei 0…100 Litern über
       0…7 Stunden ergäbe eine gemeinsame Skala ein Bild im Verhältnis
       1 : 20 — auf dem Handy unbrauchbar. Solange das Verhältnis passt,
       bleiben die Kästchen quadratisch (nötig fürs Steigungsdreieck);
       erst darüber skalieren die Achsen getrennt, wie im Schulbuch bei
       Sachkontexten mit Stunden und Euro. */
    const MAXV = opt.maxVerhaeltnis ?? 1.6;
    const Ex = (breite - 2 * R) / (xmax - xmin);
    const verh = (ymax - ymin) / (xmax - xmin);
    const Ey = verh > MAXV ? Ex * MAXV / verh : Ex;
    const W = breite, Hh = (ymax - ymin) * Ey + 2 * R;
    const X = x => R + (x - xmin) * Ex;
    const Y = y => Hh - R - (y - ymin) * Ey;
    const uid = 'a' + Math.random().toString(36).slice(2, 7);

    const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'anim-svg', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': opt.alt || 'Animiertes Koordinatensystem zu linearen Funktionen.' });
    const defs = el('defs');
    const mk = el('marker', { id: 'pf' + uid, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: 'auto' });
    mk.appendChild(el('path', { d: 'M0,0 L8,4 L0,8 z', fill: FARBE.ink })); defs.appendChild(mk);
    const clip = el('clipPath', { id: 'cl' + uid });
    clip.appendChild(el('rect', { x: R, y: R, width: W - 2 * R, height: Hh - 2 * R })); defs.appendChild(clip);
    svg.appendChild(defs);

    /* Gitter im Achsenschritt — sonst zeichnet ein Feld von 0 bis 100
       Litern 140 Linien übereinander und wird zur grauen Fläche. */
    const sx = nettSchritt(xmax - xmin), sy = nettSchritt(ymax - ymin);
    for (let i = Math.ceil(xmin / sx) * sx; i <= xmax + 1e-9; i += sx)
      svg.appendChild(el('line', { x1: X(i), y1: R, x2: X(i), y2: Hh - R, stroke: FARBE.gitter, 'stroke-width': 1 }));
    for (let j = Math.ceil(ymin / sy) * sy; j <= ymax + 1e-9; j += sy)
      svg.appendChild(el('line', { x1: R, y1: Y(j), x2: W - R, y2: Y(j), stroke: FARBE.gitter, 'stroke-width': 1 }));

    const nx = xmin <= 0 && xmax >= 0, ny = ymin <= 0 && ymax >= 0;
    const ax = ny ? Y(0) : Hh - R, ay = nx ? X(0) : R;
    svg.appendChild(el('line', { x1: R, y1: ax, x2: W - R + 6, y2: ax, stroke: FARBE.ink, 'stroke-width': 1.6, 'marker-end': `url(#pf${uid})` }));
    svg.appendChild(el('line', { x1: ay, y1: Hh - R, x2: ay, y2: R - 6, stroke: FARBE.ink, 'stroke-width': 1.6, 'marker-end': `url(#pf${uid})` }));
    svg.appendChild(el('text', { x: W - R + 2, y: ax - 6, fill: FARBE.ink, 'font-family': 'monospace', 'font-size': 12 }, opt.xlabel || 'x'));
    svg.appendChild(el('text', { x: ay + 6, y: R - 8, fill: FARBE.ink, 'font-family': 'monospace', 'font-size': 12 }, opt.ylabel || 'y'));

    if (ny) for (let i = Math.ceil(xmin / sx) * sx; i <= xmax + 1e-9; i += sx) { if (Math.abs(i) < 1e-9) continue; svg.appendChild(el('text', { x: X(i), y: +Y(0) + 13, fill: FARBE.weich, 'font-family': 'monospace', 'font-size': 10, 'text-anchor': 'middle' }, fmt(i))); }
    if (nx) for (let j = Math.ceil(ymin / sy) * sy; j <= ymax + 1e-9; j += sy) { if (Math.abs(j) < 1e-9) continue; svg.appendChild(el('text', { x: +X(0) - 5, y: +Y(j) + 3.5, fill: FARBE.weich, 'font-family': 'monospace', 'font-size': 10, 'text-anchor': 'end' }, fmt(j))); }

    const plot = el('g', { 'clip-path': `url(#cl${uid})` }); svg.appendChild(plot);
    const oben = el('g'); svg.appendChild(oben);

    return {
      svg, X, Y, W, H: Hh, xmin, xmax, ymin, ymax,
      add(e, top) { (top ? oben : plot).appendChild(e); return e; },
      gerade(m, b, o) { o = o || {}; const e = el('line', { x1: X(xmin), y1: Y(m * xmin + b), x2: X(xmax), y2: Y(m * xmax + b), stroke: o.farbe || FARBE.b, 'stroke-width': o.breite || 3, 'stroke-linecap': 'round' }); if (o.dash) e.setAttribute('stroke-dasharray', o.dash); return this.add(e, o.top); },
      setGerade(e, m, b) { e.setAttribute('x1', X(xmin)); e.setAttribute('y1', Y(m * xmin + b)); e.setAttribute('x2', X(xmax)); e.setAttribute('y2', Y(m * xmax + b)); },
      linie(x1, y1, x2, y2, o) { o = o || {}; const e = el('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), stroke: o.farbe || FARBE.ink, 'stroke-width': o.breite || 2, 'stroke-linecap': 'round' }); if (o.dash) e.setAttribute('stroke-dasharray', o.dash); return this.add(e, o.top); },
      setLinie(e, x1, y1, x2, y2) { e.setAttribute('x1', X(x1)); e.setAttribute('y1', Y(y1)); e.setAttribute('x2', X(x2)); e.setAttribute('y2', Y(y2)); },
      punkt(x, y, o) { o = o || {}; const e = el('circle', { cx: X(x), cy: Y(y), r: o.r || 5, fill: o.fill || FARBE.b, stroke: FARBE.weiss, 'stroke-width': o.rand ?? 2 }); return this.add(e, o.top !== false); },
      setPunkt(e, x, y) { e.setAttribute('cx', X(x)); e.setAttribute('cy', Y(y)); },
      pfadDreieck(x0, y0, x1, y1, o) { o = o || {}; const e = el('path', { d: `M ${X(x0)} ${Y(y0)} L ${X(x1)} ${Y(y0)} L ${X(x1)} ${Y(y1)}`, fill: o.fuell || 'none', stroke: o.farbe || FARBE.c, 'stroke-width': o.breite || 2 }); return this.add(e, o.top); },
      setDreieck(e, x0, y0, x1, y1) { e.setAttribute('d', `M ${X(x0)} ${Y(y0)} L ${X(x1)} ${Y(y0)} L ${X(x1)} ${Y(y1)}`); },
      text(x, y, s, o) { o = o || {}; const e = el('text', { x: +X(x) + (o.dx || 0), y: +Y(y) + (o.dy || 0), fill: o.farbe || FARBE.ink, 'font-family': o.mono === false ? 'inherit' : 'monospace', 'font-size': o.size || 12, 'font-weight': o.weight || 400, 'text-anchor': o.anchor || 'start' }, s); return this.add(e, true); },
      setText(e, s) { e.textContent = s; },
      setTextPos(e, x, y, dx, dy) { e.setAttribute('x', +X(x) + (dx || 0)); e.setAttribute('y', +Y(y) + (dy || 0)); }
    };
  }

  /* ---------- Bedienleiste + Regler + Stufenabzeichen ---------- */
  function steuerleiste(loop, opt) {
    opt = opt || {};
    const bar = h('div', 'anim-steuer');
    const play = h('button', 'anim-btn anim-play');
    play.type = 'button';
    play.dataset.rolle = 'play';
    const setL = () => { const on = loop.running; play.textContent = on ? '⏸ Pause' : '▶ Abspielen'; play.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    play.addEventListener('click', () => { loop.toggle(); setL(); });
    bar.appendChild(play);
    if (opt.reset !== false) { const rb = h('button', 'anim-btn anim-reset', '↺ Zurück'); rb.type = 'button'; rb.addEventListener('click', () => { loop.reset(); setL(); }); bar.appendChild(rb); }
    bar._sync = setL; setL(); return bar;
  }
  function regler(opt) {
    const wrap = h('label', 'anim-regler');
    wrap.appendChild(h('span', 'anim-regler-txt', opt.label));
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = opt.min; inp.max = opt.max; inp.step = opt.step ?? 1; inp.value = opt.wert;
    inp.addEventListener('input', () => opt.onInput(parseFloat(inp.value)));
    wrap.appendChild(inp); wrap._input = inp; return wrap;
  }
  function abzeichen(host, st) {
    const b = h('div', 'anim-stufe anim-stufe-' + st.toLowerCase());
    b.style.color = STUFE_FARBE[st] || FARBE.ink;
    b.textContent = 'Stufe ' + st + ' · ' + (STUFE_NAME[st] || '');
    host.appendChild(b);
  }

  /* ---------- Vorhersagefragen ----------
     Wer einer Animation nur zusieht, prüft nichts. Eine kurze Frage vor
     dem Start macht aus dem Zuschauen ein Nachschauen: erst tippen, dann
     läuft das Bild. Zentral hinterlegt statt in 40 Definitionen verstreut;
     eine Animation ohne Eintrag startet wie bisher sofort. */
  const FRAGEN = {
    steigung: { text: 'Was passiert mit der Geraden, wenn m größer wird?',
      optionen: ['Sie wird steiler', 'Sie wird flacher', 'Sie rutscht nach oben'], antwort: 0 },
    achsenabschnitt: { text: 'Was passiert, wenn b größer wird?',
      optionen: ['Die Gerade rutscht nach oben', 'Die Gerade wird steiler', 'Nichts ändert sich'], antwort: 0 },
    proportional: { text: 'x wird doppelt so groß. Was wird aus y?',
      optionen: ['Auch doppelt so groß', 'Es bleibt gleich', 'Halb so groß'], antwort: 0 },
    nullstelle: { text: 'Welchen y-Wert hat die Gerade an der Nullstelle?',
      optionen: ['y = 0', 'y = 1', 'Das kommt auf die Gerade an'], antwort: 0 },
    schnittpunkt: { text: 'An welcher Stelle haben beide Geraden denselben y-Wert?',
      optionen: ['Nur im Schnittpunkt', 'Überall', 'An keiner Stelle'], antwort: 0 },
    tarifvergleich: { text: 'Wann lohnt sich der Tarif mit Grundgebühr?',
      optionen: ['Bei vielen Stunden', 'Bei wenigen Stunden', 'Nie'], antwort: 0 },
    gleichung: { text: 'Du nimmst links 4 weg. Was musst du rechts tun?',
      optionen: ['Auch 4 wegnehmen', '4 dazugeben', 'Nichts'], antwort: 0 },
    graphlesen: { text: 'Du hast den x-Wert unten gefunden. Wohin gehst du zuerst?',
      optionen: ['Senkrecht hoch bis zur Linie', 'Waagerecht nach links', 'Schräg zum Ursprung'], antwort: 0 },
    antiproportional: { text: 'Es kommen mehr Maler. Was wird aus der Zeit?',
      optionen: ['Sie wird kürzer', 'Sie wird länger', 'Sie bleibt gleich'], antwort: 0 },
    veraenderung: { text: '100 € werden um 10 % erhöht, dann um 10 % gesenkt. Wieder 100 €?',
      optionen: ['Nein, etwas weniger', 'Ja, genau 100 €', 'Nein, etwas mehr'], antwort: 0 },
    einheiten: { text: '1 dm² sind wie viele cm²?',
      optionen: ['100 cm²', '10 cm²', '1000 cm²'], antwort: 0 },
    oberflaeche: { text: 'Wie viele Flächen musst du beim Quader zusammenzählen?',
      optionen: ['6', '4', '8'], antwort: 0 },
    volumenbox: { text: 'Der Körper füllt sich Schicht für Schicht. Was rechnest du?',
      optionen: ['Grundfläche · Höhe', 'Grundfläche + Höhe', 'Umfang · Höhe'], antwort: 0 },
    prisma: { text: 'Das Prisma wird doppelt so hoch. Was wird aus dem Volumen?',
      optionen: ['Auch doppelt so groß', 'Es bleibt gleich', 'Viermal so groß'], antwort: 0 },
    zylinderflaeche: { text: 'Der Mantel wird abgerollt. Welche Form entsteht?',
      optionen: ['Ein Rechteck', 'Ein Kreis', 'Ein Dreieck'], antwort: 0 },
    volpyr: { text: 'Wie viele Pyramiden füllen das Prisma?',
      optionen: ['3', '2', '4'], antwort: 0 },
    volkegel: { text: 'Wie viele Kegel füllen den Zylinder?',
      optionen: ['3', '2', '4'], antwort: 0 },
    obkegel: { text: 'Der Kegelmantel wird abgerollt. Welche Form entsteht?',
      optionen: ['Ein Kreisausschnitt', 'Ein Rechteck', 'Ein Dreieck'], antwort: 0 },
    kugel: { text: 'Der Radius wird doppelt so groß. Was wird aus der Oberfläche?',
      optionen: ['Viermal so groß', 'Doppelt so groß', 'Achtmal so groß'], antwort: 0 }
  };

  /* ---------- Registry ---------- */
  const LISTE = [], NACH_ID = {};
  function register(def) {
    if (FRAGEN[def.id] && !def.frage) def.frage = FRAGEN[def.id];
    LISTE.push(def); NACH_ID[def.id] = def;
  }


  /* ---------- Schrägbild-Helfer ----------
     Aus dem KP-Block hierher gezogen: SK baut damit Pyramide, Kegel und
     Kugel, KP Quader, Prisma und Zylinder. */
  function svgb(w, hh, alt) { return el('svg', { viewBox: `0 0 ${w} ${hh}`, class: 'anim-svg', role: 'img', 'aria-label': alt || 'Körper' }); }
  function pfad(d, o) { o = o || {}; return el('path', { d, fill: o.fill || 'none', 'fill-opacity': o.fo != null ? o.fo : 1, stroke: o.stroke || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-linejoin': 'round', 'stroke-dasharray': o.dash || '' }); }
  function txt(x, y, s, o) { o = o || {}; return el('text', { x, y, 'text-anchor': o.anchor || 'middle', 'font-family': 'monospace', 'font-size': o.size || 12, fill: o.farbe || FARBE.ink, 'font-weight': o.weight || 400 }, s); }

  /* Schrägbild-Quader: gibt Flächenpfade, Ecken und Kanten zurück. */
  function boxTeile(x, y, aw, ch, ox, oy) {
    const E = {
      D: [x, y], C: [x + aw, y], B: [x + aw, y + ch], A: [x, y + ch],
      Dp: [x + ox, y - oy], Cp: [x + aw + ox, y - oy], Bp: [x + aw + ox, y + ch - oy], Ap: [x + ox, y + ch - oy]
    };
    const P = p => p[0] + ',' + p[1];
    return {
      ecken: E,
      front: `M${P(E.D)} L${P(E.C)} L${P(E.B)} L${P(E.A)} Z`,
      top: `M${P(E.D)} L${P(E.Dp)} L${P(E.Cp)} L${P(E.C)} Z`,
      side: `M${P(E.C)} L${P(E.Cp)} L${P(E.Bp)} L${P(E.B)} Z`,
      kanten: [[E.D, E.C], [E.C, E.B], [E.B, E.A], [E.A, E.D], [E.Dp, E.Cp], [E.Cp, E.Bp], [E.Bp, E.Ap], [E.Ap, E.Dp], [E.D, E.Dp], [E.C, E.Cp], [E.B, E.Bp], [E.A, E.Ap]]
    };
  }
  function zeichneBox(parent, t, K) {
    const g = el('g'); parent.appendChild(g);
    const top = pfad(t.top, { fill: K, fo: .40 }); const side = pfad(t.side, { fill: K, fo: .52 }); const front = pfad(t.front, { fill: K, fo: .68 });
    g.appendChild(top); g.appendChild(side); g.appendChild(front);
    return { g, top, side, front };
  }
  /* Wächst ein Körper, ändern sich nur drei Pfadangaben. Vorher wurde für
     jedes Einzelbild das gesamte SVG neu aufgebaut — 25-mal je Sekunde
     Dutzende Knoten, spürbar auf Schulgeräten. */
  function setzeBox(box, t) {
    box.top.setAttribute('d', t.top);
    box.side.setAttribute('d', t.side);
    box.front.setAttribute('d', t.front);
  }

  window.ANIM = window.ANIM || {};
  window.ANIM._intern = { Feld, Loop, steuerleiste, regler, abzeichen, register, LISTE, NACH_ID, FARBE, STUFE_NAME, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED, mqDunkel, paletteSetzen, autostartErlaubt, AUTOSTART_SCHLUESSEL };
  window.ANIM._geo = { svgb, pfad, txt, boxTeile, zeichneBox, setzeBox };
  window.ANIM.liste = LISTE;
})();

/* ============================================================
   Öffentliche Schnittstelle
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Feld, Loop, steuerleiste, regler, abzeichen, register, LISTE, NACH_ID, FARBE, STUFE_NAME, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED, mqDunkel, paletteSetzen, autostartErlaubt, AUTOSTART_SCHLUESSEL } = I;

  /* ============================================================
     Öffentliche API
     ============================================================ */
  /* Eine Animation, die niemand sieht, muss auch nicht laufen. Auf der
     Einheitenseite standen bisher mehrere Endlosschleifen gleichzeitig im
     Speicher — das kostet Akku und zieht die Aufmerksamkeit von der Aufgabe
     ab, an der gerade gearbeitet wird. Wer selbst auf Pause drückt oder die
     Vorhersagefrage noch offen hat, wird nicht automatisch gestartet. */
  function nurSichtbarLaufen(fig, ctrl) {
    if (!ctrl || typeof ctrl.play !== 'function') return () => {};
    const sync = () => { const b = fig.querySelector('.anim-steuer'); if (b && b._sync) b._sync(); };
    let vomNutzerGestoppt = false;
    const btn = fig.querySelector('[data-rolle="play"]');
    const nutzerKlick = () => {
      vomNutzerGestoppt = !ctrl.running;
      /* Beim bewussten Anhalten den aktuellen Stand einmal vorlesen lassen —
         der laufende Text darunter ist für Screenreader stumm geschaltet. */
      if (!ctrl.running) vorlesen(fig);
    };
    if (btn) btn.addEventListener('click', nutzerKlick);

    let io = null;
    if (!REDUCED && autostartErlaubt() && window.IntersectionObserver) {
      io = new IntersectionObserver(eintraege => {
        eintraege.forEach(e => {
          if (e.isIntersecting) {
            if (!vomNutzerGestoppt && !fig.dataset.wartet && !ctrl.running) { ctrl.play(); sync(); }
          } else if (ctrl.running) { ctrl.pause(); sync(); }
        });
      }, { threshold: 0.2 });
      io.observe(fig);
    } else if (!REDUCED && !autostartErlaubt() && typeof ctrl.pause === 'function') {
      /* Autostart abgewählt: Das Bild steht still, bis jemand abspielt. */
      ctrl.pause(); sync();
    }

    return () => {
      if (btn) btn.removeEventListener('click', nutzerKlick);
      if (io) io.disconnect();
      if (typeof ctrl.pause === 'function') ctrl.pause();
      sync();
    };
  }

  /* ---------- Zugänglichkeit ----------
     Die Zeile unter dem Bild ändert sich fortlaufend. Als Live-Region wäre
     sie eine Flut, ohne Auszeichnung unsichtbar. Deshalb: die laufende
     Zeile ausblenden, dafür eine feste Beschreibung und eine ruhige
     Statuszeile, die nur auf Pause und im Endzustand spricht. */
  /* ---------- Bereichsabhängige Ansicht ----------
     Manche Animationen zeigen je nach Lernbereich etwas anderes — bei
     „signalwoerter" steuert das die Angabe "bereich". Kurztext, Textfassung
     und Vorhersagefrage stehen aber an der Definition und wären dann die des
     Standardbereichs: Auf PZ-14 stand als Textfassung etwas über Liter und
     Anstreichen. Eine Definition kann deshalb variante(opts) anbieten und
     genau diese drei Felder passend überschreiben. Ohne variante bleibt
     alles wie bisher. */
  function ansichtVon(def, opts) {
    if (!def || typeof def.variante !== 'function') return def;
    let abweichung = null;
    try { abweichung = def.variante(opts || {}); } catch (error) { console.warn('[Mathe9 Animation Variante]', def.id, error); }
    return abweichung ? Object.assign(Object.create(def), abweichung) : def;
  }

  function barrierefreiMachen(fig, def, stufe) {
    fig.querySelectorAll('.anim-ables, .anim-rechnung').forEach(n => n.setAttribute('aria-hidden', 'true'));
    if (def && def.kurz) {
      const fest = h('p', 'anim-sr', def.titel + '. ' + def.kurz);
      fig.appendChild(fest);
    }
    const status = h('p', 'anim-sr');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.dataset.rolle = 'status';
    fig.appendChild(status);
    textfassungEinbauen(fig, def, stufe);
  }

  /* ---------- Die Animation in Worten ----------
     Kein Lernziel darf allein an einer Bewegung hängen. Wer nicht sieht,
     wer die Bewegung abgeschaltet hat, wer sie zu schnell findet oder das
     Blatt ausdruckt, bekommt hier dieselbe Aussage als Text — aufklappbar,
     damit sie das Bild nicht verdrängt.

     Die Sätze stehen als `text: { A: [...], B: [...], C: [...] }` an der
     Animationsdefinition. Fehlt die Stufe, wird der Kurztext verwendet;
     fehlt auch der, bleibt der Block weg statt eine Hülse zu zeigen. */
  function textfassungEinbauen(fig, def, stufe) {
    const st = (stufe || 'B').toUpperCase().charAt(0);
    const saetze = (def && def.text && (def.text[st] || def.text.B))
      || (def && def.kurz ? [def.kurz] : null);
    if (!saetze || !saetze.length) return;

    const box = h('details', 'anim-text');
    const kopf = h('summary', null, 'Als Text lesen');
    box.appendChild(kopf);
    const liste = h('ol', 'anim-text-liste');
    saetze.forEach(s => liste.appendChild(h('li', null, s)));
    box.appendChild(liste);
    /* Beim Drucken ist das Bild ein Standbild — dann gehört der Text
       aufgeklappt daneben. */
    box.classList.add('anim-text-druck');
    fig.appendChild(box);
  }
  function vorlesen(fig) {
    const status = fig.querySelector('[data-rolle="status"]');
    const quelle = fig.querySelector('.anim-ables');
    if (status && quelle) status.textContent = quelle.textContent.trim();
  }

  /* ---------- Vorhersage vor dem Start ---------- */
  function vorhersageEinbauen(fig, def, ctrl) {
    const f = def.frage;
    const box = h('div', 'anim-frage');
    box.appendChild(h('span', 'anim-frage-text', f.text));
    const wahl = h('div', 'anim-frage-wahl');
    const echo = h('div', 'anim-frage-echo');
    const optionen = f.optionen.map((text, original) => ({ text, richtig: original === f.antwort }));
    for (let i = optionen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionen[i], optionen[j]] = [optionen[j], optionen[i]];
    }
    let beantwortet = false;
    optionen.forEach(o => {
      const b = h('button', 'anim-tipp-btn', o.text);
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        if (beantwortet) return;
        beantwortet = true;
        wahl.querySelectorAll('.anim-tipp-btn').forEach(x => {
          x.setAttribute('aria-pressed', String(x === b));
          x.disabled = true;
        });
        echo.textContent = (o.richtig ? 'Genau — ' : 'Schau genau hin — ')
          + 'die Animation zeigt es dir jetzt.';
        try {
          if (typeof Tracker !== 'undefined' && Tracker?.track) {
            Tracker.track('animation_prediction', {
              animation: def.id,
              correct: o.richtig,
              level: fig.querySelector('.anim-stufe')?.textContent || null
            });
          }
        } catch { /* Tracking darf die Animation nie blockieren. */ }
        delete fig.dataset.wartet;
        ctrl.play();
        const bar = fig.querySelector('.anim-steuer');
        if (bar && bar._sync) bar._sync();
      });
      wahl.appendChild(b);
    });
    box.appendChild(wahl); box.appendChild(echo);
    fig.insertBefore(box, fig.firstChild);
    fig.dataset.wartet = '1';
  }

  /* Gebaute Bilder pro Host merken. So lassen sich alte RAF-Schleifen und
     IntersectionObserver zuverlässig beenden, bevor eine Animation ersetzt
     oder eine Seite verlassen wird. */
  const GEBAUT = new Map();

  function hostAufraeumen(host) {
    const gebaut = GEBAUT.get(host);
    if (!gebaut) return;
    try { gebaut.cleanup?.(); } catch (error) { console.warn('[Mathe9 Animation Cleanup]', error); }
    GEBAUT.delete(host);
  }

  function bereichAufraeumen(root) {
    if (!root) return;
    [...GEBAUT.entries()].forEach(([host]) => {
      if (host === root || (typeof root.contains === 'function' && root.contains(host))) hostAufraeumen(host);
    });
  }

  function fehlerIn(host, id, error) {
    console.error('[Mathe9 Animation]', id, error);
    host.replaceChildren();
    const box = h('div', 'anim-fehlt', 'Die Animation konnte nicht geladen werden. Die Erklärung bleibt nutzbar.');
    if (window.MATHE9_SUPABASE?.devMode === true) {
      box.appendChild(h('small', 'anim-fehlt-detail', 'Technischer Hinweis: ' + (error?.message || String(error))));
    }
    host.appendChild(box);
  }

  function baueIn(id, host, opts) {
    if (!host) return null;
    hostAufraeumen(host);
    host.replaceChildren();
    const def = NACH_ID[id];
    if (!def) {
      host.appendChild(h('div', 'anim-fehlt', 'Animation „' + id + '“ nicht gefunden.'));
      return null;
    }

    const fig = h('figure', 'anim');
    let ctrl = null;
    try {
      ctrl = def.bauen(fig, opts || {});
      host.appendChild(fig);
      const ansicht = ansichtVon(def, opts || {});
      barrierefreiMachen(fig, ansicht, (opts || {}).stufe);
      if (ansicht.frage && !REDUCED && ctrl && typeof ctrl.pause === 'function') {
        ctrl.pause();
        vorhersageEinbauen(fig, ansicht, ctrl);
        const bar = fig.querySelector('.anim-steuer');
        if (bar && bar._sync) bar._sync();
      }
      const sichtbarCleanup = nurSichtbarLaufen(fig, ctrl);
      const cleanup = () => {
        sichtbarCleanup();
        if (ctrl && typeof ctrl.pause === 'function') ctrl.pause();
      };
      GEBAUT.set(host, { host, id, opts: { ...(opts || {}) }, ctrl, cleanup });
      return ctrl;
    } catch (error) {
      try { ctrl?.pause?.(); } catch { /* best effort */ }
      fehlerIn(host, id, error);
      return null;
    }
  }

  /* Systemfarben umgestellt: alle noch eingehängten Bilder neu aufbauen,
     damit Zeichnung und Rahmen zusammen hell oder zusammen dunkel sind. */
  if (mqDunkel && mqDunkel.addEventListener) {
    mqDunkel.addEventListener('change', e => {
      paletteSetzen(e.matches);
      const kopie = [...GEBAUT.values()].map(g => ({ host: g.host, id: g.id, opts: g.opts }));
      kopie.forEach(g => { if (g.host && g.host.isConnected) baueIn(g.id, g.host, g.opts); else hostAufraeumen(g.host); });
    });
  }

  window.ANIM.block = function (v) {
    const box = h('div', 'bild anim-bild');
    box.dataset.animation = String(v?.name || '');
    /* Das ganze visual-Objekt durchreichen: manche Animationen bedienen
       mehrere Einheiten und brauchen dafür ein „thema" oder eine „form"
       (z. B. dieselbe Rückwärts-Animation für Pyramide und Kegel). */
    requestAnimationFrame(() => {
      if (!box.isConnected) return;
      baueIn(v.name, box, v);
    });
    return box;
  };
  window.ANIM.einbetten = baueIn;
  window.ANIM.aufraeumen = bereichAufraeumen;

  /* Die Seite baut den sichtbaren Schalter; hier liegt nur der Wert und
     das Neuaufbauen der bereits eingehängten Bilder. */
  window.ANIM.autostart = {
    an: autostartErlaubt,
    setzen(an) {
      try {
        if (typeof Speicher !== 'undefined') Speicher.schreib(AUTOSTART_SCHLUESSEL, !!an);
        else localStorage.setItem(AUTOSTART_SCHLUESSEL, String(!!an));
      } catch { /* Speicher gesperrt — dann gilt es für diese Sitzung */ }
      [...GEBAUT.entries()].forEach(([host, gebaut]) => {
        if (host && host.isConnected && gebaut.id) baueIn(gebaut.id, host, gebaut.opts);
      });
    }
  };
  window.ANIM.pausieren = function (root) {
    [...GEBAUT.values()].forEach(g => {
      if (g.host === root || (root?.contains && root.contains(g.host))) {
        try { g.ctrl?.pause?.(); } catch { /* optional */ }
        const bar = g.host.querySelector('.anim-steuer');
        if (bar && bar._sync) bar._sync();
      }
    });
  };
  window.addEventListener('pagehide', () => bereichAufraeumen(document));

  window.ANIM.posterHtml = function (v) {
    const def = NACH_ID[v.name];
    const st = stufeVon(v);
    return '<div class="bild anim-poster">▶ Animation: ' + (def ? def.titel : v.name) + ' · Stufe ' + st + '</div>';
  };

  // Galerie: jede Animation als Karte mit A/B/C-Umschalter.
  const BEREICH_NAME = { LF: 'Lineare Funktionen', PZ: 'Prozent & Zinsrechnung', KP: 'Körper: Prismen & Zylinder', SK: 'Spitzkörper' };
  window.ANIM.galerie = function (host, opts) {
    opts = opts || {};
    // nach Lernbereich (Präfix des bezug) gruppieren; Reihenfolge wie in LISTE
    const gruppen = [];
    LISTE.forEach(def => {
      if (opts.bereich && !def.bezug.startsWith(opts.bereich)) return;
      const pre = def.bezug.split('-')[0];
      let g = gruppen.find(x => x.pre === pre);
      if (!g) { g = { pre, defs: [] }; gruppen.push(g); }
      g.defs.push(def);
    });
    gruppen.forEach(g => {
      if (!opts.bereich) host.appendChild(h('h2', 'anim-gruppe', BEREICH_NAME[g.pre] || g.pre));
      const gitter = h('div', 'anim-galerie'); host.appendChild(gitter);
      g.defs.forEach(def => baueKarte(def, gitter, opts));
    });
  };
  function baueKarte(def, host, opts) {
    {
      const karte = h('section', 'anim-karte');
      const kopf = h('div', 'anim-karte-kopf');
      kopf.appendChild(h('span', 'anim-bezug', def.bezug));
      kopf.appendChild(h('h2', 'anim-karte-titel', def.titel));
      karte.appendChild(kopf);
      karte.appendChild(h('p', 'anim-karte-kurz', def.kurz));

      const schalter = h('div', 'anim-schalter', null);
      const buehne = h('div', 'anim-buehne');
      let aktiv = 'B';
      const knoepfe = {};
      ['A', 'B', 'C'].forEach(s => {
        const btn = h('button', 'anim-schalt anim-schalt-' + s.toLowerCase(), STUFE_NAME[s]);
        btn.type = 'button';
        btn.addEventListener('click', () => { aktiv = s; setzeAktiv(); requestAnimationFrame(() => baueIn(def.id, buehne, { stufe: s, breite: opts.breite || 360 })); });
        knoepfe[s] = btn; schalter.appendChild(btn);
      });
      const setzeAktiv = () => Object.keys(knoepfe).forEach(s => knoepfe[s].setAttribute('aria-pressed', s === aktiv ? 'true' : 'false'));
      setzeAktiv();
      karte.appendChild(schalter);
      karte.appendChild(buehne);

      const fuss = h('div', 'anim-karte-fuss');
      const code = h('code', 'anim-code'); code.textContent = '"visual": { "type": "animation", "name": "' + def.id + '", "stufe": "A" }';
      fuss.appendChild(code);
      karte.appendChild(fuss);

      host.appendChild(karte);
      requestAnimationFrame(() => baueIn(def.id, buehne, { stufe: aktiv, breite: opts.breite || 360 }));
    }
  }
})();

/* ============================================================
   Signalwörter für die Prüfungseinheiten
   PZ-14, LF-16, KP-12 und SK-12 hatten bisher gar kein Bild. Gerade dort
   ist der erste Schritt aber immer derselbe: Was ist überhaupt gesucht?
   Diese Animation zeigt genau das — ein Signalwort erscheint, der
   passende Kasten leuchtet auf.

   Sie steht im Kern, weil sie als einzige zu allen vier Lernbereichen
   gehört. Ein eigener Nachladeschritt für ein Bild wäre mehr Mechanik,
   als er einspart.
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Loop, steuerleiste, abzeichen, register, FARBE, fmt, h, stufeVon, REDUCED } = I;

  /* Je Lernbereich: die Kästen und die Signalwörter, die hineingehören.
     Stufe A nimmt nur die eindeutigen, C auch die kniffligen. */
  const BEREICHE = {
    kp: {
      kaesten: ['Volumen', 'Oberfläche'],
      worte: {
        A: [['Wie viel Liter passen hinein?', 0], ['Wie viel Material zum Einwickeln?', 1],
            ['Wie viel fasst der Tank?', 0], ['Wie viel Farbe zum Anstreichen?', 1]],
        B: [['Rauminhalt in cm³', 0], ['Fläche zum Bekleben', 1],
            ['Wie viel Wasser passt hinein?', 0], ['Wie viel Blech für die Dose?', 1]],
        C: [['Wie viel Sand füllt die Kiste?', 0], ['Wie viel Papier für den Karton?', 1],
            ['Wie viel Luft ist im Zelt?', 0], ['Wie viel Stoff braucht das Zelt?', 1]]
      }
    },
    sk: {
      kaesten: ['Volumen', 'Oberfläche'],
      worte: {
        A: [['Wie viel Eis passt in die Waffel?', 0], ['Wie viel Papier für den Hut?', 1],
            ['Wie viel fasst das Silo?', 0], ['Wie viel Farbe für die Spitze?', 1]],
        B: [['Rauminhalt der Pyramide', 0], ['Mantelfläche des Kegels', 1],
            ['Wie viel Sand passt hinein?', 0], ['Wie viel Blech für den Trichter?', 1]],
        C: [['Wie viel Wasser fasst der Turm?', 0], ['Wie viel Anstrich braucht der Turm?', 1],
            ['Volumen der Halbkugel', 0], ['Oberfläche der Halbkugel', 1]]
      },
      kurz: 'Erst lesen, dann rechnen: Das Signalwort zeigt, ob Volumen oder Oberfläche gesucht ist.',
      text: {
        A: ['„fasst", „passt hinein" fragen nach dem Rauminhalt.', '„Papier", „Farbe", „Blech" fragen nach der Außenhaut.'],
        B: ['Erst lesen, welche Größe gesucht ist, dann die Formel wählen.'],
        C: ['„Wie viel Anstrich?" meint die Oberfläche, „wie viel Wasser?" das Volumen.', 'Bei der Halbkugel steht immer dabei, welche der beiden Größen gemeint ist.']
      },
      frage: {
        text: '„Wie viel Eis passt in die Waffel?" — wonach ist gefragt?',
        optionen: ['Nach dem Volumen', 'Nach der Oberfläche', 'Nach der Mantellinie'],
        antwort: 0
      }
    },
    /* LF-16 ist das Prüfungstraining: Dort steht nicht mehr dabei, welcher
       Aufgabentyp gemeint ist. Die Kästen sind deshalb keine Größen wie bei
       PZ, sondern die drei Wege, die in der Prüfung verlangt werden. */
    lf: {
      kaesten: ['Nullstelle', 'Punktprobe', 'Gleichung aufstellen'],
      worte: {
        A: [['Wo schneidet die Gerade die x-Achse?', 0], ['Liegt P(2 | 5) auf der Geraden?', 1],
            ['Lies m und b ab und schreibe y = mx + b.', 2], ['Setze y = 0.', 0]],
        B: [['„schneidet die x-Achse"', 0], ['„liegt auf der Geraden"', 1],
            ['„stelle die Gleichung auf"', 2], ['Prüfe durch Einsetzen.', 1]],
        C: [['Bei welchem x ist der Kontostand null?', 0], ['Erreicht der Tarif genau 30 € bei 4 Stunden?', 1],
            ['Die Gerade geht durch A(1 | 3) und B(4 | 9).', 2], ['Wann ist der Tank leer?', 0]]
      },
      kurz: 'Erst lesen, dann rechnen: Das Signalwort zeigt, welcher der vier Aufgabentypen gemeint ist.',
      text: {
        A: ['„schneidet die x-Achse" heißt: Nullstelle — setze y = 0.', '„liegt auf" heißt: Punktprobe — setze den Punkt ein.', '„stelle die Gleichung auf" heißt: m und b bestimmen.'],
        B: ['In der Prüfung steht der Aufgabentyp nicht dabei. Erkenne ihn am Signalwort, dann rechne.'],
        C: ['Im Sachkontext ist das Signalwort versteckt: „Wann ist der Tank leer?" fragt nach der Nullstelle.', '„Erreicht der Tarif genau 30 €?" ist eine Punktprobe.', 'Zwei gegebene Punkte heißen: Gleichung aufstellen.']
      },
      frage: {
        text: '„Wo schneidet die Gerade die x-Achse?" — was ist gesucht?',
        optionen: ['Die Nullstelle', 'Der y-Achsenabschnitt', 'Die Steigung'],
        antwort: 0
      }
    },
    pz: {
      kaesten: ['Grundwert G', 'Prozentwert W', 'Prozentsatz p %'],
      worte: {
        A: [['Wovon werden die Prozente genommen?', 0], ['Wie viel Euro sind das?', 1],
            ['Wie viel Prozent sind das?', 2]],
        B: [['Der Preis vor dem Rabatt', 0], ['Der Rabatt in Euro', 1],
            ['Der Rabatt in Prozent', 2], ['Das Ganze = 100 %', 0]],
        C: [['18 € sind 30 % — wovon?', 0], ['30 % von 60 € sind …', 1],
            ['18 € von 60 € sind … %', 2], ['Der Wert nach der Erhöhung', 1]]
      },
      kurz: 'Erst lesen, dann rechnen: Das Signalwort zeigt, ob G, W oder p % gesucht ist.',
      text: {
        A: ['„Wovon werden die Prozente genommen?" fragt nach dem Grundwert G.', '„Wie viel Euro sind das?" fragt nach dem Prozentwert W.', '„Wie viel Prozent sind das?" fragt nach dem Prozentsatz p %.'],
        B: ['Der Preis vor dem Rabatt ist der Grundwert, der Rabatt in Euro der Prozentwert.', 'Das Ganze ist immer 100 % — das ist der Grundwert.'],
        C: ['„18 € sind 30 % — wovon?" sucht den Grundwert, obwohl zwei Zahlen dastehen.', 'Der Wert nach einer Erhöhung ist ein Prozentwert, nicht der Grundwert.']
      },
      frage: {
        text: '„Wovon werden die Prozente genommen?" — was ist gesucht?',
        optionen: ['Der Grundwert G', 'Der Prozentwert W', 'Der Prozentsatz p %'],
        antwort: 0
      }
    }
  };

  register({
    id: 'signalwoerter', titel: 'Signalwörter: Was ist gesucht?', bezug: 'KP-12',
    kurz: 'Erst lesen, dann rechnen. Das Signalwort zeigt, was gesucht ist — über „bereich“ für PZ, LF, KP oder SK.',
    text: {
      A: ['„fasst", „Liter", „passt hinein" fragen nach dem Rauminhalt.', '„anstreichen", „Material", „einwickeln" fragen nach der Außenhaut.'],
      B: ['Erst lesen, welche Größe gesucht ist, dann die Formel wählen.'],
      C: ['Manche Formulierungen sind unauffällig: „Wie viel Farbe?" meint die Oberfläche.', '„Wie viel Wasser?" meint das Volumen.']
    },
    frage: {
      text: '„Wie viel Liter passen hinein?“ — wonach ist gefragt?',
      optionen: ['Nach dem Rauminhalt', 'Nach der Außenhaut', 'Nach der Höhe'],
      antwort: 0
    },
    /* Das Bild zeigt je Lernbereich andere Kästen und Signalwörter. Kurztext,
       Textfassung und Vorhersagefrage müssen mitwandern, sonst hört jemand
       auf PZ-14 etwas über Liter. Die Felder oben bleiben die Fassung für KP
       und damit der Rückfall, wenn ein Bereich sie nicht mitbringt. */
    variante(o) {
      const cfg = BEREICHE[String((o && o.bereich) || 'kp').toLowerCase()];
      if (!cfg) return null;
      const abw = {};
      if (cfg.kurz) abw.kurz = cfg.kurz;
      if (cfg.text) abw.text = cfg.text;
      if (cfg.frage) abw.frage = cfg.frage;
      return abw;
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const schluessel = String((o && o.bereich) || 'kp').toLowerCase();
      const cfg = BEREICHE[schluessel] || BEREICHE.kp;
      const liste = cfg.worte[st] || cfg.worte.A;

      const box = h('div', 'anim-signal');
      const karte = h('div', 'anim-signal-karte', liste[0][0]);
      box.appendChild(karte);
      box.appendChild(h('div', 'anim-signal-pfeil', '↓'));

      const reihe = h('div', 'anim-signal-reihe');
      const kaesten = cfg.kaesten.map(name => {
        const k = h('div', 'anim-signal-kasten', name);
        reihe.appendChild(k); return k;
      });
      box.appendChild(reihe);

      const info = h('div', 'anim-ables');
      let stand = -1;
      const zeige = i => {
        if (i === stand) return;          // nur bei echtem Wechsel neu setzen
        stand = i;
        const [text, ziel] = liste[i % liste.length];
        karte.textContent = text;
        kaesten.forEach((k, j) => k.classList.toggle('an', j === ziel));
        info.innerHTML = `→ gesucht ist <b>${cfg.kaesten[ziel]}</b>`;
      };
      zeige(0);
      const loop = Loop(t => zeige(Math.floor(t / 2.4) % liste.length));
      const weiter = h('button', 'anim-btn anim-play', 'Nächstes Wort →');
      weiter.type = 'button';
      weiter.addEventListener('click', () => zeige((stand + 1) % liste.length));
      const bar = steuerleiste(loop); bar.insertBefore(weiter, bar.firstChild);
      host.appendChild(box); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });
})();
