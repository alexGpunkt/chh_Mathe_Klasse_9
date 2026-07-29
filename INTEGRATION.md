# Integration der Erweiterung

Zusammengeführt wurden der bisherige Stand mit Lehrerdashboard/Supabase-Tracking und die neue Erweiterung mit:

- Prüfungstrainer (`pruefung.html`)
- Arbeitsblattgenerator (`arbeitsblatt.html`)
- Kompetenzmatrix (`matrix.html`)
- Offline-Service-Worker (`sw.js`)
- zentralem Einheitenindex (`units/index.json`)

Die Schülerseiten und der Prüfungstrainer laden `supabase-config.js` vor `tracker.js`.
`engine.js` und `spiral.js` enthalten weiterhin die Tracking-Aufrufe. Arbeitsblatt und Kompetenzmatrix senden keine Daten.

Beim Upload nach GitHub den gesamten Inhalt dieses Ordners in die Repository-Wurzel kopieren und vorhandene Dateien ersetzen.

## Lernkarten (Hinführung je Niveaustufe)

Neu: Jede Einheit kann pro Lernweg A/B/C eine **Lernkarte** zeigen, die vor
den Aufgaben erscheint — mit Hinführung, Erklärung, bildlicher Darstellung
und einer Schritt-für-Schritt-Beispielrechnung. Über „📖 Erklärung" ist sie
aus jeder Aufgabe wieder aufrufbar, ohne den Fortschritt zu verlieren.

Datengetrieben wie alles andere: ein neuer Schlüssel `lernkarten` in der
`tasks.json` der Einheit. Kein Code nötig — `engine.js` rendert automatisch.
Fehlt der Schlüssel, startet die Einheit wie bisher direkt mit Aufgabe 1.

```jsonc
"lernkarten": {
  "A": {
    "titel": "Kurze Überschrift",
    "hinfuehrung": "1–2 Sätze Einstieg (motivierend, niveaugerecht).",
    "erklaerung": ["Absatz 1", "Absatz 2"],
    "visual": { "type": "streifen", "fill": 50, "alt": "…" },
    "bild_oben": false,                // optional: Bild NACH der Erklärung
    "beispiel": {
      "titel": "Beispiel",             // optional
      "aufgabe": "Die Beispielaufgabe",
      "schritte": ["Zeile 1", "Zeile 2"],   // Monospace, Zeile für Zeile
      "ergebnis": "Die Antwort"
    },
    "merke": "Ein kurzer Merksatz."     // optional
  },
  "B": { … },
  "C": { … }
}
```

`visual` nutzt dieselben Typen wie die Aufgabenbilder (`streifen`,
`koordinaten`, `geogebra`) aus `zeichnen.js` — inklusive Steigungsdreieck
und Regler. Wortspeicher-Begriffe werden in Hinführung, Erklärung und
Beispiel automatisch hervorgehoben.

Im Prüfungsset (`pfad_fest`/`pruefung`) werden Lernkarten bewusst
übersprungen.

## Animationen (lineare Funktionen) – niveaudifferenziert

Bewegte Visualisierungen zu den zentralen Inhalten des Lernbereichs, jede in
drei Niveaustufen (A Basis · B Standard · C Vertiefung). Zehn Konzepte:
`steigung`, `achsenabschnitt`, `baukasten`, `wertetabelle`, `proportional`,
`punktprobe`, `nullstelle`, `schnittpunkt`, `tarifvergleich`, `gleichung`.

Dieselbe Kernidee, aber pro Stufe passend aufbereitet – Beispiele:
- `steigung`: A zählt Kästchen (ganze m), B rechnet m = Δy:Δx (auch negativ),
  C zeigt m aus zwei Punkten (Dreiecksgröße egal).
- `schnittpunkt`: A ablesen, B gleichsetzen, C Sonderfälle (parallel/identisch).
- `nullstelle`: A ablesen, B 0 = m·x + b lösen, C Sachkontext mit Modellgrenze.

Einbinden wie jedes Bild – die Stufe steht mit im Datensatz:

```jsonc
"visual": { "type": "animation", "name": "steigung", "stufe": "A" }
```

Ohne `stufe` wird B angenommen. In den LF-Lernkarten ist jede Stufe A/B/C
bereits mit ihrer passenden Variante bestückt (LF-02 bis LF-14).

Dateien: `assets/js/animationen.js` (window.ANIM: block/einbetten/galerie,
`register` + `Feld`-Helfer), `assets/css/anim.css`, `animationen.html`
(Galerie mit A/B/C-Umschalter, von der Startseite verlinkt). `einheit.html`
lädt beide; `zeichnen.js` kennt den Bildtyp. Fehlt `animationen.js`, greift
ein Platzhalter – nichts bricht. „Bewegung reduzieren“ wird respektiert
(Standbild statt Autostart).

Neue Animation ergänzen: einen weiteren `register({ id, titel, bezug, kurz,
bauen(host, opts){ const st = stufeVon(opts); … } })`-Block anlegen und in
`bauen` auf `st` ('A'|'B'|'C') verzweigen. Sie erscheint dann automatisch in
der Galerie (mit Umschalter) und ist sofort über ihren `name` einbindbar.


## Externe Übungen auf mehreren Plattformen

Die bisherigen LearningApps-Verweise wurden um Serlo, H5P beziehungsweise
Landesbildungsserver, Learningsnacks, Quizlet und ZUM ergänzt. Jeder Eintrag
enthält `titel`, `url`, `typ` und `quelle`.

`engine.js` prüft die URL gegen eine feste HTTPS-Allowlist, leitet die Quelle
aus dem Hostnamen ab, zeigt einen farbigen Quellenchip und protokolliert das
Öffnen als `external_practice_open`. Der Renderer behält den sicheren
Visualisierungs-Fallback und die robuste Wortspeicher-Markierung bei.

`uebungen.html` enthält die Gesamtübersicht und lädt weiterhin
`supabase-config.js`, `dev-tools.js`, `student-login.js` und `tracker.js`.
Die Entwicklernavigation bleibt vollständig erhalten.

Aktueller Datenstand:

- 88 Verweise in 39 Einheiten
- 51 unterschiedliche Zieladressen
- LearningApps: 43
- Serlo: 29
- ZUM: 6
- H5P/Landesbildungsserver: 4
- Learningsnacks: 3
- Quizlet: 3

Fünf fehlerhaft zusammengesetzte LearningApps-Sammlungsadressen aus dem
Anpassungspaket wurden beim Zusammenführen korrigiert (`?displayfolder=`
statt `&displayfolder=` unmittelbar hinter dem Benutzernamen).


## Branch-Hinweis

Diese Fassung ist für den Test im Branch `develop` vorbereitet. In
`assets/js/supabase-config.js` steht daher `devMode: true`. Vor einem
Pull Request nach `master` muss der Wert wieder auf `false` gesetzt und die
Cache-Version in `sw.js` erneut erhöht werden.
