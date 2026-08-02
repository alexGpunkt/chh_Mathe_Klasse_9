# V26 · Die 20 Anpassungen aus `anpassungen.txt`

Alle 20 Punkte sind bearbeitet. Bei drei Punkten war das Ergebnis nicht Code,
sondern eine Arbeitsgrundlage — das steht jeweils dabei.

## Priorität 1 · vor der Produktivveröffentlichung

**1 · Bearbeitungsstand dauerhaft speichern** — `store.js` (`Stand`), `engine.js`
Pro Schüler und Einheit werden Pfad, Position, gelöste Aufgaben, genutzte Tipps,
Selbsteinschätzung, abgeschlossene Pfade und die **bereits getippten, noch nicht
geprüften Eingaben** gespeichert. Beim Öffnen: „Du warst zuletzt bei Aufgabe 2
von 4 — dort weiterlernen?" mit der Alternative „Von vorn beginnen". Gesichert
wird beim Aufgabenwechsel, nach jeder Antwort, bei Eingaben (entprellt) sowie
bei `visibilitychange` und `pagehide`. Verfall nach 45 Tagen. Prüfungssets
speichern nichts.

**2 · Aufgaben-Sitzungs-ID** — `engine.js`, `tracker.js`, `supabase/setup.sql`
Jede gezeigte Aufgabe bekommt eine `task_session_id`, die über den Tracker-
Kontext an **jedes** Ereignis dieser Bearbeitung angehängt wird. Sie reist in
der Nutzlast — so braucht es keine Schemaänderung an bestehenden Installationen.
Für die Auswertung liegt ein Index auf `(payload ->> 'task_session_id')` bereit.

**3 · Lücken explizit in den Daten** — `engine.js`, alle 54 `tasks.json`
Neues Feld `beispiel.luecke = { schritt, wert, einheit }`. Es hat Vorrang vor
der bisherigen Zeichenkettenregel, die als Rückfall erhalten bleibt. Gesetzt in
**42 Einheiten**; die übrigen **12** sind Benennungs- und Zuordnungsbeispiele
ohne Rechenergebnis und bekommen bewusst keine Lücke. Sechs Lücken, die die
alte Regel nicht finden konnte (`= 15 cm²`, `→ 3,20 €`), sind jetzt gesetzt.

**4 · Fehlvorstellungen mit Erklärabsätzen verbinden** — 77 Verweise gesetzt
Zugeordnet wurde regelbasiert: Ein Absatz wird nur dann verlinkt, wenn er mit
dem Rückmeldetext der Fehlvorstellung **mindestens zwei inhaltstragende Wörter**
teilt und dabei eindeutig der beste Treffer ist.

> **Offen und bewusst so:** Das trifft 51 der 552 Fehlvorstellungs-/Pfad-Paare.
> Für den Rest bleibt der bisherige Rückfall (Animation, sonst Merksatz), der
> thematisch richtig ist. Eine Zuordnung zu raten wäre schlechter als keine —
> ein falscher Verweis schickt das Kind an die falsche Stelle.

**5 · Abdeckung der Nachfassaufgaben** — `engine.js` + `werkzeuge/nachfass-luecken.js`
Die Suche akzeptiert jetzt auch IDs mit gleichem Wortstamm
(`mal_statt_geteilt` ≙ `mal_statt_geteilt_vol`). Der Gewinn ist ehrlich klein:
**A 33 % · B 49 % · C 42 %**. Die Werte werden aus 545 zusammengefassten Fehlvorstellungs-/Pfad-Paaren berechnet.

> **Warum nicht mehr:** Der Vorschlag geht davon aus, dass es reicht, weitere
> Aufgaben zu taggen. Eine Fehlvorstellung braucht aber den konkreten falschen
> Wert und einen Rückmeldesatz — beides ist eine fachliche Entscheidung. Statt
> zu raten liefert `werkzeuge/nachfass-luecken.js` die Arbeitsliste: welche
> Fehlvorstellung in welcher Einheit allein steht und in welchen Aufgaben
> desselben Pfades sie fachlich Platz hätte.

**6 · Automatischer Updatehinweis** — `store.js`, `sw.js`, `app.css`
`skipWaiting()` ist aus dem Install entfernt. Eine neue Fassung wartet, meldet
sich als Leiste am unteren Rand und übernimmt erst nach Zustimmung — dann über
`controllerchange` in **allen offenen Tabs**. Zusätzlich wird beim Zurückkehren
auf die Seite und alle 30 Minuten nach einer neuen Fassung gesehen.

**7 · Reale Smartphone-Testmatrix** — `TESTPROTOKOLL-GERAETE.md`

> **Kann ich nicht ausführen.** Geliefert ist ein abarbeitbares Protokoll: sechs
> Geräte, acht Prüfbereiche (Tastatur, feste Navigation, Animationen,
> Wischgesten, dunkler Modus, Verbindung, Bearbeitungsstand, Barrierefreiheit),
> Befundtabelle mit Schweregrad und Freigabezeile.

## Priorität 2 · Qualität und Wartbarkeit

**8 · JSON-Schema** — `schema/tasks.schema.json`, `werkzeuge/schema-pruefer.js`
Vollständiges Schema für `tasks.json`: Aufgabentypen mit typabhängigen
Pflichtfeldern, Antwortformate, Fehlvorstellungsstruktur, Animationsfelder,
Worterklärungen, externe Links und Lückenmetadaten. Geprüft wird es von einem
**abhängigkeitsfreien** Mini-Prüfer (rund 130 Zeilen), damit das Projekt ohne
Build-Step bleibt. Alle 54 Einheiten sind sauber.

**9 · GitHub-Actions-Prüfung** — `.github/workflows/pruefen.yml`, `werkzeuge/pruefen.js`
Bei jedem Push auf `develop`/`master` und bei Pull Requests: JSON lesbar, Schema
eingehalten, Aufgaben-IDs eindeutig, Auswahlindizes im gültigen Bereich, Lücken-
und Absatzverweise zeigen ins Leere?, Animationsnamen vorhanden, Service Worker
vollständig, lokale Verweise auflösbar, nur freigegebene externe Plattformen,
JavaScript-Syntax, `devMode` passend zum Zweig, Cache-Version hochgezählt.
Gegenprobe mit absichtlich eingebauten Fehlern: alle vier gefunden.

**10 · Buch- und Aufgabenfortschritt trennen** — `buch.js`, `einheit.html`
„Buchseite 18 von 54" gegen „3 von 6 **Aufgaben**". Vorher stand zweimal nur
eine nackte Zahl auf derselben Seite.

**11 · Eigene Bewegungseinstellung** — `animationen.js`, `engine.js`, `app.css`
Schalter „Animationen automatisch starten" in der Formelkarte, gespeichert unter
`mathe9.autostart`. Er kann Bewegung nur abschalten, nie erzwingen: Wer sie im
System abgestellt hat, bekommt einen erklärenden Hinweis statt eines wirkungs-
losen Schalters.

**12 · Barrierefreiheit** — `werkzeuge/a11y-pruefen.js` + Protokollabschnitt
Automatisch geprüft: Sprachauszeichnung, Titel, doppelte IDs, Alternativtexte
(auch in den Aufgabendaten), Beschriftung der Bedienelemente, Überschriftenfolge,
Zoom-Sperren, Touchziele in den Stylesheets. Dabei gefunden und behoben: drei
Bedienelemente unter 44 px im Buchmodus.

> **Nicht automatisierbar** und deshalb im Protokoll: Screenreader-Ausgabe,
> Fokusreihenfolge, reine Tastaturbedienung, Zoom auf 200/400 %, gemessene
> Farbkontraste.

**13 · Lehrer-Deep-Links** — `engine.js`
`?p=B`, `?aufgabe=LF04-B2-003`, `?abschnitt=beispiel|erklaerung|animation|merke`.
Ein Deep-Link schlägt den gespeicherten Stand.

**14 · Automatische Prüfung externer Übungen** — `werkzeuge/links-pruefen.js`
Meldet Nichterreichbarkeit, Zeitüberschreitung, HTTP-Fehler, Weiterleitung auf
eine andere Domain und nicht mehr freigegebene Plattformen. Läuft getrennt vom
Push-Workflow (`workflow_dispatch`), weil er Netz braucht und Fremdseiten sich
ohne unser Zutun ändern.

> **Grenze:** Eine 200 ist kein Qualitätsnachweis. Ob der Inhalt fachlich noch
> passt, bleibt Sache der Lehrkraft — das sagt das Werkzeug auch selbst.

**15 · Diagnoseexport** — `dev-tools.js`
Knopf „Diagnose speichern" im Entwicklermenü: Projektseite, Einheit, Aufgabe,
Aufgabensitzung, Service-Worker-Zustand und -Skript, Cachenamen, devMode,
User-Agent, Bildschirm und Ausrichtung, Online-Zustand, dunkler Modus,
Bewegungseinstellung, Speicherfähigkeit und die letzten 20 JavaScript-Fehler.
Als `.txt` gespeichert **und** in die Zwischenablage. Enthält bewusst keinen
Klarnamen und keine Antworten.

## Priorität 3 · pädagogischer Ausbau

**16 · Unsicherheit der Pfadempfehlung** — `engine.js`
Bei weniger als vier Kernaufgaben oder wenn im Schnitt mindestens ein Tipp je
Aufgabe geholt wurde, heißt es nicht mehr „Vorschlag", sondern „Eher ein Eindruck
als ein Ergebnis" — mit dem Grund und dem Angebot einer **kurzen Einstufung**
(drei Aufgaben, Stufe 1–2, ohne Lernkarte). Deren Ergebnis bestätigt die
Empfehlung oder nicht.

**17 · Lernstatus im Inhaltsverzeichnis** — `buch.js`, `store.js`, `buch.css`
○ noch nicht begonnen · ● begonnen · ✓ abgeschlossen · ↻ Wiederholung fällig
(älter als 21 Tage). Zeichen **und** Text, nie Farbe allein; jeder Eintrag trägt
ein `aria-label` mit dem Status im Klartext.

**18 · „Weiterlernen"-Kachel** — `assets/js/weiterlernen.js`, `index.html`
Ganz oben auf der Startseite, mit Einheit, Titel, Aufgabenposition, Pfad und
Zeitpunkt. Der Pfad wandert in den Link mit. Ohne gespeicherten Stand erscheint
nichts. `index.html` lädt dafür jetzt `store.js` — damit ist auch der Service
Worker auf der Einstiegsseite registriert.

**19 · Vorhersagen im Dashboard** — `dashboard/`
Eigene Tafel: Anzahl Vorhersagen, Trefferquote, und der eigentliche Punkt —
**„falsch getippt, danach Aufgabe richtig"**. Dafür wird zu jeder falschen
Vorhersage die nächste Antwort desselben Kindes gesucht. Je Animation zusätzlich
„mehrfach daneben" als Hinweis auf eine hartnäckige Grundvorstellung.

**20 · Datenschutz und Löschfristen** — `DATENSCHUTZ.md`, `supabase/setup.sql`
Dokumentiert: was wo liegt (Gerät, Server, Cache), wer was sehen darf, Fristen
(Ereignisse 90 Tage, Fortschritt ein Schuljahr, Gerätestand 45 Tage), Auskunft,
Export und Löschung. Technisch umgesetzt als
`mathe9_aufraeumen()`, `mathe9_person_export()` und `mathe9_person_loeschen()`,
nur für angemeldete Lehrkräfte ausführbar.

> **Offen bleibt organisatorisch:** Rechtsgrundlage, Auftragsverarbeitungs-
> vertrag, Serverstandort, Verarbeitungsverzeichnis, Elterninformation und das
> Einrichten des geplanten Aufräumlaufs. Die Liste steht im Dokument. Solange
> sie offen ist, gehört das Tracking ausgeschaltet.

## Geprüft

- `werkzeuge/pruefen.js`: 66 JSON-Dateien, 54 Einheiten gegen das Schema (0 Verstöße),
  756 eindeutige Aufgaben-IDs, 147 Animationsverweise, 93 Cache-Einträge, 88 externe Links
- `werkzeuge/a11y-pruefen.js`: 9 Seiten, 287 Bilder, keine Fehler
- Funktionstests in jsdom: Bearbeitungsstand über einen simulierten Neuladevorgang
  (inklusive zurückgeholter Eingabe), Sitzungs-ID je Aufgabe, Deep-Links auf Aufgabe
  und Abschnitt, Bewegungsschalter, unsichere Empfehlung mit Einstufung,
  Weiterlernen-Kachel, Lernstatus
- 123 Animationsvarianten (41 Animationen × A/B/C) bauen fehlerfrei
- dabei gefunden und behoben: `autostartErlaubt` war nur in Teil 1 von
  `animationen.js` sichtbar und hätte jede Seite mit Animationen beim Laden zerlegt

**Nicht geprüft:** Darstellung und Verhalten in echten Browsern und auf echten
Geräten. Dafür ist `TESTPROTOKOLL-GERAETE.md` da.

## Cache

```javascript
const VERSION = 'mathe9-v26-anpassungen-develop';
```
