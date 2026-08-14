# Changelog

Alle Produktivfassungen mit ihren Änderungen, den zugehörigen
Datenbankmigrationen, bekannten Einschränkungen und dem Weg zurück.

Format: eine Überschrift je Fassung, Datum im Format JJJJ-MM-TT. Die
Fassungsnummer ist zugleich die Cache-Version in `sw.js` und das Git-Tag
(`v31`). `werkzeuge/release.js` prüft, dass es zu jeder neuen Fassung einen
Eintrag gibt — ein Release ohne Changelog-Eintrag wird nicht freigegeben.

Die ausführlichen Integrationsberichte je Fassung liegen weiterhin als
`INTEGRATION-*.md` daneben; hier steht nur, was für den Betrieb zählt.

Die Fassungen vor v29 sind nachgetragen. Ihr Veröffentlichungsdatum ist
nicht belegt — es gab bis dahin weder Tags noch Changelog. Deshalb steht
dort keines: ein geschätztes Datum wäre schlechter als gar keines.

---

## v34 — 2026-08-14 · Taschenrechner, Dauerfortschritt und Beameransicht

**Fortschritt läuft jetzt durchgehend ins Dashboard**

- Bis v33 ging eine Fortschrittszeile nur bei Pfadwahl, Wiederaufnahme und
  **richtiger** Antwort raus. Wer zehn Minuten an einer Aufgabe saß, stand
  im Dashboard mit einem zehn Minuten alten Stand. Jetzt melden zusätzlich
  jeder Aufgabenwechsel, jeder Fehlversuch und ein Takt von 20 Sekunden.
- `tracker.js` merkt sich den letzten vollständigen Stand und sendet ihn
  im Takt erneut (Upsert auf dieselbe Zeile — es entsteht kein Datenberg,
  nur ein frisches `updated_at`). Gesendet wird nur bei sichtbarer Seite:
  Ein Tab im Hintergrund arbeitet nicht.
- Neu in `engine.js`: `fortschrittMelden()` — eine Stelle, an der der Stand
  zusammengesetzt wird, statt bisher dreimal derselbe Block.
- Jeder Herzschlag trägt jetzt den Ping-Zustand des Geräts mit
  (`ping_fails`, `queue_pending`, `seit_erfolg_ms`). **Keine Migration
  nötig** — die Werte liegen in der bestehenden `payload`-Spalte.

**Taschenrechner im Vollbild**

- Neu: `assets/js/taschenrechner.js` und `assets/css/rechner.css`,
  eingebunden in `einheit.html`, `pruefung.html` und `warmup.html`.
- Aufruf über den Knopf am rechten Rand, über `R` (solange nicht in ein
  Feld getippt wird) oder über `Alt + R` beziehungsweise `F2` — die wirken
  immer, auch aus dem Antwortfeld heraus. `Esc` schließt.
- Bei geöffnetem Rechner ist alles ausgeblendet außer der zuletzt
  gewählten Aufgabe samt Eingabefeld und der Rechneroberfläche. Breite und
  Höhe betragen 100 %; ein Einpassschritt verkleinert notfalls die Schrift
  und lässt zuletzt die Abbildung weichen, damit **nirgends gescrollt
  werden muss**. Der Smoke-Test misst das nach.
- Die Aufgabe wird nicht kopiert, sondern bleibt im DOM stehen — sonst
  prüfte `pruefe()` die Felder des Klons.
- Rechnet ohne `eval` (die CSP verbietet `unsafe-eval`): eigener Parser mit
  Punkt vor Strich, Klammern, `√`, `x²`, `^` (rechtsassoziativ), `π`, `%`
  und deutschem Komma. „Ergebnis ins Antwortfeld" überträgt den Wert.

**Beameransicht für die Leinwand**

- Neu: `dashboard/beamer.html`, `beamer.css`, `beamer.js`. Zu öffnen über
  den neuen Knopf im Lehrerdashboard.
- Zeigt alle Lernenden als Strichmännchen, die auf einer Geraden vorwärts
  laufen — bei Bedarf mehrspaltig, die Spaltenzahl folgt der Fenstergröße.
  Die Gerade ist wahlweise die ganze Unterrichtsreihe (mit einem Strich je
  Einheit) oder die aktuelle Einheit.
- Drei Zustände: **grün** (Ping da), **rot** (Ping fehlt), **rot blinkend**
  (ein Grenzwert überschritten). Das Männchen läuft nur bei Grün — der
  Unterschied ist auch von hinten im Raum erkennbar, und bei
  `prefers-reduced-motion` tritt an die Stelle des Blinkens ein Rahmen.
- Grenzwerte im Lehrerdashboard einstellbar: Anzahl erfolgloser
  Ping-Versuche (Voreinstellung 3) und Sekunden seit dem letzten
  erfolgreichen Ping (Voreinstellung 120). Sie gelten sofort.
- Erfolglose Ping-Versuche haben zwei Quellen: den Zähler des Geräts und
  die Zahl der seit dem letzten angekommenen Ping ausgefallenen
  Herzschläge. Es gilt der höhere Wert — ein Gerät ohne Netz kann nicht
  melden, dass es kein Netz hat.
- Die Ansicht holt ihre Daten **nicht selbst**, sondern bekommt sie vom
  Lehrerdashboard über einen `BroadcastChannel`. So bleibt das
  Sitzungstoken der Lehrkraft in einem Fenster, und Leinwand und
  Lehrerbildschirm zeigen nie zwei verschiedene Stände. Das Dashboard lädt
  deshalb weiter, solange eine Beameransicht angemeldet ist — auch wenn
  sein eigenes Fenster im Hintergrund liegt.
- Kinder ohne jede Fortschrittszeile stehen mit auf der Leinwand. Genau
  der Fall „Gerät hat sich nie gemeldet" fehlt in einer Fortschrittstabelle.

**Das JavaScript-Budget ist wieder eingehalten**

Ausgangslage: 166 KB gesamt gegen eine Grenze von 150, und `einheit.html`
bei 127 gegen 120. Die Gesamtsumme lag mit 155 KB **bereits vor dieser
Fassung** darüber. Zwei Maßnahmen, beide ohne Eingriff in die Logik:

- **Lehrerdateien nicht mehr im Offlinepaket der Schüler.** `sw.js` lud bei
  der Installation auch `dashboard/index.html`, `dashboard.js`,
  `dashboard.css` und `beamer.*` auf jedes Schülergerät — rund 19 KB gzip,
  die kein Kind je öffnet. Offline nützt das Dashboard ohnehin nichts, es
  ist eine Live-Ansicht auf Supabase. Für die Lehrkraft ändert sich nichts:
  Der Fetch-Handler legt jede abgerufene Datei weiterhin im Cache ab.
- **`dev-tools.js` wird nur noch bei `devMode` nachgeladen.** Das
  Entwicklermenü lag als festes `<script>`-Tag auf allen neun Seiten und
  beendete sich auf `master` sofort wieder — 9 KB gzip für nichts.
  Neu: `assets/js/dev-boot.js` (2 KB) wendet die Einstellungen an und holt
  das Menü nach, wenn es gebraucht wird.
  Die Aufteilung folgt der Ladereihenfolge und ist nicht beliebig: Alles,
  was `CONFIG` ändert oder `window.MATHE9_STUDENT` setzt, muss **synchron
  vor** `student-login.js`, `tracker.js` und `lernmodus.js` laufen — die
  lesen diese Werte beim Laden. Das Menü selbst baut erst auf
  `DOMContentLoaded` auf und darf später kommen. Zwei Smoke-Tests halten
  diese Trennung fest.
- **`budget-pruefen.js` misst jetzt, was ein Schülergerät lädt**: die
  Vereinigung aus der Vorabliste in `sw.js`, allen `<script src>`/`<link>`
  der Seiten im Hauptverzeichnis und `sw.js` selbst. Die Regel ist
  mechanisch — wer eine Datei wieder einträgt, bekommt sie automatisch
  zurück in die Rechnung. Nicht gezählte Dateien weist der Bericht
  namentlich aus, damit die Entscheidung sichtbar bleibt.

- **`animationen.js` je Lernbereich aufgeteilt.** Aus einer Datei mit 3 295
  Zeilen wurden fünf: `animationen-kern.js` (Palette, Koordinatenfeld,
  Laufwerk, Bedienleiste, Registry, öffentliche Schnittstelle) und je eine
  für LF, PZ, KP und SK. `animationen-laden.js` liest den Lernbereich aus
  `?u=` und hängt nur den passenden Block ein; `engine.js` wartet über
  `window.ANIM.bereit` darauf, bevor es die erste Karte baut. Eine
  Einheitenseite lädt damit statt 48 KB nur noch 14 + 8…11 KB.
  - Die Schrägbild-Helfer (`svgb`, `pfad`, `boxTeile` …) lagen im
    KP-Block, wurden aber auch von SK gebraucht — sie stehen jetzt im
    Kern. Ebenso die Signalwort-Animation: Sie gehört zu den
    Prüfungseinheiten aller vier Bereiche, ist also gemeinsamer Bestand.
  - Die Aufteilung war ein reines Verschieben von Zeilen. Belegt wurde das
    mit einem Differenzvergleich: Für alle 41 Animationen, die es schon im
    letzten Commit gab, liefern alte und neue Fassung auf jeder der drei
    Niveaustufen denselben Fingerabdruck (SVG-Struktur, Elementzahl,
    Bedienelemente, Schieberegler, Vorhersagefrage, Beschreibungstext).
  - `werkzeuge/pruefen.js` prüft neu, dass keine Einheit eine Animation
    aus einem fremden Lernbereich verwendet — sonst stünde im Unterricht
    „Animation nicht gefunden". Zurzeit tut das keine.
  - `werkzeuge/budget-pruefen.js` zählt den nachgeladenen Block **mit**,
    und zwar im ungünstigsten Fall. Sonst wäre die Seitenzahl von 97 auf
    86 KB gefallen, ohne dass ein Kind ein Byte weniger lädt.

Ergebnis: **146 KB gesamt** (Grenze 150) und **97 KB auf `einheit.html`**
(Grenze 120, vorher 127). Beim Gesamtbudget sind nur noch 4 KB Luft — die
Aufteilung hat es wie erwartet um rund 6 KB verteuert, weil fünf Dateien
schlechter komprimieren als eine. Wer als Nächstes Code hinzufügt, schaut
also auf die Gesamtsumme, nicht mehr auf die Seite.

**Neues Prüfwerkzeug**

- `werkzeuge/aufbau-pruefen.js` prüft jede Einheit gegen die sechs
  didaktischen Phasen aus `Aufbau_Lernabschnitte_allgemein_beispiele.txt`
  sowie gegen die Schrittweite je Lernweg.

**Bekannte Einschränkungen**

- Das Gesamtbudget hat nur noch 4 KB Luft (146 von 150 KB). Der nächste
  strukturelle Hebel wäre `engine.js` (24 KB gzip): Prüfungs- und
  Diagnoselogik, die nicht jede Einheitenseite braucht.
- `animationen.js` hatte zum Zeitpunkt der Aufteilung noch nicht
  eingecheckte Änderungen (unter anderem die Animation `graphlesen`).
  Diese Fassung ist es, die aufgeteilt wurde — sie steckt vollständig in
  den fünf neuen Dateien. Einen committeten Stand zum Zurückfallen gibt
  es für diese Änderungen jedoch nicht.
- Die Beameransicht braucht ein geöffnetes Dashboard-Fenster. Fällt es
  aus, weist die Ansicht nach 30 Sekunden darauf hin, statt einen
  eingefrorenen Stand zu zeigen.
- Der Aufgabengenerator der Übungsphase und die interaktive Sicherung im
  Merkkasten fehlen weiterhin — siehe Prüfbericht zum Aufbau der
  Lernabschnitte.

---

## v33 — 2026-08-11 · Niveaudifferenzierte Übungsblätter und Fehlerrückmeldungen

Arbeitet die vier Einschränkungen ab, die v32 offengelassen hatte.

**Ein Übungsblatt je Lernweg (statt einem für alle)**

- Bisher bekamen alle drei Lernwege dasselbe Blatt. Jetzt gibt es
  `uebungsblatt-a.pdf`, `-b.pdf` und `-c.pdf` je Einheit — 162 statt 54.
  A hat 4 Aufgaben mit glatten Zahlen, B die 5 des bisherigen Bestands,
  C 6 mit unbequemen Zahlen.
- `ausdruck.js` kennt dafür `stufen: { A: { vars: … }, C: { … } }` je
  Generator; zusammengeführt wird je Variable, damit für einen geänderten
  Nenner nicht der ganze Block wiederholt werden muss. Ohne Eintrag bleibt
  ein Generator, wie er war — **Stufe B ist deshalb überall der unverändert
  geprüfte Bestand**.
- `uebungsblaetter/*.json`: 214 Zahlenbereiche je Stufe angepasst, 54
  Generatoren auf `pfade: ["B","C"]` gesetzt (die jeweils anspruchsvollste
  Aufgabe entfällt auf dem Basisweg) und **54 neue Vertiefungsaufgaben**
  geschrieben — eine je Einheit, nur für Lernweg C.
- Jedes Blatt hat eine eigene Saat: Sonst stünden auf dem A- und dem
  B-Blatt dieselben Zahlen.
- Bei allen π-Aufgaben bleiben Höhen Vielfache von 3 und Kugelradien durch
  3 teilbar, sonst ergibt die Division durch 3 eine periodische Zahl und
  die gedruckte Lösung träfe das Ergebnis des Kindes nicht.
- `werkzeuge/uebungsblatt-pruefen.js`: 324 Generatoren mit je 300 Proben
  durchgerechnet. Fünf neue C-Aufgaben runden bewusst („Runde auf …") und
  sind als `gerundet` markiert; zwei weitere wurden auf exakte Ergebnisse
  umgestellt, weil sie genau auf der Rundungsgrenze lagen.
- `engine.js` und `lernmodus.js` verlinken das Blatt des jeweiligen
  Lernwegs. In `lernmodus.js` kommt der Lernweg aus dem gespeicherten Stand
  der Einheit; fehlt er, ist B die Annahme.

**Fehlerbehebung: Karten folgten dem Lernwegwechsel nicht**

- `pfadSetzen()` baute nur die Videokarte neu. Nach einem Wechsel von B auf
  A blieb deshalb das B-Übungsblatt verlinkt. Jetzt werden auch Übungs- und
  Blattkarte neu gebaut.
- Der Klickzähler am Blattlink wird nur einmal gebunden — sonst hätte jeder
  Lernwegwechsel einen weiteren Zuhörer ergänzt und ein Klick mehrfach
  gemeldet.

**Externe Übungen folgen dem Lernweg**

- `uebungslink` kennt jetzt `pfade` (wie die Videos ihr `pfad`). Ohne
  Angabe gilt ein Verweis auf allen Wegen — das bleibt der Normalfall.
- 12 offene Übersichts- und Ordnerseiten in 9 Einheiten sind auf B und C
  beschränkt: Plattformsuche, Kategorieseite, fremder Materialordner. Wer
  auf dem Basisweg arbeitet, müsste dort erst sortieren, welche der Apps
  überhaupt zum Thema gehört. Konkrete Apps und Artikel bleiben überall.
- Gegengeprüft: Alle 162 Niveaustufen behalten mindestens einen Verweis.

**Rückmeldungen zu Fehlvorstellungen**

- 238 neue Rückmeldungen für 153 Aufgaben, die bisher nur Hinweise und
  einen Lösungsweg hatten. Damit sind 749 der 756 Aufgaben versorgt,
  Stufe A und B nicht mehr schlechter als C.
- Häufigste abgedeckte Muster: x und y vertauscht, m und b verwechselt, b
  beim Einsetzen vergessen, Vorzeichen übersehen, Grundfläche und Höhe
  addiert statt malgenommen, das Drittel bei Pyramide und Kegel vergessen.

**Erklärungen**

- Vier sehr knappe Karten (`lf-03/A`, `kp-03/A`, `sk-03/B`, `sk-10/A`)
  haben je einen Satz zum typischen Fehler bekommen. Bewusst kein Ausbau
  zu Fließtext: Die Karten sind für den Basisweg in einfacher Sprache
  geschrieben.

**Migration**

Keine Datenbankmigration. Die 54 alten `uebungsblatt.pdf` sind entfernt;
wer eine Adresse verlinkt hat, muss sie auf `uebungsblatt-b.pdf` ändern.

**Bekannte Einschränkungen**

- Sieben Zuordnungsaufgaben (`type: "assign"` in PZ-05, KP-01, SK-01)
  haben weiterhin keine Fehlerrückmeldung: `engine.js` wertet
  Fehlvorstellungen nur bei `numeric`, `choice` und `multi` aus. Daten
  einzutragen, die niemand liest, wäre schlechter als die offene Lücke.
- Die niveaugerechte Zuordnung der Aufgaben ist eine fachliche
  Einschätzung und auf Papier nicht mehr korrigierbar. Vor dem ersten
  Austeilen sollte je Bereich ein A- und ein C-Blatt gegengelesen werden.
- Der Ordnerumfang wächst um rund 900 KB. Das Offlinepaket ist nicht
  betroffen: PDFs liegen nicht im Service-Worker-Cache.
- `lf-07/A`, `lf-07/B` und `lf-09/A` behalten ihr statisches
  Koordinatenbild — es ist eigens auf das Beispiel der Lernkarte
  gezeichnet.
- Das JavaScript bleibt bei 149 von 150 KB gzip. `animationen.js` muss vor
  der nächsten inhaltlichen Erweiterung je Lernbereich aufgeteilt werden.

**Zurück zur Vorgängerfassung**

`sw.js` und `version.json` auf v32 zurücksetzen, `uebungsblaetter/*.json`,
`assets/js/{ausdruck,engine,lernmodus}.js`, `schema/tasks.schema.json`,
`werkzeuge/{uebungsblaetter,pruefen}.js` und die `units/*/*/tasks.json` aus
dem v32-Stand wiederherstellen, dann `node werkzeuge/uebungsblaetter.js`
ausführen und die `uebungsblatt-?.pdf` löschen.

---

## v32 — 2026-08-11 · Lücken bei Animationen und externen Übungen geschlossen

Anlass war eine Vollprüfung aller 54 Einheiten auf allen drei Lernwegen
(162 Niveaustufen) gegen vier Anforderungen: Erklärung mit Animation,
automatisch korrigierte Aufgaben, externe Verweise, PDF-Blatt. Erklärungen,
Aufgaben und PDFs waren lückenlos; bei Animationen und externen Übungen
fehlte etwas.

**Animationen: 15 Niveaustufen ohne Bild**

- Alle betroffenen Stufen lagen im Bereich Lineare Funktionen. `lf-15`
  (Gleichungssysteme) und `lf-16` (Prüfungstraining) hatten auf **keinem**
  Lernweg ein Bild, dazu `lf-01/B`, `lf-07/C`, `lf-09/B` und `lf-09/C`.
- Neue Animation `graphlesen` (LF-01): der Ableseweg als Bewegung statt als
  Standbild — A vorwärts x → y, B zusätzlich rückwärts y → x, C die
  Knickstellen einer Verlaufskurve. Sie ersetzt in LF-01 auch die bisherigen
  statischen Koordinatenbilder auf A und C, damit die Einheit einheitlich ist.
- Die übrigen Lücken sind mit vorhandenen Animationen geschlossen, wie das
  Projekt es bei LF-12/LF-13 schon tut: `lf-15` → `schnittpunkt` (A mit
  Rechenzeile, C zeigt parallel/identisch als „keine" und „unendlich viele
  Lösungen"), `lf-07/C` und `lf-09` → `steigung`, `lf-16` → `signalwoerter`.
- `signalwoerter` kennt jetzt den Bereich `lf` mit den Kästen Nullstelle,
  Punktprobe und Gleichung aufstellen.
- Die Animationsstufe entspricht überall dem Lernweg. Sonst stünde auf
  Lernweg B das Abzeichen „Stufe C · Vertiefung".

**Textfassung folgt dem Lernbereich (Fehlerbehebung)**

- `signalwoerter` zeigt je Bereich andere Kästen, Kurztext, Textfassung und
  Vorhersagefrage kamen aber unverändert aus der Definition. Auf PZ-14 stand
  unter „Als Text lesen" deshalb etwas über Liter und Anstreichen — also
  genau für die Kinder falsch, die auf den Text angewiesen sind.
- Neuer Haken `variante(opts)` an einer Animationsdefinition: Er darf
  `kurz`, `text` und `frage` passend überschreiben. PZ, LF, KP und SK haben
  jetzt je eine eigene Fassung.

**Externe Übungen: 15 Einheiten ohne Verweis**

- Betroffen waren `pz-02`, `lf-02`, `lf-03`, `lf-06`, `lf-11`, `lf-13`,
  `lf-15`, `kp-02`, `kp-03`, `kp-05`, `kp-11`, `sk-02`, `sk-05`, `sk-06`
  und `sk-09` — die Übungskarte blieb dort vollständig ausgeblendet.
- Je zwei Verweise ergänzt (30 insgesamt). Wo im Bestand bereits ein
  fachlich passendes, geprüftes Ziel lag, wurde es wiederverwendet, wie
  schon bei PZ-06/07/08 und LF-09/10/12.
- Neu recherchiert wurde für die vier Themen ohne passendes Ziel:
  lineare Gleichungen (Serlo 80254, 1847), Gleichungssysteme (Serlo 78918,
  16330), Einheiten umrechnen (Serlo 24386, 1603) und Pythagoras
  (Serlo 29228).
- Alle 118 Verweise mit `werkzeuge/links-pruefen.js` abgerufen.

**Migration**

Keine Datenbankmigration. Rein inhaltliche Fassung.

**Bekannte Einschränkungen**

- Das PDF-Übungsblatt gibt es weiterhin **einmal je Einheit**, nicht je
  Niveaustufe: Alle drei Lernwege bekommen dasselbe Blatt. Weder
  `uebungsblaetter/*.json` noch `ausdruck.js` kennen bisher ein Pfadfeld.
- Externe Übungsverweise werden anders als die Videos nicht nach Lernweg
  gefiltert — Lernweg A sieht dieselbe Liste wie Lernweg C.
- 160 der 756 Aufgaben haben kein Feedback zu typischen Fehlvorstellungen,
  unausgewogen verteilt: Stufe A 61 von 216, Stufe B 81 von 324, Stufe C
  18 von 216. Ausgerechnet der schwächste Lernweg ist am schlechtesten
  versorgt.
- Die drei Quizlet-Verweise (`kp-12`, `sk-07`, `sk-10`) antworten der
  Prüfung mit HTTP 403. Das ist eine Bot-Sperre und bestand schon vorher;
  im Browser öffnen sie sich. Sie lassen sich damit aber nicht mehr
  automatisch überwachen.
- `lf-07/A`, `lf-07/B` und `lf-09/A` behalten ihr statisches
  Koordinatenbild. Es ist eigens auf das Beispiel der Lernkarte gezeichnet;
  eine allgemeine Animation wäre dort ein Rückschritt.
- Das JavaScript liegt jetzt bei 148 von 150 KB gzip. Der nächste Zuwachs
  reißt die Grenze; vorher muss `animationen.js` je Lernbereich aufgeteilt
  werden.

**Zurück zur Vorgängerfassung**

`sw.js` und `version.json` auf v31 zurücksetzen und `assets/js/animationen.js`
sowie die geänderten `units/lf/*/tasks.json` und die 15 um `uebungslinks`
ergänzten `tasks.json` aus dem v31-Stand wiederherstellen. Keine
Datenbankänderung rückgängig zu machen.

---

## v31 — 2026-08-03 · Sichere Lernzeit und mobile Integration

**Gemeinsam genutzte Geräte**

- Unterrichtsmodus und noch nicht übertragene Lernzeit liegen jetzt unter
  schülerbezogenen Schlüsseln. Freigaben und Zeitblöcke eines Kindes können
  nicht mehr beim nächsten angemeldeten Kind erscheinen.
- Offene Lernzeit wird je Einheit gesammelt. Ein fehlgeschlagener Versand
  aus LF-04 kann nach einem Seitenwechsel nicht mehr fälschlich KP-02
  zugerechnet werden.
- Vor dem Abmelden wird offene Zeit nach Möglichkeit übertragen. Bei
  „Abmelden und lokale Lernstände löschen“ werden auch Modus-Cache und offene
  Lernzeit des aktuellen Profils entfernt.

**Bewertungsmodus**

- `gilt_bis` wird zusätzlich lokal ausgewertet. Ein offline gebliebenes Gerät
  fällt nach Ablauf wieder in den Übungsmodus zurück.
- Beim Eintritt in eine Einheit wird die Freigabe erzwungen aktualisiert;
  veraltete Cacheentscheidungen werden nicht mehr zunächst angezeigt.

**Externe Übungen**

- Ein normaler Klick wird nur noch vom Übungsrahmen protokolliert. Strg-/Cmd-
  und Mittelklick werden getrennt als neuer Tab erfasst; doppelte
  `external_practice_open`-Ereignisse entfallen.
- Der Rahmen besitzt `aria-modal`, Fokusfalle, Escape-Schließen, gesperrten
  Hintergrund und Fokuswiederherstellung.
- Weil X-Frame-Options aus dem Elternfenster nicht zuverlässig erkennbar ist,
  steht der Hinweis zum neuen Tab dauerhaft und macht keine Scheinerkennung
  nach einer festen Wartezeit mehr.

**Handschriftliche Übungsblätter**

- Sichtbare interne Bezeichner wie `h_Dreieck`, `h_Trapez` und `h_s` wurden
  durch lesbare Fachsprache ersetzt; alle 54 PDFs wurden neu erzeugt.
- Die Generatorprüfung weist künftig verbliebene Code-Schreibweisen in
  Aufgabentext oder Rechenweg als Fehler aus.
- PDF-Links öffnen im Browser und erzwingen auf Smartphones keinen Download.

**Migration**

Keine zusätzliche Datenbankmigration gegenüber v30. Die v30-Supabase-
Erweiterung ist in diesem Arbeitsschritt nur statisch integriert und muss vor
dem produktiven Einsatz weiterhin im Testprojekt geprüft werden.

**Bekannte Einschränkungen**

- `mathe9_unterricht` bildet weiterhin einen globalen Unterrichtszustand ab.
  Für mehrere gleichzeitig arbeitende Lerngruppen sollte der Modus später
  nach `class_code` getrennt werden; das erfordert eine kontrollierte
  Datenbankmigration.
- Ob Drittanbieter die Einbettung zulassen, muss auf echten Geräten geprüft
  werden. Der neue-Tab-Weg bleibt immer verfügbar.

**Zurück zur Vorgängerfassung**

`sw.js` und `version.json` auf v30 zurücksetzen und die in diesem Abschnitt
geänderten JavaScript-, JSON- und PDF-Dateien aus dem v30-Stand wiederherstellen.
Die v30-Datenbanktabellen können unverändert bestehen bleiben.

---

## v30 — 2026-08-03 · Handschrift, Lernmodus und Lernzeit

**Handschriftliche Übungsblätter**

- `uebungsblaetter/{pz,lf,kp,sk}.json`: 270 Aufgabengeneratoren für alle 54
  Einheiten — gleiches Thema wie der digitale Teil, andere Zahlen und
  andere Einkleidung.
- `werkzeuge/uebungsblaetter.js` erzeugt daraus 54 PDFs
  (`units/<bereich>/<id>/uebungsblatt.pdf`, zusammen 432 KB) mit
  Schreibraum, Selbstkontrollkasten und Rechenwegen.
- Der Kontrollkasten enthält alle richtigen Lösungen gemischt mit ebenso
  vielen falschen. Die falschen sind die hinterlegten Fehlvorstellungen —
  wer „das kommt hin" denkt, findet dort genau sein Ergebnis wieder.
- `assets/js/ausdruck.js`: der Generator-Auswerter aus spiral.js, jetzt
  gemeinsam von Browser und Node genutzt. Die gedruckten Lösungen stammen
  damit von genau demselben Code, der sie in der Anwendung prüft.
- `werkzeuge/uebungsblatt-pruefen.js` rechnet jeden Generator 300-mal
  durch: Ergebnis exakt bei der angegebenen Rundung, keine übrig
  gebliebenen Platzhalter, falsche Antworten verschieden von der richtigen.

**Lernmodus**

- Übungsmodus außerhalb der Unterrichtszeit: freie Wahl der Einheiten.
- Bewertungsmodus während des Unterrichts: Eine neue Einheit öffnet sich
  erst nach Freigabe durch die Lehrkraft — nach Sichtung des
  handschriftlichen Blattes. Geprüft wird nur, **ob** von Hand gerechnet
  wurde, nicht ob richtig.
- Der Modus steht in der Datenbank, nicht im Browser. Ein abgelaufener
  Bewertungsmodus fällt von selbst in den offenen Zustand zurück.
- Im Entwicklermodus bleibt alles frei wählbar.

**Aktive Lernzeit**

- Gezählt wird nur, was sichtbar, aktiv und angekommen ist: Seite im
  Vordergrund, Aktivität in den letzten 90 Sekunden, Meldung vom Server
  bestätigt. Was nicht ankommt, bleibt liegen und wird nachgemeldet.
- Scrollen, Tippen, Animationen bedienen und geöffnete externe Übungen
  zählen als Aktivität.

**Externe Übungen im Rahmen statt im neuen Tab**

- `assets/js/uebungsrahmen.js` öffnet Übungen innerhalb der Anwendung. Der
  Ping läuft weiter, die Lernzeit auch, und der Rückweg ist ein Knopf.
- Der Rahmen entsteht erst beim Klick — bis dahin gibt es keine Verbindung
  zum Anbieter, genau wie bei einem Link.
- `frame-src` in der CSP erlaubt jetzt die sieben Übungsplattformen.
  YouTube gehört bewusst nicht dazu: Videos bleiben Links.

**Dashboard**

- Tafel „Unterricht und Freigaben": Modus umschalten, je Kind die nächste
  Einheit freigeben oder zurücknehmen, mit Anzeige, ob das Übungsblatt
  geöffnet wurde.
- Tafel „Aktive Lernzeit": heute, letzte sieben Tage, häufigste Einheit.

**Datenbank** — Migration erforderlich, siehe `MIGRATION.md`

- `mathe9_unterricht`, `mathe9_freigaben`, `mathe9_lernzeit`
- `mathe9_lernmodus()`, `mathe9_lernzeit_melden()`,
  `mathe9_unterricht_setzen()`, `mathe9_freigeben()`,
  `mathe9_freigabe_zuruecknehmen()`
- `mathe9_person_export` gibt Freigaben und Lernzeiten mit heraus,
  `mathe9_aufraeumen` löscht alte Lernzeiten mit der Fortschrittsfrist.

**Bekannte Einschränkungen**

- Die Sperre im Bewertungsmodus ist eine Absprache mit sichtbarer Form,
  kein Schutz gegen Umgehung: Wer die Entwicklerwerkzeuge des Browsers
  bedienen kann, kommt daran vorbei. Der Server verhindert nur, dass sie
  durch bloßes Ändern von localStorage fällt.
- Manche Übungsplattformen verbieten das Einbetten (X-Frame-Options). Das
  lässt sich von außen nicht sicher erkennen; deshalb steht „In neuem Tab
  öffnen" immer daneben, und nach sechs Sekunden ohne Inhalt erscheint ein
  Hinweis. **Vor dem Unterricht auf einem echten Gerät prüfen, welche
  Plattformen sich einbetten lassen.**
- Was innerhalb des Rahmens passiert, ist von außen nicht sichtbar. Für die
  Lernzeit gilt „Rahmen offen und Seite sichtbar" als Arbeit, begrenzt auf
  15 Minuten ohne jede Interaktion.
- Die PDFs liegen nicht im Offlinecache (54 Dateien, 432 KB). Zum Drucken
  wird Netz gebraucht.

**Zurück zur Vorgängerfassung**

`sw.js` und `version.json` auf `v29` zurücksetzen. Die neuen Tabellen können
in der Datenbank stehen bleiben; ohne den Client werden sie nicht
beschrieben. Steht der Bewertungsmodus noch, vorher im Dashboard auf
Übungsmodus zurückstellen — sonst bleibt er bis zum Ablauf von `gilt_bis`.

---

## v29 — 2026-08-02 · Betrieb, Sicherheit und Nachvollziehbarkeit

**Anwendung**

- Content-Security-Policy auf allen Seiten. `script-src 'self'` ohne
  Ausnahmen; die beiden bisherigen Inline-Skripte liegen jetzt in
  `assets/js/animationen-seite.js` und `assets/js/uebungen-seite.js`.
- Zentrale Migration der lokalen Datenstände (`LokalerStand` in
  `store.js`): Formatmarke, Schritte von n auf n+1, unlesbare Einträge
  werden verworfen statt die App zu blockieren.
- Betriebsanzeige im Entwicklermenü: Fassung, Commit, Cache, Online-Zustand,
  Größe der Offlinewarteschlange, Zeitpunkt der letzten Synchronisation.
  Der Diagnosebericht las bisher `manifest.commit`/`manifest.branch` — die
  Felder heißen `source_commit`/`source_branch` und blieben deshalb leer.
- `Tracker.status()` gibt Warteschlange, letzte Synchronisation und letzten
  Fehler heraus.
- Die Pfadempfehlung prüft jetzt alle vier geforderten Kriterien: Anzahl der
  Kernaufgaben, Tippnutzung, **uneinheitlicher Verlauf** (erste gegen zweite
  Hälfte) und **Anteil der Nachfassaufgaben**. Die letzten beiden fehlten.

**Behobene Fehler, die nur im Betrieb auffallen**

- Der Service Worker ließ die Seite beim **ersten** Besuch neu laden:
  `clients.claim()` löst denselben `controllerchange` aus wie ein Update. Wer
  gerade tippte, verlor die Eingabe. Ein Controllerwechsel zählt jetzt nur
  noch, wenn vorher schon einer da war.
- Der Benutzer-Chip (z-index 9000) lag über „Weiter" in der Buchnavigation
  (z-index 30) und über „Jetzt aktualisieren" in der Update-Leiste
  (z-index 60). Beide waren sichtbar, aber auf dem Handy nicht bedienbar.
- „Abmelden und meine lokalen Lernstände löschen" ließ eine Kopie zurück:
  Ein noch laufender, entprellter Speichervorgang schrieb den Stand nach dem
  Löschen erneut — unter der Kennung `lokal` und damit sichtbar für das
  nächste Kind am selben Gerät. `Stand.sperren()` beendet das Schreiben jetzt
  vor dem Löschen.

**Inhalte**

- Neuer Top-Level-Schlüssel `videos` in `tasks.json` und die Karte
  „Erklärvideos" auf der Einheitenseite. **135 Verweise auf Videos des
  Kanals Lehrerschmidt in allen 54 Einheiten**, zwei bis drei je Einheit,
  bei Bedarf über `pfad` an einen Lernweg gebunden.
- Verlinkt, nicht eingebettet: Ein eingebettetes Video würde bereits beim
  Öffnen der Einheit laden und Kennungen setzen. `frame-src 'none'` in der
  CSP verhindert das, `pruefen.js` setzt es durch.
- `pruefen.js` prüft Doppelungen je Einheit, die Pfadbindung und dass jeder
  Verweis in `youtube_videos_lehrerschmitt.csv` steht.

**Dashboard**

- Neue Tafel „Betrieb und Datenpflege": laufende Fassung und Zustand des
  Aufräumjobs, mit Warnung, wenn der letzte erfolgreiche Lauf über zehn
  Tage zurückliegt.
- Neue Tafel „Denkfehler über die Lernbereiche hinweg" auf Basis von
  `schema/fehlvorstellungen-kategorien.json`.

**Datenbank** — Migration erforderlich, siehe `MIGRATION.md`

- `mathe9_wartung_laeufe` protokolliert jeden Aufräumlauf;
  `mathe9_wartung_status()` bewertet ihn.
- `mathe9_teacher_audit` protokolliert jede Änderung an der
  Lehrkraftfreigabe. Neu: `mathe9_lehrkraft_sperren(email, hinweis)` und
  `mathe9_lehrkraft_uebersicht()` für die Kontrolle alter Konten.
- `mathe9_lehrkraft_freischalten` hat jetzt einen zweiten Parameter
  (`p_hinweis`). Die einstellige Fassung wird beim Migrieren entfernt.

**Werkzeuge**

- `werkzeuge/budget-pruefen.js` und `werkzeuge/budget.json`:
  Performancebudget für günstige Smartphones.
- `werkzeuge/fehlvorstellungen-sichten.js`: Arbeitsliste für die fachliche
  Durchsicht der Fehlvorstellungen über die Lernbereiche hinweg.
- `werkzeuge/links-pruefen.js --bericht`: Der wöchentliche Linkcheck führt
  jetzt ein GitHub-Issue statt nur ein Protokoll.
- `werkzeuge/release.js` verlangt einen Changelog-Eintrag, prüft, dass das
  Git-Tag noch frei ist, und gibt die Veröffentlichungsreihenfolge aus:
  Datenbank zuerst, Webclient danach.
- `werkzeuge/pruefen.js` prüft zusätzlich die Content-Security-Policy,
  Inline-Skripte, die neuen Protokolltabellen, den Changelog-Eintrag und den
  Kategorienkatalog.
- `.github/BRANCHSCHUTZ.md`: die Einstellungen für `master` samt fertigem
  `gh api`-Befehl. Muss einmalig von Hand gesetzt werden.

**Tests**

- Neu: Offlinewarteschlange, Abmelden mit Datenlöschung, Wiederaufnahme nach
  Browserneustart, Service-Worker-Update, Content-Security-Policy,
  Buchnavigation mit fokussiertem Eingabefeld.
- Der Test „Bearbeitungsstand überlebt das Neuladen" wartete 700 ms fest und
  war deshalb auf langsamen Runnern unzuverlässig; er wartet jetzt darauf,
  dass die Eingabe tatsächlich im Speicher steht.

**Bekannte Einschränkungen**

- Die CSP steht als `<meta>`-Tag. `frame-ancestors` und `X-Frame-Options`
  lassen sich so nicht setzen; auf GitHub Pages ist das nicht nachrüstbar.
  Bei eigenem Hosting gehören beide als HTTP-Kopfzeilen dazu.
- Für die Google-Fonts-Datei gibt es keine Subresource Integrity: Die
  Antwort ist je nach Browser verschieden und ein fester Hash würde die
  Schrift zufällig blockieren.
- `mathe9_wartung_status()` und die Lehrkraftprotokolle sind erst nach der
  Datenbankmigration verfügbar. Bis dahin meldet das Dashboard „Status
  nicht abrufbar" — das ist der erwartete Zustand, kein Fehler.

**Zurück zur Vorgängerfassung**

Die Migration legt nur an; sie löscht nichts. `sw.js` und `version.json`
auf `v28` zurücksetzen genügt für die Anwendung. Die neuen Tabellen und
Funktionen können in der Datenbank stehen bleiben.

---

## v28 · Sichere Schüleranmeldung

- Sitzungstoken bindet Schreibzugriffe an das angemeldete Kind; der alte
  Login-RPC wird gesperrt.
- Lehrkraft-Freigabeliste `mathe9_teachers` statt „jeder angemeldete
  Supabase-Nutzer ist Lehrkraft".
- Abmelden fragt: nur abmelden oder auch die lokalen Lernstände löschen.
- Aufbewahrungsfristen als Funktion `mathe9_aufraeumen()` mit wöchentlichem
  pg_cron-Auftrag.

Ausführlich: `INTEGRATION-ANPASSUNGEN-V28.md`, `MIGRATION.md`.

---

## v27 · Prüfung und Integration

Ausführlich: `INTEGRATION-ANPASSUNGEN-V27.md`.

## v26 · Die 20 Anpassungen

Aufgaben-Sitzungs-ID (`task_session_id`) an jedem Ereignis; das Dashboard
bündelt Versuche seither eindeutig. Ausführlich:
`INTEGRATION-ANPASSUNGEN-V26.md`.

## v25 · Update

Ausführlich: `INTEGRATION-UPDATE-V25.md`.

## v24 · Lernwirkung

Ausführlich: `INTEGRATION-LERNWIRKUNG-V24.md`.

## v23 · Niveaustufe A sprachlich gesenkt

Ausführlich: `INTEGRATION-STUFE-A-ANIMATIONEN-V23.md`.

## v22 · Mobiler Buchmodus

Ausführlich: `INTEGRATION-BUCHMODUS-V22.md`.

## v21 · Integration und Fehlerprüfung

Ausführlich: `INTEGRATION-ANPASSUNGEN-V21.md`.

## v20 · Externe Übungen

Ausführlich: `INTEGRATION-EXTERNE-UEBUNGEN-V20.md`.

## v19 · Fehlerbereinigung

Ausführlich: `INTEGRATION-FEHLERBEHEBUNG-V19.md`.

## v18 · LearningApps

Ausführlich: `INTEGRATION-LEARNINGAPPS-V18.md`.

## v17 · Animationen Spitzkörper

Ausführlich: `INTEGRATION-ANIMATIONEN-SK-V17.md`.

## v16 · Entwickler-Schnellnavigation

Ausführlich: `INTEGRATION-DEV-NAVIGATION-V16.md`.

## v15 · Animationen Körper, Prismen, Zylinder

Ausführlich: `INTEGRATION-ANIMATIONEN-KP-V15.md`.

## v14 · Animationen Prozent und Zinsen

Ausführlich: `INTEGRATION-ANIMATIONEN-PZ-V14.md`.

## v13 · Anpassungen

Ausführlich: `INTEGRATION-ANPASSUNGEN-V13.md`.
