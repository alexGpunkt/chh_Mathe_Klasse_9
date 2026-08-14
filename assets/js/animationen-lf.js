/* ============================================================
   animationen-lf.js · Lineare Funktionen
   Elf Animationen zu LF-01 bis LF-14: Steigung, y-Achsenabschnitt,
   Geradenbaukasten, Wertetabelle, Proportionalität, Punktprobe,
   Nullstelle, Schnittpunkt, Tarifvergleich, Waage, Graphen lesen.

   Setzt animationen-kern.js voraus.
   ============================================================ */
(function () {
  'use strict';
  const I = window.ANIM._intern;
  const { Feld, Loop, steuerleiste, regler, abzeichen, register, LISTE, NACH_ID, FARBE, STUFE_NAME, STUFE_FARBE, fmt, osz, h, el, stufeVon, REDUCED, mqDunkel, paletteSetzen, autostartErlaubt, AUTOSTART_SCHLUESSEL } = I;

  /* ============================================================
     Konzept 1 · Steigung m  (LF-04)
     A: nach rechts/oben zählen (nur positive, ganze m)
     B: m = Δy : Δx (auch negativ, Bruch)
     C: aus zwei Punkten — Dreiecksgröße egal, m bleibt
     ============================================================ */
  register({
    id: 'steigung', titel: 'Steigung m', bezug: 'LF-04',
    kurz: 'Wie steil ist die Gerade? A: Kästchen zählen · B: m = Δy:Δx · C: aus zwei Punkten (Dreieck egal).',
    text: {
      A: ['Die Gerade steigt nach rechts oben.', 'Gehe 1 Kästchen nach rechts.', 'Zähle die Kästchen nach oben. Das ist m.', 'Größeres m heißt: die Gerade wird steiler.'],
      B: ['Das Steigungsdreieck zeigt Δx nach rechts und Δy nach oben.', 'm = Δy : Δx.', 'Ist m negativ, geht es nach unten statt nach oben.'],
      C: ['P und Q liegen beide auf der Geraden.', 'm = (y₂ − y₁) : (x₂ − x₁).', 'Das Dreieck darf größer oder kleiner sein — m bleibt gleich.']
    },
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
    text: {
      A: ['b ist die Höhe am Schnitt mit der senkrechten Achse.', 'Wird b größer, rutscht die ganze Gerade nach oben.', 'Die Steigung ändert sich dabei nicht.'],
      B: ['b ist der Grundbetrag: der Wert bei x = 0.', 'Er gilt auch, wenn noch nichts verbraucht wurde.'],
      C: ['Aus einem Punkt P(x | y) und der Steigung m folgt b = y − m·x.', 'Im Beispiel: b = 5 − 2·2 = 1.']
    },
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
    text: {
      A: ['m bestimmt die Steigung, b die Starthöhe.', 'Nur b ändern: die Gerade verschiebt sich nach oben oder unten.', 'Nur m ändern: die Gerade kippt um den Punkt (0 | b).'],
      B: ['m und b lassen sich auch halb und negativ einstellen.', 'Negatives m heißt: die Gerade fällt.'],
      C: ['Bei m = 0 entsteht eine waagerechte Gerade.', 'Dann hat jedes x denselben y-Wert.']
    },
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
    text: {
      A: ['Jede Spalte der Tabelle wird ein Punkt.', 'Erst der x-Wert nach rechts, dann der y-Wert nach oben.', 'Sind alle Punkte gesetzt, entsteht die Gerade.'],
      B: ['Gleiche Schritte bei x geben gleiche Sprünge bei y.', 'Diese gleichbleibende Differenz heißt linear.'],
      C: ['y = x + 1 hat die Differenzen +1, +1, +1 — linear.', 'y = x² hat die Differenzen +1, +3, +5 — nicht linear.']
    },
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
    text: {
      A: ['Die Gerade geht durch (0 | 0).', 'Doppeltes x gibt doppeltes y.'],
      B: ['Das Verhältnis y : x bleibt an jeder Stelle gleich.', 'Dieses Verhältnis ist m.'],
      C: ['Für x = 0 ist y = m · 0 = 0.', 'Deshalb muss die Gerade durch (0 | 0) gehen.']
    },
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


  /* ============================================================
     Konzept 6 · Punktprobe  (LF-08)
     A: Punkte, die draufliegen — Einsetz-Mechanik üben
     B: drauf ODER daneben (rot mit Abstand)
     C: fehlende Koordinate bestimmen (nach x auflösen)
     ============================================================ */
  register({
    id: 'punktprobe', titel: 'Punktprobe', bezug: 'LF-08',
    kurz: 'Liegt der Punkt auf der Geraden? A: einsetzen & prüfen · B: drauf/daneben · C: fehlende Koordinate.',
    text: {
      A: ['Setze den x-Wert in die Gleichung ein.', 'Kommt der y-Wert des Punktes heraus, liegt er auf der Geraden.'],
      B: ['Stimmt der berechnete y-Wert nicht, liegt der Punkt daneben.', 'Der Abstand zeigt, wie weit daneben.'],
      C: ['Ist nur y bekannt, setzt du y ein und löst nach x auf.', 'Beispiel: 5 = 2x − 1 gibt x = 3.']
    },
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
    text: {
      A: ['Die Nullstelle ist der Schnittpunkt mit der waagerechten Achse.', 'Dort ist y = 0.'],
      B: ['Setze y = 0 und löse nach x auf.', 'Beispiel: 0 = x − 2 gibt x = 2.'],
      C: ['Im Sachzusammenhang bedeutet die Nullstelle: der Tank ist leer.', 'Nach 5 Stunden ist nichts mehr da.', 'Danach gilt das Modell nicht mehr — es gibt keine negative Füllmenge.']
    },
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
    text: {
      A: ['Der Schnittpunkt ist die Kreuzung der beiden Geraden.', 'Lies dort x und y ab: S(2 | 3).'],
      B: ['Im Schnittpunkt sind beide y-Werte gleich.', 'Setze die rechten Seiten gleich und löse nach x auf.'],
      C: ['Gleiches m, anderes b: parallel, kein Schnittpunkt.', 'Gleiches m und gleiches b: identisch, unendlich viele Punkte.', 'Verschiedene m: genau ein Schnittpunkt.']
    },
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
      /* LF-12 liest den Schnittpunkt ab, LF-13 rechnet ihn aus. Damit die
         Basisstufe von LF-13 nicht bloß das Ablesen zeigt, lässt sich die
         Rechenzeile über "rechnung": true auch auf Stufe A einschalten. */
      const rechnung = (st === 'B' || (o && o.rechnung)) ? h('div', 'anim-rechnung') : null;
      const zeichne = b2 => {
        F.setGerade(g2, m2, b2);
        const xs = (b2 - b1) / (m1 - m2), ys = m1 * xs + b1, nah = Math.abs(b2 - 5) < 0.15;
        sp.style.opacity = nah ? 1 : 0.25; F.setPunkt(sp, xs, ys);
        F.setText(spText, nah ? `S(${fmt(xs)} | ${fmt(ys)})` : ''); F.setTextPos(spText, xs, ys, 9, -8);
        if (rechnung) rechnung.innerHTML = `x + 1 = −x + ${fmt(b2)} → 2x = ${fmt(b2 - 1)} → x = <b>${fmt(xs)}</b>`;
        ables.innerHTML = nah ? `Schnittpunkt <b style="color:${FARBE.korr}">S(${fmt(xs)} | ${fmt(ys)})</b>` : (rechnung ? 'beide Geraden noch getrennt …' : 'Kreuzung suchen …');
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
    text: {
      A: ['Bei wenigen Stunden ist der Tarif ohne Grundgebühr günstiger.', 'Bei vielen Stunden gewinnt der Tarif mit Grundgebühr.', 'Bei 5 Stunden kosten beide gleich viel.'],
      B: ['Der Schnittpunkt ist die Grenze zwischen den Bereichen.', 'Links davon gewinnt der eine Tarif, rechts der andere.'],
      C: ['Mit einer Flatrate gibt es drei Bereiche.', 'Jeder Tarif hat einen Bereich, in dem er am günstigsten ist.']
    },
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
        /* Genau im Schnittpunkt kosten beide gleich viel. Dort einen Sieger
           auszurufen wäre falsch — und es ist die Stelle, um die es geht. */
        const gleich = Math.abs(A(x) - B(x)) < 0.05;
        if (gleich) { ables.innerHTML = `bei ${fmt(x)} Std kosten A und B <b>gleich viel</b> (${fmt(A(x))} €) — das ist die Grenze`; return; }
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
    text: {
      A: ['Die Waage ist im Gleichgewicht: links so viel wie rechts.', 'Erst die Zahl ohne x wegnehmen — auf beiden Seiten.', 'Dann durch die Zahl vor dem x teilen — auf beiden Seiten.'],
      B: ['Steht x auf beiden Seiten, sammle es zuerst auf einer.', 'Danach wie gewohnt: erst ±, dann :.'],
      C: ['Fällt x heraus und bleibt eine wahre Aussage, gibt es unendlich viele Lösungen.', 'Bleibt eine falsche Aussage, gibt es keine.']
    },
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
      /* Die Waage stand vorher nur als Bild daneben. Der Kern des Modells
         ist aber, dass auf BEIDEN Schalen dasselbe passiert — deshalb steht
         die Umformung jetzt unter beiden Schalen, nicht nur in der Randnotiz. */
      const opL = el('text', { x: 95, y: 84, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: FARBE.korr, 'font-weight': 700 }); svg.appendChild(opL);
      const opR = el('text', { x: 205, y: 84, 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': 13, fill: FARBE.korr, 'font-weight': 700 }); svg.appendChild(opR);

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
        const op = (s[2] || '').replace('|', '').trim();
        const zeigOp = i > 0 && op && op !== 'wahr';
        opL.textContent = zeigOp ? op : ''; opR.textContent = zeigOp ? op : '';
        rechnung.innerHTML = i === 0 ? 'Gleichung im Gleichgewicht' : `Schritt ${i}: links und rechts <b>${op}</b>`;
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
     Konzept 10 · Graphen lesen  (LF-01)
     A: der Ableseweg x → hoch → links → y
     B: zusätzlich rückwärts y → x, an einem Graphen mit Abschnitten
     C: Knickstellen deuten — steigend, konstant, fallend

     Warum eigens animiert: Das Ablesen ist eine Bewegung, kein Bild. Ein
     Standbild mit eingezeichneten Hilfslinien zeigt das Ergebnis; wer den
     Weg nicht kennt, sieht darin nur zwei gestrichelte Striche. Hier läuft
     der Weg ab, und zwar in der Reihenfolge, die auch auf dem Papier gilt.
     ============================================================ */
  const GRAPH_PUNKTE = {
    A: [[0, 1], [6, 7]],
    B: [[0, 1], [2, 5], [4, 5], [6, 7]],
    C: [[0, 0], [2, 4], [4, 4], [6, 1]]
  };
  /* Stückweise linear zwischen den Stützpunkten — derselbe Graph, den die
     Aufgaben der Einheit zeigen, damit Bild und Aufgabe zusammenpassen. */
  function graphY(pts, x) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      if (x <= x1 || i === pts.length - 1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
    return pts[pts.length - 1][1];
  }

  register({
    id: 'graphlesen', titel: 'Graphen lesen', bezug: 'LF-01',
    kurz: 'A: x → hoch → links → y · B: auch rückwärts von y nach x · C: Knickstellen deuten.',
    text: {
      A: ['Suche den x-Wert unten auf der Achse.', 'Gehe von dort senkrecht nach oben bis zur Linie.', 'Gehe dann waagerecht nach links und lies den y-Wert ab.'],
      B: ['Vorwärts liest du von x nach y, rückwärts von y nach x.', 'Der Weg geht immer im rechten Winkel: einmal senkrecht, einmal waagerecht.', 'Steigt der Graph, wird y größer. Verläuft er waagerecht, bleibt y gleich.'],
      C: ['An einer Knickstelle wechselt die Änderungsrate.', 'Steigend heißt: y wird größer, während x wächst.', 'Fallend heißt: y wird kleiner, obwohl x weiter wächst.']
    },
    bauen(host, o) {
      const st = stufeVon(o); abzeichen(host, st);
      const pts = GRAPH_PUNKTE[st] || GRAPH_PUNKTE.A;
      const F = Feld({ xmin: -0.5, xmax: 6.5, ymin: -0.5, ymax: 7.5, breite: o.breite || 340 });
      const ables = h('div', 'anim-ables');
      const teile = [];
      for (let i = 1; i < pts.length; i++) {
        teile.push(F.linie(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], { farbe: FARBE.b, breite: 3 }));
      }

      if (st === 'C') {
        const NAME = ['steigend — y wird größer', 'konstant — y bleibt gleich', 'fallend — y wird kleiner'];
        pts.slice(1, -1).forEach(p => F.punkt(p[0], p[1], { fill: FARBE.gelb, r: 5 }));
        let stand = -1;
        const zeige = k => {
          if (k === stand) return;                 // nur bei echtem Wechsel neu setzen
          stand = k;
          teile.forEach((s, j) => {
            s.setAttribute('stroke', j === k ? FARBE.korr : FARBE.neutral);
            s.setAttribute('stroke-width', j === k ? 5 : 3);
          });
          ables.innerHTML = `Abschnitt ${k + 1}: <b>${NAME[k] || ''}</b>`;
        };
        zeige(0);
        const weiter = h('button', 'anim-btn anim-play', 'Nächster Abschnitt →');
        weiter.type = 'button';
        weiter.addEventListener('click', () => zeige((stand + 1) % teile.length));
        const loop = Loop(t => zeige(Math.floor(t / 2.4) % teile.length));
        const bar = steuerleiste(loop); bar.insertBefore(weiter, bar.firstChild);
        host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
        if (!REDUCED) loop.play(), bar._sync();
        return loop;
      }

      const senk = F.linie(0, 0, 0, 0, { farbe: FARBE.c, breite: 2, dash: '5 4' });
      const waag = F.linie(0, 0, 0, 0, { farbe: FARBE.c, breite: 2, dash: '5 4' });
      const pkt = F.punkt(3, graphY(pts, 3), { fill: FARBE.korr, r: 5 });
      const zeige = (x, rueckwaerts) => {
        const y = graphY(pts, x);
        F.setLinie(senk, x, F.ymin, x, y);
        F.setLinie(waag, F.xmin, y, x, y);
        F.setPunkt(pkt, x, y);
        ables.innerHTML = rueckwaerts
          ? `rückwärts: y = <b>${fmt(y)}</b> → waagerecht zur Linie → senkrecht nach unten → x = <b>${fmt(x)}</b>`
          : `vorwärts: x = <b>${fmt(x)}</b> → senkrecht nach oben zur Linie → waagerecht nach links → y = <b>${fmt(y)}</b>`;
      };
      zeige(3, false);
      /* Halbe Schritte: krumme Zwischenwerte wären beim Ablesen nicht
         nachvollziehbar, die Bewegung soll auf Gitterpunkten landen. */
      const loop = Loop(t => {
        const x = 0.5 + osz(t, 8) * 5;
        zeige(Math.round(x * 2) / 2, st === 'B' && Math.floor(t / 8) % 2 === 1);
      });
      const bar = steuerleiste(loop);
      host.appendChild(F.svg); host.appendChild(ables); host.appendChild(bar);
      if (!REDUCED) loop.play(), bar._sync();
      return loop;
    }
  });

})();
