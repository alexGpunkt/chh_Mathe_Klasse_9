# Datenschutz · Mathe 9

Dieses Dokument beschreibt, welche Daten die Anwendung verarbeitet, wie lange
sie bleiben und wie sie gelöscht werden. Es ist die technische Grundlage für
das Verarbeitungsverzeichnis — **es ersetzt keine schulische Freigabe.** Vor
dem Regelbetrieb müssen Schulleitung und behördlicher Datenschutz zustimmen.

## 1 · Was wo liegt

Die Anwendung kennt drei getrennte Ablagen. Nur eine davon verlässt das Gerät.

### 1.1 Auf dem Gerät (localStorage), verlässt es nie

| Schlüssel | Inhalt | Zweck |
|---|---|---|
| `mathe9.pfad` | A, B oder C | zuletzt gewählte Niveaustufe |
| `mathe9.stand.<kennung>.<einheit>` | Position, gelöste Aufgaben-IDs, getippte Zwischenwerte, Selbsteinschätzung | Weiterlernen nach Neuladen |
| `mathe9.stand.<kennung>.zuletzt` | zuletzt bearbeitete Einheit | Kachel „Weiterlernen“ |
| `mathe9.fehler.<kennung>` | Fehlvorstellungs-IDs mit Anzahl und Datum | Auswahl der Warm-up-Kategorien |
| `mathe9.spiral` | Leitner-Boxen der Warm-up-Generatoren | verteiltes Wiederholen |
| `mathe9.matrix.<name>` | Häkchen der Kompetenzmatrix | Lehrkraftwerkzeug |
| `mathe9.autostart` | ein/aus | Bewegungseinstellung |
| `mathe9.lesezeichen.<kennung>` | Einheitskürzel | Buchmodus |
| `mathe9.token` | Sitzungstoken der Anmeldung, mit Ablaufzeit | Schreibrecht gegenüber der Datenbank |

**Keine Klarnamen, keine Aufgabentexte, keine Antworten.** Der Bearbeitungsstand
speichert getippte Zahlen — sie gehören zu genau einer Aufgabe und gehen nicht
über das Gerät hinaus.

**Löschung:** Entwicklermenü → „Offlinecache löschen“ entfernt den Cache;
Browserdaten löschen entfernt zusätzlich den localStorage. Der Bearbeitungsstand
verfällt außerdem nach **45 Tagen** von selbst (`HALTBAR_TAGE` in `store.js`).

> **Gemeinschaftsgerät:** Der Stand hängt an der Schülerkennung, liegt aber im
> selben Browserprofil. Beim Abmelden fragt die Anwendung deshalb: **„Nur
> abmelden"** oder **„Abmelden und meine lokalen Lernstände löschen"**. Die
> zweite Wahl entfernt Bearbeitungsstände, Fehlerprofil, Lesezeichen und
> Warm-up-Kartei dieses Kindes und entwertet das Sitzungstoken sofort.

### 1.2 Auf dem Server (Supabase), nur bei eingeschaltetem Tracking

Ohne `enabled: true` in `assets/js/supabase-config.js` verlässt **nichts** das
Gerät. Ist es eingeschaltet, entstehen drei Tabellen:

| Tabelle | Inhalt |
|---|---|
| `mathe9_students` | Anmeldename, Anzeigename, Lerngruppe, aktiv/gesperrt |
| `mathe9_events` | ein Datensatz je Ereignis: Typ, Schülerkennung, Gerät, Sitzung, Lerngruppe, Seite, Einheit, Pfad, Aufgabe, Zeitstempel, Nutzlast |
| `mathe9_progress` | zusammengefasster Stand je Schüler, Einheit und Pfad |

Die **Nutzlast** enthält je nach Ereignis: richtig/falsch, Fehlvorstellungs-ID,
Anzahl Tipps, Anzahl Versuche, Bearbeitungsdauer, Aufgaben-Sitzungs-ID,
Vorhersage zur Animation. **Nicht enthalten:** eingegebene Zahlen, Aufgaben- und
Rückmeldetexte, Freitext.

Dazu kommen zwei Protokolltabellen, die **keine** Daten von Lernenden
enthalten:

| Tabelle | Inhalt | Warum |
|---|---|---|
| `mathe9_wartung_laeufe` | Zeitpunkt, Erfolg, Fehlermeldung und Anzahl gelöschter Zeilen je Aufräumlauf | Ohne Protokoll ist nicht belegbar, dass die Fristen unten tatsächlich wirken |
| `mathe9_teacher_audit` | wer wann welche Lehrkraft freigeschaltet oder gesperrt hat | „Wer durfte die Daten aller Lernenden sehen, seit wann?" muss beantwortbar sein |

Beide sind für freigeschaltete Lehrkräfte lesbar und werden ausschließlich von
den Datenbankfunktionen geschrieben. `mathe9_wartung_laeufe` wird nach 400
Tagen selbst bereinigt; das Freigabeprotokoll bleibt bewusst stehen — es
dokumentiert einen Berechtigungsvorgang, kein Lernverhalten.

Seit V30 kommen zwei personenbezogene Tabellen dazu:

| Tabelle | Inhalt | Frist |
|---|---|---|
| `mathe9_freigaben` | welche Einheit für wen freigegeben ist, wann und von wem | mit dem Schülerdatensatz (`ON DELETE CASCADE`) |
| `mathe9_lernzeit` | aktive Lernzeit je Person, Tag und Einheit — nur Sekunden, keine Inhalte | wie der Fortschritt: **ein Schuljahr** |

Zur Lernzeit gehört eine ehrliche Einordnung: Sie ist eine **Anwesenheits-
und Tätigkeitsangabe**, kein Leistungsmaß. Gezählt wird nur, was sichtbar,
aktiv und beim Server angekommen ist; Leerlauf zählt nicht. Was in einer
eingebetteten fremden Übung geschieht, ist von hier aus nicht sichtbar — dort
gilt „Rahmen offen und Seite sichtbar" als Arbeit. Wer daraus Noten ableiten
will, misst etwas anderes, als er glaubt.

Beide Tabellen stehen in `mathe9_person_export` und verschwinden mit
`mathe9_person_loeschen`.

Seit V36 kommt eine weitere personenbezogene Tabelle dazu — und es ist die
einzige, aus der eine **Note** entstehen kann:

| Tabelle | Inhalt | Frist |
|---|---|---|
| `mathe9_quiz_ergebnisse` | je Lauf des Abschlussquiz: Einheit, Lernbereich, Pfad, Anzahl Fragen, Anzahl richtig, Dauer in Sekunden, Kennungen der Denkfehler, ob im Unterricht geschrieben, ob gewertet | wie der Fortschritt: **ein Schuljahr** |

Gespeichert werden **Zählwerte und Fehlvorstellungs-IDs, keine Antworttexte**
und keine eingegebenen Zahlen. Wer wissen will, was ein Kind geantwortet hat,
findet es hier nicht — nur, wie viele Fragen saßen und welche Denkfehler
dahinterstanden.

Drei Punkte, die zu einer Bewertungsgrundlage gehören:

- **Gewertet wird der erste Lauf je Kind und Einheit.** Weitere Läufe werden
  gespeichert, aber als Übung geführt; sie verändern die Bewertung nicht. Vor
  dem Start steht auf dem Schirm, ob dieser Lauf der gewertete ist.
- **Auch Läufe von zu Hause werden aufgezeichnet.** Das Feld `pflicht` hält
  fest, ob zum Zeitpunkt des Laufs der Bewertungsmodus lief. Ob häusliche
  Läufe eine Note begründen dürfen, entscheidet die Fachkonferenz über den
  Dashboard-Schalter „nur Läufe aus dem Unterricht" — nicht das Gerät und
  nicht diese Anwendung.
- **Die Note ist eine Rechnung, keine Zeugnisnote.** Sie entsteht in
  `mathe9_quiz_uebersicht()` aus der Quote und der gewählten Bewertungsart und
  liefert eine von mehreren Grundlagen. Fünf Fragen je Einheit tragen keine
  Zeugnisnote allein, und die Anwendung behauptet das auch nicht.

Ebenfalls neu ist die Spalte `bewertungsart` in `mathe9_students`
(`note` oder `fortschritt`). Sie hält fest, nach welchem Verfahren ein Kind
bewertet wird; geändert wird sie ausschließlich über
`mathe9_bewertungsart_setzen()` durch eine freigeschaltete Lehrkraft.

Die Quizergebnisse stehen in `mathe9_person_export`, werden von
`mathe9_person_loeschen` einzeln gezählt und gelöscht und unterliegen in
`mathe9_aufraeumen()` derselben Frist wie der Fortschritt. Eine
Bewertungsgrundlage, die in keiner Auskunft auftaucht und nie verfällt, wäre
die einzige personenbezogene Sammlung im Projekt ohne Ende — und ausgerechnet
die folgenreichste.

Auf dem Gerät selbst liegt zusätzlich der eigene Stand unter
`mathe9.stand.<Einheit>` im Feld `quiz`: Anzahl richtig, Anzahl Fragen, Dauer
und der erste Lauf. Er dient der Anzeige im Abschluss und verlässt das Gerät
nicht; ohne Serververbindung ist er die einzige Spur des Laufs.

### 1.2b Verweise auf fremde Seiten (Übungen und Erklärvideos)

Jede Einheit kann auf externe Übungen und auf Erklärvideos der YouTube-Kanäle
in `youtube_videos_lehrerschmitt.csv` verweisen. Beide sind **Links, keine
Einbettungen**:

- Solange niemand klickt, wird **keine** Verbindung zu YouTube, LearningApps
  oder Serlo aufgebaut. Ein eingebettetes Video würde dagegen schon beim
  Öffnen der Einheit laden und Kennungen setzen — bei allen, auch bei denen,
  die es gar nicht ansehen wollen.
- Die Content-Security-Policy verbietet Einbettungen ausdrücklich
  (`frame-src 'none'`). Das ist keine Einstellung, sondern eine Regel, die
  `werkzeuge/pruefen.js` durchsetzt.
- Wer klickt, verlässt die Anwendung. Ab dort gelten die Bestimmungen des
  jeweiligen Anbieters — bei YouTube also die von Google, mit allem, was
  dazugehört. Auf der Karte steht das als Hinweis.
- **Seit V30 öffnen sich die Übungen in einem Rahmen innerhalb der
  Anwendung**, damit die Lernzeit weiterläuft. Am Entscheidenden ändert das
  nichts: Der Rahmen entsteht erst beim Klick, vorher gibt es keine
  Verbindung. Ein Rahmen ist **nicht harmloser** als ein neuer Tab — er ist
  genauso ein Aufruf beim fremden Anbieter, nur ohne den Verlust des
  Rückwegs. Der Rahmen läuft mit `sandbox` ohne `allow-top-navigation` und
  mit `referrerpolicy="no-referrer"`.
- Videos bleiben Links, auch nach V30. Sie liefen sonst über Google-Server
  innerhalb der Seite, und dafür gibt es keinen Grund, der die zusätzliche
  Datenweitergabe aufwöge.
- Protokolliert wird bei aktivem Tracking nur, **dass** ein Verweis geöffnet
  wurde (Ereignis `video_open` beziehungsweise `external_practice_open`) mit
  Titel und Plattform. Was auf der fremden Seite geschieht, erreicht diese
  Anwendung nicht.

Für den Unterricht heißt das: Die Videos sind ein Angebot für zu Hause. Wer
sie im Klassenraum einsetzen will, sollte sie vorher selbst öffnen — auch weil
YouTube Werbung und Empfehlungen daneben stellt, auf die niemand hier Einfluss
hat.

### 1.3 Im Offlinecache

Nur die Programm- und Aufgabendateien des Projekts. Keine personenbezogenen
Daten.

## 2 · Wer was sehen darf

| Rolle | Zugriff | technisch durchgesetzt durch |
|---|---|---|
| Schülerin/Schüler | schreibt nur für sich, liest nichts | kurzlebiges Sitzungstoken (`x-mathe9-token`), serverseitig geprüft |
| Lehrkraft | Dashboard, nur nach Freigabe | Eintrag in `mathe9_teachers` oder Claim `role = teacher` |
| Administration | Datenbankzugang | Supabase-Projektrechte |

**Zwei Änderungen gegenüber dem ersten Entwurf, beide sicherheitsrelevant:**

1. Nicht mehr jeder angemeldete Supabase-Nutzer ist Lehrkraft. Freigeschaltet
   wird einzeln:

   ```sql
   select public.mathe9_lehrkraft_freischalten('lehrerin@schule.de');
   ```

   **Solange die Liste leer ist, sieht niemand Dashboarddaten.** Das ist der
   beabsichtigte Ausgangszustand.

2. Die Anwendung kann nicht mehr im Namen beliebiger Kinder schreiben. Die
   Anmeldung stellt ein Token aus (`mathe9_student_anmelden`), das höchstens
   24 Stunden gilt und nur als Hash gespeichert wird. Beim Abmelden wird es
   sofort entwertet.

Die Regeln stehen in `supabase/setup.sql`. **Vor dem Regelbetrieb prüfen, dass
die Policies wirklich greifen** — ein Dashboard ohne Anmeldung wäre ein
Datenleck, kein Komfortmerkmal.

## 3 · Aufbewahrung und Löschung

| Daten | Frist | Begründung |
|---|---|---|
| Rohereignisse `mathe9_events` | **90 Tage** | Rückmeldung im Unterricht braucht Wochen, nicht Jahre |
| `mathe9_progress` | **1 Schuljahr** | Fortschritt über die Einheiten hinweg |
| `mathe9_students` | bis zum Verlassen der Lerngruppe | Zuordnung der Anmeldung |
| Bearbeitungsstand auf dem Gerät | 45 Tage | automatisch in `store.js` |

Die Fristen setzt `supabase/setup.sql` als Funktion `mathe9_aufraeumen()` um.
Das Skript richtet den wöchentlichen Lauf **selbst ein**, sobald `pg_cron` im
Projekt verfügbar ist (sonntags 03:17 UTC, Auftrag `mathe9-aufraeumen`). Ist
die Erweiterung nicht vorhanden, meldet das Skript das beim Ausführen und der
Aufruf bleibt ein Handgriff:

```sql
-- Prüfen, ob der Auftrag läuft
select jobname, schedule, active from cron.job where jobname = 'mathe9-aufraeumen';

-- Ersatzweise von Hand, wöchentlich
select public.mathe9_aufraeumen();
```

Ohne diesen Lauf löscht niemand etwas — das ist der häufigste stille Fehler
bei Aufbewahrungsfristen. Seit V29 muss man dafür nicht mehr nachsehen: Jeder
Lauf schreibt eine Zeile nach `mathe9_wartung_laeufe`, und das Dashboard
zeigt unter „Betrieb und Datenpflege" eine Warnung, sobald der letzte
erfolgreiche Lauf über zehn Tage zurückliegt.

```sql
-- Zustand in einer Zeile
select * from public.mathe9_wartung_status();
```

## 4 · Auskunft, Export und Löschung einzelner Personen

- **Auskunft/Export:** `select * from mathe9_events where student_id = …`
  zusammen mit `mathe9_progress`. Ergebnis als CSV aushändigen.
- **Löschung einer Person:** `select mathe9_person_loeschen('<student_id>');`
  Die Funktion entfernt Ereignisse, Fortschritt und den Eintrag in der
  Freigabeliste.
- **Gerät:** zusätzlich lokal die Browserdaten löschen — der Server erreicht
  den localStorage nicht.

## 5 · Was noch zu klären ist

- [ ] Einwilligung beziehungsweise Rechtsgrundlage schriftlich festhalten
- [ ] Auftragsverarbeitungsvertrag mit dem Supabase-Betreiber prüfen
- [ ] Serverstandort und Drittlandübermittlung klären
- [ ] Eintrag im Verarbeitungsverzeichnis der Schule
- [ ] Information an Eltern und Lernende in verständlicher Sprache
- [ ] `mathe9_aufraeumen()`: prüfen, ob der pg_cron-Auftrag wirklich läuft
      (seit V29 zeigt das Dashboard es an)
- [ ] mindestens eine Lehrkraft freischalten — sonst bleibt das Dashboard leer
- [ ] Lehrkraftliste regelmäßig durchsehen:
      `select * from public.mathe9_lehrkraft_uebersicht();` — Konten mit
      `pruefen = true` waren ein halbes Jahr nicht angemeldet
- [ ] Migration zuerst in einem Testprojekt fahren (siehe `MIGRATION.md`)
- [ ] Prüfen, ob pseudonyme Kürzel statt Klarnamen genügen

Solange diese Punkte offen sind, gehört das Tracking **ausgeschaltet**
(`enabled: false`). Die Anwendung funktioniert vollständig ohne es; es fehlt
dann allein das Lehrerdashboard.
