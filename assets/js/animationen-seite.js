/* ============================================================
   animationen-seite.js · Galerie der Animationen aufbauen

   Lag bis V28 als Inline-Skript in animationen.html. Ausgelagert, damit
   die Content-Security-Policy ohne 'unsafe-inline' für Skripte auskommt:
   Sonst wäre jede eingeschleuste <script>-Zeile genauso erlaubt wie diese.
   ============================================================ */
'use strict';

(() => {
  const bereich = new URLSearchParams(location.search).get('bereich');
  const namen = {
    PZ: 'Prozent & Zinsrechnung in Bewegung',
    LF: 'Lineare Funktionen in Bewegung',
    KP: 'Körper, Prismen & Zylinder in Bewegung',
    SK: 'Spitzkörper in Bewegung'
  };
  if (namen[bereich]) {
    document.getElementById('anim-titel').textContent = namen[bereich];
    document.title = namen[bereich] + ' · Mathe 9';
  }
  ANIM.galerie(document.getElementById('galerie'), {
    breite: 360,
    bereich: ['PZ', 'LF', 'KP', 'SK'].includes(bereich) ? bereich : null
  });
})();
