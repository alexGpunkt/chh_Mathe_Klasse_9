/* ============================================================
   pdf.js · Minimaler PDF-Schreiber ohne Abhängigkeiten

   Das Projekt hat keinen Build-Step und keine node_modules — das soll auch
   so bleiben, wenn Arbeitsblätter dazukommen. Deshalb hier nur so viel PDF,
   wie ein Aufgabenblatt braucht: Text, Linien, Rechtecke, Seitenumbruch.

   Schrift: die 14 Standardschriften (Helvetica), die jeder PDF-Betrachter
   mitbringt. Keine eingebettete Datei, keine Lizenzfrage, wenige Kilobyte.

   Zeichensatz: WinAnsiEncoding. Umlaute, ß, €, ², ³, · und die deutschen
   Anführungszeichen sind darin enthalten. Was fehlt (π, ≈, →, ⅓), wird in
   UMSCHRIFT ersetzt — sichtbar und nachvollziehbar, statt als leeres
   Kästchen im Druck zu landen.
   ============================================================ */
'use strict';

/* Zeichen, die WinAnsiEncoding nicht kennt. Lieber lesbar ersetzen als
   still verschlucken. */
const UMSCHRIFT = [
  [/π/g, 'Pi'],        // π
  [/≈/g, 'rund'],      // ≈
  [/→/g, '->'],        // →
  [/⅓/g, '1/3'],       // ⅓
  [/⅔/g, '2/3'],       // ⅔
  [/½/g, '1/2'],       // ½ (in WinAnsi zwar vorhanden, aber uneinheitlich gesetzt)
  [/−/g, '-'],         // typografisches Minus
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/·/g, '·']     // · bleibt
];

/* WinAnsi weicht oberhalb von 127 von Unicode ab. Nur die Zeichen, die in
   diesem Projekt tatsächlich vorkommen. */
const WINANSI = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x201e, 0x84], [0x2026, 0x85],
  [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93], [0x201d, 0x94],
  [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97]
]);

function nachWinAnsi(text) {
  let s = String(text);
  for (const [muster, ersatz] of UMSCHRIFT) s = s.replace(muster, ersatz);
  const bytes = [];
  for (const zeichen of s) {
    const code = zeichen.codePointAt(0);
    if (WINANSI.has(code)) { bytes.push(WINANSI.get(code)); continue; }
    if (code <= 0xff) { bytes.push(code); continue; }
    bytes.push(0x3f); // ?
  }
  return Buffer.from(bytes);
}

/* Zeichenbreiten der Standard-Helvetica in 1/1000 em. Vollständig genug für
   Umbruch und Zentrierung; ohne sie liefe jede Zeile über den Rand. */
const BREITEN_NORMAL = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
  '8': 556, '9': 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556,
  '@': 1015, 'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
  'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778,
  'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944,
  'X': 667, 'Y': 667, 'Z': 611, '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556,
  '`': 333, 'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556,
  'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556,
  'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722,
  'x': 500, 'y': 500, 'z': 500, '{': 334, '|': 260, '}': 334, '~': 584
};
const BREITEN_FETT = {
  ' ': 278, '!': 333, '"': 474, '#': 556, '$': 556, '%': 889, '&': 722, "'": 238,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556,
  '8': 556, '9': 556, ':': 333, ';': 333, '<': 584, '=': 584, '>': 584, '?': 611,
  '@': 975, 'A': 722, 'B': 722, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778,
  'H': 722, 'I': 278, 'J': 556, 'K': 722, 'L': 611, 'M': 833, 'N': 722, 'O': 778,
  'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944,
  'X': 667, 'Y': 667, 'Z': 611, '[': 333, '\\': 278, ']': 333, '^': 584, '_': 556,
  '`': 333, 'a': 556, 'b': 611, 'c': 556, 'd': 611, 'e': 556, 'f': 333, 'g': 611,
  'h': 611, 'i': 278, 'j': 278, 'k': 556, 'l': 278, 'm': 889, 'n': 611, 'o': 611,
  'p': 611, 'q': 611, 'r': 389, 's': 556, 't': 333, 'u': 611, 'v': 556, 'w': 778,
  'x': 556, 'y': 556, 'z': 500, '{': 389, '|': 280, '}': 389, '~': 584
};
/* Umlaute und Sonderzeichen: Helvetica setzt sie so breit wie den Grundbuchstaben. */
const ERSATZBREITE = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U', 'ß': 'b', '€': '0', '²': '3', '³': '3', '·': '.', '„': '"', '“': '"', '–': '-' };

function zeichenbreite(zeichen, fett) {
  const tabelle = fett ? BREITEN_FETT : BREITEN_NORMAL;
  if (tabelle[zeichen] != null) return tabelle[zeichen];
  const ersatz = ERSATZBREITE[zeichen];
  if (ersatz && tabelle[ersatz] != null) return tabelle[ersatz];
  return 556;
}

function textbreite(text, groesse, fett) {
  let summe = 0;
  for (const z of String(text)) summe += zeichenbreite(z, fett);
  return summe * groesse / 1000;
}

/* Umbruch an Leerzeichen. Ein Wort, das allein zu breit ist, bleibt stehen
   und ragt heraus — das ist sichtbar und damit besser als ein stiller
   Zeichensalat mitten im Wort. */
function umbrechen(text, breite, groesse, fett) {
  const zeilen = [];
  for (const absatz of String(text).split('\n')) {
    let zeile = '';
    for (const wort of absatz.split(/\s+/)) {
      const versuch = zeile ? zeile + ' ' + wort : wort;
      if (zeile && textbreite(versuch, groesse, fett) > breite) {
        zeilen.push(zeile);
        zeile = wort;
      } else {
        zeile = versuch;
      }
    }
    zeilen.push(zeile);
  }
  return zeilen;
}

/* ---------- Dokument ---------- */
class PDF {
  constructor({ breite = 595.28, hoehe = 841.89, rand = 48 } = {}) {
    this.breite = breite;      // A4 in Punkt
    this.hoehe = hoehe;
    this.rand = rand;
    this.seiten = [];
    this.neueSeite();
  }

  neueSeite() {
    this.strom = [];
    this.seiten.push(this.strom);
    this.y = this.hoehe - this.rand;
    return this;
  }

  get nutzbreite() { return this.breite - 2 * this.rand; }

  platzPruefen(hoehe) {
    if (this.y - hoehe < this.rand) this.neueSeite();
  }

  text(inhalt, { groesse = 11, fett = false, x = null, abstand = 3, farbe = null } = {}) {
    const zeilen = umbrechen(inhalt, this.nutzbreite - ((x || this.rand) - this.rand), groesse, fett);
    for (const zeile of zeilen) {
      this.platzPruefen(groesse + abstand);
      const roh = nachWinAnsi(zeile).toString('latin1')
        .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      const teile = ['BT'];
      if (farbe) teile.push(`${farbe[0]} ${farbe[1]} ${farbe[2]} rg`);
      teile.push(`/${fett ? 'F2' : 'F1'} ${groesse} Tf`);
      teile.push(`1 0 0 1 ${(x ?? this.rand).toFixed(2)} ${(this.y - groesse).toFixed(2)} Tm`);
      teile.push(`(${roh}) Tj`);
      if (farbe) teile.push('0 0 0 rg');
      teile.push('ET');
      this.strom.push(teile.join(' '));
      this.y -= groesse + abstand;
    }
    return this;
  }

  luecke(hoehe) { this.platzPruefen(hoehe); this.y -= hoehe; return this; }

  linie(x1, y1, x2, y2, dicke = 0.6) {
    this.strom.push(`${dicke} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    return this;
  }

  /* Schreibfeld: gepunktete Hilfslinien, damit handschriftlich gerechnet
     werden kann, ohne dass das Blatt wie kariertes Papier aussieht. */
  schreibfeld(hoehe, { linien = true } = {}) {
    this.platzPruefen(hoehe + 6);
    const oben = this.y;
    const unten = this.y - hoehe;
    if (linien) {
      this.strom.push('0.85 0.85 0.85 RG');
      for (let y = oben - 22; y > unten + 4; y -= 22) {
        this.linie(this.rand + 6, y, this.breite - this.rand - 6, y, 0.4);
      }
      this.strom.push('0 0 0 RG');
    }
    this.y = unten;
    return this;
  }

  rahmen(hoehe, { fuellung = null } = {}) {
    this.platzPruefen(hoehe);
    const x = this.rand;
    const y = this.y - hoehe;
    if (fuellung) {
      this.strom.push(`${fuellung[0]} ${fuellung[1]} ${fuellung[2]} rg`);
      this.strom.push(`${x.toFixed(2)} ${y.toFixed(2)} ${this.nutzbreite.toFixed(2)} ${hoehe.toFixed(2)} re f`);
      this.strom.push('0 0 0 rg');
    }
    this.strom.push(`0.6 w ${x.toFixed(2)} ${y.toFixed(2)} ${this.nutzbreite.toFixed(2)} ${hoehe.toFixed(2)} re S`);
    return this;
  }

  /* Höhe, die ein Text belegen wird — für Kästen, die erst gezeichnet und
     dann gefüllt werden. */
  hoeheVon(inhalt, groesse = 11, fett = false, abstand = 3) {
    return umbrechen(inhalt, this.nutzbreite, groesse, fett).length * (groesse + abstand);
  }

  bauen(titel) {
    const objekte = [];
    const hinzu = inhalt => { objekte.push(inhalt); return objekte.length; };

    const schriftNormal = hinzu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const schriftFett = hinzu('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    const seitenIds = [];
    const inhaltIds = [];
    for (const strom of this.seiten) {
      const daten = strom.join('\n');
      inhaltIds.push(hinzu(`<< /Length ${Buffer.byteLength(daten, 'latin1')} >>\nstream\n${daten}\nendstream`));
      seitenIds.push(null);
    }

    const seitenbaum = objekte.length + this.seiten.length + 1;
    for (let i = 0; i < this.seiten.length; i++) {
      seitenIds[i] = hinzu(
        `<< /Type /Page /Parent ${seitenbaum} 0 R /MediaBox [0 0 ${this.breite.toFixed(2)} ${this.hoehe.toFixed(2)}] ` +
        `/Resources << /Font << /F1 ${schriftNormal} 0 R /F2 ${schriftFett} 0 R >> >> /Contents ${inhaltIds[i]} 0 R >>`
      );
    }
    const baumId = hinzu(`<< /Type /Pages /Kids [${seitenIds.map(id => id + ' 0 R').join(' ')}] /Count ${seitenIds.length} >>`);
    const infoId = hinzu(`<< /Title (${nachWinAnsi(titel || '').toString('latin1').replace(/[()\\]/g, '')}) /Producer (Mathe 9 - werkzeuge/uebungsblaetter.js) >>`);
    const wurzelId = hinzu(`<< /Type /Catalog /Pages ${baumId} 0 R >>`);

    let pdf = '%PDF-1.4\n';
    const versatz = [];
    objekte.forEach((inhalt, i) => {
      versatz.push(Buffer.byteLength(pdf, 'latin1'));
      pdf += `${i + 1} 0 obj\n${inhalt}\nendobj\n`;
    });
    const xrefStart = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
    for (const v of versatz) pdf += String(v).padStart(10, '0') + ' 00000 n \n';
    pdf += `trailer\n<< /Size ${objekte.length + 1} /Root ${wurzelId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
  }
}

module.exports = { PDF, textbreite, umbrechen };
