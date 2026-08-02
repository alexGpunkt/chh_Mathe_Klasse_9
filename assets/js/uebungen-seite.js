/* ============================================================
   uebungen-seite.js · Klicks auf externe Übungen protokollieren

   Lag bis V28 als Inline-Skript in uebungen.html. Ausgelagert, damit die
   Content-Security-Policy ohne 'unsafe-inline' für Skripte auskommt.

   Erfasst wird die Plattform und der Titel des Verweises — nicht, was auf
   der fremden Seite anschließend passiert. Dorthin reicht die Anwendung
   nicht, und das ist gut so.
   ============================================================ */
'use strict';

document.addEventListener('click', event => {
  const link = event.target.closest('a.ua-link');
  if (!link) return;
  if (window.Tracker && typeof window.Tracker.track === 'function') {
    window.Tracker.track('external_practice_open', {
      provider: link.dataset.provider || 'external',
      title: link.textContent.trim(),
      link_type: link.parentElement?.querySelector('.ua-tag') ? 'sammlung' : 'app',
      source: 'overview'
    });
  }
});
