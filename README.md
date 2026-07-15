# Mathe 9 · Prozent & Zinsrechnung

Differenzierte Lernwege für Jahrgang 9, Campus Hannah Höch.
Statische Website, keine Abhängigkeiten, kein Build-Step.

**14 Einheiten à 60 Minuten · 196 Aufgaben · vollständiger Themenbereich.**
**Plus Spiral-Pool: 45 Generatoren für das Warm-up „Altes Wissen".**

## Einheiten

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
index.html                  Übersicht
einheit.html                universelle Einheitenseite  → ?u=pz-08
warmup.html                 Warm-up „Altes Wissen"      → ?u=pz-08 (optional)
assets/css/app.css          ein Stylesheet
assets/js/store.js          Speicher, Zahlenparser, Fehlerprofil  (zuerst laden)
assets/js/engine.js         Aufgabenlogik der Einheiten
assets/js/spiral.js         Warm-up: Generatoren, Leitner-Kartei, Auswahl
assets/js/tracker.js        Supabase-Anbindung (aus)
units/pz/pz-08/tasks.json   Inhalt einer Einheit
spiral/plan.json            Intervalle, Verzahnung, Fehlerprofil-Zuordnung
spiral/w-proz.json          Generatoren einer Wiederholungskategorie
```

`store.js` muss vor `engine.js` und `spiral.js` geladen werden — dort stehen
der Speicher, der Zahlenparser und das Fehlerprofil, die sich beide teilen.

## Neue Einheit anlegen

1. Ordner `units/pz/pz-15/` anlegen
2. `tasks.json` hineinlegen
3. Link in `index.html` ergänzen

Mehr ist es nicht. `einheit.html` und `engine.js` bleiben unangetastet.
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
stehen dort **45 Generatoren** (15 je Kategorie, 5 je Pfad), die jeweils
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
Die Zuordnung steht in `plan.json` unter `fehlerprofil` — alle 79 IDs aus
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
| `W-KOPF` `W-TERM` `W-GEO` `W-FKT` `W-SACH` | | geplant |

Neue Kategorie: Datei `spiral/w-geo.json` anlegen, Code in `plan.json` unter
`kategorien` eintragen. Fehlt eine Datei, überspringt `spiral.js` sie
kommentarlos — der Plan darf also schon auf Kategorien zeigen, die es noch
nicht gibt.

**Gleiche Anzahl auf allen Pfaden.** Ein Kind auf Pfad A bekommt fünf
A-Aufgaben, nicht drei. Gleiche Zeit, gleiche Würde.

## Das wichtigste Feld

`misconceptions`. Ohne dieses Feld sagt die App „noch nicht richtig" — das
hilft niemandem. Mit dem Feld sagt sie, **welcher Denkfehler** passiert ist,
und das Dashboard kann auszählen, welcher Fehler in der Klasse gehäuft
auftritt.

Im Pool: **72 IDs, 277 Vorkommen.** Die häufigsten:

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

## Lehrerdashboard und Supabase-Tracking

Die erweiterte Version erfasst drei Datenarten:

- **Aktivität:** Sitzungsstart, sichtbare Seite, Aufgabenaufruf und Heartbeat alle 20 Sekunden.
- **Antworten:** richtig/falsch, Versuch, Dauer, Tipps und erkannte Fehlvorstellung.
- **Fortschritt:** aktuelle Einheit, Pfad, Aufgabe, erledigte Aufgaben und Prozentwert.

### Einrichtung

1. In Supabase ein neues Projekt anlegen.
2. Den Inhalt von `supabase/setup.sql` im **SQL Editor** ausführen.
3. Unter **Project Settings → API** die Project URL und den öffentlichen `anon` key kopieren.
4. In `assets/js/supabase-config.js` eintragen und `enabled: true` setzen.
5. Die Website über GitHub Pages oder einen Webserver veröffentlichen.
6. Das Dashboard über `dashboard/index.html` öffnen.

Wichtig: Niemals den `service_role` key in HTML oder JavaScript eintragen. Die mitgelieferten
Policies erlauben einer statischen App das Schreiben und Lesen mit dem anon key. Damit ist das
Dashboard ohne Login einfach einsetzbar, aber jeder mit URL und Schlüssel kann die Daten lesen.
Für einen öffentlichen Einsatz sollte das Dashboard später mit Supabase Auth für Lehrkräfte
abgesichert und die beiden SELECT-Policies entsprechend eingeschränkt werden.

### Schülernamen

Der Tracker liest weiterhin `localStorage['mathe9.name']`. Ohne vorhandenes Namens-Modal wird
`anonym` übertragen. Zusätzlich werden eine zufällige Geräte-ID und pro Browser-Tab eine neue
Sitzungs-ID gespeichert, damit gleichnamige oder anonyme Geräte unterscheidbar bleiben.
