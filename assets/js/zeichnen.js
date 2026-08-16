/* ============================================================
   zeichnen.js · Aufgabenbilder

   Warum kein GeoGebra für die Aufgabenbilder?
   Drei Gründe, alle praktisch:
   1. Fremde Material-IDs verschwinden. Eigene müssten erst angelegt werden,
      und ich kann keine erfinden, die es nicht gibt.
   2. Der Service Worker cached geogebra.org nicht — fällt das WLAN aus,
      wäre die halbe Einheit weg.
   3. Ein Applet pro Aufgabe lädt auf 28 Schulgeräten spürbar.

   Die Bilder hier sind Inline-SVG: laden sofort, funktionieren offline,
   drucken sauber und lassen sich mit Reglern trotzdem bewegen.

   Für eigene GeoGebra-Materialien gibt es den Typ "geogebra" — für den
   Geradenbaukasten aus deinem GeoGebra-Buch, als eigene Erkundung.
   ============================================================ */

let _uid = 0;

/* ---------- Prozentstreifen ---------- */
function streifenHtml(v) {
  return `<div class="bild">
    <div class="aufg-streifen" role="img" aria-label="${v.alt || 'Ein Streifen, teilweise gefärbt. Der Strich in der Mitte markiert 50 Prozent.'}">
      <div class="aufg-fuell" style="width:${v.fill}%"></div>
      <div class="aufg-skala"></div><div class="aufg-marke"></div>
    </div>
    <div class="aufg-legende"><span>0 %</span><span>50 %</span><span>100 %</span></div>
  </div>`;
}

/* ---------- Koordinatensystem ---------- */
function koordinatenSvg(v, ueberschreib) {
  const o = { ...v, ...(ueberschreib || {}) };
  const xmin = o.xmin ?? -1, xmax = o.xmax ?? 7;
  const ymin = o.ymin ?? -1, ymax = o.ymax ?? 7;
  const E = 26, R = 18;
  const W = (xmax - xmin) * E + 2 * R;
  const H = (ymax - ymin) * E + 2 * R;
  const X = x => (R + (x - xmin) * E).toFixed(1);
  const Y = y => (H - R - (y - ymin) * E).toFixed(1);
  const id = ++_uid;

  const schrittX = Math.ceil((xmax - xmin) / 12) || 1;
  const schrittY = Math.ceil((ymax - ymin) / 12) || 1;

  let s = `<defs>
    <marker id="pf${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" class="k-achse-f"/></marker>
    <clipPath id="cl${id}"><rect x="${R}" y="${R}" width="${W - 2 * R}" height="${H - 2 * R}"/></clipPath>
  </defs>`;

  /* Gitter */
  for (let i = Math.ceil(xmin); i <= Math.floor(xmax); i++)
    s += `<line x1="${X(i)}" y1="${R}" x2="${X(i)}" y2="${H - R}" class="k-gitter"/>`;
  for (let j = Math.ceil(ymin); j <= Math.floor(ymax); j++)
    s += `<line x1="${R}" y1="${Y(j)}" x2="${W - R}" y2="${Y(j)}" class="k-gitter"/>`;

  /* Achsen */
  const nullX = xmin <= 0 && xmax >= 0, nullY = ymin <= 0 && ymax >= 0;
  if (nullY) s += `<line x1="${R}" y1="${Y(0)}" x2="${W - R + 8}" y2="${Y(0)}" class="k-achse" marker-end="url(#pf${id})"/>`;
  if (nullX) s += `<line x1="${X(0)}" y1="${H - R}" x2="${X(0)}" y2="${R - 8}" class="k-achse" marker-end="url(#pf${id})"/>`;

  /* Zahlen an den Achsen */
  if (nullY) for (let i = Math.ceil(xmin); i <= Math.floor(xmax); i++) {
    if (i === 0 || i % schrittX) continue;
    s += `<text x="${X(i)}" y="${+Y(0) + 13}" class="k-zahl" text-anchor="middle">${i}</text>`;
  }
  if (nullX) for (let j = Math.ceil(ymin); j <= Math.floor(ymax); j++) {
    if (j === 0 || j % schrittY) continue;
    s += `<text x="${+X(0) - 5}" y="${+Y(j) + 3.5}" class="k-zahl" text-anchor="end">${j}</text>`;
  }
  if (nullX && nullY) s += `<text x="${+X(0) - 5}" y="${+Y(0) + 13}" class="k-zahl" text-anchor="end">0</text>`;
  s += `<text x="${W - R + 2}" y="${+Y(nullY ? 0 : ymin) - 6}" class="k-name">x</text>`;
  s += `<text x="${+X(nullX ? 0 : xmin) + 6}" y="${R - 8}" class="k-name">y</text>`;

  /* Geraden */
  s += `<g clip-path="url(#cl${id})">`;
  (o.lines || []).forEach((L, i) => {
    const kl = L.farbe === 'zweit' ? 'k-linie k-linie2' : 'k-linie';
    if (L.x !== undefined) {
      s += `<line x1="${X(L.x)}" y1="${R}" x2="${X(L.x)}" y2="${H - R}" class="${kl}"/>`;
    } else {
      s += `<line x1="${X(xmin)}" y1="${Y(L.m * xmin + L.b)}" x2="${X(xmax)}" y2="${Y(L.m * xmax + L.b)}" class="${kl}"/>`;
    }
  });

  /* Steigungsdreieck */
  const d = o.steigungsdreieck;
  if (d) {
    const L = (o.lines || [])[d.line ?? 0];
    if (L) {
      const x0 = d.x0, dx = d.dx, x1 = x0 + dx;
      const y0 = L.m * x0 + L.b, y1 = L.m * x1 + L.b;
      s += `<path d="M ${X(x0)} ${Y(y0)} L ${X(x1)} ${Y(y0)} L ${X(x1)} ${Y(y1)}" class="k-dreieck"/>`;
      s += `<text x="${(+X(x0) + +X(x1)) / 2}" y="${+Y(y0) + (L.m >= 0 ? 13 : -6)}" class="k-mass" text-anchor="middle">${d.beschriftung === false ? '' : 'Δx = ' + fmtZ(dx)}</text>`;
      s += `<text x="${+X(x1) + 5}" y="${(+Y(y0) + +Y(y1)) / 2 + 3.5}" class="k-mass">${d.beschriftung === false ? '' : 'Δy = ' + fmtZ(L.m * dx)}</text>`;
    }
  }
  s += `</g>`;

  /* Punkte */
  (o.punkte || []).forEach(P => {
    s += `<circle cx="${X(P.x)}" cy="${Y(P.y)}" r="4" class="k-punkt"/>`;
    if (P.label) s += `<text x="${+X(P.x) + 7}" y="${+Y(P.y) - 6}" class="k-label">${P.label}</text>`;
  });

  /* Streckenzüge für qualitative Graphen */
  (o.polylinien || []).forEach(pl => {
    const p = pl.punkte.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ');
    s += `<polyline points="${p}" class="k-linie" fill="none"/>`;
  });

  const beschr = o.alt || 'Ein Koordinatensystem mit einer Geraden.';
  return `<svg viewBox="0 0 ${W} ${H}" class="k-svg" role="img" aria-label="${beschr}"
    preserveAspectRatio="xMidYMid meet">${s}</svg>`;
}

function fmtZ(x) {
  const g = Math.round(x * 1000) / 1000;
  return String(g).replace('.', ',');
}

/* ---------- Körperbilder ----------
   Schematische Schrägbilder als Inline-SVG. Wie beim Koordinatensystem:
   laden sofort, funktionieren offline, drucken in Graustufen. Die Zeichnung
   ist NICHT maßstäblich — die Zahlen tragen die Beschriftungen, genau wie im
   Schulbuch. So passt dasselbe Bild für 4 cm und für 40 cm.

   Aufruf:  "visual": { "type": "koerper", "form": "quader",
                        "labels": { "a": "5 cm", "b": "3 cm", "c": "4 cm" },
                        "alt": "Ein Quader …" }
   Formen: wuerfel · quader · prisma · zylinder · pyramide · kegel · kugel
   Jede Beschriftung ist optional; fehlt sie, bleibt die Kante unbeschriftet. */
function koerperSvg(v) {
  const L = v.labels || {};
  const alt = v.alt || 'Ein Körper-Schrägbild.';
  // Farben als Präsentationsattribute — kein CSS nötig, druckt sauber.
  const K = '#15233A';          // Kante (Tinte)
  const F = '#E2EBF6';          // sichtbare Fläche, hell
  const F2 = '#EDF1F3';         // zweite Fläche
  const H = '#8C99A8';          // verdeckte / Hilfslinie
  const T = '#15233A';          // Text
  const kante = `fill="none" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"`;
  const flanke = op => `fill="${op || F}" stroke="${K}" stroke-width="1.6" stroke-linejoin="round"`;
  const hilf = `fill="none" stroke="${H}" stroke-width="1.3" stroke-dasharray="4 3"`;
  const txt = (x, y, s, anchor) =>
    s ? `<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="13" fill="${T}" text-anchor="${anchor || 'middle'}">${s}</text>` : '';
  const masspfeil = '';
  let W = 260, Hh = 200, body = '';

  if (v.form === 'wuerfel' || v.form === 'quader') {
    // Kabinettprojektion: Vorderfläche + Tiefe schräg nach rechts oben.
    const x0 = 40, y0 = 150, bw = 120, bh = 90, dx = 46, dy = -34;
    // Flächen (hinten zuerst)
    body += `<polygon points="${x0},${y0-bh} ${x0+dx},${y0-bh+dy} ${x0+dx+bw},${y0-bh+dy} ${x0+bw},${y0-bh}" ${flanke(F2)}/>`; // Deckel
    body += `<polygon points="${x0+bw},${y0} ${x0+bw},${y0-bh} ${x0+dx+bw},${y0-bh+dy} ${x0+dx+bw},${y0+dy}" ${flanke(F2)}/>`; // rechte Seite
    body += `<rect x="${x0}" y="${y0-bh}" width="${bw}" height="${bh}" ${flanke(F)}/>`; // Vorderfläche
    // Beschriftungen
    body += txt(x0 + bw/2, y0 + 20, L.a, 'middle');          // a unten
    body += txt(x0 - 12, y0 - bh/2 + 4, L.c, 'end');         // c links (Höhe)
    body += txt(x0 + bw + dx/2 + 20, y0 - bh + dy/2 + 2, L.b, 'start'); // b Tiefe
    if (v.form === 'wuerfel') body += txt(x0 + bw/2, y0 - bh/2 + 4, L.a || 'a', 'middle');
  }

  else if (v.form === 'prisma') {
    // Liegendes Dreiecksprisma: Dreieck vorn, Tiefe nach rechts oben.
    const ax = 46, ay = 150, g = 130, hd = 78, dx = 52, dy = -38;
    const sx = ax + g/2, sy = ay - hd;              // Spitze Dreieck vorn
    // hinteres Dreieck
    body += `<polygon points="${ax+dx},${ay+dy} ${ax+g+dx},${ay+dy} ${sx+dx},${sy+dy}" ${flanke(F2)}/>`;
    // Mantelflächen
    body += `<polygon points="${ax},${ay} ${ax+g},${ay} ${ax+g+dx},${ay+dy} ${ax+dx},${ay+dy}" ${flanke(F2)}/>`; // Boden
    body += `<polygon points="${ax+g},${ay} ${sx},${sy} ${sx+dx},${sy+dy} ${ax+g+dx},${ay+dy}" ${flanke(F)}/>`;    // rechte Schräge
    // vorderes Dreieck (Grundfläche)
    body += `<polygon points="${ax},${ay} ${ax+g},${ay} ${sx},${sy}" ${flanke(F)}/>`;
    // Höhe im Dreieck (gestrichelt)
    body += `<line x1="${sx}" y1="${sy}" x2="${sx}" y2="${ay}" ${hilf}/>`;
    body += txt(sx + g/2 - 4, ay + 20, L.g, 'middle');       // Grundseite g
    body += txt(sx - 8, (sy + ay)/2 + 4, L.hd, 'end');       // Dreieckshöhe
    body += txt(ax + g + dx/2 + 18, ay + dy/2 + 2, L.h, 'start'); // Länge/Höhe Prisma
  }

  else if (v.form === 'zylinder') {
    const cx = 130, top = 42, bot = 158, rx = 66, ry = 18;
    // Mantel
    body += `<path d="M ${cx-rx} ${top} L ${cx-rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx+rx} ${bot} L ${cx+rx} ${top}" ${flanke(F)}/>`;
    // untere Ellipse: vorderer Bogen sichtbar, hinterer gestrichelt
    body += `<path d="M ${cx-rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx+rx} ${bot}" fill="none" stroke="${K}" stroke-width="1.6"/>`;
    body += `<path d="M ${cx-rx} ${bot} A ${rx} ${ry} 0 0 1 ${cx+rx} ${bot}" ${hilf}/>`;
    // obere Ellipse voll
    body += `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" ${flanke(F2)}/>`;
    // Radius oben
    body += `<line x1="${cx}" y1="${top}" x2="${cx+rx}" y2="${top}" ${kante}/>`;
    body += `<circle cx="${cx}" cy="${top}" r="2.4" fill="${K}"/>`;
    body += txt(cx + rx/2, top - 6, L.r, 'middle');
    body += `<line x1="${cx+rx+14}" y1="${top}" x2="${cx+rx+14}" y2="${bot}" ${hilf}/>`;
    body += txt(cx + rx + 20, (top+bot)/2 + 4, L.h, 'start');
  }

  else if (v.form === 'pyramide') {
    // Quadratische Pyramide, Grundfläche als Parallelogramm.
    const fx = 40, fy = 158, bw = 128, dx = 54, dy = -34, apex = [40 + 64 + 27, 40];
    const A = [fx, fy], B = [fx+bw, fy], C = [fx+bw+dx, fy+dy], D = [fx+dx, fy+dy];
    const S = apex, M = [(A[0]+C[0])/2, (A[1]+C[1])/2];
    // Grundfläche
    body += `<polygon points="${A} ${B} ${C} ${D}" ${flanke(F2)}/>`;
    // verdeckte Kanten
    body += `<line x1="${D[0]}" y1="${D[1]}" x2="${S[0]}" y2="${S[1]}" ${hilf}/>`;
    body += `<line x1="${M[0]}" y1="${M[1]}" x2="${S[0]}" y2="${S[1]}" ${hilf}/>`; // Höhe
    // sichtbare Seitenflächen
    body += `<polygon points="${A} ${B} ${S}" ${flanke(F)}/>`;
    body += `<polygon points="${B} ${C} ${S}" ${flanke(F2)}/>`;
    body += txt(fx + bw/2, fy + 20, L.a, 'middle');
    body += txt(M[0] + 6, (M[1]+S[1])/2 + 4, L.h, 'start');   // Höhe
    // Seitenhöhe s auf Vorderfläche
    const mAB = [(A[0]+B[0])/2, (A[1]+B[1])/2];
    body += `<line x1="${mAB[0]}" y1="${mAB[1]}" x2="${S[0]}" y2="${S[1]}" fill="none" stroke="${K}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
    body += txt((mAB[0]+S[0])/2 - 12, (mAB[1]+S[1])/2 + 4, L.s, 'end');
  }

  else if (v.form === 'kegel') {
    const cx = 128, top = 40, bot = 160, rx = 64, ry = 17;
    const S = [cx, top], A = [cx-rx, bot], B = [cx+rx, bot], M = [cx, bot];
    // Grundellipse: vorne voll, hinten gestrichelt
    body += `<path d="M ${A} A ${rx} ${ry} 0 0 1 ${B}" ${hilf}/>`;
    // Mantel
    body += `<path d="M ${A} L ${S} L ${B} A ${rx} ${ry} 0 0 1 ${A} Z" ${flanke(F)}/>`;
    body += `<path d="M ${A[0]} ${A[1]} A ${rx} ${ry} 0 0 0 ${B[0]} ${B[1]}" fill="none" stroke="${K}" stroke-width="1.6"/>`;
    // Höhe + Radius
    body += `<line x1="${S[0]}" y1="${S[1]}" x2="${M[0]}" y2="${M[1]}" ${hilf}/>`;
    body += `<line x1="${cx}" y1="${bot}" x2="${cx+rx}" y2="${bot}" ${kante}/>`;
    body += `<circle cx="${cx}" cy="${bot}" r="2.4" fill="${K}"/>`;
    body += txt(cx + rx/2, bot + 18, L.r, 'middle');
    body += txt(cx + 6, (top+bot)/2 + 4, L.h, 'start');
    body += txt((cx-rx + cx)/2 - 12, (bot + top)/2 + 4, L.s, 'end'); // Mantellinie
    body += `<line x1="${A[0]}" y1="${A[1]}" x2="${S[0]}" y2="${S[1]}" fill="none" stroke="${K}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
  }

  else if (v.form === 'kugel') {
    const cx = 130, cy = 100, r = 70;
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" ${flanke(F)}/>`;
    // Äquator-Ellipse
    body += `<path d="M ${cx-r} ${cy} A ${r} 20 0 0 0 ${cx+r} ${cy}" fill="none" stroke="${K}" stroke-width="1.4"/>`;
    body += `<path d="M ${cx-r} ${cy} A ${r} 20 0 0 1 ${cx+r} ${cy}" ${hilf}/>`;
    // Radius
    body += `<line x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy - r*0.0}" ${kante}/>`;
    body += `<line x1="${cx}" y1="${cy}" x2="${cx + r*0.7}" y2="${cy - r*0.7}" ${kante}/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="2.6" fill="${K}"/>`;
    body += txt(cx + r*0.42 - 4, cy - r*0.42 - 4, L.r, 'end');
  }

  else {
    body = `<text x="130" y="100" font-family="monospace" font-size="12" fill="${H}" text-anchor="middle">Unbekannte Form „${v.form || ''}"</text>`;
  }

  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" style="max-width:300px" role="img" aria-label="${alt}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

/* ---------- GeoGebra ----------
   Haken für eigene Materialien aus deinem GeoGebra-Buch. Ohne material_id
   erscheint ein ehrlicher Platzhalter statt eines leeren Kastens. */
function geogebraBlock(v) {
  const d = document.createElement('div');
  d.className = 'bild';
  if (!v.material_id) {
    d.innerHTML = `<div class="ggb-leer">
      <b>Hier fehlt noch eine GeoGebra-Material-ID.</b>
      Trage sie in der <code>tasks.json</code> unter <code>visual.material_id</code> ein —
      am besten aus einem eigenen GeoGebra-Buch, damit sie nicht verschwindet.</div>`;
    return d;
  }
  d.innerHTML = `<div class="ggb-wrap" id="ggb${++_uid}"></div>`;
  const ziel = d.firstChild.id;
  const los = () => new window.GGBApplet({
    material_id: v.material_id,
    scaleContainerClass: 'ggb-wrap',
    autoHeight: true, borderColor: null,
    showToolBar: false, showAlgebraInput: false, showMenuBar: false,
    enableRightClick: false, enableShiftDragZoom: true
  }, true).inject(ziel);

  if (window.GGBApplet) los();
  else {
    const s = document.createElement('script');
    s.src = 'https://www.geogebra.org/apps/deployggb.js';
    s.onload = los;
    s.onerror = () => { d.innerHTML = `<div class="ggb-leer">GeoGebra ist gerade nicht erreichbar.
      Die Aufgabe geht auch ohne — das Bild ist nur eine Hilfe.</div>`; };
    document.head.append(s);
  }
  return d;
}

/* ---------- Verteiler ---------- */

/* Statisch — für den Druck. */
function visualHtml(v) {
  if (!v) return '';
  if (v.type === 'streifen') return streifenHtml(v);
  if (v.type === 'koordinaten') return `<div class="bild">${koordinatenSvg(v)}</div>`;
  if (v.type === 'koerper') return `<div class="bild">${koerperSvg(v)}</div>`;
  if (v.type === 'geogebra') return '<div class="bild ggb-leer">[GeoGebra-Applet — nur am Gerät]</div>';
  if (v.type === 'animation') return (window.ANIM && window.ANIM.posterHtml)
    ? window.ANIM.posterHtml(v)
    : '<div class="bild">[Animation — nur am Gerät]</div>';
  return '';
}

/* Interaktiv — für den Bildschirm. */
function visualBlock(v) {
  if (!v) return document.createDocumentFragment();
  if (v.type === 'geogebra') return geogebraBlock(v);

  /* Bewegte Visualisierung (lineare Funktionen). animationen.js meldet
     sich als window.ANIM an; fehlt die Datei, greift der Platzhalter. */
  if (v.type === 'animation') {
    if (window.ANIM && window.ANIM.block) return window.ANIM.block(v);
    const p = document.createElement('div');
    p.className = 'bild';
    p.textContent = '[Animation — Animationsmodul nicht geladen]';
    return p;
  }

  const d = document.createElement('div');
  d.innerHTML = visualHtml(v);
  const block = d.firstElementChild;

  /* Regler am Steigungsdreieck: Das Dreieck wandert und wächst,
     m bleibt stehen. Genau das ist der Punkt der Stunde. */
  if (v.type === 'koordinaten' && v.regler && v.steigungsdreieck) {
    const L = v.lines[v.steigungsdreieck.line ?? 0];
    const stand = { x0: v.steigungsdreieck.x0, dx: v.steigungsdreieck.dx };
    const r = document.createElement('div');
    r.className = 'k-regler';
    r.innerHTML = `
      <label>Dreieck verschieben
        <input type="range" id="r-x0" min="${v.xmin ?? -1}" max="${(v.xmax ?? 7) - 1}" step="1" value="${stand.x0}"></label>
      <label>Dreieck breiter machen
        <input type="range" id="r-dx" min="1" max="4" step="1" value="${stand.dx}"></label>
      <div class="k-ablesung" id="r-out"></div>`;

    const neu = () => {
      const dy = L.m * stand.dx;
      block.innerHTML = koordinatenSvg(v, {
        steigungsdreieck: { ...v.steigungsdreieck, x0: stand.x0, dx: stand.dx }
      });
      r.querySelector('#r-out').innerHTML =
        `m = Δy : Δx = ${fmtZ(dy)} : ${fmtZ(stand.dx)} = <b>${fmtZ(L.m)}</b>`;
    };
    r.querySelector('#r-x0').addEventListener('input', e => { stand.x0 = +e.target.value; neu(); });
    r.querySelector('#r-dx').addEventListener('input', e => { stand.dx = +e.target.value; neu(); });

    const huelle = document.createElement('div');
    huelle.append(block, r);
    neu();
    return huelle;
  }
  return block;
}
