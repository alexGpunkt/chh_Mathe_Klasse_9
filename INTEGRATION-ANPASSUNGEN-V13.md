# Integration der angehängten Anpassungen – v13

Ausgangsbasis war die bereits korrigierte Develop-Fassung mit KP-01 bis KP-12,
SK-01 bis SK-12, Lernkarten, Animationen und Render-Fallback.

Die angehängte ZIP wurde vollständig verglichen. Ihre fachlichen Inhalte,
Aufgaben, Animationen und Lernkarten waren bereits in der Ausgangsbasis
enthalten. Unterschiede, die bestehende Schutzfunktionen zurückgesetzt hätten,
wurden bewusst nicht übernommen.

Zusätzlich verbessert:

- Service Worker lädt HTML, JavaScript, CSS und JSON online zuerst aus dem Netz
  und verwendet den Cache nur als Offline-Rückfall.
- Dadurch werden gemischte Skriptversionen nach Updates vermieden.
- Im Develop-Modus zeigt der Visualisierungs-Fallback die technische Ursache an.
- Cache-Version: `mathe9-v13-adjustments-develop`.

Vor dem Merge nach `master`:

- `devMode` in `assets/js/supabase-config.js` auf `false` setzen.
- Cache-Version in `sw.js` erneut erhöhen.
