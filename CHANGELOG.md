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
