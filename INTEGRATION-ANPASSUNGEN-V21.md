# Integration und Fehlerprüfung – V21

## Vergleich mit dem bestehenden Projekt

Grundlage war die funktionskorrigierte Develop-Version V20. Das neu hochgeladene
Paket wurde vollständig entpackt und dateiweise verglichen.

- aktueller V20-Stand: 105 Dateien
- neues Anpassungspaket: 96 Dateien
- neue, nur im Anpassungspaket vorhandene Dateien: 0
- abweichende Dateien: 20
- im Anpassungspaket fehlende aktuelle Integrationsdateien: 9

Das Paket enthielt damit keine neue Funktion, die in V20 noch fehlte. Die
Abweichungen waren überwiegend ältere oder unvollständige Varianten.

## Nicht übernommene Regressionen

- `devMode: false` trotz Develop-Branch
- Rückstufung des Service Workers auf `mathe9-v10-kp-sk-integriert`
- cache-first für HTML, CSS und JavaScript mit Risiko gemischter Versionen
- ältere Entwicklernavigation ohne Lernbereichs-, Einheits- und Dashboardwechsel
- Entfernung des sicheren Visualisierungs-Fallbacks `visualBlockSicher()`
- Entfernung der robusten Wortspeicher-Markierung
- einfaches Ausgeben externer URLs ohne HTTPS- und Host-Allowlist
- Verlust der Bereichsfilter in der Animationsgalerie
- Entfernung des Entwicklermenüs von Lehrkraftseiten und Dashboard
- fünf erneut fehlerhafte LearningApps-Sammlungsadressen mit
  `&displayfolder=` statt `?displayfolder=`

## Verbesserungen in V21

- alle aktuellen V20-Funktionen und Sicherheitskorrekturen beibehalten
- Service-Worker-Version auf `mathe9-v21-verified-merge-develop` erhöht
- README-Statistik zu Fehlvorstellungen aktualisiert
- Tracking-Dokumentation an `supabase-config.js` und den aktuellen Schülerdatensatz
  angepasst
- Upload-Anleitung auf V21 aktualisiert

## Validierung

- 65 JSON-Dateien erfolgreich geparst
- 54 Einheiten und 756 eindeutige Aufgaben
- Pfadverteilung A/B/C: 216 / 324 / 216
- 162 vollständige Lernkarten
- 40 eindeutige Animationen
- 138 gültige Animationsverweise
- 88 externe Übungsverweise in den Einheitsdaten
- 51 unterschiedliche externe Zieladressen
- Anbieter: 43 LearningApps, 29 Serlo, 6 ZUM, 4 H5P,
  3 Learningsnacks und 3 Quizlet
- alle externen Links: HTTPS, erlaubter Host und nicht leerer Titel
- keine fehlerhaft aufgebauten `displayfolder`-Adressen
- alle JavaScript-Dateien mit `node --check` geprüft
- alle lokalen HTML-, CSS-, JavaScript- und JSON-Verweise vorhanden
- keine doppelten HTML-IDs
- alle 91 Service-Worker-Ressourcen vorhanden

Ein Live-End-to-End-Test gegen das reale Supabase-Projekt und eine fachliche
Live-Prüfung der externen Drittanbieter-Seiten waren nicht Bestandteil der
lokalen Dateiprüfung.
