# Integration, Fehlerbehebung und Supabase-Vorbereitung V35

**Projekt:** Mathe 9 · Campus Hannah Höch  
**Zielbranch:** `develop`  
**Ausgangsbasis:** geprüfter V31-Stand  
**Integrierter Upload:** `chh_Mathe_Klasse_9(3).zip` / Git-Commit `786aefd` (`v32 bis v34: Übungsblätter je Lernweg, Taschenrechner, Beameransicht`)  
**Neuer Stand:** V35  
**Cache-Version:** `mathe9-v35-integration-preflight-develop`  
**Supabase:** in diesem Schritt **nicht** gegen eine reale Datenbank ausgeführt

## 1. Ergebnis der Integration

Der Upload baut inhaltlich sauber auf dem bisherigen V31-Stand auf. Der Commit direkt vor den neuen Änderungen (`1bfec19`) entspricht dem geprüften V31-Inhalt. Die im hochgeladenen Windows-Arbeitsverzeichnis zusätzlich als geändert markierten Dateien enthielten nach Normalisierung keine weiteren fachlichen Änderungen; es handelte sich um Zeilenenden-Unterschiede (CRLF/LF). Diese Scheinänderungen wurden nicht als neuer Projektinhalt übernommen.

V35 integriert damit die echten V32–V34-Erweiterungen, bereinigt Entwicklungsreste und behebt die bei der Prüfung gefundenen Laufzeit-, Bedien- und Wartbarkeitsfehler.

## 2. Übernommene V32–V34-Erweiterungen

### Animationen und externe Übungen

- 42 registrierte Animationen in fünf Modulen (`Kern`, `PZ`, `LF`, `KP`, `SK`)
- 159 Animationsverweise in den Lernkarten/Aufgaben
- neue beziehungsweise vervollständigte Animationen, darunter `graphlesen`
- bereichsabhängiges Nachladen über `animationen-laden.js`
- 118 externe Übungsverweise
- externe Übungen stärker an den gewählten Lernweg angepasst

### Niveaudifferenzierte Übungsblätter

- 54 Einheiten mit je einem Blatt für A, B und C
- 162 PDF-Dateien insgesamt
- 324 Aufgabengeneratoren
- A: stärker vereinfachte/glatte Zahlen
- B: Standardbestand
- C: anspruchsvollere Werte beziehungsweise zusätzliche Vertiefungsaufgaben
- deterministische Generierung mit reproduzierbaren Saaten

### Taschenrechner

- Vollbildrechner in Einheit, Warm-up und Prüfung
- eigener Parser ohne `eval`
- Klammern, Punkt-vor-Strich, Quadrat, Potenzen, Wurzel, π, Prozent
- Übernahme des Ergebnisses in das aktive Antwortfeld
- Tastaturbedienung einschließlich `R`, `Alt+R`, `F2`, `Esc`

### Dauerfortschritt und Beameransicht

- Fortschritt wird bei Aufgabenwechsel, Fehlversuch und zusätzlich ungefähr alle 20 Sekunden aktualisiert
- Beameransicht mit Lernstand und Verbindungsstatus aller aktiven Lernenden
- Kommunikationsweg Dashboard → Beamer über `BroadcastChannel`
- Pingstatus mit Zeit- und Fehlergrenzen
- Schüler ohne Fortschrittszeile werden grundsätzlich mit dargestellt

### Performance

- Animationen nach Lernbereich aufgeteilt
- Entwicklerwerkzeuge werden nur bei `devMode` nachgeladen
- Lehrerdashboard nicht mehr Bestandteil des vorinstallierten Schüler-Offlinepakets
- aktueller Stand weiterhin innerhalb des Performancebudgets

## 3. In V35 gefundene und behobene Fehler

### 3.1 Taschenrechner: Priorität von Potenz und Vorzeichen

V34 berechnete `-2^2` als `4`. Mathematisch muss ohne Klammern zuerst potenziert werden:

```text
-2^2 = -(2^2) = -4
```

Die Parsergrammatik wurde korrigiert. Gleichzeitig bleiben korrekt:

```text
(-2)^2 = 4
2^-2 = 0,25
2^3^2 = 512
```

### 3.2 Taschenrechner: Eingabe nach `=`

Nach `2 + 3 = 5` führte die nächste Ziffer `4` zuvor zu `54`. V35 unterscheidet nun:

- Ziffer/Konstante nach `=` → neue Rechnung
- Operator nach `=` → mit vorherigem Ergebnis weiterrechnen

Die Regression ist zusätzlich im offiziellen Playwright-Smoke-Test verankert.

### 3.3 Beamer: Pingfehler gingen nach einer Antwort verloren

V34 verwendete für „letzter Kontakt“ und „letzter Heartbeat“ dieselbe Logik. Kam nach einem Heartbeat mit beispielsweise drei Fehlversuchen eine normale Antwort an, konnte der Fehlerzähler wieder auf null fallen.

V35 trennt:

- `letzterKontakt`: jedes erfolgreich empfangene Ereignis
- `letzterHeartbeat`: Quelle des gemeldeten `ping_fails`

Dadurch zeigt die Beameransicht Verbindungsprobleme weiterhin korrekt an.

### 3.4 Beamer: Laufzeitfehler bei Kindern ohne Fortschrittszeile

Nach der oben genannten Aufteilung blieb in einem Codepfad die alte Variable `letzterPing` stehen. Für einen aktiven Schüler ohne Fortschrittsdatensatz konnte deshalb ein `ReferenceError` entstehen und der Aufbau der Beamerliste abbrechen.

Der Pfad verwendet jetzt ebenfalls `letzterKontakt`. Ein gezielter Laufzeittest deckt sowohl Schüler mit Fortschritt als auch reine Roster-Zeilen ab.

### 3.5 Dashboard: zu kleine Touchziele

Durch die erweiterte Barrierefreiheitsprüfung wurden Schaltflächen mit 34–42 px Höhe gefunden. Auf Touchgeräten sind diese unnötig klein.

V35 setzt die betroffenen Lehrer-/Beamerbedienelemente auf mindestens 44 px Höhe.

### 3.6 Barrierefreiheitsprüfung war unvollständig

`dashboard/beamer.html` und mehrere neue CSS-Dateien waren noch nicht Bestandteil des automatischen A11y-Checks.

V35 prüft nun:

- 10 HTML-Seiten
- 297 Bilder
- App-, Animations-, Buch-, Rechner-, Dashboard- und Beamer-CSS

### 3.7 Didaktischer Aufbauprüfer verfälschte Phasennummern

Die Gruppierung des Berichts ersetzte Ziffern so, dass aus `Phase 3` intern ein fehlerhaftes Platzhalterformat werden konnte. V35 bewahrt die Phasennummer und abstrahiert nur variable Zahlenwerte.

Der aktuelle Bericht nennt wieder korrekt beispielsweise:

```text
131× Phase 3 ohne Sicherungsaufgabe
3×   Phase 1 nur statisch
```

### 3.8 Zeilenenden erzeugten Scheinänderungen

Das hochgeladene Windows-Arbeitsverzeichnis zeigte zahlreiche modifizierte Dateien, obwohl der Inhalt nach LF/CRLF-Normalisierung identisch zum Commit war.

`.gitattributes` enthält deshalb jetzt zusätzlich:

```text
* text=auto eol=lf
```

PDFs, Bilder, Schriftdateien und ZIPs bleiben ausdrücklich binär. Das verhindert zugleich eine Beschädigung der 162 erzeugten PDF-Dateien durch Zeilenendenkonvertierung.

### 3.9 Temporäre Entwicklungsdateien entfernt

Nicht in die V35-Verteilung übernommen wurden unter anderem:

- `tests/test-results/`
- temporärer `tests/smoke/tmp-blatt.spec.js`
- `anpassungen.txt`
- alte Patchnotiz `PATCH-ANWENDUNG-V27.txt`

Die eigentlichen Smoke-Tests bleiben erhalten.

### 3.10 Veraltete technische Kommentare bereinigt

Unter anderem wurden Hinweise aktualisiert, die noch von einer monolithischen `animationen.js` oder nur einem `uebungsblatt.pdf` je Einheit ausgingen. Das Performancebudget beschreibt jetzt den tatsächlich aufgeteilten Stand.

## 4. Vorbereitung des nächsten Supabase-Abgleichs

### 4.1 Keine Datenbankänderung in V35

`supabase/setup.sql` wurde strukturell gegen den Projektcode geprüft, in diesem Integrationsschritt jedoch **nicht** im realen Test- oder Produktivprojekt ausgeführt.

Das ist beabsichtigt: Erst soll der Istzustand der bestehenden Datenbank erfasst werden. Danach wird entschieden, welche Teile der Migration tatsächlich benötigt werden.

### 4.2 Neue streng lesende Bestandsaufnahme

Neu ist:

```text
supabase/abgleich-readonly.sql
```

Die Datei enthält ausschließlich `SELECT`-Abfragen und verändert weder Schema noch Daten noch Rechte.

Sie ist außerdem für einen älteren beziehungsweise unvollständigen Datenbankstand ausgelegt:

- alle zehn V35-Solltabellen werden einzeln als vorhanden/nicht vorhanden ausgewiesen
- RLS-Status wird angezeigt
- vorhandene Policies werden gelistet
- Mathe9-Funktionen und `SECURITY DEFINER` werden gelistet
- Browserrollen-Rechte werden gelistet
- kritische RPC-Rechte werden über `to_regprocedure()` fehlertolerant geprüft
- `pg_cron` wird nur über die Erweiterungstabelle geprüft
- Zeilenzahlen werden nur statistisch angegeben; keine Schülerdaten werden ausgegeben

`werkzeuge/pruefen.js` kontrolliert künftig automatisch, dass diese Datei keine schreibenden oder strukturverändernden SQL-Anweisungen enthält.

### 4.3 V35-Sollinventar für den späteren Abgleich

Erwartete Tabellen:

1. `mathe9_students`
2. `mathe9_events`
3. `mathe9_progress`
4. `mathe9_wartung_laeufe`
5. `mathe9_teachers`
6. `mathe9_teacher_audit`
7. `mathe9_student_tokens`
8. `mathe9_unterricht`
9. `mathe9_freigaben`
10. `mathe9_lernzeit`

Erwartete zentrale Funktionen/RPCs:

- `mathe9_validate_student_login` (Legacy-Funktion, für Browserrollen am Ende gesperrt)
- `mathe9_aufraeumen`
- `mathe9_wartung_status`
- `mathe9_person_export`
- `mathe9_person_loeschen`
- `mathe9_lehrkraft_freischalten`
- `mathe9_lehrkraft_sperren`
- `mathe9_ist_lehrkraft`
- `mathe9_lehrkraft_uebersicht`
- `mathe9_student_anmelden`
- `mathe9_token_student`
- `mathe9_student_sitzung`
- `mathe9_student_abmelden`
- `mathe9_lernmodus`
- `mathe9_lernzeit_melden`
- `mathe9_unterricht_setzen`
- `mathe9_freigeben`
- `mathe9_freigabe_zuruecknehmen`

Die Projektprüfung kontrolliert jetzt das vollständige Tabellen-/Funktionsinventar, RLS auf allen zehn Tabellen und den Entzug des alten Login-RPCs für `public`, `anon` und `authenticated`.

### 4.4 Sicherer Ablauf im nächsten Schritt

1. aktuelle produktive Supabase-Datenbank zunächst **nicht** verändern
2. `abgleich-readonly.sql` im SQL Editor ausführen
3. die Ergebnisblöcke mit dem V35-Sollstand vergleichen
4. danach Backup/Restore-Möglichkeit prüfen
5. erst anschließend Migration in einem separaten Testprojekt ausführen
6. RLS, Rollen, Tokens, Unterrichtsmodus, Freigaben und Lernzeit mit echten Browserrollen testen
7. erst nach bestandenen Tests Produktivmigration planen

Wichtig: Der Supabase SQL Editor läuft mit weitreichenden administrativen Rechten. Ein erfolgreicher `SELECT` dort beweist nicht, dass RLS für `anon` oder `authenticated` korrekt arbeitet. Die eigentlichen Sicherheitstests müssen später über die Data API beziehungsweise die Anwendung mit den jeweiligen Rollen erfolgen.

## 5. Prüfergebnisse V35

### Projektstruktur

| Bestandteil | Ergebnis |
|---|---:|
| Lernbereiche | 4 |
| Einheiten | 54 |
| Aufgaben | 756 |
| Aufgaben A / B / C | 216 / 324 / 216 |
| Lernkarten | 162 |
| Animationen | 42 |
| Animationsverweise | 159 |
| externe Übungsverweise | 118 |
| Erklärvideo-Verweise | 135 |
| unterschiedliche Video-Adressen | 133 |
| Fehlvorstellungs-IDs | 268 |
| Fehlvorstellungskategorien | 17 |
| JSON-Dateien | 75 |
| Service-Worker-Einträge | 104 |
| Übungsblatt-Generatoren | 324 |
| Übungsblatt-PDFs | 162 |

### Automatische Prüfungen

Erfolgreich:

- `node werkzeuge/pruefen.js`
- `node werkzeuge/a11y-pruefen.js`
- `node werkzeuge/budget-pruefen.js`
- `node werkzeuge/uebungsblatt-pruefen.js`
- Syntaxprüfung sämtlicher JavaScript-Dateien
- 324 Generatoren mit je 300 Zufallsproben
- alle 162 PDFs mit genau zwei Seiten
- keine alten `uebungsblatt.pdf`-Dateien mehr vorhanden
- Taschenrechner-Laufzeittest für Potenzregeln und Eingabe nach `=`
- Beamer-Datenaufbereitung mit Heartbeatfehlern und Roster-Kind ohne Fortschritt

### Performancebudget

| Kennzahl | Ist | Grenze |
|---|---:|---:|
| größte Schülerseite, JavaScript gzip | 97 KB | 120 KB |
| JavaScript gesamt gzip | 146 KB | 150 KB |
| CSS gesamt gzip | 19 KB | 25 KB |
| größte ausgelieferte JavaScript-Datei roh | 78 KB | 200 KB |
| Offlinepaket | 1758 KB | 2200 KB |

Das Gesamt-JavaScript hat mit 146 von 150 KB nur noch geringe Reserve. Neue größere Funktionen sollten deshalb nicht mehr unkritisch in die globale Schülerlast eingebaut werden.

### Didaktischer Strukturbericht

Der Aufbauprüfer meldet weiterhin **inhaltliche Ausbaupunkte**, keine technischen Integrationsfehler:

- 131 Pfad-/Einheitsfälle: Phase 3 ohne eigene Sicherungsaufgabe
- 3 Fälle: Phase 1 nur statisch (`LF-07`, `LF-09`)
- 4 von 54 Einheiten ohne solche Abweichung (`PZ-04`, `PZ-05`, `KP-01`, `SK-01`)

Diese Punkte wurden bewusst nicht automatisch umgeschrieben, weil sie die didaktische Aufgabenfolge verändern. Sie gehören in einen späteren fachlichen Ausbau.

## 6. Testgrenzen

Der vollständige HTTP-basierte Playwright-Lernweg kann in der aktuellen Arbeitsumgebung nicht lokal navigieren (`ERR_BLOCKED_BY_ADMINISTRATOR`). Das ist eine Einschränkung der Testumgebung. Die gezielten Laufzeittests wurden über lokal eingesetztes HTML durchgeführt; die vollständigen Browser-Smoke-Tests sollen nach dem Push in GitHub Actions laufen.

Nicht durchgeführt wurden:

- Verbindung mit dem realen Supabase-Projekt
- Ausführung von `setup.sql` in Supabase
- echte RLS-/Rollenprüfung über `anon` und `authenticated`
- Liveprüfung aller externen Drittanbieterinhalte
- reale Smartphone-/Screenreader-Prüfung

## 7. Empfohlener Einbau

V35 zunächst ausschließlich auf `develop` verwenden.

Empfohlene Commit-Nachricht:

```text
Integrate V34 features, fix runtime issues and prepare Supabase preflight
```

Danach:

1. `Commit to develop`
2. `Push origin`
3. GitHub Actions vollständig abwarten
4. Offlinecache/Service Worker auf V35 aktualisieren
5. noch **nicht** nach `master` mergen
6. im nächsten Schritt den lesenden Supabase-Istabgleich durchführen
