# Integration KP/SK · Prüfbericht

## Übernommene Erweiterung

- 12 Einheiten KP: Würfel, Quader, Prisma und Zylinder
- 12 Einheiten SK: Pyramide, Kegel, Kugel und zusammengesetzte Spitzkörper
- 336 neue Aufgaben; Gesamtstand: 54 Einheiten und 756 Aufgaben
- neue Inline-SVG-Körperzeichnungen
- erweiterte Prüfungsformelsammlung und Kompetenzübersicht
- Verzahnung der neuen Einheiten mit dem Warm-up

## Bei der Integration korrigiert

1. Kegelzeichnung: numerische SVG-Koordinaten für die senkrechte Höhe.
2. KP10-C1-011: 791,28 cm² wird korrekt auf 791 cm² gerundet.
3. KP10-C3-013: 301,44 cm² wird korrekt auf 301 cm² gerundet.
4. SK11-B4-008: 11,3825 cm³ wird korrekt auf 11,38 cm³ gerundet.
5. W-GEO wurde mit 15 Generatoren vollständig aktiviert.
6. Service-Worker-Version und Offlinecache wurden aktualisiert.
7. README wurde an `master`, 120 Generatoren, 8 Kategorien und den tatsächlichen Cacheumfang angepasst.

## Bewusst unverändert

Die bestehende Integration für Schülerlogin, Entwicklerwerkzeuge, Tracker,
Lehrerdashboard und Supabase-Schema wurde nicht ersetzt. Es ist keine neue
SQL-Migration erforderlich.

## Validierter Sollstand

- 54 Einheiten
- 756 Aufgaben
- Pfad A: 216, Pfad B: 324, Pfad C: 216
- 120 Warm-up-Generatoren in 8 Kategorien
- 12 KP- und 12 SK-Einheiten
- `devMode: true` (nur für den develop-Branch; vor dem Merge nach master wieder auf false setzen)
- Service-Worker-Cache: `mathe9-v11-kp-sk-animationen-develop`


## Durchgeführte Prüfungen

- 65 JSON-Dateien syntaktisch gültig
- 13 JavaScript-Dateien bestehen `node --check`
- keine doppelten Aufgaben- oder Generator-IDs
- alle 54 Einheiten im Index besitzen genau eine Aufgabendatei mit 14 Aufgaben
- alle 253 verwendeten Fehlvorstellungs-IDs sind im Fehlerprofil zugeordnet
- alle 84 Service-Worker-Ressourcen sind vorhanden
- 120 Warm-up-Generatoren wurden jeweils mit 100 Zufallsvarianten gegen den Parser getestet

Ein Live-End-to-End-Test gegen das echte Supabase-Projekt ist nicht Bestandteil
dieser Dateiprüfung. Das bestehende Supabase-Schema und die Integrationsdateien
wurden unverändert übernommen.

## Ergänzend integrierte Anpassungen

- niveaudifferenzierte Lernkarten für alle 54 Einheiten
- 10 interaktive Animationen zu linearen Funktionen in drei Niveaustufen
- neue Galerie `animationen.html`
- neue Dateien `assets/js/animationen.js` und `assets/css/anim.css`
- Animationen in Lernkarten über `visual.type = "animation"`
- Animationenseite nutzt denselben Schülerlogin, Tracker und Entwicklermodus
- alle Animationsdateien sind im Service-Worker-Cache enthalten
