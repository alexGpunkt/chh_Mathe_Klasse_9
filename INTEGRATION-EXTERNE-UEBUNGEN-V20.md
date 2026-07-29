# Integration externer Übungen – V20

## Ausgangslage

Basis ist die korrigierte Develop-Version V19. Aus dem neuen Anpassungspaket
wurden die erweiterten Übungsverweise übernommen, ohne ältere Varianten von
Engine, Entwicklernavigation, Login, Tracking oder Service Worker
zurückzuspielen.

## Integriert

- LearningApps, Serlo, H5P/Landesbildungsserver, Learningsnacks, Quizlet und ZUM
- 88 Verweise in 39 Einheiten
- 51 unterschiedliche Zieladressen
- Quellenchips auf der Einheitsseite und in `uebungen.html`
- Übersichtstexte auf der Startseite
- Knopf **Externe Übungen** im Entwicklermenü
- Trackingereignis `external_practice_open` mit Plattform, Titel und Linktyp

## Sicherheits- und Kompatibilitätskorrekturen

- Der Renderer akzeptiert nur HTTPS-Links zu einer festen Host-Allowlist.
- Die Plattform wird aus der tatsächlichen URL ermittelt; das Datenfeld
  `quelle` allein wird nicht vertraut.
- Fünf fehlerhafte LearningApps-Sammlungsadressen wurden korrigiert:
  `?displayfolder=` statt `&displayfolder=` direkt hinter dem Benutzernamen.
- `target="_blank"` und `rel="noopener noreferrer"` bleiben gesetzt.
- `visualBlockSicher()`, robuste Wortspeicher-Markierung, Developer-Navigation,
  Schülerlogin, Supabase-Tracker und Network-first-Service-Worker bleiben erhalten.
- Die Übungskarte bleibt im normalen Seitenfluss und überlagert die feste
  Formelkarte nicht.

## Datenstand

| Quelle | Verweise |
|---|---:|
| LearningApps | 43 |
| Serlo | 29 |
| ZUM | 6 |
| H5P/Landesbildungsserver | 4 |
| Learningsnacks | 3 |
| Quizlet | 3 |
| **Gesamt** | **88** |

## Prüfungen

- 65 JSON-Dateien erfolgreich geparst
- 54 Einheiten und 756 eindeutige Aufgaben
- Pfadverteilung A/B/C: 216 / 324 / 216
- 162 Lernkarten
- 138 gültige Animationsverweise
- alle JavaScript-Dateien mit `node --check` geprüft
- alle lokalen HTML-, CSS-, JS- und JSON-Verweise vorhanden
- alle 91 Service-Worker-Ressourcen vorhanden
- alle Übungslinks: HTTPS, erlaubter Host, Titel, Typ und passende Quelle
- keine fehlerhaft aufgebauten `displayfolder`-Adressen
- alle 51 URLs der Einheitsdaten sind auch in `uebungen.html` enthalten
- außerhalb von `uebungslinks` blieben sämtliche Einheitsdaten gegenüber V19 unverändert
- isolierter Renderer-Test: HTTP- und Fremdhost-Links verworfen, Duplikate entfernt, Quellenchips und Tracking korrekt erzeugt

Die externen Zielseiten wurden nicht live abgerufen. Ihre Inhalte und
Verfügbarkeit können sich unabhängig vom Projekt ändern.

## Develop-Konfiguration

```javascript
devMode: true
```

```javascript
const VERSION = 'mathe9-v20-external-exercises-develop';
```
