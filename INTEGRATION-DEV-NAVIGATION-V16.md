# Integration V16 – Entwickler-Schnellnavigation

Im Entwicklermodus (`devMode: true`) enthält das 🐞-Menü jetzt eine zentrale Navigation.

## Funktionen

- Direkte Sprünge zu den Lernbereichen PZ, LF, KP und SK
- Auswahl jeder einzelnen Einheit über Lernbereich- und Einheitenliste
- Direkter Wechsel zur passenden Animationsgalerie
- Direkter Wechsel zur Gesamtübersicht, zum Warm-up und zum Lehrerdashboard
- Das Entwicklermenü ist auch im Lehrerdashboard, Arbeitsblattgenerator und in der Kompetenzmatrix verfügbar
- Beim Wechsel in das Lehrerdashboard bleibt die Lehrkraft-Sitzung im selben Browser-Tab erhalten
- Die lokale Option „Supabase deaktivieren“ schaltet Supabase im Lehrerdashboard nicht ab
- Alle Links werden relativ zur App-Wurzel erzeugt und funktionieren deshalb auch aus `/dashboard/`

## Angepasste Dateien

- `assets/js/dev-tools.js`
- `index.html`
- `arbeitsblatt.html`
- `matrix.html`
- `dashboard/index.html`
- `sw.js`

## Cache-Version

```javascript
const VERSION = 'mathe9-v16-dev-navigation-develop';
```

Vor dem Merge nach `master` weiterhin `devMode: false` setzen und die Cache-Version erneut erhöhen.
