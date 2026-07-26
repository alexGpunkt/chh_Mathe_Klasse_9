/* ============================================================
   animationen.js · Bewegte Visualisierungen zu linearen Funktionen
   — niveaudifferenziert (A Basis · B Standard · C Vertiefung)

   Eigenständig und datengetrieben: geladen NACH zeichnen.js, meldet sich
   als window.ANIM an. zeichnen.js ruft ANIM.block(v) für den Bildtyp
   "animation" auf. Fehlt diese Datei, zeigt zeichnen.js einen Platzhalter.

   Einbinden in Lernkarte oder Aufgabe — mit passender Niveaustufe:
     "visual": { "type": "animation", "name": "steigung", "stufe": "A" }
   Ohne "stufe" wird B (Standard) angenommen.

   Jede Animation ist reines Inline-SVG + Vanilla-JS: lädt sofort, offline
   nutzbar, druckt das Standbild, stylt sich selbst. „Bewegung reduzieren“
   (Systemeinstellung) wird respektiert: kein Autostart, nur ein Standbild.
   ============================================================ */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  const FARBE = {
    ink: '#15233A', weich: '#4A5A70', faint: '#8C99A8', gitter: '#DDE3E8',
    a: '#2E7D5B', b: '#2563A8', c: '#6B3FA0', korr: '#C62F26', ok: '#2E7D5B',
    paper: '#F3F5F4', weiss: '#FFFFFF', gelb: '#C98A12'
  };
  const STUFE_NAME = { A: 'Basis', B: 'Standard', C: 'Vertiefung' };
  const STUFE_FARBE = { A: FARBE.a, B: FARBE.b, C: FARBE.c };

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

  function Loop(step) {
    let raf = null, last = 0, elapsed = 0, running = false;
    function frame(ts) {
      if (!running) return;
      if (!last) last = ts;
      elapsed += (ts - last) / 1000; last = ts;
      step(elapsed);
      raf = requestAnimationFrame(frame);
    }
    return {
      play() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); },
      pause() { running = false; if (raf) cancelAnimationFrame(raf); },
      reset() { this.pause(); elapsed = 0; step(0); },
      toggle() { running ? this.pause() : this.play(); },
      get running() { return running; }
    };
  }

  /* ---------- Koordinatenfeld ---------- */
  function Feld(opt) {
    opt = opt || {};
    const xmin = opt.xmin ?? -1, xmax = opt.xmax ?? 7;
    const ymin = opt.ymin ?? -1, ymax = opt.ymax ?? 7;
    const breite = opt.breite ?? 320, R = 20;
    const E = (breite - 2 * R) / (xmax - xmin);
    const W = breite, Hh = (ymax - ymin) * E + 2 * R;
    const X = x => R + (x - xmin) * E;
    const Y = y => Hh - R - (y - ymin) * E;
    const uid = 'a' + Math.random().toString(36).slice(2, 7);

    const svg = el('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'anim-svg', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': opt.alt || 'Animiertes Koordinatensystem zu linearen Funktionen.' });
    const defs = el('defs');
    const mk = el('marker', { id: 'pf' + uid, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 6, markerHeight: 6, orient: 'auto' });
    mk.appendChild(el('path', { d: 'M0,0 L8,4 L0,8 z', fill: FARBE.ink })); defs.appendChild(mk);
    const clip = el('clipPath', { id: 'cl' + uid });
    clip.appendChild(el('rect', { x: R, y: R, width: W - 2 * R, height: Hh - 2 * R })); defs.appendChild(clip);
    svg.appendChild(defs);

    for (let i = Math.ceil(xmin); i <= Math.floor(xmax); i++)
      svg.appendChild(el('line', { x1: X(i), y1: R, x2: X(i), y2: Hh - R, stroke: FARBE.gitter, 'stroke-width': 1 }));
    for (let j = Math.ceil(ymin); j <= Math.floor(ymax); j++)
      svg.appendChild(el('line', { x1: R, y1: Y(j), x2: W - R, y2: Y(j), stroke: FARBE.gitter, 'stroke-width': 1 }));

    const nx = xmin <= 0 && xmax >= 0, ny = ymin <= 0 && ymax >= 0;
    const ax = ny ? Y(0) : Hh - R, ay = nx ? X(0) : R;
    svg.appendChild(el('line', { x1: R, y1: ax, x2: W - R + 6, y2: ax, stroke: FARBE.ink, 'stroke-width': 1.6, 'marker-end': `url(#pf${uid})` }));
    svg.appendChild(el('line', { x1: ay, y1: Hh - R, x2: ay, y2: R - 6, stroke: FARBE.ink, 'stroke-width': 1.6, 'marker-end': `url(#pf${uid})` }));
    svg.appendChild(el('text', { x: W - R + 2, y: ax - 6, fill: FARBE.ink, 'font-family': 'monospace', 'font-size': 12 }, opt.xlabel || 'x'));
    svg.appendChild(el('text', { x: ay + 6, y: R - 8, fill: FARBE.ink, 'font-family': 'monospace', 'font-size': 12 }, opt.ylabel || 'y'));

    const sx = Math.ceil((xmax - xmin) / 10) || 1, sy = Math.ceil((ymax - ymin) / 10) || 1;
    if (ny) for (let i = Math.ceil(xmin); i <= Math.floor(xmax); i++) { if (i === 0 || i % sx) continue; svg.appendChild(el('text', { x: X(i), y: +Y(0) + 13, fill: FARBE.weich, 'font-family': 'monospace', 'font-size': 10, 'text-anchor': 'middle' }, i)); }
    if (nx) for (let j = Math.ceil(ymin); j <= Math.floor(ymax); j++) { if (j === 0 || j % sy) continue; svg.appendChild(el('text', { x: +X(0) - 5, y: +Y(j) + 3.5, fill: FARBE.weich, 'font-family': 'monospace', 'font-size': 10, 'text-anchor': 'end' }, j)); }

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
    const play = h('button', 'anim-btn anim-play'); play.type = 'button';
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

  /* ---------- Registry ---------- */
  const LISTE = [], NACH_ID = {};
  function register(def) { LISTE.push(def); NACH_ID[def.id] = def; }

  /* ============================================================
     Konzept 1 · Steigung m  (LF-04)
     A: nach rechts/oben zählen (nur positive, ganze m)
     B: m = Δy : Δx (auch negativ, Bruch)
     C: aus zwei Punkten — Dreiecksgröße egal, m bleibt
     ============================================================ */
  register({
    id: 'steigung', titel: 'Steigung m', bezug: 'LF-04',
    kurz: 'Wie steil ist die Gerade? A: Kästchen zählen · B: m = Δy:Δx · C: aus zwei Punkten (Dreieck egal).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const ables = h('div', 'anim-ables');

      if (st === 'C') {
        const m = 1.5, b = 0;
        const F = Feld({ xmin: -1, xmax: 6, ymin: -1, ymax: 8, breite: o.breite || 340 });
        F.gerade(m, b, { farbe: FARBE.b });
        const P = { x: 1, y: m * 1 + b };
        F.punkt(P.x, P.y, { fill: FARBE.a });
        const pQ = F.punkt(3, m * 3 + b, { fill: FARBE.c });
        const drei = F.pfadDreieck(P.x, P.y, 3, m * 3 + b, { farbe: FARBE.c });
        const tP = F.text(P.x, P.y, 'P', { dx: -14, dy: -6, farbe: FARBE.a, weight: 700 });
        const tQ = F.text(3, m * 3 + b, 'Q', { dx: 8, dy: -6, farbe: FARBE.c, weight: 700 });
        const zeig = qx => {
          const qy = m * qx + b; F.setPunkt(pQ, qx, qy); F.setDreieck(drei, P.x, P.y, qx, qy);
          F.setTextPos(tQ, qx, qy, 8, -6);
          ables.innerHTML = `m = (${fmt(qy)} − ${fmt(P.y)}) : (${fmt(qx)} − ${fmt(P.x)}) = <b>${fmt(m)}</b> — egal, wie groß das Dreieck ist`;
        };
        zeig(3);
        const loop = Loop(t => { const qx = 2 + osz(t, 7) * 3; zeig(Math.round(qx * 2) / 2); });
        const bar = steuerleiste(loop);
        host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const b = st === 'A' ? 0 : 1;
      const cfg = st === 'A' ? { min: 1, max: 3, step: 1, start: 2, dx: 1 } : { min: -2, max: 3, step: 0.5, start: 1, dx: 2 };
      let m = cfg.start;
      const F = Feld({ xmin: -1, xmax: 6, ymin: st === 'A' ? -1 : -3, ymax: st === 'A' ? 8 : 7, breite: o.breite || 340 });
      const linie = F.gerade(m, b, { farbe: FARBE.b });
      const drei = F.pfadDreieck(0, b, cfg.dx, m * cfg.dx + b, { farbe: FARBE.c });
      F.punkt(0, b, { fill: FARBE.b });
      const zeichne = () => {
        F.setGerade(linie, m, b); F.setDreieck(drei, 0, b, cfg.dx, m * cfg.dx + b);
        ables.innerHTML = st === 'A'
          ? `${cfg.dx} nach rechts, <b>${fmt(m)}</b> nach oben &nbsp;→&nbsp; m = <b>${fmt(m)}</b>`
          : `m = Δy : Δx = ${fmt(m * cfg.dx)} : ${fmt(cfg.dx)} = <b>${fmt(m)}</b>`;
      };
      zeichne();
      const loop = Loop(t => { m = st === 'A' ? 1 + Math.floor(osz(t, 6) * 2.999) : Math.round((-2 + osz(t, 8) * 5) * 2) / 2; if (reg) reg._input.value = m; zeichne(); });
      const reg = regler({ label: 'Steigung m', min: cfg.min, max: cfg.max, step: cfg.step, wert: m, onInput: v => { loop.pause(); if (bar) bar._sync(); m = v; zeichne(); } });
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); host.appendChild(reg); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 2 · y-Achsenabschnitt b  (LF-05)
     A: b ablesen (ganze Zahlen)     B: b als Grundbetrag im Sachkontext
     C: b = y − m·x aus einem Punkt berechnen
     ============================================================ */
  register({
    id: 'achsenabschnitt', titel: 'y-Achsenabschnitt b', bezug: 'LF-05',
    kurz: 'Wo trifft die Gerade die y-Achse? A: ablesen · B: Grundbetrag · C: b = y − m·x berechnen.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const ables = h('div', 'anim-ables');
      const F = Feld({ xmin: -1, xmax: 6, ymin: -3, ymax: 7, breite: o.breite || 340 });

      if (st === 'C') {
        const m = 2, P = { x: 2, y: 5 }, b = P.y - m * P.x; // = 1
        F.gerade(m, b, { farbe: FARBE.b });
        F.punkt(P.x, P.y, { fill: FARBE.c });
        F.text(P.x, P.y, 'P(2 | 5)', { dx: 8, dy: -6, farbe: FARBE.c, size: 11, weight: 700 });
        const pB = F.punkt(0, b, { fill: FARBE.gelb });
        const glei = F.punkt(P.x, P.y, { fill: FARBE.ink, r: 4 });
        const zeig = x => { const y = m * x + b; F.setPunkt(glei, x, y); ables.innerHTML = `b = y − m·x = ${fmt(P.y)} − ${fmt(m)}·${fmt(P.x)} = <b style="color:${FARBE.gelb}">${fmt(b)}</b>`; };
        zeig(P.x);
        const loop = Loop(t => zeig(P.x * (1 - osz(t, 5))));
        const bar = steuerleiste(loop);
        host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const m = st === 'A' ? 1 : 0.5;
      const cfg = st === 'A' ? { min: -3, max: 3, step: 1, start: 2 } : { min: -2, max: 4, step: 0.5, start: 1 };
      let b = cfg.start;
      const linie = F.gerade(m, b, { farbe: FARBE.b });
      const pB = F.punkt(0, b, { fill: FARBE.gelb });
      const tB = F.text(0, b, '', { dx: -8, dy: -8, anchor: 'end', farbe: FARBE.gelb, weight: 700 });
      const zeichne = () => {
        F.setGerade(linie, m, b); F.setPunkt(pB, 0, b); F.setText(tB, 'b = ' + fmt(b)); F.setTextPos(tB, 0, b, -8, -8);
        ables.innerHTML = st === 'A'
          ? `Schnitt mit der y-Achse bei <b>b = ${fmt(b)}</b>`
          : `Grundbetrag (auch bei x = 0): <b>b = ${fmt(b)} €</b>`;
      };
      zeichne();
      const loop = Loop(t => { b = Math.round((cfg.min + osz(t, 7) * (cfg.max - cfg.min)) / cfg.step) * cfg.step; if (reg) reg._input.value = b; zeichne(); });
      const reg = regler({ label: st === 'A' ? 'y-Achsenabschnitt b' : 'Grundbetrag b', min: cfg.min, max: cfg.max, step: cfg.step, wert: b, onInput: v => { loop.pause(); if (bar) bar._sync(); b = v; zeichne(); } });
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); host.appendChild(reg); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 3 · Geradenbaukasten y = m·x + b  (LF-06)
     A: ganze m, b — ein Regler nach dem anderen begreifen
     B: halbe Schritte, negativ
     C: Sonderfall m = 0 (waagerecht) wird im Durchlauf sichtbar
     ============================================================ */
  register({
    id: 'baukasten', titel: 'Geradenbaukasten: y = m·x + b', bezug: 'LF-06',
    kurz: 'm und b zusammen. A: ganze Zahlen · B: auch negativ/halb · C: mit Sonderfall m = 0.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const gl = h('div', 'anim-gleichung');
      const F = Feld({ xmin: -1, xmax: 6, ymin: -3, ymax: 7, breite: o.breite || 340 });
      const cfg = st === 'A' ? { m: { min: 0, max: 3, step: 1 }, b: { min: -3, max: 3, step: 1 } }
                             : { m: { min: -2, max: 3, step: 0.5 }, b: { min: -3, max: 4, step: 0.5 } };
      let m = st === 'A' ? 1 : 1, b = 0;
      const linie = F.gerade(m, b, { farbe: FARBE.b });
      const drei = F.pfadDreieck(0, b, 1, m + b, { farbe: FARBE.c });
      const pB = F.punkt(0, b, { fill: FARBE.gelb });
      const note = h('div', 'anim-ables');
      const setGl = () => { const vz = b < 0 ? '−' : '+'; gl.innerHTML = `y = <b class="m">${fmt(m)}</b> · x <span class="op">${vz}</span> <b class="b">${fmt(Math.abs(b))}</b>`; };
      const zeichne = () => {
        F.setGerade(linie, m, b); F.setDreieck(drei, 0, b, 1, m + b); F.setPunkt(pB, 0, b); setGl();
        note.innerHTML = (st === 'C' && Math.abs(m) < 1e-9)
          ? `m = 0 → <b>waagerechte Gerade</b> (überall gleicher y-Wert)`
          : '&nbsp;';
      };
      zeichne();
      const loop = Loop(t => {
        if (st === 'A') { m = Math.round(osz(t, 8) * 3); b = Math.round(-3 + osz(t + 2, 10) * 6); }
        else { m = Math.round((-2 + osz(t, 9) * 5) * 2) / 2; b = Math.round((-3 + osz(t + 3, 11) * 7) * 2) / 2; }
        if (rm) rm._input.value = m; if (rb) rb._input.value = b; zeichne();
      });
      const rm = regler({ label: 'Steigung m', min: cfg.m.min, max: cfg.m.max, step: cfg.m.step, wert: m, onInput: v => { loop.pause(); if (bar) bar._sync(); m = v; zeichne(); } });
      const rb = regler({ label: 'y-Achsenabschnitt b', min: cfg.b.min, max: cfg.b.max, step: cfg.b.step, wert: b, onInput: v => { loop.pause(); if (bar) bar._sync(); b = v; zeichne(); } });
      const bar = steuerleiste(loop);
      host.appendChild(gl); host.appendChild(F.svg);
      const box = h('div', 'anim-regler-paar'); box.appendChild(rm); box.appendChild(rb); host.appendChild(box);
      host.appendChild(note); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 4 · Wertetabelle → Graph  (LF-02)
     A: Zeilen werden Punkte, dann Gerade
     B: gleiche x-Schritte → gleiche y-Sprünge (+d) sichtbar
     C: linear vs. nicht linear (konstante vs. wachsende Differenz)
     ============================================================ */
  register({
    id: 'wertetabelle', titel: 'Von der Wertetabelle zum Graphen', bezug: 'LF-02',
    kurz: 'A: Punkte setzen · B: konstante Differenz +d zeigt „linear“ · C: linear vs. nicht linear.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);

      if (st === 'C') {
        const xs = [0, 1, 2, 3];
        const lin = xs.map(x => [x, 1 + x]);       // y = x+1  (Differenz +1)
        const qua = xs.map(x => [x, x * x]);       // y = x²    (Differenzen 1,3,5)
        const F = Feld({ xmin: -1, xmax: 5, ymin: -1, ymax: 10, breite: o.breite || 320 });
        const ables = h('div', 'anim-ables');
        lin.forEach(p => F.punkt(p[0], p[1], { fill: FARBE.a, r: 4 }));
        F.gerade(1, 1, { farbe: FARBE.a });
        const qp = qua.map(p => F.punkt(p[0], p[1], { fill: FARBE.korr, r: 4 }));
        const kurve = el('polyline', { points: qua.map(p => `${F.X(p[0])},${F.Y(p[1])}`).join(' '), fill: 'none', stroke: FARBE.korr, 'stroke-width': 2, 'stroke-dasharray': '4 3' });
        F.add(kurve);
        ables.innerHTML = `<span style="color:${FARBE.a}">y = x+1: Differenz +1, +1, +1 → linear</span><br><span style="color:${FARBE.korr}">y = x²: Differenz +1, +3, +5 → nicht linear</span>`;
        host.appendChild(F.svg); host.appendChild(ables);
        return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
      }

      const m = 0.5, b = 1, xs = [-2, 0, 2, 4];
      const paare = xs.map(x => [x, m * x + b]);
      const wrap = h('div', 'anim-tabellenreihe');
      const tab = h('table', 'anim-tabelle');
      const rx = h('tr'); rx.appendChild(h('th', null, 'x')); xs.forEach(x => rx.appendChild(h('td', null, fmt(x))));
      const ry = h('tr'); ry.appendChild(h('th', null, 'y')); paare.forEach(p => ry.appendChild(h('td', null, fmt(p[1]))));
      tab.appendChild(rx); tab.appendChild(ry);
      const F = Feld({ xmin: -3, xmax: 6, ymin: -1, ymax: 5, breite: o.breite || 300 });
      const linie = F.gerade(m, b, { farbe: FARBE.b }); linie.style.opacity = 0;
      const punkte = paare.map(() => { const p = F.punkt(0, 0, { fill: FARBE.a }); p.style.opacity = 0; return p; });
      const diffTexte = st === 'B' ? paare.slice(1).map(() => F.text(0, 0, '', { farbe: FARBE.c, size: 10 })) : [];
      const zellen = () => Array.from(ry.querySelectorAll('td'));
      const ables = h('div', 'anim-ables');
      const setStand = tsek => {
        const n = Math.min(paare.length, Math.floor(tsek / 0.8));
        punkte.forEach((p, i) => { const an = i < n; p.style.opacity = an ? 1 : 0; if (an) F.setPunkt(p, paare[i][0], paare[i][1]); });
        zellen().forEach((td, i) => td.classList.toggle('an', i < n));
        if (st === 'B') diffTexte.forEach((tx, i) => { const on = i + 1 < n; tx.style.opacity = on ? 1 : 0; if (on) { const mx = (paare[i][0] + paare[i + 1][0]) / 2, my = (paare[i][1] + paare[i + 1][1]) / 2; F.setTextPos(tx, mx, my, 4, -4); F.setText(tx, '+' + fmt(paare[i + 1][1] - paare[i][1])); } });
        linie.style.opacity = n >= paare.length ? 1 : 0;
        ables.innerHTML = st === 'B'
          ? (n >= paare.length ? `gleiche x-Schritte → gleiche y-Sprünge <b>+1</b> → <b>linear</b>` : `x um 2 weiter → y immer um … ?`)
          : (n >= paare.length ? `Alle Punkte gesetzt → Gerade zeichnen` : `Zeile ${n}/${paare.length}`);
      };
      setStand(REDUCED ? 99 : 0);
      const loop = Loop(t => setStand(t % 5));
      const bar = steuerleiste(loop);
      wrap.appendChild(tab);
      host.appendChild(wrap); host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
      if (REDUCED) zellen().forEach(td => td.classList.add('an')); else loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 5 · Proportionalität y = m·x  (LF-03)
     A: doppeltes x → doppeltes y     B: m = y : x (Verhältnis konstant)
     C: warum durch (0|0) — x = 0 ⇒ y = 0
     ============================================================ */
  register({
    id: 'proportional', titel: 'Proportional: y = m·x', bezug: 'LF-03',
    kurz: 'Ursprungsgerade. A: doppeltes x → doppeltes y · B: m = y:x · C: warum durch (0|0).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const m = 1;
      const F = Feld({ xmin: -1, xmax: 6, ymin: -1, ymax: 7, breite: o.breite || 340 });
      F.gerade(m, 0, { farbe: FARBE.b });
      const nullp = F.punkt(0, 0, { fill: FARBE.ink, r: 3 });
      const ables = h('div', 'anim-ables');

      if (st === 'C') {
        const pkt = F.punkt(3, 3, { fill: FARBE.b });
        F.text(0, 0, '(0 | 0)', { dx: 6, dy: 14, farbe: FARBE.ink, size: 10 });
        const zeig = x => { const y = m * x; F.setPunkt(pkt, x, y); ables.innerHTML = x < 0.05 ? `x = 0 → y = m·0 = <b>0</b> → die Gerade muss durch <b>(0 | 0)</b> gehen` : `(x | y) = (${fmt(x)} | ${fmt(y)}) — Verhältnis y:x = ${fmt(m)}`; };
        zeig(3);
        const loop = Loop(t => zeig(osz(t, 6) * 4));
        const bar = steuerleiste(loop);
        host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const hLin = F.linie(0, 0, 1, 0, { farbe: FARBE.a, breite: 3 });
      const vLin = F.linie(1, 0, 1, m, { farbe: FARBE.c, breite: 3 });
      const pkt = F.punkt(1, m, { fill: FARBE.b });
      const zeichne = x => {
        const y = m * x; F.setLinie(hLin, 0, 0, x, 0); F.setLinie(vLin, x, 0, x, y); F.setPunkt(pkt, x, y);
        ables.innerHTML = st === 'A'
          ? `x = <b style="color:${FARBE.a}">${fmt(x)}</b> → y = <b style="color:${FARBE.c}">${fmt(y)}</b> &nbsp;(doppeltes x → doppeltes y)`
          : `m = y : x = ${fmt(y)} : ${fmt(x)} = <b>${fmt(m)}</b> &nbsp;(immer gleich)`;
      };
      zeichne(st === 'A' ? 1 : 2);
      const loop = Loop(t => { const x = 1 + osz(t, 6) * 4; zeichne(Math.round(x * 2) / 2); });
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* Teil 1 fertig — Teil 2 (weitere Konzepte + API) wird angehängt. */
  window.ANIM = window.ANIM || {};
  window.ANIM._intern = { Feld, Loop, steuerleiste, regler, abzeichen, register, LISTE, NACH_ID, FARBE, STUFE_NAME, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED };
  window.ANIM.liste = LISTE;
})();

/* ============================================================
   animationen.js · Teil 2 — Konzepte 6–10 + öffentliche API
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Feld, Loop, steuerleiste, regler, abzeichen, register, LISTE, NACH_ID, FARBE, STUFE_NAME, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;

  /* ============================================================
     Konzept 6 · Punktprobe  (LF-08)
     A: Punkte, die draufliegen — Einsetz-Mechanik üben
     B: drauf ODER daneben (rot mit Abstand)
     C: fehlende Koordinate bestimmen (nach x auflösen)
     ============================================================ */
  register({
    id: 'punktprobe', titel: 'Punktprobe', bezug: 'LF-08',
    kurz: 'Liegt der Punkt auf der Geraden? A: einsetzen & prüfen · B: drauf/daneben · C: fehlende Koordinate.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const m = 2, b = -1;
      const F = Feld({ xmin: -1, xmax: 5, ymin: -3, ymax: 8, breite: o.breite || 340 });
      F.gerade(m, b, { farbe: FARBE.b });
      const rechnung = h('div', 'anim-rechnung');
      const ables = h('div', 'anim-ables');

      if (st === 'C') {
        // (x | 5) soll auf y = 2x − 1 liegen → x = 3
        const ziel = 5, xl = (ziel - b) / m;
        const pkt = F.punkt(0, ziel, { fill: FARBE.c, r: 6 });
        const spur = F.linie(0, ziel, 0, ziel, { farbe: FARBE.c, dash: '4 3' });
        const zeig = x => {
          const y = m * x + b; F.setPunkt(pkt, x, ziel); F.setLinie(spur, x, ziel, x, y);
          rechnung.innerHTML = `gesucht: welches x liegt (x | ${fmt(ziel)}) auf der Geraden?`;
          ables.innerHTML = Math.abs(x - xl) < 0.06
            ? `${fmt(ziel)} = 2·x − 1 → x = <b style="color:${FARBE.c}">${fmt(xl)}</b>`
            : `probiere x = ${fmt(x)}: 2·${fmt(x)} − 1 = ${fmt(y)} ${Math.abs(y - ziel) < 0.06 ? '= ' : '≠ '} ${fmt(ziel)}`;
        };
        zeig(REDUCED ? xl : 0.5);
        const loop = Loop(t => zeig(0.5 + osz(t, 6) * (xl + 1)));
        const bar = steuerleiste(loop);
        host.appendChild(F.svg); host.appendChild(rechnung); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const tests = st === 'A'
        ? [{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 5 }]                        // alle DRAUF
        : [{ x: 2, y: 3 }, { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 1 }];        // gemischt
      const pkt = F.punkt(tests[0].x, tests[0].y, { fill: FARBE.faint, r: 6 });
      const verb = F.linie(0, 0, 0, 0, { farbe: FARBE.korr, breite: 2, dash: '4 3' }); verb.style.opacity = 0;
      let idx = 0;
      const zeige = k => {
        const P = tests[k], soll = m * P.x + b, drauf = Math.abs(soll - P.y) < 1e-9;
        F.setPunkt(pkt, P.x, P.y); pkt.setAttribute('fill', drauf ? FARBE.ok : FARBE.korr);
        if (drauf) verb.style.opacity = 0; else { F.setLinie(verb, P.x, P.y, P.x, soll); verb.style.opacity = 1; }
        rechnung.innerHTML = `Punkt (${fmt(P.x)} | ${fmt(P.y)}): &nbsp; y = 2·${fmt(P.x)} − 1 = <b>${fmt(soll)}</b>`;
        ables.innerHTML = drauf
          ? `<b style="color:${FARBE.ok}">✓ liegt auf der Geraden</b> (${fmt(soll)} = ${fmt(P.y)})`
          : `<b style="color:${FARBE.korr}">✗ liegt nicht darauf</b> (${fmt(soll)} ≠ ${fmt(P.y)})`;
      };
      zeige(0);
      const naechst = h('button', 'anim-btn anim-play', 'Nächster Punkt →'); naechst.type = 'button';
      naechst.addEventListener('click', () => { idx = (idx + 1) % tests.length; zeige(idx); });
      const loop = Loop(t => { const k = Math.floor(t / 1.6) % tests.length; if (k !== idx) { idx = k; zeige(idx); } });
      const bar = steuerleiste(loop); bar.insertBefore(naechst, bar.firstChild);
      host.appendChild(F.svg); host.appendChild(rechnung); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 7 · Nullstelle  (LF-10)
     A: ablesen, wo die Gerade die x-Achse trifft
     B: 0 = m·x + b nach x lösen (Schritte)
     C: im Sachkontext deuten (Tank leer) + Modellgrenze
     ============================================================ */
  register({
    id: 'nullstelle', titel: 'Nullstelle: wo y = 0 ist', bezug: 'LF-10',
    kurz: 'A: ablesen · B: 0 = m·x + b lösen · C: im Sachkontext (Tank leer) mit Modellgrenze.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const ables = h('div', 'anim-ables');

      if (st === 'C') {
        // Tank: y = 100 − 20x, leer bei x = 5
        const m = -20, b = 100, x0 = -b / m;
        const F = Feld({ xmin: 0, xmax: 7, ymin: -40, ymax: 100, breite: o.breite || 360, xlabel: 'h', ylabel: 'l' });
        F.gerade(m, b, { farbe: FARBE.b });
        // Modellgrenze: ab x0 grau gestrichelt
        const grau = el('line', { x1: F.X(x0), y1: F.Y(0), x2: F.X(7), y2: F.Y(m * 7 + b), stroke: FARBE.faint, 'stroke-width': 2, 'stroke-dasharray': '5 4' });
        F.add(grau);
        F.punkt(x0, 0, { fill: FARBE.a });
        F.text(x0, 0, 'leer', { dx: 6, dy: -8, farbe: FARBE.a, size: 11, weight: 700 });
        const glei = F.punkt(0, b, { fill: FARBE.gelb });
        const zeig = x => { const y = m * x + b; F.setPunkt(glei, Math.min(x, x0), Math.max(0, y)); ables.innerHTML = x >= x0 - 0.05 ? `0 = 100 − 20·x → x = <b>${fmt(x0)} h</b> — Tank leer (danach gilt das Modell nicht mehr)` : `nach ${fmt(x)} h: noch <b>${fmt(y)} l</b> im Tank`; };
        zeig(REDUCED ? x0 : 0);
        const loop = Loop(t => zeig(osz(t, 6) * x0));
        const bar = steuerleiste(loop);
        host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const m = 1, b = -2, x0 = -b / m; // Nullstelle bei x = 2
      const F = Feld({ xmin: -1, xmax: 6, ymin: -3, ymax: 4, breite: o.breite || 340 });
      F.gerade(m, b, { farbe: FARBE.b });
      const glei = F.punkt(0, b, { fill: FARBE.gelb });
      const nst = F.punkt(x0, 0, { fill: FARBE.a }); nst.style.opacity = 0;
      const rechnung = st === 'B' ? h('div', 'anim-rechnung') : null;
      const zeichne = x => {
        const y = m * x + b; F.setPunkt(glei, x, y); const nah = Math.abs(y) < 0.06; nst.style.opacity = nah ? 1 : 0;
        if (st === 'B' && rechnung) rechnung.innerHTML = `0 = x − 2 &nbsp;|+2&nbsp; → x = <b>${fmt(x0)}</b>`;
        ables.innerHTML = nah ? `y = 0 → Nullstelle bei <b style="color:${FARBE.a}">x = ${fmt(x0)}</b>` : `Punkt (${fmt(x)} | ${fmt(y)}) — noch nicht auf der x-Achse`;
      };
      zeichne(REDUCED ? x0 : -0.5);
      const loop = Loop(t => zeichne(-0.5 + osz(t, 6) * (x0 + 1.5)));
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); if (rechnung) host.appendChild(rechnung); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 8 · Schnittpunkt  (LF-12 / LF-13)
     A: Schnittpunkt ablesen        B: gleichsetzen, eine Gerade wandert ein
     C: Sonderfälle — parallel (keine) / identisch (unendlich)
     ============================================================ */
  register({
    id: 'schnittpunkt', titel: 'Schnittpunkt zweier Geraden', bezug: 'LF-12',
    kurz: 'A: ablesen · B: gleichsetzen · C: Sonderfälle parallel / identisch.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const F = Feld({ xmin: -1, xmax: 6, ymin: -1, ymax: 7, breite: o.breite || 340 });
      const ables = h('div', 'anim-ables');

      if (st === 'C') {
        // wechselt: schneidend → parallel → identisch
        const g1 = F.gerade(1, 1, { farbe: FARBE.b });
        const g2 = F.gerade(-1, 5, { farbe: FARBE.c });
        const sp = F.punkt(2, 3, { fill: FARBE.korr, r: 6 });
        const phasen = [
          { m: -1, b: 5, txt: `schneidend → genau <b>ein</b> Schnittpunkt` },
          { m: 1, b: 4, txt: `parallel (gleiches m, anderes b) → <b>keine</b> Lösung` },
          { m: 1, b: 1, txt: `identisch (gleiches m und b) → <b>unendlich</b> viele` }
        ];
        let pi = -1;
        const setz = k => {
          const p = phasen[k]; F.setGerade(g2, p.m, p.b);
          if (k === 0) { sp.style.opacity = 1; F.setPunkt(sp, 2, 3); } else sp.style.opacity = 0;
          g2.setAttribute('stroke', k === 2 ? FARBE.b : FARBE.c);
          g2.setAttribute('stroke-dasharray', k === 2 ? '6 5' : '');
          ables.innerHTML = p.txt;
        };
        setz(0);
        const weiter = h('button', 'anim-btn anim-play', 'Nächster Fall →'); weiter.type = 'button';
        let idx = 0; weiter.addEventListener('click', () => { idx = (idx + 1) % 3; setz(idx); });
        const loop = Loop(t => { const k = Math.floor(t / 2.2) % 3; if (k !== pi) { pi = k; idx = k; setz(k); } });
        const bar = steuerleiste(loop); bar.insertBefore(weiter, bar.firstChild);
        host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const m1 = 1, b1 = 1, m2 = -1;
      F.gerade(m1, b1, { farbe: FARBE.b });
      const g2 = F.gerade(m2, 5, { farbe: FARBE.c });
      const sp = F.punkt(2, 3, { fill: FARBE.korr, r: 6 }); sp.style.opacity = 0;
      const spText = F.text(2, 3, '', { dx: 9, dy: -8, farbe: FARBE.korr, size: 12, weight: 700 });
      const rechnung = st === 'B' ? h('div', 'anim-rechnung') : null;
      const zeichne = b2 => {
        F.setGerade(g2, m2, b2);
        const xs = (b2 - b1) / (m1 - m2), ys = m1 * xs + b1, nah = Math.abs(b2 - 5) < 0.15;
        sp.style.opacity = nah ? 1 : 0.25; F.setPunkt(sp, xs, ys);
        F.setText(spText, nah ? `S(${fmt(xs)} | ${fmt(ys)})` : ''); F.setTextPos(spText, xs, ys, 9, -8);
        if (st === 'B' && rechnung) rechnung.innerHTML = `x + 1 = −x + ${fmt(b2)} → 2x = ${fmt(b2 - 1)} → x = <b>${fmt(xs)}</b>`;
        ables.innerHTML = nah ? `Schnittpunkt <b style="color:${FARBE.korr}">S(${fmt(xs)} | ${fmt(ys)})</b>` : (st === 'A' ? 'Kreuzung suchen …' : 'beide Geraden noch getrennt …');
      };
      zeichne(REDUCED ? 5 : 6.5);
      const loop = Loop(t => zeichne(5 + Math.cos(t * 1.1) * 1.8));
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); if (rechnung) host.appendChild(rechnung); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 9 · Tarifvergleich / Modellieren  (LF-14)
     A: an einer Stelle beide Kosten vergleichen
     B: Scanlinie + Schnittpunkt als Grenze
     C: dritte Option (Flatrate) — Bereiche statt eines Siegers
     ============================================================ */
  register({
    id: 'tarifvergleich', titel: 'Tarifvergleich: ab wann lohnt sich was?', bezug: 'LF-14',
    kurz: 'A: an einer Stelle vergleichen · B: Grenze über Schnittpunkt · C: mit Flatrate (Bereiche).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const A = x => 10 + 2 * x, B = x => 4 * x, C = 22;
      const F = Feld({ xmin: 0, xmax: 9, ymin: 0, ymax: 30, breite: o.breite || 360, xlabel: 'Std', ylabel: '€' });
      F.gerade(2, 10, { farbe: FARBE.b });
      F.gerade(4, 0, { farbe: FARBE.a });
      const ables = h('div', 'anim-ables');
      const leg = h('div', 'anim-legende');
      let legHtml = `<span><i style="background:${FARBE.b}"></i>A: 10 € + 2 €/Std</span><span><i style="background:${FARBE.a}"></i>B: 4 €/Std</span>`;

      if (st === 'C') {
        F.gerade(0, C, { farbe: FARBE.c });
        legHtml += `<span><i style="background:${FARBE.c}"></i>C: Flatrate 22 €</span>`;
        F.punkt(5, 20, { fill: FARBE.korr, r: 4 });
        F.punkt(6, 22, { fill: FARBE.korr, r: 4 });
      } else {
        F.punkt(5, 20, { fill: FARBE.korr, r: 5 });
        F.text(5, 20, 'S(5 | 20)', { dx: 8, dy: -8, farbe: FARBE.korr, size: 11, weight: 700 });
      }
      leg.innerHTML = legHtml;
      const scan = F.linie(0, 0, 0, 30, { farbe: FARBE.faint, breite: 1.5, dash: '3 3' });
      const pA = F.punkt(0, 10, { fill: FARBE.b, r: 4 });
      const pB = F.punkt(0, 0, { fill: FARBE.a, r: 4 });
      const pC = st === 'C' ? F.punkt(0, C, { fill: FARBE.c, r: 4 }) : null;

      const guenstigster = x => {
        const kand = st === 'C' ? [['A', A(x), FARBE.b], ['B', B(x), FARBE.a], ['C', C, FARBE.c]] : [['A', A(x), FARBE.b], ['B', B(x), FARBE.a]];
        kand.sort((u, v) => u[1] - v[1]); return kand[0];
      };
      const zeichne = x => {
        F.setLinie(scan, x, 0, x, 30); F.setPunkt(pA, x, A(x)); F.setPunkt(pB, x, B(x)); if (pC) F.setPunkt(pC, x, C);
        const g = guenstigster(x);
        if (st === 'A') ables.innerHTML = `bei ${fmt(x)} Std: A = ${fmt(A(x))} € · B = ${fmt(B(x))} € → <b style="color:${g[2]}">Tarif ${g[0]} günstiger</b>`;
        else if (st === 'B') ables.innerHTML = `bei ${fmt(x)} Std → <b style="color:${g[2]}">Tarif ${g[0]}</b> &nbsp;(Grenze: Schnittpunkt bei 5 Std)`;
        else ables.innerHTML = `bei ${fmt(x)} Std ist <b style="color:${g[2]}">Tarif ${g[0]}</b> am günstigsten`;
      };
      zeichne(REDUCED ? 5 : 0);
      const loop = Loop(t => zeichne(osz(t, 8) * 9));
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); host.appendChild(leg); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Konzept 10 · Lineare Gleichung lösen (Waage)  (LF-11)
     A: a·x + b = c — erst b weg, dann : a
     B: x auf beiden Seiten — x sammeln, dann lösen
     C: Sonderfälle — x fällt weg → wahr (unendlich) / falsch (keine)
     ============================================================ */
  register({
    id: 'gleichung', titel: 'Lineare Gleichung als Waage', bezug: 'LF-11',
    kurz: 'A: erst ± , dann : · B: x auf beiden Seiten sammeln · C: Sonderfälle (keine / unendlich).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const zeile = h('div', 'anim-gleichung'); zeile.style.fontSize = '20px';
      const rechnung = h('div', 'anim-rechnung');
      const ables = h('div', 'anim-ables');
      // Waage
      const svg = el('svg', { viewBox: '0 0 300 120', class: 'anim-svg', role: 'img', 'aria-label': 'Waagemodell einer Gleichung.' });
      svg.appendChild(el('line', { x1: 150, y1: 20, x2: 150, y2: 95, stroke: FARBE.ink, 'stroke-width': 3 }));
      const balken = el('line', { x1: 40, y1: 30, x2: 260, y2: 30, stroke: FARBE.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }); svg.appendChild(balken);
      svg.appendChild(el('path', { d: 'M130,95 L170,95 L150,110 z', fill: FARBE.ink }));
      const schaleL = el('text', { x: 95, y: 62, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 18, fill: FARBE.b, 'font-weight': 700 }); svg.appendChild(schaleL);
      const schaleR = el('text', { x: 205, y: 62, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 18, fill: FARBE.a, 'font-weight': 700 }); svg.appendChild(schaleR);
      svg.appendChild(el('line', { x1: 95, y1: 30, x2: 95, y2: 50, stroke: FARBE.faint, 'stroke-width': 1.5 }));
      svg.appendChild(el('line', { x1: 205, y1: 30, x2: 205, y2: 50, stroke: FARBE.faint, 'stroke-width': 1.5 }));

      let schritte, fazit;
      if (st === 'A') {
        schritte = [['3·x + 4', '19', ''], ['3·x', '15', '| − 4'], ['x', '5', '| : 3']];
        fazit = `x = <b style="color:${FARBE.ok}">5</b>`;
      } else if (st === 'B') {
        schritte = [['5·x − 3', '2·x + 9', ''], ['3·x − 3', '9', '| − 2x'], ['3·x', '12', '| + 3'], ['x', '4', '| : 3']];
        fazit = `x = <b style="color:${FARBE.ok}">4</b> &nbsp;(Probe: 5·4−3 = 17 = 2·4+9 ✓)`;
      } else {
        schritte = [['2·(x + 3)', '2·x + 6', ''], ['2·x + 6', '2·x + 6', '| − 2x'], ['6', '6', 'wahr']];
        fazit = `6 = 6 ist immer wahr → <b style="color:${FARBE.c}">unendlich viele Lösungen</b>`;
      }
      let k = 0;
      const zeig = i => {
        const s = schritte[i];
        schaleL.textContent = s[0]; schaleR.textContent = s[1];
        balken.setAttribute('transform', ''); // Gleichgewicht (Äquivalenzumformung)
        zeile.innerHTML = `${s[0]} <span class="op">=</span> ${s[1]}`;
        rechnung.innerHTML = i === 0 ? 'Gleichung im Gleichgewicht' : `Schritt ${i}: <b>${s[2]}</b>`;
        ables.innerHTML = i >= schritte.length - 1 ? fazit : '&nbsp;';
      };
      zeig(0);
      const weiter = h('button', 'anim-btn anim-play', 'Nächster Schritt →'); weiter.type = 'button';
      weiter.addEventListener('click', () => { k = (k + 1) % schritte.length; zeig(k); });
      const loop = Loop(t => { const i = Math.floor(t / 1.6) % schritte.length; if (i !== k) { k = i; zeig(i); } });
      const bar = steuerleiste(loop); bar.insertBefore(weiter, bar.firstChild);
      host.appendChild(zeile); host.appendChild(svg); host.appendChild(rechnung); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

  /* ============================================================
     Öffentliche API
     ============================================================ */
  function baueIn(id, host, opts) {
    const def = NACH_ID[id]; host.innerHTML = '';
    if (!def) { host.appendChild(h('div', 'anim-fehlt', 'Animation „' + id + '“ nicht gefunden.')); return null; }
    const fig = h('figure', 'anim'); const ctrl = def.bauen(fig, opts || {}); host.appendChild(fig); return ctrl;
  }

  window.ANIM.block = function (v) {
    const box = h('div', 'bild anim-bild');
    requestAnimationFrame(() => baueIn(v.name, box, { stufe: v.stufe, breite: v.breite }));
    return box;
  };
  window.ANIM.einbetten = baueIn;
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
   animationen.js · Teil 3 — Lernbereich PZ (Prozent & Zinsrechnung)
   Zehn Konzepte, je Niveaustufe A/B/C. Grundbild: der Prozentstreifen.
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Loop, steuerleiste, regler, abzeichen, register, FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;

  /* ---------- Prozentstreifen (lebend) ---------- */
  function Streifen(opt) {
    opt = opt || {};
    const breite = opt.breite || 340, hoehe = opt.hoehe || 46, R = 10, max = opt.max || 100;
    const legende = opt.legende !== false, unten = legende ? 22 : 6;
    const y0 = 14, W = breite, H = y0 + hoehe + unten, innerW = W - 2 * R;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg', role: 'img', 'aria-label': opt.alt || 'Prozentstreifen' });
    const PX = p => R + innerW * Math.max(0, Math.min(max, p)) / max;
    svg.appendChild(el('rect', { x: R, y: y0, width: innerW, height: hoehe, rx: 6, fill: FARBE.weiss, stroke: FARBE.faint, 'stroke-width': 1.5 }));
    const fuell = el('rect', { x: R, y: y0, width: 0.001, height: hoehe, rx: 6, fill: FARBE.b }); svg.appendChild(fuell);
    if (opt.mitte !== false && max === 100) { const mx = PX(50); svg.appendChild(el('line', { x1: mx, y1: y0 - 3, x2: mx, y2: y0 + hoehe + 3, stroke: FARBE.ink, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' })); }
    if (legende) [[0, '0 %'], [50, '50 %'], [100, '100 %']].forEach(([p, t]) => { if (p > max) return; svg.appendChild(el('text', { x: PX(p), y: y0 + hoehe + 15, 'text-anchor': p === 0 ? 'start' : (p >= max ? 'end' : 'middle'), 'font-family': 'monospace', 'font-size': 10, fill: FARBE.weich }, t)); });
    const oben = el('g'); svg.appendChild(oben);
    return {
      svg, PX, y0, hoehe, R, innerW, max,
      setFill(p, farbe) { fuell.setAttribute('width', Math.max(0.001, PX(p) - R)); if (farbe) fuell.setAttribute('fill', farbe); },
      add(e) { oben.appendChild(e); return e; },
      tick(p, label, o) { o = o || {}; const x = PX(p); const l = el('line', { x1: x, y1: y0 - 5, x2: x, y2: y0 + hoehe + 5, stroke: o.farbe || FARBE.c, 'stroke-width': 2 }); oben.appendChild(l); let tx = null; if (label != null) { tx = el('text', { x: x, y: y0 - 8, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 11, fill: o.farbe || FARBE.c, 'font-weight': 700 }, label); oben.appendChild(tx); } return { l, tx }; },
      setTick(ref, p, label) { const x = this.PX(p); ref.l.setAttribute('x1', x); ref.l.setAttribute('x2', x); if (ref.tx) { ref.tx.setAttribute('x', x); if (label != null) ref.tx.textContent = label; } }
    };
  }

  /* ---------- kleines Säulendiagramm (für Zinseszins) ---------- */
  function Saeulen(opt) {
    opt = opt || {};
    const W = opt.breite || 320, H = opt.hoehe || 180, basis = H - 24, links = 30, max = opt.max || 100;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg', role: 'img', 'aria-label': opt.alt || 'Säulendiagramm' });
    svg.appendChild(el('line', { x1: links, y1: basis, x2: W - 8, y2: basis, stroke: FARBE.ink, 'stroke-width': 1.5 }));
    svg.appendChild(el('line', { x1: links, y1: basis, x2: links, y2: 10, stroke: FARBE.ink, 'stroke-width': 1.5 }));
    const oben = el('g'); svg.appendChild(oben);
    const YH = v => basis - (Math.max(0, Math.min(max, v)) / max) * (basis - 14);
    return {
      svg, basis, links, max, YH,
      saeule(x, w, farbe) { const r = el('rect', { x, y: basis, width: w, height: 0.001, fill: farbe || FARBE.b, rx: 2 }); oben.appendChild(r); return r; },
      setSaeule(r, v) { const y = YH(v); r.setAttribute('y', y); r.setAttribute('height', Math.max(0.001, basis - y)); },
      text(x, y, s, o) { o = o || {}; const e = el('text', { x, y, 'text-anchor': o.anchor || 'middle', 'font-family': 'monospace', 'font-size': o.size || 10, fill: o.farbe || FARBE.ink, 'font-weight': o.weight || 400 }, s); oben.appendChild(e); return e; },
      setText(e, s) { e.textContent = s; }
    };
  }

  /* 1 · Anteile: Bruch – Dezimalzahl – Prozent (PZ-01) */
  register({
    id: 'anteile', titel: 'Bruch – Dezimalzahl – Prozent', bezug: 'PZ-01',
    kurz: 'A: einfache Anteile ablesen · B: 3/4 → 0,75 → 75 % · C: unbequeme Brüche runden.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340 });
      const info = h('div', 'anim-ables');
      if (st === 'A') {
        const daten = [[1, 2], [1, 4], [3, 4], [1, 1]];
        const zeig = k => { const [z, n] = daten[k]; const p = z / n * 100; S.setFill(p, FARBE.a); info.innerHTML = `${z}/${n} = <b>${fmt(p)} %</b>`; };
        zeig(0);
        const loop = Loop(t => zeig(Math.floor(t / 1.5) % daten.length));
        const bar = steuerleiste(loop);
        host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }
      const z = st === 'B' ? 3 : 2, n = st === 'B' ? 4 : 3, dez = z / n, proz = dez * 100;
      const ger = st === 'C' ? Math.round(proz) : proz;
      S.setFill(ger, st === 'C' ? FARBE.c : FARBE.b);
      const phasen = st === 'B'
        ? [`${z}/${n}`, `${z} : ${n} = ${fmt(dez)}`, `${fmt(dez)} · 100 = <b>${fmt(proz)} %</b>`]
        : [`${z}/${n}`, `${z} : ${n} = 0,666…`, `≈ 0,67 · 100 ≈ <b>${ger} %</b>`];
      const zeig = i => info.innerHTML = phasen.slice(0, i + 1).join(' &nbsp;→&nbsp; ');
      zeig(REDUCED ? phasen.length - 1 : 0);
      const loop = Loop(t => zeig(Math.floor(t / 1.3) % phasen.length));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 2 · Prozente schätzen (PZ-02) */
  register({
    id: 'schaetzen', titel: 'Prozente schätzen', bezug: 'PZ-02',
    kurz: 'A: mehr/weniger als die Hälfte · B: mit Ankerwerten auf 5 % · C: über 10 %-Schritte zerlegen.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340 });
      const info = h('div', 'anim-ables');
      if (st === 'B') [25, 75].forEach(p => S.tick(p, fmt(p) + ' %', { farbe: FARBE.faint }));
      if (st === 'C') for (let p = 10; p < 100; p += 10) if (p !== 50) S.tick(p, '', { farbe: FARBE.gitter });
      const zeig = p => {
        S.setFill(p, FARBE.a);
        if (st === 'A') info.innerHTML = p < 49 ? `weniger als die Hälfte (< 50 %)` : (p > 51 ? `mehr als die Hälfte (> 50 %)` : `etwa die Hälfte (50 %)`);
        else if (st === 'B') { const anker = [0, 25, 50, 75, 100].reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a); info.innerHTML = `nächster Ankerwert: ${anker} % → Schätzung ≈ <b>${Math.round(p / 5) * 5} %</b>`; }
        else { const z = Math.round(p / 10); info.innerHTML = `≈ ${z} · 10 % = <b>${z * 10} %</b>`; }
      };
      zeig(40);
      const loop = Loop(t => zeig(10 + osz(t, 7) * 80));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 3 · Dreisatz proportional (PZ-03) — Schema mit Pfeilen */
  register({
    id: 'dreisatz', titel: 'Dreisatz über die Einheit', bezug: 'PZ-03',
    kurz: 'A: :n auf 1, dann ·m · B: Schema mit beschrifteten Pfeilen · C: direkt über den Faktor.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const box = h('div', 'anim-schema');
      const rows = [
        { l: '5 Brötchen', r: '2,00 €', op: '' },
        { l: '1 Brötchen', r: '0,40 €', op: ': 5' },
        { l: '8 Brötchen', r: '3,20 €', op: '· 8' }
      ];
      const zeilen = rows.map((rw, i) => {
        const z = h('div', 'anim-schema-zeile');
        z.appendChild(h('span', 'anim-schema-op', rw.op));
        z.appendChild(h('span', 'anim-schema-l', rw.l));
        z.appendChild(h('span', 'anim-schema-pf', '→'));
        z.appendChild(h('span', 'anim-schema-r', rw.r));
        z.style.opacity = i === 0 ? 1 : 0;
        box.appendChild(z); return z;
      });
      const info = h('div', 'anim-ables');
      const setz = n => {
        zeilen.forEach((z, i) => z.style.opacity = i < n ? 1 : 0);
        if (st === 'C') info.innerHTML = n >= 2 ? `Faktor = 0,40 €/Stück → 8 · 0,40 € = <b>3,20 €</b>` : `erst den Preis für 1 Stück (Faktor)`;
        else info.innerHTML = n >= 3 ? `8 Brötchen kosten <b>3,20 €</b>` : (n === 2 ? `erst : 5 (auf 1), dann · 8` : `gegeben: 5 → 2,00 €`);
      };
      setz(REDUCED ? 3 : 1);
      const loop = Loop(t => setz(1 + Math.floor((t % 4.5) / 1.5)));
      const bar = steuerleiste(loop);
      host.appendChild(box); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 4 · Antiproportional (PZ-04) */
  register({
    id: 'antiproportional', titel: 'Antiproportional: mehr → weniger', bezug: 'PZ-04',
    kurz: 'A: steigt oder fällt? · B: rechnen (Produkt bleibt gleich) · C: Produktprobe.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const box = h('div', 'anim-schema anim-schema-tab');
      const kopf = h('div', 'anim-schema-zeile anim-schema-kopf');
      ['Maler', 'Tage', st === 'C' ? 'Produkt' : ''].forEach(s => kopf.appendChild(h('span', 'anim-schema-z', s)));
      box.appendChild(kopf);
      const rows = st === 'C'
        ? [[2, 6], [3, 4], [4, 3]]
        : [[6, 8], [8, 6]];
      const zeilen = rows.map((rw, i) => {
        const z = h('div', 'anim-schema-zeile');
        z.appendChild(h('span', 'anim-schema-z', rw[0] + ''));
        z.appendChild(h('span', 'anim-schema-z', rw[1] + ''));
        if (st === 'C') z.appendChild(h('span', 'anim-schema-z anim-prod', rw[0] * rw[1] + ''));
        z.style.opacity = i === 0 ? 1 : 0.15;
        box.appendChild(z); return z;
      });
      const info = h('div', 'anim-ables');
      const setz = k => {
        zeilen.forEach((z, i) => z.style.opacity = i <= k ? 1 : 0.15);
        if (st === 'A') info.innerHTML = `mehr Maler <b>↑</b> → weniger Tage <b>↓</b> (antiproportional)`;
        else if (st === 'B') info.innerHTML = k >= 1 ? `6 · 8 = 48 → 48 : 8 Maler = <b>6 Tage</b>` : `Produkt Maler · Tage bleibt gleich`;
        else info.innerHTML = `Produkt immer <b>${rows[0][0] * rows[0][1]}</b> → antiproportional`;
      };
      setz(REDUCED ? rows.length - 1 : 0);
      const loop = Loop(t => setz(Math.floor((t % (rows.length * 1.4)) / 1.4)));
      const bar = steuerleiste(loop);
      host.appendChild(box); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 5 · G, W und p % benennen (PZ-05) */
  register({
    id: 'grundgroessen', titel: 'Grundwert, Prozentwert, Prozentsatz', bezug: 'PZ-05',
    kurz: 'A: den Grundwert (das Ganze) finden · B: G, W und p % benennen · C: wenn G fehlt.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340, mitte: false });
      const info = h('div', 'anim-ables');
      const W = 40; // Prozentwert bei 40 %
      S.setFill(W, FARBE.a);
      const tG = S.tick(100, 'G = 100 %', { farbe: FARBE.b });
      const tW = st !== 'A' ? S.tick(W, 'W', { farbe: FARBE.a }) : null;
      const zeig = phase => {
        if (st === 'A') info.innerHTML = `der ganze Streifen ist der <b style="color:${FARBE.b}">Grundwert G</b> = 100 %`;
        else if (st === 'B') info.innerHTML = `<b style="color:${FARBE.b}">G</b> = das Ganze (100 %) · <b style="color:${FARBE.a}">W</b> = der Teil · <b style="color:${FARBE.c}">p %</b> = ${W} %`;
        else info.innerHTML = phase % 2 ? `<b style="color:${FARBE.b}">G = ?</b> — der Grundwert ist nicht genannt` : `nur der Teil W und p % sind bekannt`;
      };
      if (st === 'C') S.setTick(tG, 100, 'G = ?');
      zeig(0);
      const loop = Loop(t => zeig(Math.floor(t / 1.6)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 6 · Prozentwert berechnen (PZ-06) */
  register({
    id: 'prozentwert', titel: 'Prozentwert berechnen', bezug: 'PZ-06',
    kurz: 'A: über den 1-%-Schritt · B: W = G · p : 100 · C: mit Faktor und Überschlag.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const G = 80, p = 35, W = G * p / 100;
      const S = Streifen({ breite: o.breite || 340 });
      const info = h('div', 'anim-ables');
      const tick = S.tick(p, p + ' %', { farbe: FARBE.c });
      const zeig = frac => {
        S.setFill(p * frac, FARBE.a);
        if (st === 'A') info.innerHTML = `1 % = 80 € : 100 = 0,80 € → 35 · 0,80 € = <b>${fmt(W)} €</b>`;
        else if (st === 'B') info.innerHTML = `W = G · p : 100 = 80 · 35 : 100 = <b>${fmt(W)} €</b>`;
        else info.innerHTML = `Überschlag: 35 % ≈ ⅓ von 80 ≈ 27 € · genau: 80 · 0,35 = <b>${fmt(W)} €</b>`;
      };
      zeig(REDUCED ? 1 : 0);
      const loop = Loop(t => zeig(osz(t, 4)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 7 · Prozentsatz berechnen (PZ-07) */
  register({
    id: 'prozentsatz', titel: 'Prozentsatz berechnen', bezug: 'PZ-07',
    kurz: 'A: bei glatten Zahlen (Bruch → %) · B: p = W : G · 100 · C: prozentuale Veränderung.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340 });
      const info = h('div', 'anim-ables');
      let W = st === 'A' ? 15 : 34, G = st === 'A' ? 60 : 40; if (st === 'C') { W = 6; G = 40; }
      const p = W / G * 100;
      const tick = S.tick(p, '', { farbe: FARBE.c });
      const zeig = frac => {
        const akt = p * frac; S.setFill(akt, FARBE.a); S.setTick(tick, akt, fmt(akt) + ' %');
        if (st === 'A') info.innerHTML = `15 von 60 = 15/60 = 1/4 = <b>25 %</b>`;
        else if (st === 'B') info.innerHTML = `p = W : G · 100 = 34 : 40 · 100 = <b>${fmt(p)} %</b>`;
        else info.innerHTML = `Veränderung: 6 € von 40 € = 6 : 40 · 100 = <b>${fmt(p)} %</b>`;
      };
      zeig(REDUCED ? 1 : 0);
      const loop = Loop(t => zeig(osz(t, 4)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 8 · Grundwert berechnen (PZ-08) */
  register({
    id: 'grundwert', titel: 'Grundwert berechnen', bezug: 'PZ-08',
    kurz: 'A: über den 1-%-Schritt aufs Ganze · B: G = W : p · 100 mit Kontrolle · C: vom verminderten Wert zurück.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340 });
      const info = h('div', 'anim-ables');
      // A/B: 12 € = 20 %  → G = 60 €   ·  C: 48 € nach −20 % = 80 %
      const p = st === 'C' ? 80 : 20, W = st === 'C' ? 48 : 12, G = W / p * 100;
      S.tick(p, fmt(p) + ' %', { farbe: FARBE.a });
      const marke = S.tick(p, '', { farbe: FARBE.b });
      const zeig = frac => {
        const bis = p + (100 - p) * frac; S.setFill(bis, FARBE.a); S.setTick(marke, bis, fmt(Math.round(bis)) + ' %');
        if (st === 'A') info.innerHTML = `20 % = 12 € → 1 % = 0,60 € → 100 % = <b>60 €</b>`;
        else if (st === 'B') info.innerHTML = `G = W : p · 100 = 12 : 20 · 100 = <b>60 €</b> (60 > 12 ✓)`;
        else info.innerHTML = `48 € = 80 % (nach −20 %) → 100 % = 48 : 80 · 100 = <b>60 €</b>`;
      };
      zeig(REDUCED ? 1 : 0);
      const loop = Loop(t => zeig(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 9 · Vermehrter/verminderter Grundwert & Wachstumsfaktor (PZ-09/10) */
  register({
    id: 'veraenderung', titel: 'Vermehren, vermindern, Wachstumsfaktor', bezug: 'PZ-09',
    kurz: 'A: erst Betrag, dann ±  · B: in einem Schritt (Faktor 1 ± p) · C: Faktorkette +10 % / −10 %.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 360, max: 150, mitte: false, legende: false });
      const info = h('div', 'anim-ables');
      S.tick(100, '100 %', { farbe: FARBE.ink });
      if (st === 'C') {
        // 100 → +10% =110 → −10% =99
        const marke = S.tick(100, '', { farbe: FARBE.c });
        const phasen = [{ v: 100, t: `Start: 100 €` }, { v: 110, t: `+10 % → · 1,10 = 110 €` }, { v: 99, t: `−10 % → · 0,90 = <b>99 €</b> (nicht 100 €!)` }];
        const zeig = k => { S.setFill(phasen[k].v, FARBE.c); S.setTick(marke, phasen[k].v, fmt(phasen[k].v)); info.innerHTML = phasen[k].t; };
        zeig(REDUCED ? 2 : 0);
        const loop = Loop(t => zeig(Math.floor((t % 5.4) / 1.8)));
        const bar = steuerleiste(loop);
        host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }
      // A/B: 200 € − 15 % = 170 €  (dargestellt in %)
      const p = 15, ziel = 100 - p;
      const marke = S.tick(ziel, '', { farbe: FARBE.a });
      const zeig = frac => {
        const v = 100 - p * frac; S.setFill(v, FARBE.a); S.setTick(marke, v, fmt(Math.round(v)) + ' %');
        if (st === 'A') info.innerHTML = `Rabatt = 200 € · 15 : 100 = 30 € → 200 − 30 = <b>170 €</b>`;
        else info.innerHTML = `100 % − 15 % = 85 % → Faktor 0,85 → 200 · 0,85 = <b>170 €</b>`;
      };
      zeig(REDUCED ? 1 : 0);
      const loop = Loop(t => zeig(osz(t, 4)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 10 · Zinsen & Zinseszins (PZ-11/12/13) */
  register({
    id: 'zinsen', titel: 'Zinsen & Zinseszins', bezug: 'PZ-11',
    kurz: 'A: Jahreszinsen Z = K·p:100 · B: unterjährig (m/12) · C: Zinseszins K·qⁿ.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const info = h('div', 'anim-ables');

      if (st === 'C') {
        // Zinseszins vs. einfacher Zins, K=100, p=10 %, 5 Jahre
        const K = 100, q = 1.1, n = 5;
        const zins = [], einf = [];
        for (let j = 0; j <= n; j++) { zins.push(K * Math.pow(q, j)); einf.push(K + K * 0.1 * j); }
        const Sa = Saeulen({ breite: o.breite || 340, hoehe: 190, max: 170 });
        const bw = ((o.breite || 340) - 46) / (n + 1);
        const rects = [], refs = [];
        for (let j = 0; j <= n; j++) {
          const x = Sa.links + 6 + j * bw;
          rects.push(Sa.saeule(x, bw * 0.5, FARBE.c));
          Sa.text(x + bw * 0.25, Sa.basis + 12, j + '', { size: 9, farbe: FARBE.weich });
          refs.push(el('line', { x1: x, y1: Sa.YH(einf[j]), x2: x + bw * 0.5, y2: Sa.YH(einf[j]), stroke: FARBE.ink, 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }));
          Sa.add ? null : null; Sa.svg.appendChild(refs[j]); refs[j].style.opacity = 0;
        }
        const setz = k => {
          rects.forEach((r, j) => { Sa.setSaeule(r, j <= k ? zins[j] : 0); refs[j].style.opacity = j <= k ? 1 : 0; });
          info.innerHTML = `Jahr ${k}: Zinseszins ${fmt(Math.round(zins[k]))} € vs. einfach ${fmt(einf[k])} € — <b style="color:${FARBE.c}">wächst schneller</b>`;
        };
        setz(REDUCED ? n : 0);
        const loop = Loop(t => setz(Math.floor((t % ((n + 1) * 0.9)) / 0.9)));
        const bar = steuerleiste(loop);
        host.appendChild(Sa.svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // A/B: Zinsen als p%-Anteil des Kapitals auf dem Streifen
      const S = Streifen({ breite: o.breite || 340, mitte: false });
      const K = 1200, p = 5, Zjahr = K * p / 100;
      S.tick(100, 'K = 1200 €', { farbe: FARBE.b });
      const zeig = frac => {
        if (st === 'A') { S.setFill(p * frac, FARBE.a); info.innerHTML = `Z = K · p : 100 = 1200 · 5 : 100 = <b>${fmt(Zjahr)} €</b> pro Jahr`; }
        else { const m = 3; const Zt = Zjahr * m / 12; S.setFill(p * (m / 12) * frac, FARBE.a); info.innerHTML = `3 Monate: Z = ${fmt(Zjahr)} € · 3/12 = <b>${fmt(Zt)} €</b>`; }
      };
      zeig(REDUCED ? 1 : 0);
      const loop = Loop(t => zeig(osz(t, 4)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();
