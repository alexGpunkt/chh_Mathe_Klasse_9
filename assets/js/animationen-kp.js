/* ============================================================
   animationen-kp.js · Würfel, Quader, Prisma, Zylinder
   Zehn Animationen zu KP-01 bis KP-11.
   Setzt animationen-kern.js voraus (auch für die Schrägbild-Helfer).
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Loop, steuerleiste, regler, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;
  const { svgb, pfad, txt, boxTeile, zeichneBox, setzeBox } = window.ANIM._geo;


  /* 1 · Körper erkennen: Flächen, Kanten, Ecken (KP-01) */
  register({
    id: 'koerper', titel: 'Körper: Flächen, Kanten, Ecken', bezug: 'KP-01',
    kurz: 'A: zählen (6/12/8) · B: Grundfläche, Mantel, Netz · C: n-Eck-Prisma (n+2, 3n, 2n).',
    text: {
      A: ['Der Würfel hat 6 Flächen.', 'Er hat 12 Kanten: 4 oben, 4 unten, 4 senkrecht.', 'Er hat 8 Ecken: 4 oben, 4 unten.'],
      B: ['Die Grundfläche liegt unten und gibt dem Körper den Namen.', 'Der Mantel sind alle Seitenflächen zusammen.', 'Oben liegt die Deckfläche, so groß wie die Grundfläche.'],
      C: ['Bei einem n-Eck-Prisma gilt: n + 2 Flächen, 3n Kanten, 2n Ecken.', 'Für n = 4 sind das 6 Flächen, 12 Kanten und 8 Ecken.']
    },
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
    text: {
      A: ['Ein Würfel mit 1 dm Kante fasst genau 1 Liter.', '1 dm³ = 1 l.'],
      B: ['Teilt man jede Seite in 10, entstehen 10 · 10 = 100 Kästchen.', 'Bei Flächen gilt der Faktor 100, bei Volumen 1000.'],
      C: ['1 m³ = 1000 dm³ = 1000 l.', '250 cm³ = 250 : 1000 = 0,25 l.']
    },
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
        /* Die neun Teilungslinien je Richtung werden einmal angelegt und
           danach nur ein- und ausgeblendet. */
        const grid = el('g'); svg.appendChild(grid);
        const paare = [];
        for (let i = 1; i <= 9; i++) {
          const p = X0 + S * i / 10;
          const senk = el('line', { x1: p, y1: Y0, x2: p, y2: Y0 + S, stroke: FARBE.ink, 'stroke-width': .6, 'stroke-opacity': .5 });
          const waag = el('line', { x1: X0, y1: Y0 + S * i / 10, x2: X0 + S, y2: Y0 + S * i / 10, stroke: FARBE.ink, 'stroke-width': .6, 'stroke-opacity': .5 });
          grid.appendChild(senk); grid.appendChild(waag); paare.push([senk, waag]);
        }
        const zeige = frac => {
          const linien = Math.round(9 * frac);
          paare.forEach(([a, b], i) => { const an = i < linien ? '' : 'none'; a.style.display = an; b.style.display = an; });
          const felder = Math.pow(Math.min(10, linien + 1), 2);
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
    text: {
      A: ['Das Netz des Würfels besteht aus 6 gleichen Quadraten.', 'O = 6 · a² = 6 · 25 = 150 cm².'],
      B: ['Das Quadernetz hat 6 Flächen in 3 Paaren.', 'O = 2 · (a·b + a·c + b·c) = 2 · (12 + 8 + 6) = 52 cm².'],
      C: ['Vor dem Rechnen alle Längen in dieselbe Einheit bringen.', 'Dann wie gewohnt die sechs Flächen addieren.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 210, 'Netz');
      /* Kreuznetz. Mittlere Reihe (Höhe c): links · vorne · rechts · hinten,
         darüber der Deckel, darunter der Boden — beide a·b. So liegen die
         sechs Flächen überschneidungsfrei nebeneinander und die Summe der
         gezeigten Rechtecke ist wirklich die Oberfläche. */
      const a = 4, b = 3, c = 2; // Quader; Würfel nutzt a = b = c = 5
      const wA = 5;
      const felder = st === 'A'
        ? [{ x: 1, y: 0, w: 1, hh: 1, l: 'a²' }, { x: 0, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 1, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 2, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 3, y: 1, w: 1, hh: 1, l: 'a²' }, { x: 1, y: 2, w: 1, hh: 1, l: 'a²' }]
        : [{ x: b, y: 0, w: a, hh: b, l: 'a·b' },
           { x: 0, y: b, w: b, hh: c, l: 'b·c' },
           { x: b, y: b, w: a, hh: c, l: 'a·c' },
           { x: b + a, y: b, w: b, hh: c, l: 'b·c' },
           { x: 2 * b + a, y: b, w: a, hh: c, l: 'a·c' },
           { x: b, y: b + c, w: a, hh: b, l: 'a·b' }];
      // Für die Darstellung normieren wir auf eine Zellgröße
      const U = st === 'A' ? 40 : 19, OX = st === 'A' ? 70 : 18, OY = st === 'A' ? 40 : 30;
      const rects = felder.map(f => { const r = el('rect', { x: OX + f.x * U, y: OY + f.y * U, width: f.w * U, height: f.hh * U, fill: K, 'fill-opacity': .12, stroke: FARBE.ink, 'stroke-width': 1.2 }); svg.appendChild(r); return r; });
      const oben = el('g'); svg.appendChild(oben);
      const werte = st === 'A' ? felder.map(() => wA * wA) : [a * b, b * c, a * c, b * c, a * c, a * b];
      const ges = werte.reduce((x, y) => x + y, 0);
      /* Beschriftungen einmal anlegen, danach nur ein- und ausblenden. */
      const marken = felder.map(f => {
        const e = txt(OX + (f.x + f.w / 2) * U, OY + (f.y + f.hh / 2) * U + 4, f.l, { size: st === 'A' ? 12 : 10, farbe: FARBE.weich });
        oben.appendChild(e); return e;
      });
      const zeige = n => {
        let summe = 0;
        rects.forEach((r, i) => {
          const an = i < n; r.setAttribute('fill-opacity', an ? .5 : .12);
          marken[i].style.display = an ? '' : 'none';
          if (an) summe += werte[i];
        });
        info.innerHTML = st === 'A'
          ? (n >= 6 ? `O = 6 · a² = 6 · ${wA}² = <b>${ges} cm²</b>` : `Fläche ${n} von 6: je a² = ${wA * wA} cm² — Summe ${summe} cm²`)
          : (n >= 6 ? `O = 2·(a·b + a·c + b·c) = 2·(${a * b} + ${a * c} + ${b * c}) = <b>${ges} cm²</b>` : `Fläche ${n} von 6 — Summe ${summe} cm²`);
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
    text: {
      A: ['Der Würfel füllt sich Schicht für Schicht.', 'V = a · a · a = 3³ = 27 cm³.'],
      B: ['Jede Schicht ist die Grundfläche a · b.', 'V = a · b · c = 5 · 3 · 4 = 60 dm³, also 60 Liter.'],
      C: ['Bei gemischten Einheiten zuerst umrechnen.', 'In dm gerechnet ergibt dm³ direkt Liter.']
    },
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
    text: {
      A: ['Das Volumen wächst, bis es 60 cm³ erreicht.', 'c = V : (a · b) = 60 : 20 = 3 cm.'],
      B: ['Beim Würfel ist V = a³.', 'a ist die dritte Wurzel aus 64, also 4 cm.'],
      C: ['Aus O = 6 · a² = 96 folgt a² = 16.', 'Also ist a = 4 cm.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 200, 'Körper mit gesuchter Kante');

      if (st === 'A') {
        const V = 60, a = 5, bb = 4, cziel = V / (a * bb); // = 3
        const box = zeichneBox(svg, boxTeile(80, 140, 120, 30, 48, 48), K);
        const marke = txt(206, 155, 'c = ?', { anchor: 'start', farbe: FARBE.korr, weight: 700, size: 12 });
        svg.appendChild(marke);
        const zeige = frac => {
          const cakt = 1 + (cziel - 1) * frac; const ch = 30 + cakt * 26;
          setzeBox(box, boxTeile(80, 170 - ch, 120, ch, 48, 48));
          marke.setAttribute('y', 170 - ch / 2);
          const Vakt = a * bb * cakt;
          info.innerHTML = frac >= .99
            ? `c = V : (a·b) = 60 : (5·4) = <b>3 cm</b>` : `Volumen wächst: ${fmt(Math.round(Vakt))} / 60 cm³`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(tt => zeige(osz(tt, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // B/C: Würfel wächst, bis V bzw. O den Zielwert erreicht
      const ziel = st === 'B' ? { V: 64, a: 4, art: 'V' } : { O: 96, a: 4, art: 'O' };
      const box = zeichneBox(svg, boxTeile(110, 126, 24, 24, 12, 12), K);
      const zeige = frac => {
        const aakt = 1 + (ziel.a - 1) * frac; const s = 24 * aakt;
        setzeBox(box, boxTeile(110, 150 - s, s, s, s * .5, s * .5));
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

})();

/* ---------- KP-Konzepte 6–10 ---------- */
(function () {
  'use strict';
  const I = window.ANIM._intern, G = window.ANIM._geo;
  const { Loop, steuerleiste, abzeichen, register, FARBE, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED } = I;
  const { svgb, txt } = G;

  function poly(pts, o) { o = o || {}; return el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: o.fill || 'none', 'fill-opacity': o.fo != null ? o.fo : 1, stroke: o.stroke || FARBE.ink, 'stroke-width': o.sw || 1.5, 'stroke-linejoin': 'round' }); }
  /* Die hochgezogene Grundfläche: einmal anlegen, danach nur die Höhe
     nachziehen. Vorher entstand für jedes Einzelbild ein neues SVG. */
  function Extrusion(parent, basePts, K) {
    const g = el('g'); parent.appendChild(g);
    const basis = poly(basePts, { fill: K, fo: .5 });
    const kanten = basePts.map(() => el('line', { stroke: FARBE.ink, 'stroke-width': 1.2, 'stroke-opacity': .6 }));
    const deck = poly(basePts, { fill: K, fo: .34 });
    g.appendChild(basis); kanten.forEach(l => g.appendChild(l)); g.appendChild(deck);
    return {
      g,
      setzen(Hpx) {
        const top = basePts.map(p => [p[0], p[1] - Hpx]);
        deck.setAttribute('points', top.map(p => p.join(',')).join(' '));
        basePts.forEach((p, i) => {
          const l = kanten[i];
          l.setAttribute('x1', p[0]); l.setAttribute('y1', p[1]);
          l.setAttribute('x2', top[i][0]); l.setAttribute('y2', top[i][1]);
        });
      }
    };
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
    text: {
      A: ['Die Grundfläche wird nach oben gezogen.', 'V = G · h = 12 · 5 = 60 cm³.'],
      B: ['Bei einem Dreiecksprisma ist G die Dreiecksfläche.', 'V = G · h = 12 · 10 = 120 cm³.'],
      C: ['Auch eine zusammengesetzte Grundfläche wird zuerst berechnet.', 'V = 25 · 8 = 200 cm³.']
    },
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
      const koerper = Extrusion(svg, cfg.pts.map(p => p.slice()), K);
      const zeige = frac => {
        koerper.setzen(Hmax * frac);
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
    text: {
      A: ['Der Mantel wird abgerollt und wird ein Rechteck.', 'Mantel = Umfang · Höhe = 12 · 10 = 120 cm².'],
      B: ['Zur Oberfläche kommen beide Grundflächen dazu.', 'O = 2 · 6 + 120 = 132 cm².'],
      C: ['Fehlt eine Dreiecksseite, hilft der Satz des Pythagoras.', '√(3² + 4²) = 5, also Umfang 12.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 340, 210, 'Mantel eines Dreiecksprismas wird abgewickelt');
      const seiten = [3, 4, 5], U = seiten.reduce((a, b) => a + b, 0), hoehe = 10;
      const skala = 12;
      /* Dreiecksprisma links — steht fest und wird nur einmal gezeichnet. */
      const g = el('g'); svg.appendChild(g);
      const bpts = [[40, 60], [40, 106], [74, 83]];
      const oben = bpts.map(p => [p[0] + 40, p[1] - 8]);
      g.appendChild(poly(bpts, { fill: K, fo: .5 }));
      bpts.forEach((p, i) => g.appendChild(el('line', { x1: p[0], y1: p[1], x2: oben[i][0], y2: oben[i][1], stroke: FARBE.ink, 'stroke-width': 1, 'stroke-opacity': .5 })));
      g.appendChild(poly(oben, { fill: K, fo: .34 }));

      /* Der abgerollte Mantel: drei Rechtecke mit Beschriftung, einmal
         angelegt, danach wächst nur die Breite. */
      const strip = el('g'); svg.appendChild(strip);
      const x0 = 150, y0 = 70, hpx = hoehe * skala * 0.5;
      const teile = [];
      let xlauf = x0;
      seiten.forEach(s => {
        const w = s * skala;
        const r = el('rect', { x: xlauf, y: y0, width: 0.001, height: hpx, fill: K, 'fill-opacity': .3, stroke: FARBE.ink, 'stroke-width': 1 });
        const label = txt(xlauf + w / 2, y0 + hpx + 13, s + '', { size: 10, farbe: FARBE.weich });
        strip.appendChild(r); strip.appendChild(label);
        teile.push({ r, label, w, s }); xlauf += w;
      });
      const zeige = frac => {
        let gezeigt = U * frac, sum = 0;
        teile.forEach(t => {
          const anteil = Math.max(0, Math.min(t.w, (gezeigt - sum) * skala));
          t.r.setAttribute('width', Math.max(0.001, anteil));
          t.r.style.display = anteil > 0 ? '' : 'none';
          t.label.style.display = anteil >= t.w - 0.5 ? '' : 'none';
          sum += t.s;
        });
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
    text: {
      A: ['Der Zylinder füllt sich von unten.', 'V = π · r² · h = 3,14 · 25 · 10 = 785 cm³.'],
      B: ['Steht nur d da, halbiere zuerst: r = 8 : 2 = 4.', 'V = 3,14 · 16 · 12 = 603 cm³.'],
      C: ['In dm gerechnet ergibt dm³ direkt Liter.', 'V = 3,14 · 4 · 3 ≈ 37,7 l.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 300, 210, 'Zylinder füllt sich');
      const cx = 150, topY = 30, rx = 60, ry = 16, hh = 140;
      zyl(svg, cx, topY, rx, hh, ry, '#C8D2D8');
      const clipId = 'zc' + Math.random().toString(36).slice(2, 6);
      const defs = el('defs'); const cp = el('clipPath', { id: clipId }); cp.appendChild(el('rect', { x: cx - rx, y: topY, width: rx * 2, height: hh })); defs.appendChild(cp); svg.appendChild(defs);
      const fuellG = el('g', { 'clip-path': `url(#${clipId})` }); svg.appendChild(fuellG);
      /* Füllstand und Spiegel einmal anlegen, danach nur nachziehen. */
      const spiegelFlaeche = el('rect', { x: cx - rx, y: topY + hh, width: rx * 2, height: 0.001, fill: K, 'fill-opacity': .45 });
      const spiegel = el('ellipse', { cx, cy: topY + hh, rx, ry, fill: K, 'fill-opacity': .7 });
      fuellG.appendChild(spiegelFlaeche); fuellG.appendChild(spiegel);
      const zeige = frac => {
        const hpx = hh * frac;
        spiegelFlaeche.setAttribute('y', topY + hh - hpx);
        spiegelFlaeche.setAttribute('height', Math.max(0.001, hpx));
        spiegel.setAttribute('cy', topY + hh - hpx);
        spiegel.style.display = hpx > 4 ? '' : 'none';
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
    text: {
      A: ['Der Mantel wird zu einem Rechteck abgerollt.', 'Die eine Seite ist der Kreisumfang 2 · π · r = 25,12 cm.', 'Mantel = 25,12 · 10 = 251,2 cm².'],
      B: ['Zur Oberfläche kommen zwei Kreise dazu.', 'O = 2 · 50,24 + 251,2 ≈ 351,7 cm².'],
      C: ['Ein oben offener Becher hat nur einen Kreis.', 'O = 50,24 + 251,2 ≈ 301,4 cm².']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 340, 200, 'Zylindermantel wird zu einem Rechteck abgerollt');
      const cx = 70, topY = 40, rx = 30, ry = 10, hh = 100;
      zyl(svg, cx, topY, rx, hh, ry, K);
      /* Rechteck, Beschriftung und Deckkreise einmal anlegen — beim Abrollen
         ändert sich nur die Breite. */
      const strip = el('g'); svg.appendChild(strip);
      const r = 4, hZ = 10, U = 2 * 3.14 * r; // 25,12
      const x0 = 120, y0 = 50, wMax = 190;
      const flaeche = el('rect', { x: x0, y: y0, width: 0.001, height: hh, fill: K, 'fill-opacity': .3, stroke: FARBE.ink, 'stroke-width': 1.2 });
      const beschr = txt(x0, y0 + hh + 14, 'Umfang = 2·π·r = ' + fmt(U), { size: 10, farbe: FARBE.weich });
      strip.appendChild(flaeche); strip.appendChild(beschr);
      const kreis = (cx) => el('ellipse', { cx, cy: y0 - 14, rx: 18, ry: 6, fill: K, 'fill-opacity': .5, stroke: FARBE.ink, 'stroke-width': 1 });
      const deckelLinks = (st === 'B' || st === 'C') ? strip.appendChild(kreis(x0 + 20)) : null;
      const deckelRechts = st === 'B' ? strip.appendChild(kreis(x0 + wMax - 20)) : null;
      const zeige = frac => {
        const w = wMax * frac;
        flaeche.setAttribute('width', Math.max(0.001, w));
        beschr.setAttribute('x', x0 + w / 2);
        beschr.style.display = frac > .2 ? '' : 'none';
        if (deckelRechts) deckelRechts.setAttribute('cx', x0 + Math.max(40, w) - 20);
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
    text: {
      A: ['Der Körper wird in Quader und Würfel zerlegt.', 'V = 32 + 8 = 40 cm³.'],
      B: ['Ein Quader mit 5 · 5 · 2 hat 50 cm³.', 'Masse = 50 cm³ · 7,8 g/cm³ = 390 g.'],
      C: ['Bei einem Rohr zählt nur das Material.', 'V = außen − innen = 785 − 502,4 = 282,6 cm³.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st); const K = STUFE_FARBE[st];
      const G4 = window.ANIM._geo;
      const info = h('div', 'anim-ables');
      const svg = svgb(o.breite || 320, 210, 'Zusammengesetzter Körper');

      if (st === 'C') {
        /* Die Zahlen der Lernkarte gehören zu einem Rohr (außen r = 5 cm,
           innen r = 4 cm, Länge 10 cm). Vorher stand daneben ein Quader mit
           rechteckigem Loch — Bild und Rechnung passten nicht zusammen. */
        const cx = 160, topY = 50, rx = 62, ry = 18, hh = 105;
        zyl(svg, cx, topY, rx, hh, ry, K);
        const bohrung = el('ellipse', { cx, cy: topY, rx: 0.001, ry: 0.001, fill: FARBE.weiss, stroke: FARBE.korr, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
        svg.appendChild(bohrung);
        svg.appendChild(txt(cx, 28, 'Rohr: außen r = 5 cm · innen r = 4 cm · Länge 10 cm', { size: 9, farbe: FARBE.weich }));
        const zeige = frac => {
          const irx = rx * 0.8 * frac, iry = ry * 0.8 * frac;
          bohrung.setAttribute('rx', Math.max(0.001, irx));
          bohrung.setAttribute('ry', Math.max(0.001, iry));
          bohrung.style.display = irx > 1.5 ? '' : 'none';
          info.innerHTML = frac >= .96
            ? `V = außen − innen = 785 − 502,4 = <b>282,6 cm³</b>`
            : `nur das Material zählt — innen aushöhlen …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t => zeige(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      if (st === 'B') {
        /* Ein Vollquader mit 50 cm³ — genau der Körper aus der Lernkarte.
           Vorher lief hier derselbe zusammengesetzte Körper wie auf A, der
           40 cm³ hat: dasselbe Bild mit zwei verschiedenen Volumen. */
        G4.zeichneBox(svg, G4.boxTeile(70, 80, 140, 56, 44, 30), K);
        svg.appendChild(txt(140, 165, 'a = 5 cm · b = 5 cm · c = 2 cm → V = 50 cm³', { size: 10, farbe: FARBE.weich }));
        svg.appendChild(el('line', { x1: 246, y1: 150, x2: 288, y2: 150, stroke: FARBE.ink, 'stroke-width': 1.5 }));
        const saeule = el('rect', { x: 250, y: 150, width: 34, height: 0.001, fill: FARBE.c, 'fill-opacity': .5, stroke: FARBE.ink, 'stroke-width': 1 });
        const gramm = txt(267, 145, '0 g', { size: 10, farbe: FARBE.c, weight: 700 });
        svg.appendChild(saeule); svg.appendChild(gramm);
        const zeige = frac => {
          const hoehe = 100 * frac;
          saeule.setAttribute('y', 150 - hoehe);
          saeule.setAttribute('height', Math.max(0.001, hoehe));
          gramm.setAttribute('y', 145 - hoehe);
          gramm.textContent = Math.round(390 * frac) + ' g';
          info.innerHTML = frac >= .96
            ? `Masse = V · Dichte = 50 cm³ · 7,8 g/cm³ = <b>390 g</b>`
            : `erst das Volumen (50 cm³), dann · Dichte …`;
        };
        zeige(REDUCED ? 1 : 0);
        const loop = Loop(t => zeige(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      // A: Quader unten + Würfel oben, der abhebt
      G4.zeichneBox(svg, G4.boxTeile(80, 150, 140, 44, 40, 26), K);
      const wuerfel = G4.zeichneBox(svg, G4.boxTeile(120, 128, 44, 44, 24, 24), FARBE.c);
      const zeige = frac => {
        G4.setzeBox(wuerfel, G4.boxTeile(120, 128 - 40 * frac, 44, 44, 24, 24));
        info.innerHTML = frac >= .5
          ? `V = Quader + Würfel = 32 + 8 = <b>40 cm³</b>`
          : `in Grundformen zerlegen …`;
      };
      zeige(REDUCED ? 1 : 0);
      const loop = Loop(t => zeige(osz(t, 5)));
      const bar = steuerleiste(loop);
      host.appendChild(svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();
