# Integration und Optimierung V28

**Projekt:** Mathe 9 · Campus Hannah Höch  
**Zielbranch:** `develop`  
**Stand:** V28 · sichere Integration und automatisierte Prüfung  
**Cache-Version:** `mathe9-v28-secure-integration-develop`  
**Grundlage:** die hochgeladene Projektfassung `chh_Mathe_Klasse_9(1).zip`

## 1. Gesamturteil

Die hochgeladenen Anpassungen verfolgen die richtige Richtung und stellen einen deutlichen Qualitätssprung dar. Besonders wertvoll sind:

- dauerhafte Lernstände und Wiederaufnahme,
- Lehrerrollen und Schüler-Sitzungstoken,
- datenschutzbezogene Verwaltungsfunktionen,
- aufgabensitzungsbezogene Dashboard-Auswertungen,
- Konzeptfehler-Kategorien,
- Textalternativen für Animationen,
- automatische Projekt- und Browsertests,
- Release- und Versionswerkzeuge.

In der angelieferten Form war die Integration jedoch noch nicht vollständig sicher und zuverlässig. Die größten Risiken lagen bei `SECURITY DEFINER`-Funktionen, der Token-Lebensdauer, der Trennung gemeinsam genutzter Geräte, der Dashboard-Gruppierung, der Release-Automatisierung und der tatsächlichen Ausführung der Browserprüfungen in GitHub Actions.

V28 behebt diese Integrationsprobleme, erhält die vorhandenen Funktionen und ordnet sie in die aktuelle Projektstruktur ein.

## 2. Wesentliche vorgenommene Verbesserungen

### 2.1 Verwaltungs-RPCs gegen unberechtigte Nutzung abgesichert

Die Funktionen

- `mathe9_aufraeumen`,
- `mathe9_person_export`,
- `mathe9_person_loeschen`

laufen als `SECURITY DEFINER`. Solche Funktionen umgehen die normale Row-Level-Security und müssen ihre Berechtigung deshalb selbst prüfen.

V28 enthält nun in jeder Verwaltungsfunktion eine ausdrückliche Lehrkraftprüfung. Nicht autorisierte angemeldete Nutzer erhalten SQLSTATE `42501`. Der geplante serverseitige Aufräumjob kann weiterhin ohne Benutzer-JWT ausgeführt werden.

### 2.2 Bestehende Schüler-Sitzungen werden wiederverwendet

Zuvor konnte bei nahezu jedem Online-Seitenaufruf ein neues Schülertoken erzeugt werden. Das hätte die Token-Tabelle unnötig vergrößert und die Sitzung schwerer nachvollziehbar gemacht.

V28 speichert zusätzlich:

- zugehörige Schüler-ID,
- Ablaufzeit,
- Zeitpunkt der letzten Serverprüfung.

Ein vorhandenes Token wird über `mathe9_student_sitzung()` geprüft und normalerweise wiederverwendet. Eine erneute Serverprüfung erfolgt höchstens alle 15 Minuten oder ausdrücklich erzwungen nach einem Zugriffsfehler.

### 2.3 Kein unsicherer Rückfall auf die alte Anmeldung

Die alte Funktion `mathe9_validate_student_login` liefert nur eine Schüler-ID und bietet keine belastbare Bindung späterer Schreibzugriffe an die erfolgreiche Anmeldung.

V28 verwendet diesen Rückfall nicht mehr automatisch. Fehlt die neue Datenbankmigration, erscheint eine verständliche Migrationsmeldung. Nach erfolgreicher Migration werden die Ausführungsrechte auf die alte Funktion entzogen.

### 2.4 Tracker erneuert abgelaufene Token kontrolliert

Vor Ereignis- und Fortschrittsübertragungen stellt der Tracker jetzt über `Mathe9StudentLogin.ensureToken()` sicher, dass ein gültiges Sitzungstoken vorliegt.

Bei HTTP 401 oder 403 geschieht genau ein kontrollierter Ablauf:

1. Token serverseitig neu prüfen beziehungsweise erneuern,
2. Schreibvorgang einmal wiederholen,
3. bei weiterem Fehler Ereignis in der Offlinewarteschlange behalten.

Endlosschleifen werden vermieden.

### 2.5 Deaktivierte Schüler verlieren sofort ihre Schreibberechtigung

Die Tokenauflösung prüft nicht nur das Token, sondern verbindet es mit dem aktuellen Eintrag in `mathe9_students`. Ist ein Schüler deaktiviert, kann auch ein zuvor gültiges Token keine neuen Daten mehr schreiben.

### 2.6 Abgelaufene Schülertoken werden bereinigt

`mathe9_aufraeumen()` entfernt nun zusätzlich abgelaufene Schülertoken und gibt deren Anzahl im Ergebnis aus. Dadurch wächst die Token-Tabelle nicht unbegrenzt.

### 2.7 Lehrerdashboard prüft die Rolle sofort

Eine erfolgreiche Supabase-Anmeldung allein reicht nicht mehr aus. Das Dashboard ruft unmittelbar `mathe9_ist_lehrkraft()` auf. Nutzer ohne Lehrkraftfreigabe erhalten eine eindeutige Meldung und keine Dashboarddaten.

### 2.8 Aufgabensitzungen stabil gruppiert

Eine `task_session_id` ist nur zusammen mit Schüler beziehungsweise Gerät eindeutig. V28 gruppiert daher nach:

```text
Schüler/Gerät + task_session_id
```

Heartbeats aktualisieren die letzte Aktivität der Sitzung. Als „festgehängt“ wird eine Sitzung nur angezeigt, wenn sie innerhalb der letzten fünf Minuten noch aktiv war. Alte, bloß nicht sauber beendete Sitzungen erzeugen keine dauerhaften Warnungen mehr.

### 2.9 Pfadempfehlungen genauer ausgewertet

Eine Empfehlung gilt jetzt nur dann als angenommen, wenn innerhalb von 30 Minuten ein ausdrückliches `path_selected` für dieselbe Einheit und den empfohlenen Pfad folgt.

Für die anschließende Leistung werden die ersten fünf eindeutigen Aufgabensitzungen derselben Einheit und desselben Pfades innerhalb von 60 Minuten betrachtet. Entscheidend ist jeweils die erste Antwort der Aufgabe, nicht die bloße Anzahl aller Antwortversuche.

Für alte Daten ohne `path_selected` bleibt ein enger Rückfall erhalten.

### 2.10 Interner Engine-Zustand nicht mehr global offengelegt

`window.S = S` wurde entfernt. Stattdessen gibt es nur noch eine datensparsame Diagnosefunktion, die keine Lösungen oder vollständigen Schülerantworten offenlegt.

Die Playwright-Tests laden erwartete Aufgaben-IDs und Antworten aus den jeweiligen JSON-Dateien und verwenden die Diagnoseoberfläche nur zur Navigation und Zustandsprüfung.

### 2.11 Browser-Smoke-Tests laufen nun tatsächlich in GitHub Actions

Der Prüfworkflow enthält jetzt einen eigenen Job:

- `npm ci`,
- Installation von Chromium,
- Ausführung der Playwright-Smoke-Tests,
- Upload von Screenshots und Testberichten bei Fehlern.

Damit sind die vorhandenen Browsertests nicht mehr nur Projektdateien, sondern Teil der automatischen Qualitätskontrolle.

### 2.12 Release-Skript sicherer gemacht

Das Produktionsskript:

- ändert Tracking nicht mehr stillschweigend,
- verlangt bei einer bewussten Änderung `--tracking` oder `--ohne-tracking`,
- deaktiviert Entwicklermodus und Testzugänge,
- erhöht die Produktions-Cache-Version,
- erzeugt ein Versionsmanifest,
- führt alle Projektprüfungen aus,
- stellt bei einem Fehler sämtliche geänderten Dateien wieder her.

Ein Probelauf plant aus V28 die Produktionsversion V29, schreibt aber ohne `--schreiben` nichts.

### 2.13 Versions- und Cachekonsistenz geprüft

`version.json` und `sw.js` stimmen nun überein:

```text
Projektversion: v28
Cache-Version: mathe9-v28-secure-integration-develop
```

Das Prüfskript erkennt zusätzlich Änderungen im lokalen Arbeitsverzeichnis, die bei unveränderter Cache-Version sonst unbemerkt geblieben wären.

### 2.14 Konzeptfehler fachlich präzisiert

In 23 nicht prozentbezogenen Aufgaben war die Kategorie `grundwert_prozentwert_vertauscht` verwendet worden, obwohl es dort allgemein um eine Verwechslung von Multiplikation und Division ging.

Diese Einträge wurden in `mal_geteilt_vertauscht` geändert. Betroffen sind zwölf Einheiten aus LF und KP. Das JSON-Schema akzeptiert nun nur noch die festgelegten Konzeptkategorien statt beliebiger Zeichenfolgen.

### 2.15 Farbkontraste verbessert

Mehrere helle Status- und Pfadfarben waren für kleine Smartphoneschriften zu schwach. Angepasst wurden unter anderem:

- sekundäre Textfarbe,
- Pfad A / Erfolg,
- Pfad B,
- Fehlerfarbe,
- Text im Merkkasten,
- entsprechende Farben der Animationen.

Die statische Barrierefreiheitsprüfung meldet danach keine maschinell erkennbaren Kontrastwarnungen mehr.

### 2.16 Animationstexte vollständig abgesichert

Alle 41 Animationen besitzen Textfassungen für A, B und C. Fehlt künftig eine differenzierte Textfassung, fällt der Renderer tatsächlich auf den allgemeinen Kurztext der Animation zurück, statt einen leeren Abschnitt zu erzeugen.

### 2.17 Externe Übungen effizienter geprüft

Die 88 Übungsverweise werden auf 51 unterschiedliche URLs reduziert und mit begrenzter Parallelität geprüft. Ein Fehler wird anschließend wieder allen betroffenen Einheiten zugeordnet.

Der Workflow startet:

- manuell,
- automatisch jeden Montag um 05:20 Uhr UTC.

### 2.18 Projektarchiv bereinigt

Nicht in die verteilbare V28-Fassung übernommen wurden:

- `.git/`,
- `.claude/`,
- `tests/node_modules/`,
- Playwright-Testergebnisse,
- lokale Notiz- und Patchdateien.

Eine `.gitignore` schützt vor einer erneuten Aufnahme dieser Dateien.

## 3. Validierung

### Erfolgreich ausgeführt

- 69 JSON-Dateien gelesen,
- 54 Einheiten gegen das Schema geprüft,
- 54 Einheiten mit `units/index.json` abgeglichen,
- Sollverteilung 4/6/4 je Einheit geprüft,
- 756 eindeutige Aufgaben-IDs,
- 147 Animationsverweise auf 41 Animationen,
- 41 Animationen mit Textfassungen A/B/C,
- 94 Service-Worker-Ressourcen,
- 88 externe Übungsverweise strukturell geprüft,
- JavaScript-Syntax geprüft,
- Versionsmanifest und Cache-Version abgeglichen,
- Supabase-SQL strukturell auf Transaktion, Verwaltungsrechte, Tokenpflege und Funktionsblöcke geprüft,
- 9 HTML-Seiten und 287 Bilder statisch auf Barrierefreiheit geprüft,
- Release-Probelauf ohne Schreibzugriff erfolgreich,
- vorhandenes Schülertoken in einem gezielten Headless-Test wiederverwendet, ohne ein neues Token auszustellen.

### Nicht vollständig lokal ausführbar

Der vollständige Playwright-Lernweg konnte in der Arbeitsumgebung nicht über einen lokalen HTTP-Server geöffnet werden, weil lokale Browsernavigation mit `ERR_BLOCKED_BY_ADMINISTRATOR` blockiert wurde. Das ist eine Beschränkung der Prüfungsumgebung und kein nachgewiesener Anwendungsfehler.

Der Browser-Smoke-Test ist deshalb in GitHub Actions integriert und muss nach dem Push dort erfolgreich durchlaufen.

Die externen Drittanbieterlinks wurden nicht live inhaltlich bewertet. Ihre Struktur und erlaubten Hosts wurden geprüft; die tatsächliche Verfügbarkeit muss der geplante Linkworkflow ermitteln.

## 4. Aktueller Projektstand

| Bestandteil | Stand |
|---|---:|
| Lernbereiche | 4 |
| Einheiten | 54 |
| Aufgaben | 756 |
| Aufgaben Pfad A / B / C | 216 / 324 / 216 |
| Lernkarten | 162 |
| Animationen | 41 |
| Animationsverweise | 147 |
| externe Übungsverweise | 88 |
| unterschiedliche externe URLs | 51 |
| JSON-Dateien | 69 |
| Service-Worker-Ressourcen | 94 |
| Projektversion | V28 |

## 5. Empfohlene nächste Verbesserungen

### Priorität 1 – vor einem Merge nach `master`

#### 5.1 Datenbankmigration in einem Testprojekt ausführen

Die SQL-Datei wurde statisch geprüft, aber nicht gegen dein reales Supabase-Schema ausgeführt. Vor dem Produktivsystem sollte ein separates Testprojekt verwendet werden.

Zu testen sind mindestens:

- Lehrkraft kann Dashboard und Verwaltungs-RPCs nutzen,
- normaler authentifizierter Nutzer wird bei Export, Löschen und Aufräumen abgewiesen,
- deaktivierter Schüler kann mit altem Token nicht mehr schreiben,
- abgelaufenes Token wird abgewiesen und später bereinigt,
- Schüler kann nur die eigene, durch das Token gebundene ID schreiben,
- `pg_cron` kann den Aufräumjob ausführen,
- Export und Löschung liefern nur die ausgewählte Person.

Langfristig wären automatisierte SQL-Tests mit Supabase CLI oder pgTAP sinnvoll.

#### 5.2 Kontrollierte Reihenfolge beim Rollout

Datenbank und Webanwendung müssen abgestimmt veröffentlicht werden:

1. Datenbank sichern,
2. neue SQL-Migration im Testprojekt ausführen,
3. Rechte und RPCs prüfen,
4. Migration im Produktivprojekt ausführen,
5. erst danach V28 veröffentlichen,
6. alte Tokens gegebenenfalls widerrufen,
7. GitHub-Actions-Prüfungen abwarten.

Damit werden Zwischenzustände vermieden, in denen neuer Client und alte RPCs nicht zusammenpassen.

#### 5.3 Trackingentscheidung verbindlich treffen

Das Versionsmanifest weist für den hochgeladenen Stand `tracking_aktiv: true` aus. Vor dem Regelbetrieb sollte geklärt und dokumentiert werden:

- Rechtsgrundlage beziehungsweise schulische Freigabe,
- Informationspflichten,
- Speicherfristen,
- Zugriffskreis,
- Zweckbindung,
- Verfahren bei Auskunft und Löschung.

Bis zu einer organisatorischen Freigabe ist ein Release mit `--ohne-tracking` die sicherere Wahl.

#### 5.4 Reale Smartphone-Testmatrix durchführen

Mindestens erforderlich:

- iPhone/Safari,
- aktuelles Android/Chrome,
- älteres oder günstiges Android-Gerät,
- Android/Firefox,
- Tablet in Hoch- und Querformat,
- Bildschirmtastatur,
- langsame Verbindung,
- vollständiger Offlinebetrieb,
- Versionswechsel bei bereits installiertem Service Worker,
- VoiceOver und TalkBack.

Das vorhandene `TESTPROTOKOLL-GERAETE.md` sollte dabei ausgefüllt und zum Release archiviert werden.

#### 5.5 GitHub-Actions-Lauf als Freigabekriterium

Ein Merge nach `master` sollte nur erfolgen, wenn erfolgreich sind:

- Gesamtprüfung,
- statische Barrierefreiheitsprüfung,
- Browser-Smoke-Test,
- gegebenenfalls manuelle SQL-Migrationsprüfung.

Ein Branch-Schutz kann diese Checks verpflichtend machen.

### Priorität 2 – Sicherheit und Betrieb

#### 5.6 Lehrerrolle serverseitig stärker verwalten

Die Allowlist ist deutlich besser als ein bloßer `authenticated`-Status. Für einen größeren Regelbetrieb wäre zusätzlich sinnvoll:

- Freischaltung ausschließlich durch einen Administrator,
- Änderungsprotokoll für Lehrerrollen,
- regelmäßige Prüfung nicht mehr benötigter Konten,
- optional serverseitiger JWT-Claim `role = teacher`.

#### 5.7 Linkprüfung soll automatisch ein Issue erzeugen

Der wöchentliche Workflow protokolliert Fehler derzeit hauptsächlich im Actions-Lauf. Sinnvoll wäre:

- bei neuen Ausfällen ein GitHub-Issue anlegen,
- bestehendes Issue aktualisieren statt Duplikate zu erzeugen,
- wieder funktionierende Links automatisch abhaken,
- betroffene Einheiten und Plattformen nennen.

#### 5.8 Sicherheitsrichtlinie für Browserressourcen

GitHub Pages erlaubt nur eingeschränkt eigene HTTP-Header. Trotzdem kann geprüft werden:

- Content-Security-Policy per `<meta>` soweit möglich,
- nur notwendige externe Hosts freigeben,
- `frame-ancestors` beziehungsweise Einbettungsschutz auf einem späteren eigenen Hosting,
- Subresource-Integrität für unveränderliche externe Bibliotheken,
- konsequentes `noopener noreferrer`.

#### 5.9 Diagnoseversion sichtbar machen

Im Entwicklermenü und Dashboard sollten sichtbar sein:

- Projektversion,
- Cache-Version,
- Commit-SHA,
- Buildzeitpunkt,
- Online-/Offlinezustand,
- Status der Offlinewarteschlange.

Das beschleunigt Supportfälle auf Schülergeräten.

#### 5.10 Löschjob und Datenschutzbericht überwachen

Der Aufräumjob sollte nicht nur eingerichtet, sondern überwacht werden:

- letzte erfolgreiche Ausführung,
- Anzahl gelöschter Ereignisse, Fortschritte und Tokens,
- Fehlerprotokoll,
- Alarm bei längerem Ausfall.

### Priorität 3 – Testabdeckung und Wartbarkeit

#### 5.11 Browsertests erweitern

Weitere Playwright-Szenarien:

- Token läuft während der Bearbeitung ab,
- Erneuerung scheitert und Ereignis bleibt offline gespeichert,
- nicht freigeschalteter Nutzer öffnet das Dashboard,
- deaktivierter Schüler versucht weiterzuschreiben,
- Updatehinweis und Service-Worker-Wechsel,
- Buchnavigation bei geöffneter Bildschirmtastatur,
- Safe-Area auf iPhones,
- Deep-Link auf Pfad und konkrete Aufgabe,
- Abmelden mit und ohne lokale Datenlöschung,
- Wiederaufnahme nach Browserneustart.

#### 5.12 Lokales Speicherformat versioniert migrieren

Der Lernstand besitzt bereits eine Version. Für jede künftige Strukturänderung sollte es eine kleine, einzeln testbare Migration geben:

```text
v2 → v3 → v4
```

Fehlerhafte oder sehr alte Zustände sollten gesichert verworfen werden, ohne die Anwendung zu blockieren.

#### 5.13 Release-Tags und Changelog

Für jede produktive Fassung:

- Git-Tag wie `v29.0.0`,
- automatisch erzeugtes Changelog,
- Verweis auf Datenbankmigration,
- bekannte Einschränkungen,
- Rückkehrpunkt zur vorherigen Version.

#### 5.14 Performancebudget für schwächere Geräte

Empfohlene Grenzwerte:

- JavaScript-Größe,
- Zeit bis zur ersten bedienbaren Ansicht,
- Speicherverbrauch der Animationen,
- maximale gleichzeitige Animationsschleifen,
- keine Layoutsprünge durch nachgeladene Inhalte.

Ein Low-End-Android-Gerät sollte als verbindliches Testgerät gelten.

### Priorität 4 – Pädagogische Qualität

#### 5.15 Konzeptfehler-Kategorien fachlich prüfen

Das Schema verhindert Tippfehler, ersetzt aber keine fachliche Sichtung. Die Zuordnung aller Konzeptfehler sollte einmal systematisch geprüft werden, insbesondere dort, wo Kategorien regelbasiert erzeugt oder umbenannt wurden.

Im Dashboard könnten die Kategorien anschließend lernbereichsübergreifend ausgewertet werden.

#### 5.16 Erklärverweise und Nachfassaufgaben ausbauen

Für jede häufige Fehlvorstellung sollte vorhanden sein:

- ein konkreter Erklärabsatz,
- möglichst eine passende Animation oder Abbildung,
- eine leichtere Nachfassaufgabe,
- eine Transferaufgabe zur späteren Überprüfung.

Automatisch erzeugte Absatzverweise sollten fachlich kontrolliert werden.

#### 5.17 Empfehlungssicherheit anzeigen

Eine Pfadempfehlung sollte ihre Sicherheit berücksichtigen:

- Anzahl gewerteter Kernaufgaben,
- Tippnutzung,
- Wiederholungsaufgaben,
- uneinheitliche Ergebnisse.

Bei geringer Datengrundlage wäre eine Formulierung wie „spricht eher für Pfad B“ angemessener als eine definitive Empfehlung.

#### 5.18 Textalternativen als vollständige Lernwege

Die Animationstexte sind nun vorhanden. Der nächste Schritt wäre, sicherzustellen, dass ein Schüler ohne Bewegung oder Grafik dasselbe Lernziel erreichen kann:

- Ausgangslage,
- Veränderung,
- mathematische Beobachtung,
- Schlussfolgerung,
- gegebenenfalls Beispielrechnung.

### Priorität 5 – Komfort

#### 5.19 Cloud-Wiederaufnahme optional ergänzen

LocalStorage funktioniert nur im selben Browser. Für wechselnde Schulgeräte könnte ein minimierter Cloud-Lernstand gespeichert werden, etwa:

- Einheit,
- Pfad,
- aktuelle Aufgaben-ID,
- Abschlussstatus,
- letzter Zeitpunkt.

Nicht notwendig wären vollständige Eingaben oder jeder Zwischenschritt. Die Funktion sollte datensparsam und transparent sein.

#### 5.20 Gemeinsame Geräte noch klarer unterstützen

Beim Abmelden sollten zwei deutlich getrennte Optionen erscheinen:

```text
Nur abmelden
Abmelden und meine lokalen Lernstände auf diesem Gerät löschen
```

Zusätzlich kann die Startseite anzeigen, für welchen Schüler lokale Daten vorhanden sind, ohne sensible Detaildaten offenzulegen.

## 6. Empfohlener Einbau

Für den hochgeladenen aktuellen Stand reicht das V28-Korrekturpatch. Es enthält nur neue oder gegenüber dem Upload geänderte Projektdateien sowie diese Dokumentation.

Nicht aus einem Patch überschreiben oder hochladen:

- den lokalen `.git`-Ordner,
- `.claude`,
- `tests/node_modules`,
- Playwright-Ergebnisordner.

Empfohlene Commit-Nachricht:

```text
Harden V28 authentication, accessibility and automated tests
```

Danach:

1. `Commit to develop`,
2. `Push origin`,
3. GitHub-Actions-Prüfungen abwarten,
4. SQL zunächst im Supabase-Testprojekt prüfen,
5. V28 auf realen Smartphones testen,
6. erst danach einen Produktionsrelease beziehungsweise Merge nach `master` vorbereiten.
