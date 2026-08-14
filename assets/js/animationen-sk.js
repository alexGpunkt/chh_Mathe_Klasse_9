/* ============================================================
   animationen-sk.js · Spitzkörper
   Zehn Animationen zu SK-01 bis SK-11: Pyramide, Kegel, Kugel.
   Schrägbild-Spitzkörper mit animierbaren Teilen.
   Setzt animationen-kern.js voraus (auch für die Schrägbild-Helfer).
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern, GE = window.ANIM._geo;
  const { Loop, steuerleiste, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;
  const { svgb, txt } = GE;

  function poly(pts, o) { o = o || {}; return el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: o.fill || 'none', 'fill-opacity': o.fo != null ? o.fo : 1, stroke: o.stroke || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-linejoin': 'round', 'stroke-dasharray': o.dash || '' }); }
  function line(x1, y1, x2, y2, o) { o = o || {}; return el('line', { x1, y1, x2, y2, stroke: o.farbe || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-dasharray': o.dash || '', 'stroke-opacity': o.op != null ? o.op : 1 }); }

  /* Schrägbild-Pyramide (quadratische Grundfläche als Raute).
     `setzen(H)` zieht nur die vier Kanten nach — beim Wachsen muss deshalb
     nicht das ganze Bild neu entstehen. */
  function mkPyramide(parent, cx, cyB, bw, bd, H, K) {
    const F = [cx, cyB + bd], R = [cx + bw, cyB], Ba = [cx, cyB - bd], L = [cx - bw, cyB], C = [cx, cyB];
    parent.appendChild(poly([F, R, Ba, L], { fill: K, fo: .22, stroke: FARBE.ink, sw: 1.3 }));
    const kanten = [
      line(cx, cyB - H, Ba[0], Ba[1], { dash: '4 3', op: .5 }),   // hintere Kanten
      line(cx, cyB - H, L[0], L[1], { dash: '4 3', op: .5 }),
      line(cx, cyB - H, F[0], F[1]),                              // vordere Kanten
      line(cx, cyB - H, R[0], R[1])
    ];
    kanten.forEach(k => parent.appendChild(k));
    const obj = {
      F, R, Ba, L, C, S: [cx, cyB - H],
      mFR: [(F[0] + R[0]) / 2, (F[1] + R[1]) / 2],
      setzen(hneu) {
        obj.S = [cx, cyB - hneu];
        kanten.forEach(k => { k.setAttribute('x1', cx); k.setAttribute('y1', cyB - hneu); });
      }
    };
    return obj;
  }
  /* Schrägbild-Kegel — ebenfalls mit `setzen(H)`. */
  function mkKegel(parent, cx, cyB, rx, ry, H, K, opt) {
    opt = opt || {};
    const Lp = [cx - rx, cyB], Rp = [cx + rx, cyB], C = [cx, cyB];
    const flaeche = opt.fill !== false
      ? el('path', { d: `M${Lp[0]},${Lp[1]} L${cx},${cyB - H} L${Rp[0]},${Rp[1]}`, fill: K, 'fill-opacity': .3, stroke: 'none' })
      : null;
    if (flaeche) parent.appendChild(flaeche);
    parent.appendChild(el('ellipse', { cx, cy: cyB, rx, ry, fill: K, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.4 }));
    const links = line(Lp[0], Lp[1], cx, cyB - H);
    const rechts = line(Rp[0], Rp[1], cx, cyB - H);
    parent.appendChild(links); parent.appendChild(rechts);
    const obj = {
      Lp, Rp, C, S: [cx, cyB - H],
      setzen(hneu) {
        obj.S = [cx, cyB - hneu];
        if (flaeche) flaeche.setAttribute('d', `M${Lp[0]},${Lp[1]} L${cx},${cyB - hneu} L${Rp[0]},${Rp[1]}`);
        [links, rechts].forEach(l => { l.setAttribute('x2', cx); l.setAttribute('y2', cyB - hneu); });
      }
    };
    return obj;
  }
  function mkKugel(parent, cx, cy, r, K) {
    const kreis = el('circle', { cx, cy, r, fill: K, 'fill-opacity': .28, stroke: FARBE.ink, 'stroke-width': 1.5 });
    const aequator = el('ellipse', { cx, cy, rx: r, ry: r * 0.32, fill: 'none', stroke: FARBE.ink, 'stroke-width': 1, 'stroke-dasharray': '3 3', 'stroke-opacity': .6 });
    parent.appendChild(kreis); parent.appendChild(aequator);
    return {
      C: [cx, cy], r,
      setzen(rn) {
        kreis.setAttribute('r', rn);
        aequator.setAttribute('rx', rn); aequator.setAttribute('ry', rn * 0.32);
      }
    };
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
    text: {
      A: ['Die Spitze ist der oberste Punkt.', 'Die Grundfläche liegt unten, eine ihrer Seiten ist die Grundkante a.', 'Die Höhe h geht senkrecht von der Spitze zur Mitte.'],
      B: ['Die Höhe h steht innen senkrecht.', 'Die Seitenhöhe s liegt außen auf der Fläche.', 's ist immer länger als h.'],
      C: ['Eine n-Eck-Pyramide hat n Seitendreiecke.', 'Zusammen mit der Grundfläche sind das n + 1 Flächen.']
    },
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
    text: {
      A: ['Höhe h, halbe Grundkante a : 2 und Seitenhöhe s bilden ein rechtwinkliges Dreieck.', 'Der rechte Winkel liegt zwischen h und a : 2.', 's ist die Hypotenuse.'],
      B: ['s = √(h² + (a:2)²) = √(16 + 9) = 5 cm.'],
      C: ['Rückwärts: h = √(s² − (a:2)²) = √(169 − 25) = 12 cm.']
    },
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
      host.appendChild(svg); host.appendChild(info);
      return { play() {}, pause() {}, reset() {}, toggle() {}, get running() { return false; } };
    }
  });

  /* 3 · Volumen der Pyramide (SK-03) */
  register({
    id: 'volpyr', titel: 'Pyramidenvolumen: ⅓ · G · h', bezug: 'SK-03',
    kurz: 'A: V = ⅓·G·h · B: quadratische Grundfläche · C: 3 Pyramiden füllen 1 Prisma.',
    text: {
      A: ['Drei gleiche Pyramiden füllen genau ein Prisma.', 'Deshalb ist V = (G · h) : 3 = (30 · 6) : 3 = 60 cm³.'],
      B: ['Bei quadratischer Grundfläche ist G = a² = 36.', 'V = (36 · 10) : 3 = 120 cm³.'],
      C: ['Prisma: 24 · 9 = 216 cm³.', 'Pyramide: 216 : 3 = 72 cm³ — genau ein Drittel.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      /* Bisher bekam ausgerechnet die Basisstufe nur ein Standbild mit der
         Formel, während die Vertiefung das Einfüllen zeigte. Der Faktor ⅓
         ist aber genau das, was man sehen muss — also läuft die Füllung
         jetzt auf allen drei Stufen, und nur der Rechenweg unterscheidet
         sich. */
      const svg = svgb(o.breite || 300, 215, 'Drei Pyramiden füllen ein Prisma gleicher Grundfläche und Höhe');
      const t = GE.boxTeile(90, 62, 120, 120, 46, 46);
      const clipId = 'pc' + Math.random().toString(36).slice(2, 6);
      const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('path', { d: t.front })); defs.appendChild(cp); svg.appendChild(defs);
      GE.zeichneBox(svg, t, '#C8D2D8');
      const fuell = el('rect', { x: 90, y: 182, width: 120, height: 0, fill: K, 'fill-opacity': .5, 'clip-path': `url(#${clipId})` });
      svg.appendChild(fuell);
      svg.appendChild(txt(150, 205, 'Prisma: gleiche Grundfläche G, gleiche Höhe h', { size: 9, farbe: FARBE.weich }));
      const fertig = {
        A: `3 Pyramiden füllen 1 Prisma → V = (30 · 6) : 3 = <b>60 cm³</b>`,
        B: `G = a² = 6² = 36 → V = (36 · 10) : 3 = <b>120 cm³</b>`,
        C: `Prisma 24 · 9 = 216 cm³ · Pyramide 216 : 3 = <b>72 cm³</b>`
      };
      const zeige = frac => {
        const f = Math.min(1, frac);
        const hpx = 120 * f; fuell.setAttribute('y', 62 + 120 - hpx); fuell.setAttribute('height', hpx);
        info.innerHTML = f >= .99 ? (fertig[st] || fertig.A) : `Pyramide ${Math.min(3, Math.ceil(f * 3) || 1)} von 3 wird eingefüllt …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t2 => zeige(osz(t2, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 4 · Oberfläche der Pyramide (SK-04) */
  register({
    id: 'obpyr', titel: 'Pyramiden-Oberfläche: Netz', bezug: 'SK-04',
    kurz: 'A: ein Seitendreieck (a·s):2 · B: O = a² + 4 Dreiecke · C: erst s mit Pythagoras.',
    text: {
      A: ['Jedes Seitendreieck hat die Fläche (a · s) : 2 = 15 cm².', 'Alle vier sind gleich groß.'],
      B: ['O = Grundfläche + 4 Dreiecke = a² + 2 · a · s.', 'O = 36 + 60 = 96 cm².'],
      C: ['Fehlt s, wird es zuerst mit Pythagoras berechnet: s = 5.', 'Dann O = 96 cm².']
    },
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
      /* Auf Stufe A geht es um EIN Seitendreieck. Vorher leuchteten sie
         nacheinander alle vier auf, während der Text von einem sprach —
         jetzt ist immer genau eines hervorgehoben, reihum. */
      const zeige = n => {
        if (st === 'A') {
          const k = (n - 1) % 4;
          dreiEls.forEach((e, i) => e.setAttribute('fill-opacity', i === k ? .55 : .12));
          info.innerHTML = `ein Seitendreieck: (a · s) : 2 = (6 · 5) : 2 = <b>15 cm²</b> — alle vier sind gleich groß`;
          return;
        }
        dreiEls.forEach((e, i) => e.setAttribute('fill-opacity', i < n ? .5 : .12));
        if (st === 'B') info.innerHTML = n >= 4 ? `O = a² + 2·a·s = 36 + 60 = <b>96 cm²</b>` : `Grundfläche + ${n} von 4 Dreiecken …`;
        else info.innerHTML = n >= 4 ? `s = √(h²+(a:2)²) = 5 → O = a² + 2·a·s = <b>96 cm²</b>` : `erst s = √(4²+3²) = 5 …`;
      };
      zeige(REDUCED ? 4 : 1);
      const loop = Loop(t => zeige(1 + Math.floor((t % 5) / 1)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 5 · Rückwärts & gemischt (SK-05 / SK-09)
     SK-05 rechnet an der Pyramide, SK-09 am Kegel — deshalb "form".
     Ohne Angabe bleibt es bei der Pyramide. */
  register({
    id: 'rueckwaerts', titel: 'Rückwärts & gemischt', bezug: 'SK-05',
    kurz: 'A: Volumen oder Oberfläche? · B: fehlende Höhe aus dem Volumen · C: mehrschrittig.',
    text: {
      A: ['„Wie viel passt hinein?" fragt nach dem Volumen — der Körper füllt sich.', '„Wie viel Material?" fragt nach der Oberfläche — nur die Außenhaut zählt.'],
      B: ['Aus dem Volumen lässt sich die Höhe zurückrechnen.', 'Pyramide: h = 3 · V : a². Kegel: h = 3 · V : (π · r²).'],
      C: ['Mehrschrittig: erst die fehlende Größe, dann die gesuchte.', 'Zwischenergebnisse mit Einheit notieren.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const form = (o && o.form) === 'kegel' ? 'kegel' : 'pyramide';
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 200, form === 'kegel' ? 'Kegel' : 'Pyramide');

      if (st === 'A') {
        /* Vorher wechselte nur der Text, das Bild stand still. Jetzt zeigt
           Phase 1 den Rauminhalt (der Körper füllt sich) und Phase 2 die
           Außenhaut (die Umrisslinie wird nachgezogen) — die Unterscheidung,
           um die es auf dieser Stufe überhaupt geht. */
        const cx = 150, cyB = 155, H = 108, rx = 64, ry = 20;
        const silhouette = () => form === 'kegel'
          ? `M${cx - rx},${cyB} L${cx},${cyB - H} L${cx + rx},${cyB} A${rx},${ry} 0 0 1 ${cx - rx},${cyB} Z`
          : `M${cx},${cyB - H} L${cx - rx},${cyB} L${cx},${cyB + ry} L${cx + rx},${cyB} Z`;
        /* Körper und Umriss stehen fest — je Bild ändern sich nur die Höhe
           der Füllung und die Länge der nachgezogenen Linie. */
        const clipId = 'rw' + Math.random().toString(36).slice(2, 6);
        const defs = el('defs'); const cp = el('clipPath', { id: clipId });
        cp.appendChild(el('path', { d: silhouette() })); defs.appendChild(cp); svg.appendChild(defs);
        if (form === 'kegel') mkKegel(svg, cx, cyB, rx, ry, H, K);
        else mkPyramide(svg, cx, cyB, rx, ry, H, K);
        const fuellung = el('rect', { x: cx - rx - 2, y: cyB + ry, width: rx * 2 + 4, height: 0.001, fill: FARBE.korr, 'fill-opacity': .35, 'clip-path': `url(#${clipId})` });
        const umriss = el('path', { d: silhouette(), fill: 'none', stroke: FARBE.korr, 'stroke-width': 3.5, 'stroke-dasharray': '600', 'stroke-dashoffset': '600' });
        svg.appendChild(fuellung); svg.appendChild(umriss);
        const zeichne = (k, frac) => {
          if (k === 0) {
            const hpx = (H + ry) * frac;
            fuellung.style.display = ''; umriss.style.display = 'none';
            fuellung.setAttribute('y', cyB + ry - hpx);
            fuellung.setAttribute('height', Math.max(0.001, hpx));
            info.innerHTML = `„Wie viel passt hinein?“ → Rauminhalt → <b>Volumen</b>`;
          } else {
            fuellung.style.display = 'none'; umriss.style.display = '';
            umriss.setAttribute('stroke-dashoffset', String(600 * (1 - frac)));
            info.innerHTML = `„Wie viel Material?“ → Außenhaut → <b>Oberfläche</b>`;
          }
        };
        zeichne(0, REDUCED ? 1 : 0);
        const loop = Loop(t => { const per = 3.6, k = Math.floor(t / per) % 2; zeichne(k, Math.min(1, (t % per) / per * 1.4)); });
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      // B/C: Höhe wächst, bis V den Zielwert erreicht
      //   Pyramide: V = (a²·h):3, a = 5, Ziel 100 cm³ → h = 12
      //   Kegel:    V = (π·r²·h):3, r = 3, Ziel 94,2 cm³ → h = 10
      const kegel = form === 'kegel';
      const grund = kegel ? 3.14 * 9 : 25;                 // Grundfläche
      const Vziel = kegel ? 94.2 : 100;
      const hziel = 3 * Vziel / grund;
      const koerper = kegel
        ? mkKegel(svg, 150, 168, 58, 16, 11, K)
        : mkPyramide(svg, 150, 168, 60, 22, 11, K);
      const zeige = frac => {
        const hakt = 1 + (hziel - 1) * frac; const Hpx = 11 * hakt;
        koerper.setzen(Hpx);
        const Vakt = grund * hakt / 3;
        const fertigB = kegel
          ? `h = 3·V : (π·r²) = 3·94,2 : 28,26 = <b>10 cm</b>`
          : `h = 3·V : a² = 3·100 : 25 = <b>12 cm</b>`;
        const fertigC = kegel
          ? `erst r = d:2 = 3, dann h = √(s²−r²) = 4, dann V ≈ 37,7 cm³`
          : `erst h = 3·V : a² = 12, dann s = √(12² + 2,5²) …`;
        info.innerHTML = st === 'B'
          ? (frac >= .98 ? fertigB : `Volumen ${fmt(Math.round(Vakt))} / ${fmt(Vziel)} cm³`)
          : (frac >= .98 ? fertigC : `mehrschrittig: erst die fehlende Größe …`);
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();

/* ---------- SK-Konzepte 6–10 ---------- */
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
    text: {
      A: ['Der Radius r geht von der Kreismitte zum Rand.', 'Die Höhe h steht senkrecht auf der Mitte.', 'Die Mantellinie s ist die Hypotenuse zwischen r und h.'],
      B: ['s = √(r² + h²) = √(9 + 16) = 5 cm.'],
      C: ['Rückwärts: h = √(s² − r²) = √(169 − 25) = 12 cm.']
    },
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
    text: {
      A: ['Drei Kegel füllen genau einen Zylinder.', 'V = (3,14 · 25 · 10) : 3 ≈ 261,7 cm³.'],
      B: ['Steht nur d da, halbiere zuerst: r = 3.', 'V = (3,14 · 9 · 7) : 3 ≈ 65,9 cm³.'],
      C: ['Zylinder: 37,68 dm³. Kegel: ein Drittel davon.', 'V = 12,56 dm³ = 12,56 l.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');

      /* Wie bei der Pyramide: das Einfüllen zeigt den Faktor ⅓ und gehört
         deshalb auf jede Stufe, nicht nur in die Vertiefung. */
      const svg = svgb(o.breite || 300, 215, 'Drei Kegel füllen einen Zylinder gleicher Grundfläche und Höhe');
      const cx = 150, topY = 32, rx = 60, ry = 16, hh = 148;
      mkZyl(svg, cx, topY, rx, hh, ry, '#C8D2D8');
      const clipId = 'kc' + Math.random().toString(36).slice(2, 6);
      const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('rect', { x: cx - rx, y: topY, width: rx * 2, height: hh })); defs.appendChild(cp); svg.appendChild(defs);
      const fuellG = el('g', { 'clip-path': `url(#${clipId})` }); svg.appendChild(fuellG);
      svg.appendChild(txt(cx, 205, 'Zylinder: gleicher Grundkreis, gleiche Höhe', { size: 9, farbe: FARBE.weich }));
      const fertig = {
        A: `3 Kegel füllen 1 Zylinder → V = (3,14·5²·10) : 3 ≈ <b>261,7 cm³</b>`,
        B: `r = d : 2 = 6 : 2 = 3 → V = (3,14·3²·7) : 3 ≈ <b>65,9 cm³</b>`,
        C: `Zylinder 37,68 dm³ · Kegel 37,68 : 3 = <b>12,56 dm³ = 12,56 l</b>`
      };
      /* Füllstand und Spiegel einmal anlegen, danach nur nachziehen. */
      const fuellFlaeche = el('rect', { x: cx - rx, y: topY + hh, width: rx * 2, height: 0.001, fill: K, 'fill-opacity': .45 });
      const fuellSpiegel = el('ellipse', { cx, cy: topY + hh, rx, ry, fill: K, 'fill-opacity': .7 });
      fuellG.appendChild(fuellFlaeche); fuellG.appendChild(fuellSpiegel);
      const zeige = frac => {
        const hpx = hh * frac;
        fuellFlaeche.setAttribute('y', topY + hh - hpx);
        fuellFlaeche.setAttribute('height', Math.max(0.001, hpx));
        fuellSpiegel.setAttribute('cy', topY + hh - hpx);
        fuellSpiegel.style.display = hpx > 4 ? '' : 'none';
        info.innerHTML = frac >= .99 ? (fertig[st] || fertig.A) : `Kegel ${Math.min(3, Math.ceil(frac * 3) || 1)} von 3 wird eingefüllt …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 8 · Oberfläche des Kegels: Mantel als Sektor (SK-08) */
  register({
    id: 'obkegel', titel: 'Kegel-Oberfläche: Mantel als Sektor', bezug: 'SK-08',
    kurz: 'A: Mantel = π·r·s (abwickeln) · B: O = Grundkreis + Mantel · C: erst s mit Pythagoras.',
    text: {
      A: ['Der Mantel wird zu einem Kreisausschnitt abgerollt.', 'Sein Radius ist die Mantellinie s.', 'Mantel = π · r · s = 3,14 · 3 · 5 = 47,1 cm².'],
      B: ['Zur Oberfläche kommt der Grundkreis dazu.', 'O = 28,26 + 47,1 = 75,36 cm².'],
      C: ['Fehlt s, zuerst mit Pythagoras berechnen.', 'Dann O = π · r · (r + s) = 75,36 cm².']
    },
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
    text: {
      A: ['Wächst der Radius, wächst die Oberfläche schneller als er selbst.', 'O = 4 · π · r² = 4 · 3,14 · 25 = 314 cm².'],
      B: ['Beim Volumen kommt r dreimal vor.', 'V = (4 · π · r³) : 3 = 113,04 cm³.'],
      C: ['Erst r = d : 2 bestimmen.', 'In dm gerechnet ergibt dm³ direkt Liter: rund 33,5 l.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 190, 'Kugel mit wachsendem Radius r');
      const cx = 150, cy = 95, RPX = 68;
      /* Statt eines sinnlosen Aufleuchtens wächst der Radius: so wird
         sichtbar, dass die Oberfläche mit r² und das Volumen mit r³
         zunimmt — und die Beschriftung nennt denselben Radius wie die
         Lernkarte der jeweiligen Stufe. */
      const rZ = st === 'A' ? 5 : (st === 'B' ? 3 : 2);   // cm bzw. dm
      const einh = st === 'C' ? 'dm' : 'cm';
      const kugel = mkKugel(svg, cx, cy, RPX, K);
      const radius = line(cx, cy, cx + RPX, cy, { farbe: FARBE.korr, sw: 2 });
      const rMarke = txt(cx + RPX / 2, cy - 6, 'r', { farbe: FARBE.korr, weight: 700 });
      const rWert = txt(cx, cy + RPX + 22, '', { size: 11, farbe: FARBE.korr, weight: 700 });
      svg.appendChild(radius); svg.appendChild(rMarke); svg.appendChild(rWert);
      const zeige = frac => {
        const rr = Math.max(rZ * 0.12, rZ * frac), px = RPX * rr / rZ;
        kugel.setzen(px);
        radius.setAttribute('x2', cx + px);
        rMarke.setAttribute('x', cx + px / 2);
        rWert.textContent = 'r = ' + fmt(Math.round(rr * 10) / 10) + ' ' + einh;
        const O = 4 * 3.14 * rr * rr, V = 4 * 3.14 * rr * rr * rr / 3;
        if (st === 'A') info.innerHTML = `O = 4·π·r² = 4·3,14·${fmt(Math.round(rr * 10) / 10)}² = <b>${fmt(Math.round(O * 10) / 10)} cm²</b>`;
        else if (st === 'B') info.innerHTML = `V = (4·π·r³):3 = <b>${fmt(Math.round(V * 100) / 100)} cm³</b>`;
        else info.innerHTML = `r = d:2 = 2 dm → V = <b>${fmt(Math.round(V * 10) / 10)} dm³ = ${fmt(Math.round(V * 10) / 10)} l</b>`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 10 · Zusammengesetzte Spitzkörper (SK-11) */
  register({
    id: 'zusammensk', titel: 'Zusammengesetzte Körper', bezug: 'SK-11',
    kurz: 'A: Eistüte = Kegel + Halbkugel (zerlegen) · B: Silo = Zylinder + Kegel (addieren) · C: mehrschrittig.',
    text: {
      A: ['Die Eistüte besteht aus einem Kegel und einer Halbkugel.', 'Beide Volumen einzeln berechnen, dann addieren.'],
      B: ['Kegel 75,36 cm³ plus Halbkugel 56,52 cm³.', 'Zusammen 131,88 cm³.'],
      C: ['Das Silo besteht aus Zylinder und Kegeldach.', 'V = 62,8 + 6,28 = 69,08 m³.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 220, 'Zusammengesetzter Körper');

      /* Zuordnung nach den Lernkarten: A und B sind die Eistüte (zerlegen,
         dann addieren), C ist das Silo aus der Vertiefungskarte. Vorher
         zeigte B das Silo, während die Karte die Eistüte rechnete. */
      if (st === 'A' || st === 'B') {
        // Eistüte: Kegel (Spitze unten) + Halbkugel oben — r = 3 cm, h = 8 cm
        const cx = 150, topY = 100, rx = 40, apex = 205;
        // Waffel (Kegel nach unten) — steht fest
        svg.appendChild(el('path', { d: `M${cx - rx},${topY} L${cx},${apex} L${cx + rx},${topY}`, fill: K, 'fill-opacity': .3, stroke: FARBE.ink, 'stroke-width': 1.5 }));
        svg.appendChild(el('ellipse', { cx, cy: topY, rx, ry: 12, fill: K, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.4 }));
        const haube = el('path', { fill: FARBE.c, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.5 });
        svg.appendChild(haube);
        svg.appendChild(txt(cx + rx + 8, topY + 40, 'h = 8 cm', { anchor: 'start', size: 10, farbe: FARBE.weich }));
        svg.appendChild(txt(cx + rx + 8, topY - 4, 'r = 3 cm', { anchor: 'start', size: 10, farbe: FARBE.weich }));
        const zeige = frac => {
          // Halbkugel, hebt ab
          const lift = 55 * frac;
          haube.setAttribute('d', `M${cx - rx},${topY - lift} A${rx},${rx} 0 0 1 ${cx + rx},${topY - lift} Z`);
          info.innerHTML = frac < .5 ? `in Grundkörper zerlegen …`
            : (st === 'A'
              ? `Eistüte = <b>Kegel + Halbkugel</b> — beide Volumen einzeln, dann addieren`
              : `Kegel 75,36 cm³ + Halbkugel 56,52 cm³ = <b>131,88 cm³</b>`);
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t => zeige(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // C: Silo = Zylinder + Kegeldach (r = 2 m, h = 5 m, Dach h = 1,5 m)
      const cx = 150, topY = 100, rx = 46, ry = 14, hh = 90;
      mkZyl(svg, cx, topY, rx, hh, ry, K);
      const dach = el('path', { fill: FARBE.c, 'fill-opacity': .4, stroke: FARBE.ink, 'stroke-width': 1.5 });
      svg.appendChild(dach);
      svg.appendChild(txt(cx + rx + 8, topY + hh / 2, 'h = 5 m', { anchor: 'start', size: 10, farbe: FARBE.weich }));
      const dachMass = txt(cx + rx + 8, topY - 14, 'Dach h = 1,5 m', { anchor: 'start', size: 10, farbe: FARBE.weich });
      svg.appendChild(dachMass);
      svg.appendChild(txt(cx, topY + hh + 24, 'r = 2 m', { size: 10, farbe: FARBE.weich }));
      const zeige = frac => {
        const lift = 46 * frac;
        dach.setAttribute('d', `M${cx - rx},${topY - lift} L${cx},${topY - 46 - lift} L${cx + rx},${topY - lift} Z`);
        dachMass.setAttribute('y', topY - lift - 14);
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
