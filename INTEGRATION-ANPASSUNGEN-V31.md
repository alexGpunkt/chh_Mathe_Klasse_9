# Integration und Optimierung V31

**Projekt:** Mathe 9 · Campus Hannah Höch  
**Zielbranch:** `develop`  
**Grundlage:** hochgeladene Projektfassung `chh_Mathe_Klasse_9(2).zip`  
**Vorheriger geprüfter Stand:** V28  
**Neuer Stand:** V31  
**Cache-Version:** `mathe9-v31-integration-fixes-develop`

## 1. Gesamturteil

Das Update ist inhaltlich und didaktisch ein deutlicher Ausbau. Besonders
wertvoll sind:

- 54 druckfertige Übungsblätter mit eigenständigen Zufallsaufgaben,
- ein Übungs- und Bewertungsmodus mit Lehrkraftfreigaben,
- die Erfassung aktiver Lernzeit,
- externe Übungen innerhalb der Anwendung,
- zusätzliche Dashboardansichten,
- 135 Verweise auf Erklärvideos,
- Performancebudget, Changelog, Branchschutz- und Prüfwerkzeuge.

Der angelieferte Stand war strukturell weitgehend vollständig und bestand die
vorhandenen statischen Prüfungen. Für gemeinsam genutzte Schülergeräte war er
aber noch nicht sicher genug integriert. Unterrichtsfreigaben und nicht
übertragene Lernzeit wurden geräteweit gespeichert. Dadurch konnten Daten eines
Kindes beim nächsten angemeldeten Kind erscheinen. Außerdem konnte Lernzeit
nach einem Einheitenwechsel der falschen Einheit zugeordnet werden.

Weitere Integrationsmängel betrafen den Ablauf eines offline gespeicherten
Bewertungsmodus, doppelte Trackingereignisse, die Zugänglichkeit des
Übungsrahmens, zwangsweise PDF-Downloads und interne Variablennamen auf
Arbeitsblättern. V31 behebt diese Punkte, ohne die neuen Funktionen zu
entfernen.

## 2. Übernommene Erweiterungen

### 2.1 Handschriftliche Übungsblätter

- vier Generatorpools unter `uebungsblaetter/`,
- 270 Generatoren für alle 54 Einheiten,
- fünf Aufgaben pro Blatt,
- jeweils zwei PDF-Seiten mit Schreibraum, Rechenwegen und
  Selbstkontrollkasten,
- deterministische Erzeugung mit fester Saat,
- gemeinsame Ausdrucksauswertung in `assets/js/ausdruck.js`,
- automatische Prüfung mit 300 Zufallsdurchläufen je Generator.

### 2.2 Lern- und Bewertungsmodus

- freier Übungsmodus außerhalb des Unterrichts,
- zeitlich begrenzter Bewertungsmodus,
- Freigabe einzelner Einheiten durch die Lehrkraft,
- bereits begonnene Einheiten bleiben zugänglich,
- Sperrseite mit Rückweg und Übungsblattlink,
- Dashboardsteuerung für Modus und Freigaben.

### 2.3 Aktive Lernzeit

- Aktivität durch Tippen, Scrollen, Touch, Animationen und externe Übungen,
- Pausieren bei unsichtbarer Seite oder längerer Inaktivität,
- lokale Warteschlange bei fehlendem Netz,
- serverseitige Meldung in begrenzten Zeitblöcken,
- Dashboardauswertung für Tag, Woche und häufige Einheiten.

### 2.4 Externe Übungen im Anwendungsrahmen

- iframe wird erst nach ausdrücklichem Klick erzeugt,
- erlaubte Hosts werden geprüft,
- CSP begrenzt `frame-src` auf die vorgesehenen Plattformen,
- Rückkehr zur Einheit ohne Verlust des Aufgabenstandes,
- neuer Tab bleibt als Ausweichweg verfügbar.

### 2.5 Weitere Betriebsverbesserungen

- 135 Videoverweise in 133 unterschiedlichen YouTube-Adressen,
- bereichsübergreifende Kategorien für 253 Fehlvorstellungen,
- Performancebudget für schwächere Smartphones,
- GitHub-Actions- und Playwright-Erweiterungen,
- Changelog und Branchschutzanleitung,
- Datenschutz-, Migrations- und Gerätetestdokumentation.

## 3. In V31 behobene Integrationsprobleme

### 3.1 Freigaben werden je Schüler gespeichert

V30 verwendete die geräteweiten Schlüssel:

```text
mathe9.lernmodus
mathe9.lernzeit.offen
```

Auf gemeinsam genutzten Smartphones konnte dadurch das nächste Kind einen
zwischengespeicherten Bewertungsmodus oder eine Freigabe des vorherigen Kindes
übernehmen.

V31 verwendet stattdessen:

```text
mathe9.lernmodus.<Schülerkennung>
mathe9.lernzeit.offen.<Schülerkennung>
```

Die unsicheren alten Schlüssel werden entfernt und bewusst keinem zufällig
angemeldeten Kind zugeordnet.

### 3.2 Lernzeit bleibt der richtigen Einheit zugeordnet

Offene Lernzeit war zuvor eine einzelne Zahl. Scheiterte der Versand in
LF-04 und wechselte das Kind danach zu KP-02, konnte die alte Zeit unter der
neuen Einheit gemeldet werden.

V31 speichert offene Sekunden als Einheitenblöcke:

```json
{
  "lf-04": 35,
  "kp-02": 10
}
```

Jeder Block wird mit seiner ursprünglichen Einheit übertragen und erst nach
erfolgreicher Serverbestätigung vermindert.

### 3.3 Abmelden behandelt offene Lernzeit korrekt

Vor dem Entwerten des Schülertokens wird offene Lernzeit nach Möglichkeit
übertragen. Bei der Option „Abmelden und meine lokalen Lernstände löschen“
werden anschließend auch Modus-Cache und offene Lernzeit dieses Profils
entfernt. Daten anderer Schülerprofile bleiben erhalten.

### 3.4 Offline abgelaufener Bewertungsmodus

V30 verließ sich beim Ablauf von `gilt_bis` auf den Server. Ein Gerät ohne
Netz konnte deshalb über den Ablaufzeitpunkt hinaus gesperrt bleiben.

V31 prüft den Zeitpunkt zusätzlich lokal. Ein abgelaufener Bewertungsmodus
fällt auch offline in den Übungsmodus zurück.

### 3.5 Aktuelle Freigabe beim Öffnen einer Einheit

Beim Eintritt in eine Einheit wird die Modusabfrage jetzt erzwungen
aktualisiert. `Lernmodus.starten()` liefert dafür die Aktualisierungs-Promise
zurück. Dadurch gibt es keinen zweiten parallelen Abruf und keine Entscheidung
auf Basis eines unnötig alten Caches.

### 3.6 Kein doppeltes Tracking externer Übungen

Der normale Linkklick wurde sowohl in `engine.js` als auch im Übungsrahmen als
`external_practice_open` erfasst.

V31 trennt die Wege:

- normaler Klick: genau ein Ereignis durch den Übungsrahmen,
- Strg/Cmd/Shift-Klick und Mittelklick: ein Ereignis mit `mode: neuer_tab`.

Provider und Linktyp werden dabei konsistent über `data-provider` und
`data-link-type` weitergegeben.

### 3.7 Zugänglicher Übungsrahmen

Ergänzt wurden:

- `role="dialog"` und `aria-modal="true"`,
- beschrifteter Dialogtitel,
- Fokusfalle für Tab und Umschalt+Tab,
- Schließen mit Escape,
- gesperrter Hintergrund,
- Wiederherstellung vorheriger `inert`-Zustände,
- Wiederherstellung des vorherigen Scrollzustands,
- Rückgabe des Fokus an den auslösenden Link,
- mindestens 44 Pixel hohe Bedienelemente.

### 3.8 Keine unzuverlässige iframe-Fehlererkennung

Ein `load`-Ereignis beweist nicht, dass ein Drittanbieter tatsächlich
sichtbar eingebettet wurde. Auch blockierte oder interne Fehlerseiten können
es auslösen. Umgekehrt kann eine langsame Seite nach sechs Sekunden noch
funktionieren.

V31 zeigt daher dauerhaft einen ehrlichen Hinweis: Bleibt der Bereich leer,
soll „In neuem Tab öffnen“ verwendet werden. Es wird keine technisch nicht
belastbare automatische Erkennung behauptet.

### 3.9 PDF-Links smartphonefreundlich

Der Linktext lautete „Übungsblatt öffnen“, gleichzeitig erzwang das
`download`-Attribut einen Download. Auf Smartphones ist die Browseransicht
meist praktischer, weil von dort direkt gedruckt oder geteilt werden kann.

V31 entfernt das erzwungene Downloadattribut. Die PDF öffnet in einem neuen
Browserkontext; ein Download bleibt über die Browserfunktion möglich.

### 3.10 Interne Codebezeichner aus Arbeitsblättern entfernt

Sichtbare Texte enthielten unter anderem:

```text
h_Dreieck
h_Trapez
h_s
```

Sie wurden durch lesbare Bezeichnungen wie „Dreieckshöhe“, „Trapezhöhe“ und
„Seitenhöhe hs“ ersetzt. Alle betroffenen PDFs wurden neu erzeugt.

`werkzeuge/uebungsblatt-pruefen.js` erkennt künftig interne Schreibweisen mit
Unterstrich im gerenderten Aufgabentext oder Rechenweg und stoppt die Prüfung.

### 3.11 Dokumentation und Version konsolidiert

Der Upload enthielt bereits V30-Funktionen, während das README noch V29 als
aktuellen Stand und Cache nannte. Vereinheitlicht wurden:

```text
Projektversion: v31
Cache-Version: mathe9-v31-integration-fixes-develop
Branch: develop
```

README, Changelog, Performancebudget und Gerätetestprotokoll wurden an das
aktuelle Verhalten angepasst.

### 3.12 Verteilerarchiv bereinigt

Nicht übernommen wurden lokale oder sehr große Entwicklungsreste:

- `.git/`,
- `.claude/`,
- `tests/node_modules/`,
- Playwright-Ergebnisordner,
- lokale Planungs- und Patchnotizen.

## 4. Prüfergebnisse

### 4.1 Projektstruktur

| Bestandteil | Ergebnis |
|---|---:|
| Lernbereiche | 4 |
| Einheiten | 54 |
| Aufgaben | 756 |
| Pfad A / B / C | 216 / 324 / 216 |
| Lernkarten | 162 |
| Animationen | 41 |
| Animationsverweise | 147 |
| externe Übungsverweise | 88 |
| Erklärvideo-Verweise | 135 |
| Fehlvorstellungs-IDs | 253 |
| Fehlvorstellungskategorien | 17 |
| JSON-Dateien | 75 |
| Service-Worker-Einträge | 100 |

### 4.2 Übungsblätter

| Prüfung | Ergebnis |
|---|---:|
| PDFs | 54 |
| Seiten je PDF | 2 |
| Generatoren | 270 |
| Zufallsproben je Generator | 300 |
| verbliebene Platzhalter | 0 |
| sichtbare Codebezeichner mit Unterstrich | 0 |
| beschädigte oder fehlende PDFs | 0 |

Die PDFs KP-07 und SK-02 wurden zusätzlich als Seitenbilder geprüft. Umlaute,
Quadrat-/Kubikzeichen und die überarbeiteten Höhenbezeichnungen werden lesbar
dargestellt.

### 4.3 Automatische Prüfungen

Erfolgreich:

- `node werkzeuge/pruefen.js`,
- `node werkzeuge/a11y-pruefen.js`,
- `node werkzeuge/budget-pruefen.js`,
- `node werkzeuge/uebungsblatt-pruefen.js`,
- Syntaxprüfung aller JavaScript-Dateien,
- ZIP- und PDF-Strukturprüfung.

Performancebudget V31:

| Kennzahl | Ist | Grenze |
|---|---:|---:|
| größte Seite, JavaScript gzip | 114 KB | 120 KB |
| JavaScript gesamt gzip | 146 KB | 150 KB |
| CSS gesamt gzip | 18 KB | 25 KB |
| größte JavaScript-Datei | 178 KB | 200 KB |
| Offlinepaket | 1745 KB | 2200 KB |

### 4.4 Gezielte Laufzeitprüfungen

Mit Chromium und lokal eingesetztem HTML wurden geprüft:

- zwei Schülerprofile erhalten getrennte Modus- und Lernzeitschlüssel,
- Zeit aus LF-04 und KP-02 bleibt in getrennten Einheitenblöcken,
- ein abgelaufener Bewertungsmodus öffnet offline,
- der Übungsrahmen ist modal, sperrt den Hintergrund und stellt den Fokus
  wieder her,
- ein normaler Übungsklick erzeugt genau ein Öffnungsereignis,
- beim Löschen lokaler Daten werden nur die Daten des aktuellen Schülers
  entfernt,
- die Lernzeitmeldung läuft vor der Tokenentwertung.

Der vollständige HTTP-basierte Playwright-Lernweg konnte in der
Arbeitsumgebung nicht lokal navigieren, weil Browsernavigation dort durch eine
Administrationsrichtlinie blockiert ist. Die projektinternen Smoke-Tests wurden
für V31 erweitert und sollen nach dem Push in GitHub Actions laufen.

## 5. Bewusst zurückgestellter Supabase-Abgleich

Die mit V30 ergänzten SQL-Tabellen und RPCs wurden übernommen und durch die
vorhandene Projektprüfung statisch kontrolliert. Sie wurden in diesem
Arbeitsschritt nicht gegen das reale Supabase-Projekt ausgeführt.

Vor einem produktiven Einsatz bleibt erforderlich:

1. Datenbank sichern,
2. Migration in einem separaten Supabase-Testprojekt ausführen,
3. Rollen, RLS, Schüler-Tokens und Verwaltungs-RPCs testen,
4. erst danach die Produktivmigration durchführen,
5. anschließend Dashboard, Lernmodus und Lernzeit mit echten Testkonten
   prüfen.

## 6. Weitere Verbesserungsvorschläge

### Priorität 1 – vor einem Merge nach `master`

#### 6.1 Supabase-Testmigration vollständig durchführen

Zu prüfen sind insbesondere:

- Lehrkraftfreigabe und Sperrung,
- Schüleranmeldung und Tokenablauf,
- deaktivierter Schüler mit bereits vorhandenem Token,
- Schreiben für fremde Schüler-IDs,
- Lernmodus, Freigabe und Rücknahme,
- Lernzeitmeldung und Personenlöschung,
- Aufräumjob ohne Benutzer-JWT.

#### 6.2 Unterrichtsmodus nach Lerngruppe trennen

`mathe9_unterricht` bildet aktuell einen globalen Zustand ab. Schaltet eine
Lehrkraft den Bewertungsmodus ein, betrifft das potenziell alle Lerngruppen.
Für parallelen Unterricht sollte der Primärschlüssel mindestens
`class_code` enthalten. Freigaben und Modusabfragen müssen denselben
Gruppenschlüssel verwenden.

#### 6.3 Reale Smartphone-Testmatrix

Verbindlich testen:

- iPhone/Safari,
- aktuelles Android/Chrome,
- günstiges älteres Android,
- Android/Firefox,
- Tablet hochkant und quer,
- Bildschirmtastatur,
- vollständiger Offlinebetrieb,
- Update aus bereits gecachter V28/V30,
- VoiceOver und TalkBack.

#### 6.4 Tracking- und Datenschutzentscheidung

`version.json` weist weiterhin `tracking_aktiv: true` aus. Vor dem
Regelbetrieb müssen Zweck, Rechtsgrundlage, Informationspflichten,
Speicherfristen, Zugriffskreis sowie Lösch- und Auskunftsverfahren verbindlich
festgelegt sein. Bis dahin ist ein Release ohne Tracking die konservativere
Variante.

### Priorität 2 – Lernzeit belastbarer machen

#### 6.5 Mehrfach geöffnete Tabs koordinieren

Zwei Tabs desselben Schülers können gleichzeitig Zeit in denselben lokalen
Block schreiben und dadurch doppelt zählen. Ein `BroadcastChannel` oder eine
kurzlebige lokale Führungsrolle sollte festlegen, welcher Tab die Lernzeit
meldet.

#### 6.6 Zeitmeldungen idempotent machen

Jeder Zeitblock sollte eine eindeutige Meldungs-ID besitzen. Der Server merkt
sich bereits verarbeitete IDs. Dann führt ein Netzwerkabbruch nach erfolgreicher
Serververarbeitung, aber vor der Clientantwort, nicht zu einer doppelten
Anrechnung beim Wiederholen.

#### 6.7 Externe Übung nicht 15 Minuten pauschal als Aktivität behandeln

Innerhalb eines fremden iframes ist echte Aktivität nicht beobachtbar. Derzeit
wird ein offener Rahmen großzügig als Aktivität behandelt. Genauer wäre:

- kürzeres Zeitfenster,
- Fokus/Blur des iframes berücksichtigen,
- nach längerer Ruhe eine Schaltfläche „Ich arbeite noch“ anzeigen,
- die so gemessene Zeit im Dashboard als geschätzt kennzeichnen.

### Priorität 3 – Performance und Wartbarkeit

#### 6.8 `animationen.js` aufteilen

Das JavaScript-Budget ist mit 146 von 150 KB gzip nahezu ausgeschöpft.
`animationen.js` besitzt 178 KB. Sinnvoll ist eine Datei je Lernbereich:

```text
animationen-pz.js
animationen-lf.js
animationen-kp.js
animationen-sk.js
```

Die Einheitenseite lädt nur den benötigten Bereich; die Galerie lädt alle
vier. Das reduziert Download-, Parse- und Speicherlast auf schwachen Geräten.

#### 6.9 Schriften lokal ausliefern

Lokale WOFF2-Dateien würden:

- die Verbindung zu Google Fonts entfernen,
- Datenschutz und CSP vereinfachen,
- Layoutsprünge reduzieren,
- vollständigen Offlinebetrieb der gewählten Schriften sichern.

#### 6.10 Visuelle PDF-Regression automatisieren

Neben der mathematischen Generatorprüfung sollte eine Stichprobe der PDFs in
GitHub Actions gerendert werden. Vergleichsbilder oder Layoutregeln können
melden:

- abgeschnittenen Text,
- leere Kästchen,
- Überläufe,
- unerwartete dritte Seiten,
- fehlende Schreiblinien.

### Priorität 4 – Übungsblätter pädagogisch ausbauen

#### 6.11 Zwei oder drei Blattvarianten je Einheit

Die feste Saat erzeugt für alle dasselbe Blatt. Für Klassen mit engem
Sitzabstand wären Varianten A/B/C hilfreich. Jede Variante bleibt
reproduzierbar und erhält einen kleinen Variantencode.

#### 6.12 Selbstkontrollbereich abtrennbar gestalten

Eine gestrichelte Falt- oder Schnittlinie vor den Lösungen ermöglicht zwei
Einsatzformen:

- sofortige Selbstkontrolle,
- Abgabe ohne sichtbare Lösungen.

#### 6.13 Druckblatt mit digitalem Lernweg verbinden

Optional kann ein kurzer QR-Code zurück zur konkreten Einheit führen. Dabei
sollte nur die öffentliche Einheitenadresse codiert werden, niemals eine
Schülerkennung oder ein Token.

### Priorität 5 – Dashboard und Unterrichtssteuerung

#### 6.14 Freigaben mit Zeitstempel und Lehrkraft anzeigen

Im Dashboard sollte sichtbar sein:

- wer freigegeben hat,
- wann freigegeben wurde,
- wann die Freigabe zurückgenommen wurde,
- ob das Kind die Einheit danach tatsächlich geöffnet hat.

#### 6.15 Modusstatus auf Schülergeräten transparenter machen

Eine kleine Statusanzeige könnte enthalten:

```text
Übungsmodus
oder
Bewertungsmodus bis 11:30 · zuletzt geprüft vor 40 Sekunden
```

Bei Offlinebetrieb sollte klar erkennbar sein, dass eine zwischengespeicherte
Entscheidung verwendet wird.

#### 6.16 Einbettbarkeit externer Anbieter dokumentieren

Im Linkchecker kann je Plattform beziehungsweise URL ein Status gepflegt
werden:

- im Rahmen geprüft,
- nur neuer Tab,
- unbekannt,
- vorübergehend nicht erreichbar.

Dann kann die App bekannte nicht einbettbare Ziele direkt im neuen Tab öffnen,
ohne zunächst einen leeren Rahmen zu zeigen.

## 7. Einbau

Für ein Repository auf V28 wird das vollständige Integrationspatch verwendet.
Für den unmittelbar hochgeladenen V30-Stand genügt das kleinere
Korrekturpatch.

Empfohlene Commit-Nachricht:

```text
Integrate V30 learning mode and harden shared-device behavior
```

Danach:

1. `Commit to develop`,
2. `Push origin`,
3. GitHub-Actions-Prüfungen abwarten,
4. Offlinecache löschen beziehungsweise Update übernehmen,
5. V31 auf realen Smartphones testen,
6. den Supabase-Abgleich anschließend fortsetzen,
7. noch nicht unmittelbar nach `master` mergen.
