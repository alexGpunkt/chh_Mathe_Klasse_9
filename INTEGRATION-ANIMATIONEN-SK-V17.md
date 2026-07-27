# Integration V17 – Animationen für Spitzkörper

## Neu

Die noch fehlenden Animationen für den Lernbereich **SK – Spitzkörper** wurden
in den aktuellen Develop-Stand integriert.

### Neue Animationen

1. `pyramide` – Teile einer Pyramide erkennen (`SK-01`)
2. `pythpyr` – rechtwinkliges Dreieck in der Pyramide (`SK-02`)
3. `volpyr` – Pyramidenvolumen und Faktor 1/3 (`SK-03`)
4. `obpyr` – Oberfläche und Netz der Pyramide (`SK-04`)
5. `rueckwaerts` – rückwärts und gemischt (`SK-05`, auch `SK-09`)
6. `kegel` – Radius, Höhe und Mantellinie (`SK-06`)
7. `volkegel` – Kegelvolumen und Faktor 1/3 (`SK-07`)
8. `obkegel` – Kegelmantel als Kreissektor (`SK-08`)
9. `kugel` – Oberfläche und Volumen der Kugel (`SK-10`)
10. `zusammensk` – zusammengesetzte Spitzkörper (`SK-11`)

Jede Animation besitzt die Stufen A, B und C. In `SK-01` bis `SK-11` wurden
jeweils drei Lernkartenverweise ergänzt. `SK-12` bleibt als gemischtes
Prüfungstraining ohne eigene Animation.

## Bewahrte Systemfunktionen

- Entwicklernavigation einschließlich Lehrerdashboard
- Schülerlogin, Tracker und Supabase
- sicherer Visualisierungs-Fallback
- Network-first-Aktualisierung für HTML, CSS, JavaScript und JSON
- Offlinecache mit vollständiger Anwendungsschale
- `devMode: true` im Develop-Branch

## Service Worker

```javascript
const VERSION = 'mathe9-v17-sk-animationen-develop';
```

Vor dem Merge nach `master` muss `devMode` wieder auf `false` gesetzt und die
Cache-Version erneut erhöht werden.
