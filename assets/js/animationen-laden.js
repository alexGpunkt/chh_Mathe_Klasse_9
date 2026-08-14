/* ============================================================
   animationen-laden.js · Den passenden Animationsblock nachholen

   Eine Einheitenseite zeigt Animationen genau eines Lernbereichs.
   Bis V34 lud sie trotzdem alle 42 — 48 KB gzip, von denen rund
   drei Viertel für diese Einheit ohne Bedeutung waren.

   Diese Datei liest den Lernbereich aus `?u=` und hängt nur die
   zugehörige Datei ein. Der Kern (animationen-kern.js) steht bereits;
   er bringt die Registry, die Bedienleiste und die Signalwort-Animation
   mit, die zu allen vier Bereichen gehört.

   Geprüft und maschinell abgesichert: Keine Einheit verweist auf eine
   Animation eines fremden Lernbereichs — siehe werkzeuge/pruefen.js,
   Abschnitt „Animationsverweise". Käme das je vor, meldet die Prüfung
   es, bevor es im Unterricht auffällt.

   window.ANIM.bereit ist das Versprechen, dass der Block da ist.
   engine.js wartet darauf, bevor es die erste Karte baut.
   ============================================================ */

(function () {
  'use strict';

  const BEREICHE = ['pz', 'lf', 'kp', 'sk'];

  /* Dieselbe Vorgabe wie in engine.js: Ohne ?u= wird pz-05 geöffnet. */
  const einheit = new URLSearchParams(location.search).get('u') || 'pz-05';
  const bereich = String(einheit).split('-')[0].toLowerCase();
  const gewaehlt = BEREICHE.includes(bereich) ? bereich : 'pz';

  window.ANIM = window.ANIM || {};

  /* Ohne Kern gibt es nichts einzuhängen. Das ist kein stiller Fehler:
     Ohne Registry käme später nur „Animation nicht gefunden". */
  if (!window.ANIM._intern) {
    console.error('[Mathe9 Animation] animationen-kern.js fehlt oder wurde nach '
      + 'animationen-laden.js eingebunden. Der Kern muss zuerst stehen.');
    window.ANIM.bereit = Promise.resolve(false);
    return;
  }

  const quelle = document.currentScript?.src
    || new URL('assets/js/animationen-laden.js', location.href).href;

  window.ANIM.bereich = gewaehlt;
  window.ANIM.bereit = new Promise(fertig => {
    const s = document.createElement('script');
    s.src = new URL('animationen-' + gewaehlt + '.js', quelle).href;
    s.async = false;
    s.addEventListener('load', () => fertig(true));
    /* Ein fehlender Block darf die Einheit nicht aufhalten. zeichnen.js
       zeigt dann seinen Platzhalter, die Aufgaben bleiben bearbeitbar. */
    s.addEventListener('error', () => {
      console.warn('[Mathe9 Animation] Block „' + gewaehlt + '" nicht ladbar. '
        + 'Die Aufgaben funktionieren, die Bilder fehlen.');
      fertig(false);
    });
    (document.head || document.documentElement).appendChild(s);
  });
})();
