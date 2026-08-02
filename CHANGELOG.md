# Changelog

Alle Produktivfassungen mit ihren Änderungen, den zugehörigen
Datenbankmigrationen, bekannten Einschränkungen und dem Weg zurück.

Format: eine Überschrift je Fassung, Datum im Format JJJJ-MM-TT. Die
Fassungsnummer ist zugleich die Cache-Version in `sw.js` und das Git-Tag
(`v29`). `werkzeuge/release.js` prüft, dass es zu jeder neuen Fassung einen
Eintrag gibt — ein Release ohne Changelog-Eintrag wird nicht freigegeben.

Die ausführlichen Integrationsberichte je Fassung liegen weiterhin als
`INTEGRATION-*.md` daneben; hier steht nur, was für den Betrieb zählt.

Die Fassungen vor v29 sind nachgetragen. Ihr Veröffentlichungsdatum ist
nicht belegt — es gab bis dahin weder Tags noch Changelog. Deshalb steht
dort keines: ein geschätztes Datum wäre schlechter als gar keines.

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
