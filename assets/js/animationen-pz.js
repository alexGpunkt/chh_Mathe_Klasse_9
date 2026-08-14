/* ============================================================
   animationen-pz.js · Prozent- und Zinsrechnung
   Zehn Animationen zu PZ-01 bis PZ-13. Grundbild: der Prozentstreifen.
   Setzt animationen-kern.js voraus.
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
      /* Beschriftungen am Rand mittig zu setzen schnitt sie ab — deshalb
         richtet sich die Ausrichtung nach der Lage auf dem Streifen. */
      anker(p) { return p >= max * 0.88 ? 'end' : (p <= max * 0.12 ? 'start' : 'middle'); },
      tick(p, label, o) { o = o || {}; const x = PX(p); const l = el('line', { x1: x, y1: y0 - 5, x2: x, y2: y0 + hoehe + 5, stroke: o.farbe || FARBE.c, 'stroke-width': 2 }); oben.appendChild(l); let tx = null; if (label != null) { tx = el('text', { x: x, y: y0 - 8, 'text-anchor': o.anchor || this.anker(p), 'font-family': 'monospace', 'font-size': 11, fill: o.farbe || FARBE.c, 'font-weight': 700 }, label); oben.appendChild(tx); } return { l, tx }; },
      setTick(ref, p, label) { const x = this.PX(p); ref.l.setAttribute('x1', x); ref.l.setAttribute('x2', x); if (ref.tx) { ref.tx.setAttribute('x', x); ref.tx.setAttribute('text-anchor', this.anker(p)); if (label != null) ref.tx.textContent = label; } }
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
    text: {
      A: ['Der ganze Streifen ist 100 %.', 'Die Hälfte sind 50 %, ein Viertel 25 %, drei Viertel 75 %.'],
      B: ['Bruch durch Division in eine Dezimalzahl: 3 : 4 = 0,75.', 'Dezimalzahl mal 100 gibt Prozent: 75 %.'],
      C: ['Nicht jede Division geht auf: 2 : 3 = 0,666…', 'Dann wird sinnvoll gerundet: rund 67 %.']
    },
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
    text: {
      A: ['Die Marke in der Mitte ist 50 %.', 'Endet die Farbe davor, sind es weniger als die Hälfte.'],
      B: ['Ordne zuerst zwischen den Marken 0, 25, 50, 75 und 100 % ein.', 'Dann schätze auf 5 % genau.'],
      C: ['Zerlege in Zehnerschritte.', 'Vier Schritte sind rund 40 %.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340 });
      const info = h('div', 'anim-ables');
      if (st === 'B') [25, 75].forEach(p => S.tick(p, fmt(p) + ' %', { farbe: FARBE.faint }));
      if (st === 'C') for (let p = 10; p < 100; p += 10) if (p !== 50) S.tick(p, '', { farbe: FARBE.gitter });
      const zeig = p => {
        S.setFill(p, FARBE.a);
        if (st === 'A') info.innerHTML = p < 49 ? `weniger als die Hälfte (< 50 %)` : (p > 51 ? `mehr als die Hälfte (> 50 %)` : `etwa die Hälfte (50 %)`);
        else if (st === 'B') {
          /* Der Ankerwert soll die Schätzung tragen, nicht nur daneben
             stehen: erst einordnen (zwischen welchen Marken?), dann auf
             5 % genau schätzen. */
          const A = [0, 25, 50, 75, 100];
          const unten = A.filter(x => x <= p).pop(), oben = A.find(x => x >= p);
          const nah = Math.abs(p - unten) <= Math.abs(oben - p) ? unten : oben;
          info.innerHTML = unten === oben
            ? `genau auf der Marke <b>${unten} %</b>`
            : `zwischen ${unten} % und ${oben} %, näher an ${nah} % → Schätzung ≈ <b>${Math.round(p / 5) * 5} %</b>`;
        }
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
    text: {
      A: ['5 Brötchen kosten 2,00 €.', 'Teile durch 5: ein Brötchen kostet 0,40 €.', 'Nimm mal 8: acht Brötchen kosten 3,20 €.'],
      B: ['Erst herunter auf 1, dann hoch auf die gesuchte Menge.', 'Die Pfeile zeigen, womit gerechnet wird.'],
      C: ['Der Preis für ein Stück ist der Faktor.', '8 · 0,40 € = 3,20 €.']
    },
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
    text: {
      A: ['Mehr Maler bedeutet weniger Tage.', 'Die eine Größe wächst, die andere schrumpft.'],
      B: ['Das Produkt aus Malern und Tagen bleibt gleich: 6 · 8 = 48.', '48 : 8 Maler = 6 Tage.'],
      C: ['In jeder Zeile ergibt das Produkt denselben Wert.', 'Genau das kennzeichnet antiproportional.']
    },
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
    text: {
      A: ['Der ganze Streifen ist der Grundwert G und entspricht 100 %.', 'Der gefärbte Teil ist der Prozentwert W.'],
      B: ['G ist das Ganze, W der Teil, p % der Prozentsatz.', 'Das %-Zeichen gehört zum Prozentsatz, die Einheit zum Prozentwert.'],
      C: ['Manchmal ist der Grundwert im Text gar nicht genannt.', 'Dann sind nur W und p % bekannt und G ist gesucht.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const S = Streifen({ breite: o.breite || 340, mitte: false });
      const info = h('div', 'anim-ables');
      const W = 40; // Prozentwert bei 40 %
      S.setFill(W, FARBE.a);
      const tG = S.tick(100, 'G = 100 %', { farbe: FARBE.b });
      const tW = st !== 'A' ? S.tick(W, 'W', { farbe: FARBE.a }) : null;
      /* Vorher stand hier auf A und B nur ein fester Satz — der Abspielknopf
         bewegte nichts. Jetzt wandert die Markierung zwischen „das Ganze"
         und „der Teil", denn genau diese Unterscheidung ist der Lernkern. */
      const phasenA = [
        { fill: 100, farbe: FARBE.b, txt: `der <b style="color:${FARBE.b}">ganze</b> Streifen = <b>Grundwert G</b> = 100 %` },
        { fill: W, farbe: FARBE.a, txt: `nur der gefärbte <b style="color:${FARBE.a}">Teil</b> = <b>Prozentwert W</b> = ${W} %` }
      ];
      const phasenB = [
        { fill: 100, farbe: FARBE.b, txt: `<b style="color:${FARBE.b}">G</b> = das Ganze = 100 %` },
        { fill: W, farbe: FARBE.a, txt: `<b style="color:${FARBE.a}">W</b> = der Teil davon (in € oder Stück)` },
        { fill: W, farbe: FARBE.c, txt: `<b style="color:${FARBE.c}">p %</b> = ${W} % — wie viel Prozent der Teil ausmacht` }
      ];
      const zeig = phase => {
        if (st === 'C') { info.innerHTML = phase % 2 ? `<b style="color:${FARBE.b}">G = ?</b> — der Grundwert ist nicht genannt` : `nur der Teil W und p % sind bekannt`; return; }
        const ph = (st === 'A' ? phasenA : phasenB);
        const p = ph[phase % ph.length];
        S.setFill(p.fill, p.farbe); info.innerHTML = p.txt;
      };
      if (st === 'C') S.setTick(tG, 100, 'G = ?');
      zeig(0);
      const loop = Loop(t => zeig(Math.floor(t / 1.8)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

  /* 6 · Prozentwert berechnen (PZ-06) */
  register({
    id: 'prozentwert', titel: 'Prozentwert berechnen', bezug: 'PZ-06',
    kurz: 'A: über den 1-%-Schritt · B: W = G · p : 100 · C: mit Faktor und Überschlag.',
    text: {
      A: ['1 % ist der Grundwert geteilt durch 100: 80 € : 100 = 0,80 €.', '35 % sind 35 · 0,80 € = 28 €.'],
      B: ['W = G · p : 100 = 80 · 35 : 100 = 28 €.', 'Ist p kleiner als 100 %, muss W kleiner als G sein.'],
      C: ['35 % sind ungefähr ein Drittel: rund 27 € als Überschlag.', 'Genau: 80 · 0,35 = 28 €.']
    },
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
    text: {
      A: ['15 von 60 ist der Bruch 15/60.', 'Gekürzt ist das 1/4, also 25 %.'],
      B: ['p = W : G · 100 = 34 : 40 · 100 = 85 %.'],
      C: ['Auch eine Veränderung wird so berechnet: 6 € von 40 € sind 15 %.']
    },
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
    text: {
      A: ['20 % sind 12 €.', '1 % ist 12 € : 20 = 0,60 €.', '100 % sind 0,60 € · 100 = 60 €.'],
      B: ['G = W : p · 100 = 12 : 20 · 100 = 60 €.', 'Kontrolle: 60 € ist größer als 12 € — das passt.'],
      C: ['Nach 20 % Rabatt sind 48 € noch 80 % des alten Preises.', '100 % sind 48 : 80 · 100 = 60 €.']
    },
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

  /* 9 · Vermehrter/verminderter Grundwert & Wachstumsfaktor (PZ-09/10)
     Zwei Einheiten teilen sich diese Animation, deshalb das Feld "thema":
       thema "rabatt"   → PZ-09 (Rabatt/Aufschlag, zurück vom Endpreis)
       thema "richtung" → PZ-10 (gestiegen/gefallen, Faktor, Faktorkette)
     Ohne Angabe bleibt es beim bisherigen Verhalten (Rabatt). */
  register({
    id: 'veraenderung', titel: 'Vermehren, vermindern, Wachstumsfaktor', bezug: 'PZ-09',
    kurz: 'A: erst Betrag, dann ±  · B: in einem Schritt (Faktor 1 ± p) · C: zurück vom Endpreis bzw. Faktorkette.',
    text: {
      A: ['Der Rabatt beträgt 200 € · 15 : 100 = 30 €.', 'Der Endpreis ist 200 € − 30 € = 170 €.'],
      B: ['100 % − 15 % = 85 %, also Faktor 0,85.', '200 € · 0,85 = 170 € in einem Schritt.'],
      C: ['Ein Endpreis von 119 € entspricht 119 %.', 'Zurück geht es durch 1,19, nicht durch Abziehen von 19 %.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const thema = (o && o.thema) === 'richtung' ? 'richtung' : 'rabatt';
      const S = Streifen({ breite: o.breite || 360, max: 150, mitte: false, legende: false });
      const info = h('div', 'anim-ables');
      S.tick(100, '100 %', { farbe: FARBE.ink });

      if (thema === 'richtung' && st === 'C') {
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

      if (thema === 'rabatt' && st === 'C') {
        // Vom Endpreis zurück: 119 € sind 119 %, also : 1,19 statt − 19 %
        const marke = S.tick(119, '', { farbe: FARBE.c });
        const zeig = frac => {
          const v = 119 - 19 * frac; S.setFill(v, FARBE.c); S.setTick(marke, v, fmt(Math.round(v)) + ' %');
          info.innerHTML = `Endpreis 119 € = <b>119 %</b> → : 1,19 = <b>100 €</b> netto &nbsp;(nicht 119 € − 19 %)`;
        };
        zeig(REDUCED ? 1 : 0);
        const loop = Loop(t => zeig(osz(t, 5)));
        const bar = steuerleiste(loop);
        host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      if (thema === 'richtung') {
        // A/B: 50 € → 58 €  (Richtung, Differenz, Prozentsatz, Faktor)
        const marke = S.tick(100, '', { farbe: FARBE.a });
        const zeig = frac => {
          const v = 100 + 16 * frac; S.setFill(v, FARBE.a); S.setTick(marke, v, fmt(Math.round(v)) + ' %');
          info.innerHTML = st === 'A'
            ? `alt 50 € → neu 58 €: <b>gestiegen</b> · Differenz = 58 − 50 = <b>8 €</b>`
            : `p = (58 − 50) : 50 · 100 = <b>16 %</b> → Faktor q = <b>1,16</b>`;
        };
        zeig(REDUCED ? 1 : 0);
        const loop = Loop(t => zeig(osz(t, 4)));
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

  /* 10 · Zinsen & Zinseszins (PZ-11/12/13)
     Drei Einheiten, ein Bildvorrat — getrennt über "thema", damit die
     Stufe wirklich die Niveaustufe meint und nicht heimlich das Thema:
       thema "jahr"   → PZ-11 Jahreszinsen (A: Z · B: p · C: K)
       thema "zeit"   → PZ-12 Teile eines Jahres (A: halbes Jahr · B: m/12 · C: Laufzeit zurück)
       thema "eszins" → PZ-13 Zinseszins (A: Tabelle · B: K·qⁿ · C: Vergleich) */
  register({
    id: 'zinsen', titel: 'Zinsen & Zinseszins', bezug: 'PZ-11',
    kurz: 'Jahreszinsen, Teile eines Jahres und Zinseszins — je Einheit über „thema“ gewählt.',
    text: {
      A: ['Das Kapital ist der Grundwert, der Zinssatz der Prozentsatz.', 'Z = K · p : 100 = 1200 · 5 : 100 = 60 € im Jahr.'],
      B: ['Ist p gesucht: p = Z : K · 100 = 60 : 2000 · 100 = 3 %.'],
      C: ['Ist K gesucht: K = Z · 100 : p = 100 · 100 : 4 = 2500 €.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const thema = ['jahr', 'zeit', 'eszins'].indexOf((o && o.thema) || '') >= 0 ? o.thema : 'jahr';
      const info = h('div', 'anim-ables');

      /* ---- PZ-13 · Zinseszins ---- */
      if (thema === 'eszins') {
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
            Sa.svg.appendChild(refs[j]); refs[j].style.opacity = 0;
          }
          const setz = k => {
            rects.forEach((r, j) => { Sa.setSaeule(r, j <= k ? zins[j] : 0); refs[j].style.opacity = j <= k ? 1 : 0; });
            info.innerHTML = `Jahr ${k}: Zinseszins ${fmt(Math.round(zins[k]))} € vs. einfach ${fmt(einf[k])} € — <b style="color:${FARBE.c}">wächst schneller</b>`;
          };
          setz(REDUCED ? n : 0);
          const loop = Loop(t => setz(Math.floor((t % ((n + 1) * 0.9)) / 0.9)));
          const bar = steuerleiste(loop);
          /* Die gestrichelten Striche sind der einfache Zins — ohne Legende
             blieb im Bild unklar, wogegen die Säulen antreten. */
          const leg = h('div', 'anim-legende');
          leg.innerHTML = `<span><i style="background:${FARBE.c}"></i>Zinseszins</span><span><i style="background:${FARBE.ink}"></i>einfacher Zins (gestrichelt)</span>`;
          host.appendChild(Sa.svg); host.appendChild(leg); host.appendChild(info); host.appendChild(bar);
          if (!REDUCED) loop.play(), bar._sync(); return loop;
        }
        // A: Tabelle Jahr für Jahr · B: dieselbe Rechnung als K · qⁿ
        const box = h('div', 'anim-schema');
        const zeilen = [
          { l: 'Start', r: '1000,00 €' },
          { l: 'Jahr 1: + 2 %', r: '1020,00 €' },
          { l: 'Jahr 2: + 2 %', r: '1040,40 €' }
        ].map((rw, i) => {
          const z = h('div', 'anim-schema-zeile');
          z.appendChild(h('span', 'anim-schema-op', i === 0 ? '' : '+ ' + (i === 1 ? '20,00' : '20,40') + ' €'));
          z.appendChild(h('span', 'anim-schema-l', rw.l));
          z.appendChild(h('span', 'anim-schema-pf', '→'));
          z.appendChild(h('span', 'anim-schema-r', rw.r));
          z.style.opacity = i === 0 ? 1 : 0;
          box.appendChild(z); return z;
        });
        const setz = n => {
          zeilen.forEach((z, i) => z.style.opacity = i < n ? 1 : 0);
          if (st === 'A') info.innerHTML = n >= 3
            ? `Jahr 2 verzinst <b>1020 €</b>, nicht mehr 1000 € → <b>1040,40 €</b>`
            : `neues Kapital = altes Kapital + Zinsen`;
          else info.innerHTML = n >= 3
            ? `kurz: K · qⁿ = 1000 · 1,02² = <b>1040,40 €</b>`
            : `q = 1 + 2/100 = <b>1,02</b>`;
        };
        setz(REDUCED ? 3 : 1);
        const loop = Loop(t => setz(1 + Math.floor((t % 5.4) / 1.8)));
        const bar = steuerleiste(loop);
        host.appendChild(box); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      /* ---- PZ-12 · Teile eines Jahres ---- */
      if (thema === 'zeit') {
        const K = 1200, p = 5, Zjahr = K * p / 100;      // 60 € im Jahr
        const monate = st === 'A' ? 6 : 3;
        const S = Streifen({ breite: o.breite || 340, max: 12, mitte: false, legende: false });
        S.tick(12, '1 Jahr = ' + fmt(Zjahr) + ' €', { farbe: FARBE.b });
        const marke = S.tick(monate, '', { farbe: FARBE.a });
        const Zteil = Zjahr * monate / 12;
        const zeig = frac => {
          const m = monate * frac; S.setFill(m, FARBE.a); S.setTick(marke, m, fmt(Math.round(m)) + ' Mon.');
          if (st === 'A') info.innerHTML = `halbes Jahr = <b>6 von 12</b> Monaten → ${fmt(Zjahr)} € : 2 = <b>${fmt(Zteil)} €</b>`;
          else if (st === 'B') info.innerHTML = `3 Monate → Zeitfaktor 3/12 → ${fmt(Zjahr)} € · 3/12 = <b>${fmt(Zteil)} €</b>`;
          else info.innerHTML = `rückwärts: ${fmt(Zteil)} € : ${fmt(Zjahr)} € = 1/4 Jahr → <b>3 Monate</b> (= 90 Tage)`;
        };
        zeig(REDUCED ? 1 : 0);
        const loop = Loop(t => zeig(osz(t, 4)));
        const bar = steuerleiste(loop);
        host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync(); return loop;
      }

      /* ---- PZ-11 · Jahreszinsen: A sucht Z, B sucht p, C sucht K ---- */
      const faelle = {
        A: { K: 1200, p: 5, Z: 60, txt: `Z = K · p : 100 = 1200 · 5 : 100 = <b>60 €</b> im Jahr` },
        B: { K: 2000, p: 3, Z: 60, txt: `gesucht ist <b>p</b>: p = Z : K · 100 = 60 : 2000 · 100 = <b>3 %</b>` },
        C: { K: 2500, p: 4, Z: 100, txt: `gesucht ist <b>K</b>: K = Z · 100 : p = 100 · 100 : 4 = <b>2500 €</b>` }
      };
      const f = faelle[st] || faelle.A;
      const S = Streifen({ breite: o.breite || 340, mitte: false });
      S.tick(100, 'K = ' + fmt(f.K) + ' €', { farbe: FARBE.b });
      const zeig = frac => { S.setFill(f.p * frac, FARBE.a); info.innerHTML = f.txt; };
      zeig(REDUCED ? 1 : 0);
      const loop = Loop(t => zeig(osz(t, 4)));
      const bar = steuerleiste(loop);
      host.appendChild(S.svg); host.appendChild(info); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync(); return loop;
    }
  });

})();
