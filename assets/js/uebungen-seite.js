/* ============================================================
   uebungen-seite.js · Klicks auf externe Übungen protokollieren

   Lag bis V28 als Inline-Skript in uebungen.html. Ausgelagert, damit die
   Content-Security-Policy ohne 'unsafe-inline' für Skripte auskommt.

   Erfasst wird die Plattform und der Titel des Verweises — nicht, was auf
   der fremden Seite anschließend passiert. Dorthin reicht die Anwendung
   nicht, und das ist gut so.

   Seit V30 öffnet uebungsrahmen.js die Übung INNERHALB der Anwendung und
   protokolliert das Öffnen selbst. Hier bleibt nur der Fall, den der
   Rahmen nicht übernimmt: bewusst in einem neuen Tab geöffnet (Mittelklick
   oder Strg/Cmd). Ohne diese Zeilen wäre genau dieser Weg unsichtbar.
   ============================================================ */
'use strict';

document.addEventListener('auxclick', event => {
  if (event.button !== 1) return;
  melde(event.target.closest('a.ua-link'), 'neuer_tab');
});

document.addEventListener('click', event => {
  if (!(event.metaKey || event.ctrlKey || event.shiftKey)) return;
  melde(event.target.closest('a.ua-link'), 'neuer_tab');
});

function melde(link, art) {
  if (!link) return;
  if (window.Tracker && typeof window.Tracker.track === 'function') {
    window.Tracker.track('external_practice_open', {
      provider: link.dataset.provider || 'external',
      title: link.textContent.trim(),
      link_type: link.parentElement?.querySelector('.ua-tag') ? 'sammlung' : 'app',
      source: 'overview',
      mode: art
    });
  }
}
