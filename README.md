# Mathe 9 · Campus Hannah Höch

Differenzierte Lernwege für Jahrgang 9, Campus Hannah Höch.
Statische Website, keine Abhängigkeiten, kein Build-Step.

**30 Einheiten à 60 Minuten · 420 Aufgaben.**
**Spiral-Pool: 105 Generatoren in 7 Kategorien für das Warm-up „Altes Wissen".**
**Prüfungstrainer, Arbeitsblatt-Druck, Kompetenzmatrix, Offline-Betrieb.**

| Bereich | Einheiten | Stand |
|---|---|---|
| **PZ** Prozent & Zinsrechnung | 14 | vollständig |
| **LF** Lineare Funktionen | 16 | vollständig |
| **KP** Würfel, Quader, Prisma, Zylinder | 0 von 12 | offen |
| **SK** Spitzkörper | 0 von 12 | offen |

## Einheiten · PZ

| | Einheit | Schwerpunkt |
|---|---|---|
| **Grundlagen** | PZ-01 | Anteile: Bruch, Dezimalzahl, Prozent |
| | PZ-02 | Prozente schätzen |
| | PZ-03 | Dreisatz |
| | PZ-04 | Antiproportional – und der Unterschied |
| **Die drei Größen** | PZ-05 | G, W und p % benennen |
| | PZ-06 | Prozentwert berechnen |
| | PZ-07 | Prozentsatz berechnen |
| | PZ-08 | Grundwert berechnen |
| **Anwenden** | PZ-09 | Vermehrter und verminderter Grundwert |
| | PZ-10 | Prozentuale Veränderung & Wachstumsfaktor |
| **Zinsen** | PZ-11 | Zinsen für ein Jahr |
| | PZ-12 | Monats- und Tageszinsen |
| | PZ-13 | Mehrjährige Anlage & Zinseszins |
| **Prüfung** | PZ-14 | Anwendung & Prüfungstraining |

Jede Einheit: 4 Aufgaben Basis · 6 Standard · 4 Vertiefung, jeweils über die
Stufen Einstieg → Geführt → Frei → Transfer. Alle mit gestuften Tipps,
vollständigem Rechenweg und hinterlegten Fehlvorstellungen.


## Einheiten · LF

| | Einheit | Schwerpunkt |
|---|---|---|
| **Gerade lesen** | LF-01 | Zuordnungen im Alltag – Graphen lesen |
| | LF-02 | Wertetabelle → Graph |
| | LF-03 | Proportionale Funktionen y = m · x |
| | LF-04 | Die Steigung m |
| **Gerade und Gleichung** | LF-05 | Der y-Achsenabschnitt b |
| | LF-06 | y = mx + b zeichnen |
| | LF-07 | Vom Graphen zur Gleichung |
| | LF-08 | Punktprobe |
| **Mit Geraden rechnen** | LF-09 | Gleichung aus zwei Punkten |
| | LF-10 | Die Nullstelle |
| | LF-11 | Lineare Gleichungen sicher lösen |
| | LF-12 | Schnittpunkt – grafisch |
| **Schnittpunkt & Anwendung** | LF-13 | Schnittpunkt rechnerisch |
| | LF-14 | Modellieren: Tarifvergleich |
| | LF-15 | Lineare Gleichungssysteme |
| | LF-16 | Prüfungstraining |

**LF-11 ist bewusst eine Werkstattstunde:** kein neuer Funktionsinhalt,
sondern Gleichungen lösen — die Voraussetzung für LF-13. Ohne sie scheitert
das Gleichsetzungsverfahren nicht am Verständnis, sondern am Umformen.

**LF-14 nutzt durchgehend dieselben drei Tarife** (A: 12 € + 0,10 €/min,
B: 0,25 €/min, Flat: 30 €). Die Schnittpunkte liegen bei 80, 120 und
180 Minuten — jeder Tarif hat einen echten Bereich, in dem er gewinnt. Das
ist kein Zufall, sondern so gewählt: Ein Vergleich, bei dem eine Option nie
sinnvoll ist, lehrt nichts.

## Aufgabenbilder (`zeichnen.js`)

Drei Typen, alle über das Feld `visual` an jeder Aufgabe:

```jsonc
"visual": { "type": "streifen", "fill": 35, "alt": "…" }

"visual": {
  "type": "koordinaten",
  "xmin": -1, "xmax": 7, "ymin": -1, "ymax": 7,     // alle optional
  "lines": [ { "m": 2, "b": 1 },                     // Gerade
             { "x": 4 },                             // senkrechte Gerade
             { "m": -1, "b": 6, "farbe": "zweit" } ],// gestrichelt
  "steigungsdreieck": { "line": 0, "x0": 1, "dx": 2 },
  "regler": true,                                    // Dreieck wird beweglich
  "punkte": [ { "x": 3, "y": 4, "label": "P" } ],
  "polylinien": [ { "punkte": [[0,0],[2,3],[4,3]] } ],  // qualitative Graphen
  "alt": "Pflicht, sobald das Bild die Aufgabe trägt"
}

"visual": { "type": "geogebra", "material_id": "abc123" }
```

### Warum kein GeoGebra für die Aufgabenbilder?

Das Konzept sah GeoGebra vor. Ich habe die Bilder trotzdem als Inline-SVG
gebaut — aus drei praktischen Gründen:

1. **Material-IDs rotten.** Fremde verschwinden; eigene müsstest du erst
   anlegen, und ich kann keine erfinden, die es nicht gibt.
2. **Der Service Worker cached geogebra.org nicht.** Fällt das WLAN aus,
   wäre die halbe Einheit weg — genau in der Stunde, in der du sie brauchst.
3. **Ein Applet pro Aufgabe lädt.** Auf 28 Schulgeräten spürbar.

Die SVGs laden sofort, funktionieren offline, drucken in Graustufen und
lassen sich mit Reglern trotzdem bewegen. **LF-04-C1 ist der Beweis:** Das
Steigungsdreieck ist verschiebbar und verbreiterbar, Δy und Δx ändern sich,
m bleibt stehen. Genau das, was das Konzept als „Kernanimation des Themas"
verlangt — nur ohne Abhängigkeit.

Der Typ `geogebra` bleibt als Haken für **deine eigenen** Materialien, etwa
einen Geradenbaukasten zum freien Erkunden. Ohne `material_id` erscheint ein
ehrlicher Platzhalter statt eines leeren Kastens; ist GeoGebra nicht
erreichbar, sagt die Seite das, statt stumm zu bleiben.

## Starten

**Auf GitHub Pages:** Repo pushen, unter *Settings → Pages* die Quelle auf
`main / (root)` stellen. Fertig.

**Lokal:** Doppelklick funktioniert nicht — der Browser blockiert dann das
Laden der JSON-Dateien. Stattdessen im Projektordner:

```bash
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Aufbau

```
Für Schülerinnen und Schüler
  index.html                Übersicht
  einheit.html              Einheitenseite            → ?u=pz-08
  warmup.html               Warm-up „Altes Wissen"    → ?u=pz-08 (optional)
  pruefung.html             Prüfungstrainer           → ?set=bbr

Für die Lehrkraft
  arbeitsblatt.html         Arbeitsblatt mit Lösungsanhang
  matrix.html               Kompetenzmatrix pro Kind

Code
  assets/css/app.css        ein Stylesheet, inkl. Druckansicht
  assets/js/store.js        Speicher, Zahlenparser, Fehlerprofil, SW-Registrierung
  assets/js/zeichnen.js     Aufgabenbilder: Streifen, Koordinatensystem, GeoGebra
  assets/js/engine.js       Aufgabenlogik der Einheiten
  assets/js/spiral.js       Warm-up: Generatoren, Leitner-Kartei, Auswahl
  assets/js/pruefung.js     stellt Prüfungssets zusammen (nutzt engine.js)
  assets/js/arbeitsblatt.js Druckfassung
  assets/js/matrix.js       Kompetenzmatrix
  assets/js/tracker.js      Supabase-Anbindung (aus)
  sw.js                     Service Worker (Offline)

Inhalt
  units/index.json          Liste aller Bereiche und Einheiten — hier neue eintragen
  units/pz/pz-08/tasks.json Inhalt einer Einheit
  units/lf/lf-04/tasks.json Neuer Bereich = neuer Ordner, sonst nichts
  pruefung-sets.json        Definition der Prüfungssets + Formelsammlung
  spiral/plan.json          Intervalle, Verzahnung, Fehlerprofil-Zuordnung
  spiral/w-proz.json        Generatoren einer Wiederholungskategorie
```

`store.js` muss vor `engine.js` und `spiral.js` geladen werden — dort stehen
der Speicher, der Zahlenparser und das Fehlerprofil, die sich beide teilen.

## Neue Einheit anlegen

1. Ordner `units/pz/pz-15/` anlegen
2. `tasks.json` hineinlegen
3. In `units/index.json` eintragen
4. Link in `index.html` ergänzen
5. In `sw.js` bei `EINHEITEN` ergänzen und `VERSION` hochzählen

Schritt 3 genügt, damit Prüfungstrainer, Arbeitsblatt und Kompetenzmatrix
die Einheit kennen — die drei lesen alle denselben Index. Mehr ist es nicht. `einheit.html` und `engine.js` bleiben unangetastet.
Ein neuer Themenbereich braucht nur einen neuen Ordner: `units/lf/lf-01/…`
funktioniert sofort, weil der Bereich aus dem Präfix der ID abgeleitet wird.

## tasks.json

```jsonc
{
  "unit": "PZ-08",
  "title": "Grundwert berechnen",
  "leitidee": "L1",
  "standards": ["K2", "K5"],
  "wortspeicher": ["der Grundwert", "der Prozentwert"],
  "can_do": {                       // erscheint am Ende jedes Pfades
    "A": "Du berechnest den Grundwert über den 1-%-Schritt.",
    "B": "…", "C": "…"
  },
  "formelkarte": { "formeln": ["…"], "saetze": ["…"] },
  "tasks": [ /* siehe unten */ ]
}
```

### Aufgabentypen

**numeric** — Zahleneingabe

```jsonc
{
  "id": "PZ08-B1-005",
  "path": "B",          // A | B | C
  "step": 1,            // 1 Einstieg · 2 Geführt · 3 Frei · 4 Transfer
  "type": "numeric",
  "prompt": "17 % eines Betrags sind 68 €. Wie groß ist der Betrag?",
  "answer": 400,
  "unit_label": "€",
  "tolerance": 0.01,
  "hints": ["…", "…", "…"],        // einzeln abrufbar
  "solution": "1 % = 68 : 17 = 4 €\n100 % = 4 · 100 = 400 €",
  "misconceptions": [
    { "id": "mal_statt_geteilt", "value": 11.56,
      "feedback": "Du hast 17 % von 68 € gerechnet …" }
  ],
  "tags": ["grundwert", "bbr"],
  "spiral": ["W-PROZ"]
}
```

**choice** — Auswahl. `options` als Liste, `answer` als Index.
`misconceptions[].value` ist dann ebenfalls ein Index.

**assign** — Zuordnung. `slots` (Zeilen), `values` (Auswahl je Zeile),
`answer` als Index-Liste. Muss eine Bijektion sein.

**multi** — mehrere Zahlenfelder, für Tabellen und mehrschrittige Rechnungen.
Jedes Feld kann eigene Toleranz und eigene Fehlvorstellungen haben:

```jsonc
{
  "type": "multi",
  "prompt": "Weiter mit 1 050 € zu 5 %. Fülle die zweite Zeile aus.",
  "fields": [
    { "label": "Zinsen im 2. Jahr", "answer": 52.5, "unit_label": "€",
      "tolerance": 0.01,
      "misconceptions": [
        { "id": "alter_grundwert", "value": 50,
          "feedback": "Das wären die Zinsen von 1 000 € …" }
      ] },
    { "label": "Kapital am Ende", "answer": 1102.5, "unit_label": "€" }
  ]
}
```

Falsche Felder werden einzeln rot markiert, richtige grün — die Rückmeldung
zeigt also, *wo* es klemmt, nicht nur *dass*.

### visual — optional bei jedem Typ

```jsonc
"visual": { "type": "streifen", "fill": 35,
            "alt": "Der Streifen ist etwa zu einem Drittel gefärbt." }
```

Zeichnet einen Prozentstreifen mit Zehnerskala und Marke bei 50 %. Dieselbe
Darstellung wie der Fortschrittsbalken im Kopf — Streifen bedeuten im ganzen
Bereich dasselbe. `alt` ist Pflicht, sobald das Bild die Aufgabe trägt.

## Warm-up „Altes Wissen“ (`warmup.html`)

5 Aufgaben zu Beginn jeder Stunde, aus einem eigenen Pool — nicht aus dem
aktuellen Thema. **Kein Countdown auf dem Schülergerät.** Die Uhr führt die
Lehrkraft; ein tickender Timer vor einem Kind, das ohnehin langsam rechnet,
richtet mehr Schaden an als er nutzt.

Aufruf mit Einheit: `warmup.html?u=pz-12` — dann fährt das Warm-up die
Kategorien hoch, die die heutige Stunde braucht. Ohne `?u=` läuft es rein
nach Fälligkeit.

### Generatoren statt Einzelaufgaben

Warm-ups leben von Variation. Statt 60 Aufgaben pro Kategorie zu schreiben,
stehen dort **105 Generatoren** (15 je Kategorie, 5 je Pfad), die jeweils
hunderte Varianten erzeugen:

```jsonc
{
  "id": "WPROZ-B-grundwert",
  "level": "B",
  "skill": "Grundwert berechnen",
  "vars": {
    "G": { "von": 100, "bis": 900, "schritt": 50 },
    "p": { "aus": [5, 10, 20, 25, 40, 50] }
  },
  "berechnet": { "W": "G*p/100" },        // abhängige Größen
  "bedingung": "z < n",                    // optional, sonst neu würfeln
  "template": "{p} % eines Betrags sind {W} €. Wie groß ist der Betrag?",
  "answer": "G",
  "unit_label": "€",
  "round": 2,
  "hint": "Erst 1 % ({W} : {p}), dann mal 100.",
  "solution": "1 % = {W} : {p}\n100 % = {ergebnis} €",
  "misconceptions": [
    { "id": "mal_statt_geteilt", "value": "W*p/100",
      "feedback": "Du hast {p} % von {W} € gerechnet …" }
  ]
}
```

**Getrackt wird die Generator-ID, nicht die Zahl.** Die Information ist
„kann Grundwert berechnen“ — nicht „kann 68 : 17“. Deshalb ist der Generator
die Karteikarte, die Variante nur ihre Vorderseite.

Platzhalter dürfen rechnen: `{G}` genauso wie `{100-p}` oder `{1+p/100}`.
Ausgewertet wird mit einem eigenen kleinen Parser (`werteAus` in `spiral.js`),
**nicht mit `eval`** — er kennt nur `+ - * / ( )`, Zahlen, Variablen und
Vergleiche. Funktionsaufrufe lehnt er ab.

Zwei Formatzusätze, beide aus echten Mängeln entstanden:

- `{pa:€}` → `3,60` statt `3,6`. Bei allem, was ein Kind als Preis liest,
  gehören zwei Nachkommastellen hin.
- `{b:±}` → `− 1` bzw. `+ 3`. Sonst steht in der Aufgabe `y = 2x + -1`,
  und so schreibt man das nicht.

Zahlen werden mit dem typografischen Minus (−) ausgegeben, nicht mit dem
Bindestrich. `lesarten()` in `store.js` versteht beides — falls jemand die
Zahl aus dem Aufgabentext kopiert.

Kollidiert eine Fehlvorstellung bei bestimmten Zufallswerten mit der Lösung
(bei `p = 50` ist „Rest“ gleich „Teil“), wird sie für diese Variante
automatisch verworfen.

### Auswahl: zwei Regeln

**1. Leitner-Kartei.** Boxen 1–5, Intervalle in `plan.json`
(`[0, 1, 3, 7, 21, 60]` Tage). Auf Anhieb richtig → eine Box hoch. Falsch →
zurück auf Box 1, kommt morgen wieder.

**2. Fehlerprofil.** Jede Fehlvorstellung aus den Einheiten wird lokal
notiert (`mathe9.fehler`, nur IDs — keine Namen, keine Aufgabentexte). Wer
gestern `komma_verschoben` produziert hat, bekommt heute W-BRUCH.
Die Zuordnung steht in `plan.json` unter `fehlerprofil` — alle 162 IDs aus
dem Pool sind zugeordnet.

Dazu kommt die **Verzahnung**: `plan.json` → `verzahnung` sagt, welche
Kategorien eine Einheit braucht. Vor `pz-12` (Monats-/Tageszinsen) läuft
W-EINH hoch, vor `sk-04` läuft W-GEO hoch.

Höchstens 3 Aufgaben aus derselben Kategorie — sonst wird das Warm-up
einseitig.

### Kategorien

| Code | Titel | Status |
|---|---|---|
| `W-PROZ` | Prozente | 15 Generatoren |
| `W-BRUCH` | Brüche & Dezimalzahlen | 15 Generatoren |
| `W-EINH` | Einheiten | 15 Generatoren |
| `W-KOPF` | Kopfrechnen | 15 Generatoren |
| `W-SACH` | Sachrechnen (Dreisatz, Maßstab) | 15 Generatoren |
| `W-FKT` | Funktionen | 15 Generatoren |
| `W-TERM` | Terme & Gleichungen | 15 Generatoren |
| `W-GEO` | Grundgeometrie, Pythagoras | geplant (trägt KP-08, SK-04) |

Alle **162 Fehlvorstellungs-IDs** aus dem Pool zeigen auf eine gebaute
Kategorie — es läuft keine ins Leere.

Nicht jeder Generator hat Fehlvorstellungen. Ein Rechenfehler im Einmaleins
ist ein Ausrutscher, kein Denkfehler; dafür eine Diagnose zu erfinden, wäre
gelogen. Wo ein systematischer Fehler existiert, steht er drin —
`potenz_als_mal` (7² als 7 · 2), `additives_denken` (beim Dreisatz die
Differenz addieren statt über die Einheit zu rechnen), `rest_abgeschnitten`
(23 : 2 = 11).

Neue Kategorie: Datei `spiral/w-geo.json` anlegen, Code in `plan.json` unter
`kategorien` eintragen. Fehlt eine Datei, überspringt `spiral.js` sie
kommentarlos — der Plan darf also schon auf Kategorien zeigen, die es noch
nicht gibt.

**Gleiche Anzahl auf allen Pfaden.** Ein Kind auf Pfad A bekommt fünf
A-Aufgaben, nicht drei. Gleiche Zeit, gleiche Würde.


## Prüfungstrainer (`pruefung.html`)

**Kein eigener Aufgabenbestand — eine Sicht auf den vorhandenen Pool.** Sonst
pflegst du zwei Pools, und der zweite veraltet. Gerendert wird mit derselben
`engine.js`; `pruefung.js` stellt nur zusammen und setzt `window.QUELLE`.

| Set | Pfad | Filter | Umfang | Ziel | Tipps |
|---|---|---|---|---|---|
| Sockel | A | Stufe ≥ 3 | 8 | 5 | ja |
| BBR / eBBR | B | Tag `bbr` | 10 | 7 | nein |
| MSA | C | Tag `msa` | 10 | 7 | nein |
| Gemischt | aktueller | Stufe ≥ 3 | 10 | 7 | nein |

Die Sets stehen in `pruefung-sets.json` — Filter, Umfang und Ziel ändern, ohne
Code anzufassen.

**Warum kein `bbr`-Set für Pfad A?** Weil kein A-Aufgabe mit `bbr` getaggt ist,
und das ist richtig so: Pfad A liegt auf Niveaustufe D–E, ein BBR-Satz auf E–F.
A-Aufgaben nachträglich mit `bbr` zu taggen wäre eine Lüge über ihr Niveau.
Deshalb heißt das A-Set **Sockel** und zieht über die Stufe (frei/Transfer) —
genau die Dreiteilung Sockel / Aufbau / Vertiefung, die auch die Klassenarbeit
hat.

Es zählt, was **auf Anhieb** sitzt. Am Ende stehen die Denkfehler, die heute
mehrfach auftraten — nicht nur eine Punktzahl.

## Arbeitsblatt (`arbeitsblatt.html`)

Der Pool muss auch funktionieren, wenn keine 28 Geräte im Raum sind. Einheiten
und Pfad wählen → Blatt mit Schreibraum, Formelkarte auf Seite 1, Lösungen im
Anhang (eigene Seite). Tipps optional mitdrucken.

Direkt verlinkbar: `arbeitsblatt.html?u=pz-06,pz-07,pz-08&p=B`

Alle vier Aufgabentypen werden gedruckt: `numeric` mit Rechenraum und
Ergebnislinie, `choice` mit Ankreuzkästchen, `assign` mit Werteliste und
Zuordnungslinien, `multi` mit beschrifteten Feldern. Prozentstreifen bleiben
auch auf Papier Streifen (`print-color-adjust`).

## Kompetenzmatrix (`matrix.html`)

Die „Ich kann"-Sätze stehen längst in jeder `tasks.json` unter `can_do` — 42
Stück. Diese Seite macht sie pro Kind abhakbar und gibt sie als Text aus, der
direkt in ein Zeugnis oder einen Förderplan wandern kann. Die A-Spalte ist
bereits als Förderplanziel formuliert.

Der Textexport gruppiert nach Pfad, zählt und nennt den Schwerpunkt der
selbstständigen Arbeit — damit ist eine E-Kurs-Zuweisung über ein
Kompetenzprofil belegbar statt über ein Bauchgefühl.

**Datenschutz:** Die Häkchen liegen unter `mathe9.matrix.<Name>` im
localStorage — auf **diesem** Gerät, nichts geht an einen Server. Auf einem
Rechner, an dem mehrere arbeiten, besser Kürzel als Klarnamen.

## Offline (`sw.js`)

Das Schul-WLAN fällt aus, der Unterricht nicht. Der Service Worker cached alle
56 Dateien — der ganze Pool ist unter 100 KB.

- **JSON:** erst Netz, dann Cache. Korrekturen kommen an; fällt das Netz aus,
  merkt niemand etwas.
- **Schale (HTML/CSS/JS):** erst Cache (schnell), Auffrischung im Hintergrund.
- Fremde Hosts (Google Fonts, Supabase) werden nie aus dem Cache bedient.

**Nach jeder inhaltlichen Änderung `VERSION` in `sw.js` hochzählen.** Sonst
sehen die Geräte weiter die alte Fassung. Registriert wird nur über https
(GitHub Pages) oder auf localhost — bei `file://` passiert nichts.

## Das wichtigste Feld

`misconceptions`. Ohne dieses Feld sagt die App „noch nicht richtig" — das
hilft niemandem. Mit dem Feld sagt sie, **welcher Denkfehler** passiert ist,
und das Dashboard kann auszählen, welcher Fehler in der Klasse gehäuft
auftritt.

Im Pool: **162 IDs.** Die häufigsten aus den Einheiten:

| | ID | Bedeutung |
|---|---|---|
| 30× | `bei_1prozent_gestoppt` | 1 % gerechnet, letzten Schritt vergessen |
| 17× | `mal_statt_geteilt` | Grundwertaufgabe wie Prozentwertaufgabe gerechnet |
| 15× | `mal_100_vergessen` | Dezimalzahl statt Prozent angegeben |
| 15× | `nur_teil_berechnet` | Rabatt statt Endpreis angegeben |
| 14× | `geteilt_vertauscht` | Ganzes : Teil statt Teil : Ganzes |
| 14× | `bei_einheit_gestoppt` | Dreisatz nach Schritt 1 abgebrochen |
| 11× | `komma_verschoben` | Faktor 10 daneben (2,5 % als 25 % gerechnet) |
| 9× | `rest_statt_teil` | Gegenanteil angegeben |
| 9× | `zeitfaktor_vergessen` | Jahreszinsen statt Monatszinsen |
| 8× | `neuer_als_grundwert` | bei Veränderungen durch den neuen Wert geteilt |
| 7× | `proportional_gerechnet` | Zuordnungsart nicht geprüft |
| 7× | `einfacher_zins` | Zinseszins übersehen |

28 IDs kommen nur einmal vor. Das ist Absicht: Sie gehören zu einzelnen
Begründungsaufgaben, wo der Denkfehler wirklich einmalig ist
(`bank_zahlt_mehr`, `monotonie_reicht`, `name_missverstanden`). Für alles,
was mehrfach vorkommt, gilt: **dieselbe ID verwenden** — sonst lässt sich
nichts auszählen.

## Tracking einschalten

In `assets/js/tracker.js` oben `url`, `key` und `aktiv: true` setzen. Ohne
Konfiguration läuft alles normal weiter, die Ereignisse landen nur in der
Konsole. Ereignisse werden 3 Sekunden gesammelt und dann gebündelt gesendet —
sonst erzeugt eine Klasse mit 28 Geräten zu viele Einzelrequests.

Gesendet wird pro Antwort:

```json
{ "unit": "PZ-08", "task": "PZ08-B1-005", "path": "B", "step": 1,
  "correct": false, "misconception": "mal_statt_geteilt",
  "hints_used": 2, "attempts": 1, "duration_ms": 47000,
  "student": "…", "ts": "…" }
```

Der Schülername wird aus `localStorage['mathe9.name']` gelesen — setze ihn
über dein vorhandenes Namens-Modal, nicht über `prompt()`.

## Mobile

- Touchziele ≥ 44 px, Zahlenfeld ist `inputmode="decimal"`, nie `type="number"`
- Eingaben werden mit Komma **und** Punkt akzeptiert. Ohne Komma ist `1.250`
  mehrdeutig (1250 oder 1,25?) — die Engine prüft beide Lesarten, statt eine
  zu raten. Die Lesarten unterscheiden sich um Faktor 1000, ein Fehltreffer
  kommt nicht vor.
- Formelkarte ist eine Schublade am unteren Rand — immer erreichbar, ohne die
  Aufgabe zu verlassen
- `prefers-reduced-motion` wird respektiert
- Druckansicht (`@media print`) zeigt die Aufgaben ohne Tipps

## Fonts

Bricolage Grotesque, Atkinson Hyperlegible und JetBrains Mono kommen von
Google Fonts. Atkinson Hyperlegible ist bewusst gewählt: für Lesende mit
Schwierigkeiten entwickelt, unterscheidet klar zwischen 0/O und 1/l/I — das
ist bei Zahlenaufgaben und DaZ kein Luxus. Falls das Schulnetz Google Fonts
blockiert, greifen die Fallbacks; besser ist, die Dateien nach
`assets/fonts/` zu legen und lokal einzubinden.
