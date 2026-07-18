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
  if (v.type === 'geogebra') return '<div class="bild ggb-leer">[GeoGebra-Applet — nur am Gerät]</div>';
  return '';
}

/* Interaktiv — für den Bildschirm. */
function visualBlock(v) {
  if (!v) return document.createDocumentFragment();
  if (v.type === 'geogebra') return geogebraBlock(v);

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
