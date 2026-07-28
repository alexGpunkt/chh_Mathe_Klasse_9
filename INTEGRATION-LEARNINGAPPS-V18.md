# Integration V18 · LearningApps

## Übernommene Anpassungen

- neue Übersichtsseite `uebungen.html`
- vier LearningApps-Kacheln auf der Startseite
- 43 Zuordnungen externer Übungen in 34 Einheiten
- 27 unterschiedliche LearningApps-Adressen
- aufklappbare Übungskarte direkt auf passenden Einheitsseiten
- direkter LearningApps-Wechsel im Entwicklermenü
- Aufnahme von `uebungen.html` in den Offlinecache

## Bewusst erhaltene Projektfunktionen

Die hochgeladene Ausgangsfassung enthielt bei mehreren Systemdateien ältere
Varianten. Deshalb wurden die neuen Übungslinks gezielt in den aktuellen
V17-Stand integriert, ohne folgende Funktionen zurückzusetzen:

- alle 40 Animationen und 138 Animationsverweise
- Entwicklernavigation zwischen PZ, LF, KP, SK und Lehrerdashboard
- `devMode: true` für den Branch `develop`
- Schülerlogin, Supabase-Tracking und Lehrerdashboard
- `visualBlockSicher()` und die robuste Wortspeicher-Markierung
- Network-first-Aktualisierung von HTML, CSS, JavaScript und JSON
- vollständiger Offline-Fallback

## Sicherheit und Bedienung

`engine.js` akzeptiert für `uebungslinks` ausschließlich HTTPS-Adressen auf
`learningapps.org`. Links öffnen in einem neuen Tab mit
`rel="noopener noreferrer"`. Ungültige oder fremde Adressen werden nicht
angezeigt.

Die Übungskarte ist eine normale aufklappbare Karte im Seitenfluss und keine
zweite feste Schublade. Dadurch überlagert sie die bestehende Formelkarte am
unteren Bildschirmrand nicht.

## Cache-Version

```javascript
const VERSION = 'mathe9-v18-learningapps-develop';
```

Vor dem Merge nach `master`:

1. `devMode` auf `false` setzen.
2. Cache-Version erneut erhöhen.
3. LearningApps vor dem Unterricht fachlich und technisch prüfen.
