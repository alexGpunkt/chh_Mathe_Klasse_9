# Upload in den Branch develop

Diese Fassung ist vollständig für den Branch `develop` vorbereitet.

## Enthalten

- 54 Einheiten mit 756 Aufgaben
- KP-01 bis KP-12
- SK-01 bis SK-12
- Lernkarten für die Pfade A, B und C in allen Einheiten
- 10 niveaudifferenzierte Animationen zu linearen Funktionen
- W-GEO mit 15 Warm-up-Generatoren
- bestehender Schülerlogin, Supabase-Tracker und Lehrerdashboard

## Develop-Einstellungen

- `assets/js/supabase-config.js`: `devMode: true`
- `sw.js`: `mathe9-v11-kp-sk-animationen-develop`

Vor dem späteren Merge nach `master`:

1. `devMode` auf `false` setzen.
2. Cache-Version in `sw.js` erneut erhöhen, z. B. auf
   `mathe9-v12-kp-sk-animationen-master`.
3. Die veröffentlichte Seite vollständig testen.

## Hochladen

Den Inhalt dieses Ordners in die Wurzel des Branches `develop` laden. Es darf
keine zusätzliche äußere Ordnerebene im Repository entstehen.
