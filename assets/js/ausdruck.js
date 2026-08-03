/* ============================================================
   ausdruck.js · Aufgabengeneratoren: auswerten, formatieren, würfeln

   Dieselbe Datei läuft im Browser (Warm-up) UND in Node
   (werkzeuge/uebungsblaetter.js). Das ist Absicht: Die Lösungen auf den
   gedruckten Übungsblättern werden damit von genau demselben Code
   berechnet, der sie in der Anwendung prüft. Zwei Implementierungen
   wären zwei Gelegenheiten, sich zu verrechnen — und ein gedrucktes
   Blatt lässt sich nicht nachträglich korrigieren.

   Lag bis V30 als Block 1 bis 3 in spiral.js.
   ============================================================ */

/* ============================================================
   1 · Ausdrucksauswertung ohne eval
   Grammatik: vergleich → ausdruck → term → faktor → primär
   Erlaubt: + - * / ( ) Zahlen, Variablennamen, < > <= >= == !=
   ============================================================ */

function tokenisiere(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      t.push({ art: 'zahl', wert: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      t.push({ art: 'name', wert: s.slice(i, j) });
      i = j; continue;
    }
    const zwei = s.slice(i, i + 2);
    if (['<=', '>=', '==', '!='].includes(zwei)) { t.push({ art: 'op', wert: zwei }); i += 2; continue; }
    if ('+-*/()<>,'.includes(c)) { t.push({ art: 'op', wert: c }); i++; continue; }
    throw new Error('Unerwartetes Zeichen: ' + c);
  }
  return t;
}

/* Eine kleine, feste Funktionsliste. Sie ist der Grund, warum die
   Bedingungen der Übungsblätter überhaupt formulierbar sind: „Das Ergebnis
   muss bei zwei Nachkommastellen aufgehen" heißt ganz(x * 100). Ohne diese
   Prüfung landen 33,333… auf einem gedruckten Blatt, und das Kind kann
   seine Rechnung nicht mit der Lösung vergleichen.

   Bewusst kein Zugriff auf Math von außen: Nur diese Namen sind erlaubt,
   und jeder rechnet mit Zahlen. */
const FUNKTIONEN = {
  ganz: x => (Math.abs(x - Math.round(x)) < 1e-9 ? 1 : 0),
  runde: (x, k = 0) => Math.round(x * 10 ** k) / 10 ** k,
  betrag: x => Math.abs(x),
  wurzel: x => Math.sqrt(x),
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a)
};

function werteAus(ausdruck, vars) {
  const t = tokenisiere(ausdruck);
  let i = 0;
  const schau = () => t[i];
  const nimm = () => t[i++];

  function primaer() {
    const k = nimm();
    if (!k) throw new Error('Ausdruck endet zu früh');
    if (k.art === 'zahl') return k.wert;
    if (k.art === 'name') {
      /* Funktionsaufruf: Name direkt gefolgt von einer Klammer. */
      if (schau() && schau().wert === '(' && FUNKTIONEN[k.wert]) {
        nimm();
        const args = [];
        if (schau() && schau().wert !== ')') {
          args.push(vergleich());
          while (schau() && schau().wert === ',') { nimm(); args.push(vergleich()); }
        }
        const zu = nimm();
        if (!zu || zu.wert !== ')') throw new Error('Klammer nach ' + k.wert + ' nicht geschlossen');
        return FUNKTIONEN[k.wert](...args);
      }
      if (!(k.wert in vars)) throw new Error('Unbekannte Variable: ' + k.wert);
      return vars[k.wert];
    }
    if (k.wert === '(') {
      const v = vergleich();
      const zu = nimm();
      if (!zu || zu.wert !== ')') throw new Error('Klammer nicht geschlossen');
      return v;
    }
    throw new Error('Unerwartet: ' + k.wert);
  }
  function faktor() {
    if (schau() && schau().wert === '-') { nimm(); return -faktor(); }
    if (schau() && schau().wert === '+') { nimm(); return faktor(); }
    return primaer();
  }
  function term() {
    let v = faktor();
    while (schau() && (schau().wert === '*' || schau().wert === '/')) {
      const op = nimm().wert;
      const r = faktor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function ausdr() {
    let v = term();
    while (schau() && (schau().wert === '+' || schau().wert === '-')) {
      const op = nimm().wert;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function vergleich() {
    const l = ausdr();
    const k = schau();
    if (k && ['<', '>', '<=', '>=', '==', '!='].includes(k.wert)) {
      nimm();
      const r = ausdr();
      switch (k.wert) {
        case '<':  return l <  r ? 1 : 0;
        case '>':  return l >  r ? 1 : 0;
        case '<=': return l <= r ? 1 : 0;
        case '>=': return l >= r ? 1 : 0;
        case '==': return Math.abs(l - r) < 1e-9 ? 1 : 0;
        case '!=': return Math.abs(l - r) >= 1e-9 ? 1 : 0;
      }
    }
    return l;
  }

  const v = vergleich();
  if (i < t.length) throw new Error('Rest im Ausdruck: ' + t[i].wert);
  return v;
}

/* ============================================================
   2 · Zahlen deutsch formatieren
   ============================================================ */

function fmt(x) {
  if (typeof x !== 'number' || !isFinite(x)) return String(x);
  const g = Math.round(x * 1e6) / 1e6;
  let s = Number.isInteger(g) ? String(g) : String(g).replace('.', ',');
  const [ganz, rest] = s.split(',');
  const mitTrenner = ganz.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  /* Typografisches Minus (−), nicht der Bindestrich (-). */
  return (rest ? mitTrenner + ',' + rest : mitTrenner).replace('-', '\u2212');
}

/* Vorzeichenbehaftetes Anhängen: aus b = −1 wird "− 1", aus b = 3 wird "+ 3".
   Damit steht in keiner Aufgabe mehr "y = 2x + -1". */
function fmtVorzeichen(x) {
  return (x < 0 ? '\u2212 ' : '+ ') + fmt(Math.abs(x));
}

/* Geld hat immer zwei Nachkommastellen. "3,6 €" liest sich falsch. */
function fmtGeld(x) {
  const s = Math.abs(x).toFixed(2).replace('.', ',');
  const [ganz, rest] = s.split(',');
  return (x < 0 ? '-' : '') + ganz.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + rest;
}

/* Platzhalter dürfen rechnen: {G} genauso wie {100-p} oder {1+p/100}.
   Mit :€ als Zusatz wird als Geldbetrag formatiert — {pa:€} → "3,60".
   Das spart Hilfsvariablen in jedem Generator. */
function fuelle(vorlage, vars) {
  return String(vorlage).replace(/\{([^{}:]+)(?::(€|\u00b1))?\}/g, (ganz, ausdruck, flagge) => {
    try {
      const w = werteAus(ausdruck, vars);
      if (flagge === '€') return fmtGeld(w);
      if (flagge === '\u00b1') return fmtVorzeichen(w);
      return fmt(w);
    } catch { return ganz; }
  });
}

/* ============================================================
   3 · Aus einem Generator eine konkrete Aufgabe würfeln
   ============================================================ */

function zufallVar(def) {
  if (def.aus) return def.aus[Math.floor(Math.random() * def.aus.length)];
  const schritt = def.schritt || 1;
  const n = Math.floor((def.bis - def.von) / schritt) + 1;
  return def.von + Math.floor(Math.random() * n) * schritt;
}

function baue(gen) {
  let vars = null;
  for (let versuch = 0; versuch < 200; versuch++) {
    const v = {};
    for (const [name, def] of Object.entries(gen.vars || {})) v[name] = zufallVar(def);
    for (const [name, ausdruck] of Object.entries(gen.berechnet || {})) {
      v[name] = werteAus(ausdruck, v);
    }
    if (gen.bedingung && !werteAus(gen.bedingung, v)) continue;
    vars = v; break;
  }
  if (!vars) throw new Error(`Generator ${gen.id}: Bedingung nie erfüllt`);

  const roh = werteAus(gen.answer, vars);
  const stellen = gen.round ?? 2;
  const antwort = Math.round(roh * 10 ** stellen) / 10 ** stellen;
  vars.ergebnis = antwort;

  const mis = (gen.misconceptions || []).map(m => ({
    id: m.id,
    value: Math.round(werteAus(m.value, vars) * 10 ** stellen) / 10 ** stellen,
    feedback: fuelle(m.feedback, vars)
  })).filter(m => Math.abs(m.value - antwort) > (gen.tolerance ?? 0.005));

  return {
    genId: gen.id,
    kategorie: gen.kategorie,
    skill: gen.skill,
    /* Die gewürfelten Werte bleiben am Ergebnis hängen. Der Prüfer der
       Übungsblätter rechnet damit nach, ob die gedruckte Lösung bei der
       angegebenen Rundung überhaupt exakt ist. Getrackt wird das Feld nie —
       die Anwendung sendet ausdrücklich nur Kategorie und Fähigkeit. */
    vars: { ...vars },
    prompt: fuelle(gen.template, vars),
    answer: antwort,
    unit_label: gen.unit_label || '',
    tolerance: gen.tolerance ?? 0.005,
    hint: gen.hint ? fuelle(gen.hint, vars) : null,
    solution: gen.solution ? fuelle(gen.solution, vars) : null,
    misconceptions: mis
  };
}

/* Im Browser hängen die Funktionen am globalen Objekt (spiral.js nutzt sie
   direkt), in Node werden sie exportiert. Kein Build-Step, kein Modulformat,
   das der eine oder andere nicht versteht. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    tokenisiere, werteAus, fmt, fmtVorzeichen, fmtGeld, fuelle, zufallVar, baue
  };
}
