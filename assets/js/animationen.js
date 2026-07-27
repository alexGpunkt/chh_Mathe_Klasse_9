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

/* ============================================================
   animationen.js · Teil 4a — Lernbereich KP (Körper: Prismen & Zylinder)
   Schematische Schrägbild-Körper mit animierbaren Teilen:
   Netze auffalten, Schichten stapeln, Mantel abwickeln.
   Helfer + Konzepte 1–5.
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Loop, steuerleiste, regler, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;

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

  /* 1 · Körper erkennen: Flächen, Kanten, Ecken (KP-01) */
  register({
    id: 'koerper', titel: 'Körper: Flächen, Kanten, Ecken', bezug: 'KP-01',
    kurz: 'A: zählen (6/12/8) · B: Grundfläche, Mantel, Netz · C: n-Eck-Prisma (n+2, 3n, 2n).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'C') {
        const svg = svgb(o.breite || 320, 190, 'n-Eck-Prisma');
        const cxc = 130, cyB = 130, cyT = 66, rx = 52, ry = 20;
        const basis = el('polygon', { fill: K, 'fill-opacity': .25, stroke: FARBE.ink, 'stroke-width': 1.5 });
        const deck = el('polygon', { fill: K, 'fill-opacity': .45, stroke: FARBE.ink, 'stroke-width': 1.5 });
        const seiten = el('g'); svg.appendChild(seiten); svg.appendChild(basis); svg.appendChild(deck);
        let n = 4;
        const zeichne = () => {
          const B = [], T = [];
          for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; const px = cxc + rx * Math.cos(a), py = cyB + ry * Math.sin(a); B.push([px, py]); T.push([px, py - (cyB - cyT)]); }
          basis.setAttribute('points', B.map(p => p.join(',')).join(' '));
          deck.setAttribute('points', T.map(p => p.join(',')).join(' '));
          seiten.innerHTML = '';
          B.forEach((p, i) => seiten.appendChild(el('line', { x1: p[0], y1: p[1], x2: T[i][0], y2: T[i][1], stroke: FARBE.ink, 'stroke-width': 1.2, 'stroke-opacity': .5 })));
          info.innerHTML = `n = ${n}: Flächen n+2 = <b>${n + 2}</b> · Kanten 3n = <b>${3 * n}</b> · Ecken 2n = <b>${2 * n}</b>`;
        };
        zeichne();
        const loop = Loop(t => { const nn = 3 + Math.floor(osz(t, 8) * 3.99); if (nn !== n) { n = nn; zeichne(); } });
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      const svg = svgb(o.breite || 320, 200, 'Würfel');
      const t = boxTeile(70, 70, 90, 90, 46, 46);
      const box = zeichneBox(svg, t, K);
      const marker = el('g'); svg.appendChild(marker);
      const P = p => p[0] + ',' + p[1];

      if (st === 'A') {
        const phasen = [
          () => { marker.innerHTML = ''; [box.top, box.side, box.front].forEach(f => f.setAttribute('fill-opacity', .8)); setTimeout(() => { }, 0); info.innerHTML = `Flächen: oben + unten + 4 Seiten = <b>6</b>`; },
          () => { [box.top, box.side, box.front].forEach((f, i) => f.setAttribute('fill-opacity', [.40, .52, .68][i])); marker.innerHTML = ''; t.kanten.forEach(k => marker.appendChild(el('line', { x1: k[0][0], y1: k[0][1], x2: k[1][0], y2: k[1][1], stroke: FARBE.korr, 'stroke-width': 3 }))); info.innerHTML = `Kanten: 4 oben + 4 unten + 4 senkrecht = <b>12</b>`; },
          () => { marker.innerHTML = ''; Object.values(t.ecken).forEach(p => marker.appendChild(el('circle', { cx: p[0], cy: p[1], r: 4.5, fill: FARBE.c }))); info.innerHTML = `Ecken: 4 oben + 4 unten = <b>8</b>`; }
        ];
        let pi = -1;
        const loop = Loop(tt => { const k = Math.floor(tt / 2) % 3; if (k !== pi) { pi = k; phasen[k](); } });
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); else phasen[0]();
        return loop;
      }

      // B: Grundfläche · Mantel · Deckfläche
      const teile = [
        { els: [box.front, box.side], txt: 'Mantel: die Seitenflächen rundherum', op: .85 },
        { els: [box.top], txt: 'Deckfläche: oben (= Grundfläche)', op: .85 },
        { els: [], txt: 'Grundfläche: unten – sie gibt dem Körper den Namen', op: .85 }
      ];
      const grund = pfad(`M${P(t.ecken.A)} L${P(t.ecken.B)} L${P(t.ecken.Bp)} L${P(t.ecken.Ap)} Z`, { fill: K, fo: .0, stroke: FARBE.korr, sw: 2, dash: '5 4' });
      svg.appendChild(grund);
      let pi = -1;
      const zeige = k => {
        [box.top, box.side, box.front].forEach((f, i) => f.setAttribute('fill-opacity', [.40, .52, .68][i]));
        grund.setAttribute('fill-opacity', 0);
        if (k === 0) teile[0].els.forEach(f => f.setAttribute('fill-opacity', .85));
        else if (k === 1) box.top.setAttribute('fill-opacity', .85);
        else grund.setAttribute('fill-opacity', .35);
        info.innerHTML = teile[k].txt;
      };
      const loop = Loop(tt => { const k = Math.floor(tt / 2) % 3; if (k !== pi) { pi = k; zeige(k); } });
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); else zeige(2);
      return loop;
    }
  });

  /* 2 · Einheiten für Fläche und Volumen (KP-02) */
  register({
    id: 'einheiten', titel: 'Einheiten: Fläche ·100, Volumen ·1000', bezug: 'KP-02',
    kurz: 'A: 1 dm³ = 1 l · B: dm² → cm² (·100), dm³ → cm³ (·1000) · C: zwischen l/dm³/cm³/m³ wechseln.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'A') {
        const svg = svgb(o.breite || 300, 190, 'Würfel mit 1 dm Kante');
        const t = boxTeile(90, 70, 80, 80, 42, 42); const box = zeichneBox(svg, t, K);
        svg.appendChild(txt(130, 165, '1 dm', { size: 12, weight: 700 }));
        info.innerHTML = `Ein Würfel mit 1 dm Kante fasst genau <b>1 Liter</b> (1 dm³ = 1 l).`;
        const loop = Loop(tt => { box.front.setAttribute('fill-opacity', .55 + 0.2 * osz(tt, 2)); });
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      if (st === 'B') {
        const svg = svgb(o.breite || 300, 200, '1 dm² wird in 100 cm² geteilt');
        const X0 = 60, Y0 = 30, S = 130;
        svg.appendChild(el('rect', { x: X0, y: Y0, width: S, height: S, fill: K, 'fill-opacity': .18, stroke: FARBE.ink, 'stroke-width': 1.5 }));
        const grid = el('g'); svg.appendChild(grid);
        const zeige = frac => {
          grid.innerHTML = '';
          const linien = Math.round(9 * frac);
          for (let i = 1; i <= linien; i++) { const p = X0 + S * i / 10; grid.appendChild(el('line', { x1: p, y1: Y0, x2: p, y2: Y0 + S, stroke: FARBE.ink, 'stroke-width': .6, 'stroke-opacity': .5 })); grid.appendChild(el('line', { x1: X0, y1: Y0 + S * i / 10, x2: X0 + S, y2: Y0 + S * i / 10, stroke: FARBE.ink, 'stroke-width': .6, 'stroke-opacity': .5 })); }
          const felder = Math.pow(Math.min(10, Math.round(linien) + 1), 2);
          info.innerHTML = linien >= 9
            ? `1 dm² = 10·10 = <b>100 cm²</b> &nbsp;·&nbsp; Volumen: 10·10·10 = <b>·1000</b>`
            : `teile jede Seite in 10 → ${felder} Kästchen …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(tt => zeige(osz(tt, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // C: Einheitenkette
      const ketten = [
        `1 m³ = 1000 dm³ = <b>1000 l</b>`,
        `1 dm³ = 1000 cm³ &nbsp;·&nbsp; 1 dm³ = <b>1 l</b>`,
        `1,5 m³ = 1,5 · 1000 = <b>1500 l</b>`,
        `250 cm³ = 250 : 1000 = <b>0,25 l</b>`
      ];
      const svg = svgb(o.breite || 320, 70, 'Einheitenkette');
      const bandL = ['m³', 'dm³ = l', 'cm³'];
      bandL.forEach((s, i) => { const x = 40 + i * 120; svg.appendChild(el('rect', { x: x - 30, y: 20, width: 60, height: 30, rx: 6, fill: K, 'fill-opacity': .2, stroke: FARBE.ink, 'stroke-width': 1.2 })); svg.appendChild(txt(x, 40, s, { size: 12, weight: 700 })); if (i < 2) svg.appendChild(txt(x + 60, 34, '·1000', { size: 10, farbe: FARBE.weich })); });
      const zeige = k => info.innerHTML = ketten[k];
      zeige(0);
      const loop = Loop(tt => zeige(Math.floor(tt / 1.8) % ketten.length));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 3 · Oberfläche über das Netz (KP-03) */
  register({
    id: 'oberflaeche', titel: 'Oberfläche über das Netz', bezug: 'KP-03',
    kurz: 'A: Würfel 6·a² · B: Quader 2·(ab+ac+bc) · C: mit gemischten Einheiten.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 210, 'Netz');
      // Würfel-/Quader-Netz als Kreuz: [oben, [links,vorne,rechts,hinten], unten]
      const a = 4, b = 3, c = 2; // Quader; Würfel nutzt a=a=a mit a=5
      const wA = st === 'A' ? 5 : a;
      const felder = st === 'A'
        ? [{ x: 1, y: 0, w: 1, hh: 1, l: 'a²' }, { x: 0, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 1, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 2, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 3, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 1, y: 2, w: 1, hh: 1, l: 'a²' }]
        : [{ x: 1, y: 0, w: a, hh: b, l: 'a·b' }, { x: 0, y: 1, w: c, hh: a, l: 'b·c' }, { x: 1, y: 1, w: a, hh: a, l: 'a·c' }, { x: 1 + a, y: 1, w: c, hh: a, l: 'b·c' }, { x: 1, y: 2, w: a, hh: b, l: 'a·b' }];
      // Für die Darstellung normieren wir auf eine Zellgröße
      const U = st === 'A' ? 34 : 18, OX = 20, OY = 14;
      const rects = felder.map(f => { const r = el('rect', { x: OX + f.x * U, y: OY + f.y * U, width: f.w * U, height: f.hh * U, fill: K, 'fill-opacity': .12, stroke: FARBE.ink, 'stroke-width': 1.2 }); svg.appendChild(r); return r; });
      const oben = el('g'); svg.appendChild(oben);
      const werte = st === 'A' ? felder.map(() => wA * wA) : [a * b, b * c, a * c, b * c, a * b];
      const zeige = n => {
        oben.innerHTML = '';
        let summe = 0;
        rects.forEach((r, i) => { const an = i < n; r.setAttribute('fill-opacity', an ? .5 : .12); if (an) summe += werte[i]; });
        const ges = werte.reduce((x, y) => x + y, 0);
        info.innerHTML = st === 'A'
          ? (n >= 6 ? `O = 6 · a² = 6 · ${wA}² = <b>${ges} cm²</b>` : `Fläche ${n}/6 · a² …`)
          : (n >= 5 ? `O = 2·(a·b + a·c + b·c) = <b>${ges} cm²</b>` : `Flächenpaar ${n}/5 …`);
      };
      zeige(REDUCED ? rects.length : 0);
      const loop = Loop(tt => zeige(1 + Math.floor((tt % ((rects.length + 1) * 0.7)) / 0.7)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 4 · Volumen als Schichten (KP-04) */
  register({
    id: 'volumenbox', titel: 'Volumen: Schicht für Schicht', bezug: 'KP-04',
    kurz: 'A: Würfel a³ · B: Quader a·b·c (= G·h), Liter · C: gemischte Einheiten.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 210, 'Quader füllt sich schichtweise');
      const a = st === 'A' ? 3 : 5, b = st === 'A' ? 3 : 3, c = st === 'A' ? 3 : 4;
      const t = boxTeile(70, 60, 120, 110, 54, 54); const box = zeichneBox(svg, t, K);
      // Füllung im Frontgesicht steigt
      const clipId = 'flc' + Math.random().toString(36).slice(2, 6);
      const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('path', { d: t.front })); defs.appendChild(cp); svg.appendChild(defs);
      const fuell = el('rect', { x: 70, y: 170, width: 120, height: 0, fill: K, 'fill-opacity': .5, 'clip-path': `url(#${clipId})` });
      box.g.insertBefore(fuell, box.front);
      const zeige = frac => {
        const hpx = 110 * frac; fuell.setAttribute('y', 60 + 110 - hpx); fuell.setAttribute('height', hpx);
        const schicht = Math.min(c, Math.round(c * frac));
        const V = a * b * c;
        info.innerHTML = st === 'A'
          ? (frac >= .99 ? `V = a·a·a = ${a}³ = <b>${V} cm³</b>` : `Schicht ${schicht}/${c} …`)
          : (frac >= .99 ? `V = a·b·c = ${a}·${b}·${c} = <b>${V} dm³ = ${V} l</b>` : `Grundfläche ${a}·${b}=${a * b}, Schicht ${schicht}/${c}`);
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(tt => zeige(osz(tt, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 5 · Rückwärts: fehlende Kante (KP-05) */
  register({
    id: 'kante', titel: 'Rückwärts: fehlende Kante finden', bezug: 'KP-05',
    kurz: 'A: Quaderkante = V:(a·b) · B: Würfelkante aus V (∛) oder O · C: rückwärts begründen.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 200, 'Körper mit gesuchter Kante');

      if (st === 'A') {
        const V = 60, a = 5, bb = 4, cziel = V / (a * bb); // = 3
        const zeige = frac => {
          svg.innerHTML = '';
          const cakt = 1 + (cziel - 1) * frac; const ch = 30 + cakt * 26;
          const t = boxTeile(80, 170 - ch, 120, ch, 48, 48); const box = zeichneBox(svg, t, K);
          svg.appendChild(txt(200 + 6, 170 - ch / 2, 'c = ?', { anchor: 'start', farbe: FARBE.korr, weight: 700, size: 12 }));
          const Vakt = a * bb * cakt;
          info.innerHTML = frac >= .99
            ? `c = V : (a·b) = 60 : (5·4) = <b>3</b>` : `Volumen wächst: ${fmt(Math.round(Vakt))} / 60 cm³`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(tt => zeige(osz(tt, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // B/C: Würfel wächst, bis V bzw. O den Zielwert erreicht
      const ziel = st === 'B' ? { V: 64, a: 4, art: 'V' } : { O: 96, a: 4, art: 'O' };
      const zeige = frac => {
        svg.innerHTML = '';
        const aakt = 1 + (ziel.a - 1) * frac; const s = 24 * aakt;
        const t = boxTeile(110, 150 - s, s, s, s * .5, s * .5); zeichneBox(svg, t, K);
        if (st === 'B') info.innerHTML = frac >= .99 ? `a = ∛V = ∛64 = <b>4 cm</b>` : `a³ = ${fmt(Math.round(aakt ** 3))} / 64`;
        else info.innerHTML = frac >= .99 ? `O = 6·a² = 96 → a² = 16 → a = <b>4 cm</b>` : `6·a² = ${fmt(Math.round(6 * aakt * aakt))} / 96`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(tt => zeige(osz(tt, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  // Helfer für Teil 4b bereitstellen
  window.ANIM._geo = { svgb, pfad, txt, boxTeile, zeichneBox };
})();

/* ============================================================
   animationen.js · Teil 4b — KP-Konzepte 6–10
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern, G = window.ANIM._geo;
  const { Loop, steuerleiste, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;
  const { svgb, txt } = G;

  function poly(pts, o) { o = o || {}; return el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: o.fill || 'none', 'fill-opacity': o.fo != null ? o.fo : 1, stroke: o.stroke || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-linejoin': 'round' }); }
  function extrude(parent, basePts, Hpx, K) {
    const top = basePts.map(p => [p[0], p[1] - Hpx]);
    parent.appendChild(poly(basePts, { fill: K, fo: .5 }));
    basePts.forEach((p, i) => parent.appendChild(el('line', { x1: p[0], y1: p[1], x2: top[i][0], y2: top[i][1], stroke: FARBE.ink, 'stroke-width': 1.2, 'stroke-opacity': .6 })));
    parent.appendChild(poly(top, { fill: K, fo: .34 }));
  }
  function zyl(parent, cx, topY, rx, hh, ry, K) {
    const g = el('g');
    g.appendChild(el('rect', { x: cx - rx, y: topY, width: rx * 2, height: hh, fill: K, 'fill-opacity': .3 }));
    g.appendChild(el('ellipse', { cx, cy: topY + hh, rx, ry, fill: K, 'fill-opacity': .5, stroke: FARBE.ink, 'stroke-width': 1.5 }));
    g.appendChild(el('path', { d: `M${cx - rx},${topY} V${topY + hh} M${cx + rx},${topY} V${topY + hh}`, stroke: FARBE.ink, 'stroke-width': 1.5, fill: 'none' }));
    g.appendChild(el('ellipse', { cx, cy: topY, rx, ry, fill: K, 'fill-opacity': .62, stroke: FARBE.ink, 'stroke-width': 1.5 }));
    parent.appendChild(g); return g;
  }

  /* 6 · Prisma: V = G · h durch Extrusion (KP-06/07) */
  register({
    id: 'prisma', titel: 'Prisma: Grundfläche · Höhe', bezug: 'KP-06',
    kurz: 'A: V = G·h (Grundfläche hoch ziehen) · B: Dreiecksgrundfläche → G → V · C: zusammengesetzte Grundfläche.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 210, 'Prisma entsteht durch Hochziehen der Grundfläche');
      const bx = 90, by = 175, ox = 42, oy = 20;
      const basen = {
        A: { pts: [[bx, by], [bx + ox, by - oy], [bx + ox + 80, by - oy], [bx + 80, by]], G: 12, h: 5, txt: 'G = 12 cm²' },
        B: { pts: [[bx, by], [bx + 90, by], [bx + 45 + ox, by - oy]], G: 12, h: 10, txt: 'G = (6·4):2 = 12 cm²' },
        C: { pts: [[bx, by], [bx + 80, by], [bx + 80, by - 22], [bx + 40, by - 40], [bx, by - 22]], G: 25, h: 8, txt: 'G = 20 + 5 = 25 cm²' }
      };
      const cfg = basen[st];
      const Hmax = st === 'B' ? 120 : (st === 'C' ? 95 : 70);
      const zeige = frac => {
        svg.innerHTML = '';
        extrude(svg, cfg.pts.map(p => p.slice()), Hmax * frac, K);
        const V = cfg.G * cfg.h;
        info.innerHTML = frac < .96 ? `${cfg.txt} — Höhe ${fmt(Math.round(cfg.h * frac))} …`
          : `V = G · h = ${cfg.G} · ${cfg.h} = <b>${V} cm³</b>`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 7 · Oberfläche Prisma: Mantel abwickeln (KP-08) */
  register({
    id: 'mantelprisma', titel: 'Prisma-Oberfläche: Mantel abwickeln', bezug: 'KP-08',
    kurz: 'A: Mantel = Umfang · Höhe · B: O = 2·G + Mantel · C: fehlende Seite mit Pythagoras.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 340, 210, 'Mantel eines Dreiecksprismas wird abgewickelt');
      const seiten = [3, 4, 5], U = seiten.reduce((a, b) => a + b, 0), hoehe = 10;
      const HH = 70, skala = 12;
      // Dreiecksprisma links
      const drawPrisma = () => { const g = el('g'); const p1 = [40, 60], p2 = [40, 60 + 46], p3 = [40 + 34, 60 + 23]; extrude(g, [p1, p2, p3], 0, K); // flach? nein: zeichne kleines Prisma
        g.innerHTML = ''; const bpts = [p1, p2, p3]; const top = bpts.map(p => [p[0] + 40, p[1] - 8]); g.appendChild(poly(bpts, { fill: K, fo: .5 })); bpts.forEach((p, i) => g.appendChild(el('line', { x1: p[0], y1: p[1], x2: top[i][0], y2: top[i][1], stroke: FARBE.ink, 'stroke-width': 1, 'stroke-opacity': .5 }))); g.appendChild(poly(top, { fill: K, fo: .34 })); return g; };
      svg.appendChild(drawPrisma());
      const strip = el('g'); svg.appendChild(strip);
      const zeige = frac => {
        strip.innerHTML = '';
        const x0 = 150, y0 = 70, hpx = hoehe * skala * 0.5;
        let x = x0, gezeigt = U * frac, sum = 0;
        for (const s of seiten) { const w = s * skala; const anteil = Math.max(0, Math.min(w, (gezeigt - sum) * skala)); if (anteil > 0) { strip.appendChild(el('rect', { x, y: y0, width: anteil, height: hpx, fill: K, 'fill-opacity': .3, stroke: FARBE.ink, 'stroke-width': 1 })); if (anteil >= w - 0.5) strip.appendChild(txt(x + w / 2, y0 + hpx + 13, s + '', { size: 10, farbe: FARBE.weich })); } x += w; sum += s; }
        const M = U * hoehe;
        if (st === 'A') info.innerHTML = frac >= .96 ? `Mantel = Umfang · Höhe = ${U} · ${hoehe} = <b>${M} cm²</b>` : `Mantel abrollen … Umfang = 3+4+5 = ${U}`;
        else if (st === 'B') info.innerHTML = frac >= .96 ? `O = 2·G + Mantel = 2·6 + ${M} = <b>${12 + M} cm²</b>` : `erst der Mantel (${U}·${hoehe}) …`;
        else info.innerHTML = frac >= .96 ? `Hypotenuse c = √(3²+4²) = 5 → Umfang 12 → Mantel = <b>${M} cm²</b>` : `fehlende Seite: c = √(3²+4²) = 5`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 8 · Zylindervolumen (KP-09) */
  register({
    id: 'zylinder', titel: 'Zylindervolumen: π·r²·h', bezug: 'KP-09',
    kurz: 'A: V = π·r²·h · B: aus dem Durchmesser (r = d:2) · C: in Litern.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 210, 'Zylinder füllt sich');
      const cx = 150, topY = 30, rx = 60, ry = 16, hh = 140;
      zyl(svg, cx, topY, rx, hh, ry, '#C8D2D8');
      const clipId = 'zc' + Math.random().toString(36).slice(2, 6);
      const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('rect', { x: cx - rx, y: topY, width: rx * 2, height: hh })); defs.appendChild(cp); svg.appendChild(defs);
      const fuellG = el('g', { 'clip-path': `url(#${clipId})` }); svg.appendChild(fuellG);
      const rr = st === 'B' ? 4 : 5, r_h = st === 'C' ? 3 : 10; const V = Math.PI * rr * rr * (st === 'C' ? 3 : 10);
      const zeige = frac => {
        fuellG.innerHTML = '';
        const hpx = hh * frac; fuellG.appendChild(el('rect', { x: cx - rx, y: topY + hh - hpx, width: rx * 2, height: hpx, fill: K, 'fill-opacity': .45 }));
        if (hpx > 4) fuellG.appendChild(el('ellipse', { cx, cy: topY + hh - hpx, rx, ry, fill: K, 'fill-opacity': .7 }));
        const Vc = st === 'C' ? Math.PI * 4 * 3 : (st === 'B' ? Math.PI * 16 * 12 : Math.PI * 25 * 10);
        if (st === 'A') info.innerHTML = frac >= .96 ? `V = π·r²·h = 3,14·5²·10 = <b>${fmt(Math.round(Vc))} cm³</b>` : `Kreisfläche π·r² mal Höhe stapeln …`;
        else if (st === 'B') info.innerHTML = frac >= .96 ? `r = d:2 = 8:2 = 4 → V = 3,14·4²·12 = <b>${fmt(Math.round(Vc))} cm³</b>` : `erst r = d:2 = 4 …`;
        else info.innerHTML = frac >= .96 ? `in dm rechnen: V = 3,14·2²·3 ≈ <b>37,7 dm³ = 37,7 l</b>` : `in dm → dm³ = Liter …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 9 · Zylinderoberfläche: Mantel abwickeln (KP-10) */
  register({
    id: 'zylinderflaeche', titel: 'Zylinder-Oberfläche: Mantel abrollen', bezug: 'KP-10',
    kurz: 'A: Mantel = 2·π·r · h · B: O = 2 Kreise + Mantel · C: offener Behälter.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 340, 200, 'Zylindermantel wird zu einem Rechteck abgerollt');
      const cx = 70, topY = 40, rx = 30, ry = 10, hh = 100;
      zyl(svg, cx, topY, rx, hh, ry, K);
      const strip = el('g'); svg.appendChild(strip);
      const r = 4, hZ = 10, U = 2 * 3.14 * r; // 25,12
      const zeige = frac => {
        strip.innerHTML = '';
        const x0 = 120, y0 = 50, wMax = 190, w = wMax * frac, hpx = hh;
        strip.appendChild(el('rect', { x: x0, y: y0, width: w, height: hpx, fill: K, 'fill-opacity': .3, stroke: FARBE.ink, 'stroke-width': 1.2 }));
        if (frac > .2) strip.appendChild(txt(x0 + w / 2, y0 + hpx + 14, 'Umfang = 2·π·r = ' + fmt(U), { size: 10, farbe: FARBE.weich }));
        if (st === 'B') { strip.appendChild(el('ellipse', { cx: x0 + 20, cy: y0 - 14, rx: 18, ry: 6, fill: K, 'fill-opacity': .5, stroke: FARBE.ink, 'stroke-width': 1 })); strip.appendChild(el('ellipse', { cx: x0 + w - 20, cy: y0 - 14, rx: 18, ry: 6, fill: K, 'fill-opacity': .5, stroke: FARBE.ink, 'stroke-width': 1 })); }
        if (st === 'C') strip.appendChild(el('ellipse', { cx: x0 + 20, cy: y0 - 14, rx: 18, ry: 6, fill: K, 'fill-opacity': .5, stroke: FARBE.ink, 'stroke-width': 1 }));
        const M = 2 * 3.14 * r * hZ, Kr = 3.14 * r * r;
        if (st === 'A') info.innerHTML = frac >= .96 ? `Mantel = 2·π·r·h = ${fmt(U)}·${hZ} = <b>${fmt(Math.round(M * 10) / 10)} cm²</b>` : `Mantel abrollen → Rechteck (Umfang · Höhe)`;
        else if (st === 'B') info.innerHTML = frac >= .96 ? `O = 2·π·r² + Mantel = 2·${fmt(Kr)} + ${fmt(M)} ≈ <b>${fmt(Math.round((2 * Kr + M) * 10) / 10)} cm²</b>` : `Mantel + 2 Deckkreise …`;
        else info.innerHTML = frac >= .96 ? `offen oben: O = 1 Kreis + Mantel = ${fmt(Kr)} + ${fmt(M)} ≈ <b>${fmt(Math.round((Kr + M) * 10) / 10)} cm²</b>` : `offener Becher → nur 1 Kreis`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 10 · Zusammengesetzte Körper & Masse (KP-11) */
  register({
    id: 'zusammengesetzt', titel: 'Zusammengesetzte Körper', bezug: 'KP-11',
    kurz: 'A: zerlegen und Volumen addieren · B: Masse = Volumen · Dichte · C: Hohlkörper (außen − innen).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const G4 = window.ANIM._geo;
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 210, 'Zusammengesetzter Körper');

      if (st === 'C') {
        // Hohlkörper: außen minus innen (Rohr, Querschnitt)
        const zeige = frac => {
          svg.innerHTML = '';
          svg.appendChild(el('rect', { x: 90, y: 40, width: 140, height: 120, fill: K, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.5 }));
          const iw = 90 * frac, ih = 70 * frac;
          svg.appendChild(el('rect', { x: 160 - iw / 2, y: 100 - ih / 2, width: iw, height: ih, fill: '#FFFFFF', stroke: FARBE.korr, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));
          info.innerHTML = frac >= .96 ? `V = V<tspan>außen</tspan> − V<tspan>innen</tspan> = 785 − 502,4 = <b>282,6 cm³</b>` : `innen aushöhlen …`;
          info.innerHTML = frac >= .96 ? `V = außen − innen = 785 − 502,4 = <b>282,6 cm³</b>` : `innen aushöhlen …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t => zeige(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // A/B: Quader unten + Würfel oben, der abhebt
      const zeige = frac => {
        svg.innerHTML = '';
        const t1 = G4.boxTeile(80, 150, 140, 44, 40, 26); G4.zeichneBox(svg, t1, K);
        const lift = 40 * frac;
        const t2 = G4.boxTeile(120, 128 - lift, 44, 44, 24, 24); G4.zeichneBox(svg, t2, FARBE.c);
        if (st === 'A') info.innerHTML = frac >= .5 ? `V = Quader + Würfel = 32 + 8 = <b>40 cm³</b>` : `in Grundformen zerlegen …`;
        else info.innerHTML = frac >= .5 ? `V = 50 cm³ · Dichte 7,8 g/cm³ → Masse = <b>390 g</b>` : `erst das Volumen, dann · Dichte …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();

/* ============================================================
   animationen.js · Teil 5a — Lernbereich SK (Spitzkörper: Pyramide, Kegel, Kugel)
   Schrägbild-Spitzkörper mit animierbaren Teilen. Helfer + Konzepte 1–5.
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern, GE = window.ANIM._geo;
  const { Loop, steuerleiste, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;
  const { svgb, txt } = GE;

  function poly(pts, o) { o = o || {}; return el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: o.fill || 'none', 'fill-opacity': o.fo != null ? o.fo : 1, stroke: o.stroke || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-linejoin': 'round', 'stroke-dasharray': o.dash || '' }); }
  function line(x1, y1, x2, y2, o) { o = o || {}; return el('line', { x1, y1, x2, y2, stroke: o.farbe || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-dasharray': o.dash || '', 'stroke-opacity': o.op != null ? o.op : 1 }); }

  /* Schrägbild-Pyramide (quadratische Grundfläche als Raute). */
  function mkPyramide(parent, cx, cyB, bw, bd, H, K) {
    const F = [cx, cyB + bd], R = [cx + bw, cyB], Ba = [cx, cyB - bd], L = [cx - bw, cyB], S = [cx, cyB - H], C = [cx, cyB];
    parent.appendChild(poly([F, R, Ba, L], { fill: K, fo: .22, stroke: FARBE.ink, sw: 1.3 }));
    // hintere Kanten gestrichelt
    parent.appendChild(line(S[0], S[1], Ba[0], Ba[1], { dash: '4 3', op: .5 }));
    parent.appendChild(line(S[0], S[1], L[0], L[1], { dash: '4 3', op: .5 }));
    // vordere Kanten solide
    parent.appendChild(line(S[0], S[1], F[0], F[1]));
    parent.appendChild(line(S[0], S[1], R[0], R[1]));
    return { F, R, Ba, L, S, C, mFR: [(F[0] + R[0]) / 2, (F[1] + R[1]) / 2] };
  }
  /* Schrägbild-Kegel. */
  function mkKegel(parent, cx, cyB, rx, ry, H, K, opt) {
    opt = opt || {};
    const S = [cx, cyB - H], Lp = [cx - rx, cyB], Rp = [cx + rx, cyB], C = [cx, cyB];
    if (opt.fill !== false) parent.appendChild(el('path', { d: `M${Lp[0]},${Lp[1]} L${S[0]},${S[1]} L${Rp[0]},${Rp[1]}`, fill: K, 'fill-opacity': .3, stroke: 'none' }));
    parent.appendChild(el('ellipse', { cx, cy: cyB, rx, ry, fill: K, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.4 }));
    parent.appendChild(line(Lp[0], Lp[1], S[0], S[1]));
    parent.appendChild(line(Rp[0], Rp[1], S[0], S[1]));
    return { S, Lp, Rp, C };
  }
  function mkKugel(parent, cx, cy, r, K) {
    parent.appendChild(el('circle', { cx, cy, r, fill: K, 'fill-opacity': .28, stroke: FARBE.ink, 'stroke-width': 1.5 }));
    parent.appendChild(el('ellipse', { cx, cy, rx: r, ry: r * 0.32, fill: 'none', stroke: FARBE.ink, 'stroke-width': 1, 'stroke-dasharray': '3 3', 'stroke-opacity': .6 }));
    return { C: [cx, cy], r };
  }
  function mkZyl(parent, cx, topY, rx, hh, ry, K) {
    parent.appendChild(el('rect', { x: cx - rx, y: topY, width: rx * 2, height: hh, fill: K, 'fill-opacity': .18 }));
    parent.appendChild(el('ellipse', { cx, cy: topY + hh, rx, ry, fill: K, 'fill-opacity': .35, stroke: FARBE.ink, 'stroke-width': 1.4 }));
    parent.appendChild(el('path', { d: `M${cx - rx},${topY} V${topY + hh} M${cx + rx},${topY} V${topY + hh}`, stroke: FARBE.ink, 'stroke-width': 1.4, fill: 'none' }));
    parent.appendChild(el('ellipse', { cx, cy: topY, rx, ry, fill: K, 'fill-opacity': .45, stroke: FARBE.ink, 'stroke-width': 1.4 }));
  }
  window.ANIM._geo2 = { poly, line, mkPyramide, mkKegel, mkKugel, mkZyl };

  const rechtwinkel = (parent, px, py, dx1, dy1, dx2, dy2) => { const s = 8; parent.appendChild(el('path', { d: `M${px + dx1 * s},${py + dy1 * s} L${px + dx1 * s + dx2 * s},${py + dy1 * s + dy2 * s} L${px + dx2 * s},${py + dy2 * s}`, fill: 'none', stroke: FARBE.korr, 'stroke-width': 1.2 })); };

  /* 1 · Pyramide kennenlernen (SK-01) */
  register({
    id: 'pyramide', titel: 'Die Pyramide: Teile benennen', bezug: 'SK-01',
    kurz: 'A: Spitze, Grundfläche, Grundkante, Höhe · B: Höhe vs. Seitenhöhe · C: n-Eck-Pyramide (n Seiten, n+1 Flächen).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'C') {
        const svg = svgb(o.breite || 320, 200, 'n-Eck-Pyramide');
        const cx = 150, cyB = 150, rx = 60, ry = 22, S = [cx, 40];
        const basis = el('polygon', { fill: K, 'fill-opacity': .25, stroke: FARBE.ink, 'stroke-width': 1.4 });
        const kanten = el('g'); svg.appendChild(basis); svg.appendChild(kanten);
        let n = 4;
        const zeichne = () => {
          const pts = [];
          for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push([cx + rx * Math.cos(a), cyB + ry * Math.sin(a)]); }
          basis.setAttribute('points', pts.map(p => p.join(',')).join(' '));
          kanten.innerHTML = '';
          pts.forEach(p => kanten.appendChild(line(p[0], p[1], S[0], S[1], { op: .6 })));
          info.innerHTML = `n = ${n}: <b>${n} Seitendreiecke</b> · Flächen n+1 = <b>${n + 1}</b>`;
        };
        zeichne();
        const loop = Loop(t => { const nn = 3 + Math.floor(osz(t, 8) * 3.99); if (nn !== n) { n = nn; zeichne(); } });
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      const svg = svgb(o.breite || 300, 200, 'Pyramide');
      const P = mkPyramide(svg, 150, 150, 75, 26, 110, K);
      const mark = el('g'); svg.appendChild(mark);

      if (st === 'B') {
        // Höhe h (innen) vs Seitenhöhe s (auf der Fläche)
        svg.appendChild(line(P.S[0], P.S[1], P.C[0], P.C[1], { farbe: FARBE.b, sw: 2.5 }));
        svg.appendChild(txt(P.C[0] - 6, (P.S[1] + P.C[1]) / 2, 'h', { anchor: 'end', farbe: FARBE.b, weight: 700 }));
        svg.appendChild(line(P.S[0], P.S[1], P.mFR[0], P.mFR[1], { farbe: FARBE.c, sw: 2.5 }));
        svg.appendChild(txt(P.mFR[0] + 8, (P.S[1] + P.mFR[1]) / 2, 's', { anchor: 'start', farbe: FARBE.c, weight: 700 }));
        info.innerHTML = `<b style="color:${FARBE.b}">Höhe h</b> steht innen senkrecht · <b style="color:${FARBE.c}">Seitenhöhe s</b> liegt auf der Fläche (s > h)`;
        host.appendChild(svg); host.appendChild(info);
        return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
      }

      const teile = [
        { txt: 'Spitze: der oberste Punkt', zeig: () => { mark.innerHTML = ''; mark.appendChild(el('circle', { cx: P.S[0], cy: P.S[1], r: 6, fill: FARBE.korr })); } },
        { txt: 'Grundfläche: die Fläche unten', zeig: () => { mark.innerHTML = ''; mark.appendChild(poly([P.F, P.R, P.Ba, P.L], { fill: FARBE.korr, fo: .3 })); } },
        { txt: 'Grundkante a: eine Kante der Grundfläche', zeig: () => { mark.innerHTML = ''; mark.appendChild(line(P.F[0], P.F[1], P.R[0], P.R[1], { farbe: FARBE.korr, sw: 4 })); } },
        { txt: 'Höhe h: senkrecht zur Mitte', zeig: () => { mark.innerHTML = ''; mark.appendChild(line(P.S[0], P.S[1], P.C[0], P.C[1], { farbe: FARBE.korr, sw: 3 })); } }
      ];
      let pi = -1;
      const loop = Loop(t => { const k = Math.floor(t / 1.6) % 4; if (k !== pi) { pi = k; teile[k].zeig(); info.innerHTML = teile[k].txt; } });
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); else { teile[0].zeig(); info.innerHTML = teile[0].txt; }
      return loop;
    }
  });

  /* 2 · Höhe/Seitenhöhe/Grundkante mit Pythagoras (SK-02) */
  register({
    id: 'pythpyr', titel: 'Pyramide: das rechtwinklige Dreieck', bezug: 'SK-02',
    kurz: 'A: das Dreieck aus h, a:2 und s erkennen · B: s = √(h²+(a:2)²) · C: h oder a rückwärts.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'A') {
        const svg = svgb(o.breite || 300, 200, 'rechtwinkliges Dreieck in der Pyramide');
        const P = mkPyramide(svg, 150, 150, 75, 26, 110, K);
        // Dreieck S - C - mFR
        svg.appendChild(el('path', { d: `M${P.S[0]},${P.S[1]} L${P.C[0]},${P.C[1]} L${P.mFR[0]},${P.mFR[1]} Z`, fill: FARBE.korr, 'fill-opacity': .18, stroke: FARBE.korr, 'stroke-width': 2 }));
        svg.appendChild(txt(P.C[0] - 6, (P.S[1] + P.C[1]) / 2, 'h', { anchor: 'end', farbe: FARBE.b, weight: 700 }));
        svg.appendChild(txt((P.C[0] + P.mFR[0]) / 2, P.C[1] + 14, 'a:2', { farbe: FARBE.a, weight: 700, size: 11 }));
        svg.appendChild(txt((P.S[0] + P.mFR[0]) / 2 + 8, (P.S[1] + P.mFR[1]) / 2, 's', { anchor: 'start', farbe: FARBE.c, weight: 700 }));
        rechtwinkel(svg, P.C[0], P.C[1], 0, -1, 1, 0);
        info.innerHTML = `Katheten <b style="color:${FARBE.b}">h</b> und <b style="color:${FARBE.a}">a:2</b>, Hypotenuse <b style="color:${FARBE.c}">s</b>`;
        host.appendChild(svg); host.appendChild(info);
        return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
      }

      // B/C: flaches rechtwinkliges Dreieck mit Zahlen
      const svg = svgb(o.breite || 300, 170, 'Pythagoras am Dreieck');
      const bekannt = st === 'B' ? { h: 4, a2: 3, s: 5, ges: 's' } : { h: 12, a2: 5, s: 13, ges: 'h' };
      const Ox = 70, Oy = 130, sc = 9;
      const A0 = [Ox, Oy], B0 = [Ox + bekannt.a2 * sc, Oy], Cc = [Ox, Oy - bekannt.h * sc];
      const zeichne = () => {
        svg.innerHTML = '';
        svg.appendChild(el('path', { d: `M${A0} L${B0} L${Cc} Z`, fill: K, 'fill-opacity': .2, stroke: FARBE.ink, 'stroke-width': 1.6 }));
        rechtwinkel(svg, A0[0], A0[1], 1, 0, 0, -1);
        svg.appendChild(txt((A0[0] + B0[0]) / 2, A0[1] + 15, 'a:2 = ' + bekannt.a2, { farbe: FARBE.a, size: 11 }));
        svg.appendChild(txt(A0[0] - 8, (A0[1] + Cc[1]) / 2, 'h = ' + bekannt.h, { anchor: 'end', farbe: FARBE.b, size: 11 }));
        svg.appendChild(txt((B0[0] + Cc[0]) / 2 + 6, (B0[1] + Cc[1]) / 2 - 4, 's = ' + bekannt.s, { anchor: 'start', farbe: FARBE.c, size: 11 }));
      };
      zeichne();
      info.innerHTML = st === 'B'
        ? `s = √(h² + (a:2)²) = √(4² + 3²) = √25 = <b>5 cm</b>`
        : `h = √(s² − (a:2)²) = √(13² − 5²) = √144 = <b>12 cm</b>`;
      const loop = Loop(() => { }); const bar = steuerleiste(loop, { reset: false });
      host.appendChild(svg); host.appendChild(info);
      return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
    }
  });

  /* 3 · Volumen der Pyramide (SK-03) */
  register({
    id: 'volpyr', titel: 'Pyramidenvolumen: ⅓ · G · h', bezug: 'SK-03',
    kurz: 'A: V = ⅓·G·h · B: quadratische Grundfläche · C: 3 Pyramiden füllen 1 Prisma.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'C') {
        const svg = svgb(o.breite || 300, 210, 'Drei Pyramiden füllen ein Prisma');
        const t = GE.boxTeile(90, 60, 120, 120, 46, 46);
        const clipId = 'pc' + Math.random().toString(36).slice(2, 6);
        const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('path', { d: t.front })); defs.appendChild(cp); svg.appendChild(defs);
        GE.zeichneBox(svg, t, '#C8D2D8');
        const fuell = el('rect', { x: 90, y: 180, width: 120, height: 0, fill: K, 'fill-opacity': .5, 'clip-path': `url(#${clipId})` });
        svg.appendChild(fuell);
        const zeige = frac => {
          const stufe3 = Math.min(3, Math.floor(frac * 3) + (frac >= 1 ? 0 : 1)); const f = Math.min(1, frac);
          const hpx = 120 * f; fuell.setAttribute('y', 60 + 120 - hpx); fuell.setAttribute('height', hpx);
          info.innerHTML = f >= .99 ? `3 Pyramiden = 1 Prisma → V = <b>⅓ · G · h</b>` : `Pyramide ${Math.min(3, Math.ceil(f * 3))} von 3 …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t2 => zeige(osz(t2, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      const svg = svgb(o.breite || 300, 200, 'Pyramide');
      const P = mkPyramide(svg, 150, 155, 75, 26, 115, K);
      const G = st === 'A' ? 30 : 36, hh = st === 'A' ? 6 : 10, a = 6;
      const V = G * hh / 3;
      info.innerHTML = st === 'A'
        ? `V = ⅓ · G · h = (30 · 6) : 3 = <b>${V} cm³</b>`
        : `G = a² = 6² = 36 → V = (36 · 10) : 3 = <b>${36 * 10 / 3} cm³</b>`;
      const loop = Loop(t => { P.S && 0; });
      const bar = steuerleiste(loop, { reset: false });
      host.appendChild(svg); host.appendChild(info);
      return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
    }
  });

  /* 4 · Oberfläche der Pyramide (SK-04) */
  register({
    id: 'obpyr', titel: 'Pyramiden-Oberfläche: Netz', bezug: 'SK-04',
    kurz: 'A: ein Seitendreieck (a·s):2 · B: O = a² + 4 Dreiecke · C: erst s mit Pythagoras.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 220, 'Netz der Pyramide');
      const cx = 150, cy = 110, u = 30; // halbe Grundkante in px-Einheiten
      // Grundquadrat + 4 Dreiecke
      const sq = [[cx - u, cy - u], [cx + u, cy - u], [cx + u, cy + u], [cx - u, cy + u]];
      const sh = 46; // Seitenhöhe in px
      const drei = [
        [sq[0], sq[1], [cx, cy - u - sh]],
        [sq[1], sq[2], [cx + u + sh, cy]],
        [sq[2], sq[3], [cx, cy + u + sh]],
        [sq[3], sq[0], [cx - u - sh, cy]]
      ];
      const quad = poly(sq, { fill: K, fo: .3 }); svg.appendChild(quad);
      const dreiEls = drei.map(d => { const e = poly(d, { fill: K, fo: .12 }); svg.appendChild(e); return e; });
      const zeige = n => {
        dreiEls.forEach((e, i) => e.setAttribute('fill-opacity', i < n ? .5 : .12));
        if (st === 'A') info.innerHTML = `ein Seitendreieck: (a · s) : 2 = (6 · 5) : 2 = <b>15 cm²</b>`;
        else if (st === 'B') info.innerHTML = n >= 4 ? `O = a² + 2·a·s = 36 + 60 = <b>96 cm²</b>` : `Grundfläche + ${n} von 4 Dreiecken …`;
        else info.innerHTML = n >= 4 ? `s = √(h²+(a:2)²) = 5 → O = a² + 2·a·s = <b>96 cm²</b>` : `erst s = √(4²+3²) = 5 …`;
      };
      zeige(REDUCED ? 4 : 0);
      const loop = Loop(t => zeige(1 + Math.floor((t % 5) / 1)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 5 · Rückwärts & gemischt (SK-05 / SK-09) */
  register({
    id: 'rueckwaerts', titel: 'Rückwärts & gemischt', bezug: 'SK-05',
    kurz: 'A: Volumen oder Oberfläche? · B: fehlende Größe (h) aus dem Volumen · C: mehrschrittig.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 200, 'Spitzkörper');

      if (st === 'A') {
        const P = mkPyramide(svg, 150, 150, 70, 24, 105, K);
        const signale = [
          { t: `„Wie viel passt hinein?“ → Rauminhalt → <b>Volumen</b>`, mark: () => svg.querySelectorAll('polygon') },
          { t: `„Wie viel Material?“ → Außenhaut → <b>Oberfläche</b>`, mark: () => null }
        ];
        let pi = -1;
        const loop = Loop(t => { const k = Math.floor(t / 2) % 2; if (k !== pi) { pi = k; info.innerHTML = signale[k].t; } });
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); else info.innerHTML = signale[0].t;
        return loop;
      }

      // B/C: Höhe wächst, bis V den Zielwert erreicht (V=(a²·h)/3, a=5, Ziel 100 → h=12)
      const a = 5, Vziel = 100, hziel = 3 * Vziel / (a * a);
      const zeige = frac => {
        svg.innerHTML = '';
        const hakt = 1 + (hziel - 1) * frac; const Hpx = 12 * hakt;
        mkPyramide(svg, 150, 165, 60, 22, Hpx, K);
        const Vakt = a * a * hakt / 3;
        info.innerHTML = st === 'B'
          ? (frac >= .98 ? `h = 3·V : a² = 3·100 : 25 = <b>12 cm</b>` : `Volumen ${fmt(Math.round(Vakt))} / 100 cm³`)
          : (frac >= .98 ? `erst h = 3·V:a² = 12, dann s = √(12²+2,5²) …` : `mehrschrittig: erst h aus V …`);
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();

/* ============================================================
   animationen.js · Teil 5b — SK-Konzepte 6–10
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern, GE = window.ANIM._geo, G2 = window.ANIM._geo2;
  const { Loop, steuerleiste, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;
  const { svgb, txt } = GE; const { mkKegel, mkKugel, mkZyl, line, poly } = G2;
  const rwk = (p, px, py, dx1, dy1, dx2, dy2) => { const s = 8; p.appendChild(el('path', { d: `M${px + dx1 * s},${py + dy1 * s} L${px + dx1 * s + dx2 * s},${py + dy1 * s + dy2 * s} L${px + dx2 * s},${py + dy2 * s}`, fill: 'none', stroke: FARBE.korr, 'stroke-width': 1.2 })); };

  /* 6 · Kegel: Radius, Höhe, Mantellinie (SK-06) */
  register({
    id: 'kegel', titel: 'Der Kegel: r, h, s', bezug: 'SK-06',
    kurz: 'A: benennen + rechtwinkliges Dreieck · B: s = √(r²+h²) · C: r oder h rückwärts.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'A') {
        const svg = svgb(o.breite || 300, 200, 'Kegel mit r, h, s');
        const kg = mkKegel(svg, 150, 150, 65, 18, 115, K);
        svg.appendChild(line(kg.C[0], kg.C[1], kg.S[0], kg.S[1], { farbe: FARBE.b, sw: 2.5 }));
        svg.appendChild(line(kg.C[0], kg.C[1], kg.Rp[0], kg.Rp[1], { farbe: FARBE.a, sw: 2.5 }));
        svg.appendChild(el('path', { d: `M${kg.S} L${kg.C} L${kg.Rp} Z`, fill: FARBE.korr, 'fill-opacity': .12, stroke: 'none' }));
        svg.appendChild(txt(kg.C[0] - 6, (kg.S[1] + kg.C[1]) / 2, 'h', { anchor: 'end', farbe: FARBE.b, weight: 700 }));
        svg.appendChild(txt((kg.C[0] + kg.Rp[0]) / 2, kg.C[1] + 14, 'r', { farbe: FARBE.a, weight: 700 }));
        svg.appendChild(txt((kg.S[0] + kg.Rp[0]) / 2 + 8, (kg.S[1] + kg.Rp[1]) / 2, 's', { anchor: 'start', farbe: FARBE.c, weight: 700 }));
        rwk(svg, kg.C[0], kg.C[1], 0, -1, 1, 0);
        info.innerHTML = `Katheten <b style="color:${FARBE.a}">r</b> und <b style="color:${FARBE.b}">h</b>, Hypotenuse <b style="color:${FARBE.c}">s</b> (Mantellinie)`;
        host.appendChild(svg); host.appendChild(info);
        return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
      }
      const svg = svgb(o.breite || 300, 170, 'Pythagoras am Kegel-Dreieck');
      const bk = st === 'B' ? { r: 3, hh: 4, s: 5, } : { r: 5, hh: 12, s: 13 };
      const Ox = 80, Oy = 130, sc = 8;
      const A0 = [Ox, Oy], B0 = [Ox + bk.r * sc, Oy], Cc = [Ox, Oy - bk.hh * sc];
      svg.appendChild(el('path', { d: `M${A0} L${B0} L${Cc} Z`, fill: K, 'fill-opacity': .2, stroke: FARBE.ink, 'stroke-width': 1.6 }));
      rwk(svg, A0[0], A0[1], 1, 0, 0, -1);
      svg.appendChild(txt((A0[0] + B0[0]) / 2, A0[1] + 15, 'r = ' + bk.r, { farbe: FARBE.a, size: 11 }));
      svg.appendChild(txt(A0[0] - 8, (A0[1] + Cc[1]) / 2, 'h = ' + bk.hh, { anchor: 'end', farbe: FARBE.b, size: 11 }));
      svg.appendChild(txt((B0[0] + Cc[0]) / 2 + 6, (B0[1] + Cc[1]) / 2 - 4, 's = ' + bk.s, { anchor: 'start', farbe: FARBE.c, size: 11 }));
      info.innerHTML = st === 'B' ? `s = √(r²+h²) = √(3²+4²) = √25 = <b>5 cm</b>` : `h = √(s²−r²) = √(13²−5²) = √144 = <b>12 cm</b>`;
      host.appendChild(svg); host.appendChild(info);
      return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
    }
  });

  /* 7 · Volumen des Kegels (SK-07) */
  register({
    id: 'volkegel', titel: 'Kegelvolumen: ⅓·π·r²·h', bezug: 'SK-07',
    kurz: 'A: V = ⅓·π·r²·h · B: aus dem Durchmesser · C: 3 Kegel füllen 1 Zylinder.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      if (st === 'C') {
        const svg = svgb(o.breite || 300, 210, 'Drei Kegel füllen einen Zylinder');
        const cx = 150, topY = 30, rx = 60, ry = 16, hh = 150;
        mkZyl(svg, cx, topY, rx, hh, ry, '#C8D2D8');
        const clipId = 'kc' + Math.random().toString(36).slice(2, 6);
        const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('rect', { x: cx - rx, y: topY, width: rx * 2, height: hh })); defs.appendChild(cp); svg.appendChild(defs);
        const fuellG = el('g', { 'clip-path': `url(#${clipId})` }); svg.appendChild(fuellG);
        const zeige = frac => {
          fuellG.innerHTML = '';
          const hpx = hh * frac; fuellG.appendChild(el('rect', { x: cx - rx, y: topY + hh - hpx, width: rx * 2, height: hpx, fill: K, 'fill-opacity': .45 }));
          if (hpx > 4) fuellG.appendChild(el('ellipse', { cx, cy: topY + hh - hpx, rx, ry, fill: K, 'fill-opacity': .7 }));
          info.innerHTML = frac >= .99 ? `3 Kegel = 1 Zylinder → V = <b>⅓·π·r²·h</b>` : `Kegel ${Math.min(3, Math.ceil(frac * 3))} von 3 …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t => zeige(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      const svg = svgb(o.breite || 300, 200, 'Kegel');
      mkKegel(svg, 150, 155, 60, 16, 120, K);
      info.innerHTML = st === 'A'
        ? `V = ⅓·π·r²·h = (3,14·5²·10):3 ≈ <b>261,7 cm³</b>`
        : `r = d:2 = 6:2 = 3 → V = (3,14·3²·7):3 ≈ <b>65,9 cm³</b>`;
      host.appendChild(svg); host.appendChild(info);
      return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
    }
  });

  /* 8 · Oberfläche des Kegels: Mantel als Sektor (SK-08) */
  register({
    id: 'obkegel', titel: 'Kegel-Oberfläche: Mantel als Sektor', bezug: 'SK-08',
    kurz: 'A: Mantel = π·r·s (abwickeln) · B: O = Grundkreis + Mantel · C: erst s mit Pythagoras.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 340, 200, 'Kegelmantel wird zu einem Kreissektor abgewickelt');
      const r = 3, s = 5, R = 74, theta = (r / s) * 2 * Math.PI;
      mkKegel(svg, 75, 130, 34, 10, 78, K);
      const scx = 230, scy = 120;
      const sektor = el('path', { fill: K, 'fill-opacity': .32, stroke: FARBE.ink, 'stroke-width': 1.4 }); svg.appendChild(sektor);
      const grund = st !== 'A' ? el('circle', { cx: 75, cy: 130, r: 0, fill: 'none' }) : null;
      const zeige = frac => {
        const a0 = -Math.PI / 2, a1 = a0 + theta * frac;
        const p0 = [scx + R * Math.cos(a0), scy + R * Math.sin(a0)];
        const p1 = [scx + R * Math.cos(a1), scy + R * Math.sin(a1)];
        const large = theta * frac > Math.PI ? 1 : 0;
        sektor.setAttribute('d', `M${scx},${scy} L${p0[0]},${p0[1]} A${R},${R} 0 ${large} 1 ${p1[0]},${p1[1]} Z`);
        const M = 3.14 * r * s, Kr = 3.14 * r * r;
        if (st === 'A') info.innerHTML = frac >= .98 ? `Mantel = π·r·s = 3,14·3·5 = <b>${fmt(M)} cm²</b>` : `Mantel abrollen → Kreissektor (Radius s)`;
        else if (st === 'B') info.innerHTML = frac >= .98 ? `O = π·r² + π·r·s = ${fmt(Kr)} + ${fmt(M)} = <b>${fmt(Math.round((Kr + M) * 100) / 100)} cm²</b>` : `Mantel + Grundkreis …`;
        else info.innerHTML = frac >= .98 ? `s = √(r²+h²) zuerst, dann O = π·r·(r+s) = <b>${fmt(Math.round((Kr + M) * 100) / 100)} cm²</b>` : `erst s mit Pythagoras …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 9 · Die Kugel (SK-10) */
  register({
    id: 'kugel', titel: 'Die Kugel: O und V', bezug: 'SK-10',
    kurz: 'A: O = 4·π·r² · B: V = 4/3·π·r³ · C: in Sachaufgaben (aus d, Liter).',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 190, 'Kugel mit Radius r');
      const cx = 150, cy = 95, r = 68;
      mkKugel(svg, cx, cy, r, K);
      const rad = line(cx, cy, cx + r, cy, { farbe: FARBE.korr, sw: 2 }); svg.appendChild(rad);
      svg.appendChild(txt(cx + r / 2, cy - 6, 'r', { farbe: FARBE.korr, weight: 700 }));
      const loop = Loop(t => { const puls = 0.28 + 0.12 * osz(t, 2.5); svg.querySelector('circle').setAttribute('fill-opacity', puls); });
      info.innerHTML = st === 'A'
        ? `O = 4·π·r² = 4·3,14·5² = <b>314 cm²</b>`
        : (st === 'B' ? `V = 4/3·π·r³ = (4·3,14·3³):3 ≈ <b>113,04 cm³</b>` : `r = d:2 zuerst; in dm rechnen → dm³ = <b>Liter</b>`);
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 10 · Zusammengesetzte Spitzkörper (SK-11) */
  register({
    id: 'zusammensk', titel: 'Zusammengesetzte Körper', bezug: 'SK-11',
    kurz: 'A: Eistüte = Kegel + Halbkugel (zerlegen) · B: Silo = Zylinder + Kegel (addieren) · C: mehrschrittig.',
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 220, 'Zusammengesetzter Körper');

      if (st === 'A' || st === 'C') {
        // Eistüte: Kegel (Spitze unten) + Halbkugel oben
        const cx = 150, topY = 90, rx = 40, apex = 200;
        const zeige = frac => {
          svg.innerHTML = '';
          // Waffel (Kegel nach unten)
          svg.appendChild(el('path', { d: `M${cx - rx},${topY} L${cx},${apex} L${cx + rx},${topY}`, fill: K, 'fill-opacity': .3, stroke: FARBE.ink, 'stroke-width': 1.5 }));
          svg.appendChild(el('ellipse', { cx, cy: topY, rx, ry: 12, fill: K, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.4 }));
          // Halbkugel, hebt ab
          const lift = 60 * frac;
          svg.appendChild(el('path', { d: `M${cx - rx},${topY - lift} A${rx},${rx} 0 0 1 ${cx + rx},${topY - lift} Z`, fill: FARBE.c, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.5 }));
          info.innerHTML = frac >= .5
            ? (st === 'A' ? `Eistüte = <b>Kegel + Halbkugel</b> — beide Volumen einzeln, dann addieren` : `mehrschrittig: erst h/s, dann Kegel + Halbkugel, dann addieren`)
            : `in Grundkörper zerlegen …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t => zeige(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // B: Silo = Zylinder + Kegeldach
      const cx = 150, topY = 90, rx = 46, ry = 14, hh = 90;
      const zeige = frac => {
        svg.innerHTML = '';
        mkZyl(svg, cx, topY, rx, hh, ry, K);
        const lift = 46 * frac;
        svg.appendChild(el('path', { d: `M${cx - rx},${topY - lift} L${cx},${topY - 46 - lift} L${cx + rx},${topY - lift} Z`, fill: FARBE.c, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.5 }));
        info.innerHTML = frac >= .5 ? `Silo: V = <b>Zylinder + Kegel</b> = 62,8 + 6,28 = <b>69,08 m³</b>` : `Dach abheben → Teile erkennen …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();
