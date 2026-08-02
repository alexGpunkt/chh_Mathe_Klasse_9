# V24 · Die 19 Optimierungsvorschläge umgesetzt

Grundlage war die Vorschlagsliste nach V23 — zehn Punkte zur Inhaltsvermittlung,
neun zur mobilen Darstellung. Alle 19 sind umgesetzt; jeder steht unten mit
Nummer, Begründung und dem, was tatsächlich gebaut wurde — einschließlich der
Stellen, an denen die Wirkung durch die Datenlage begrenzt bleibt.

## 1 · Inhaltsvermittlung

**1.1 · Nachfassaufgabe zur erkannten Fehlvorstellung** (`engine.js`)
Wird eine Fehlvorstellung erkannt, sucht `nachfassEinreihen()` eine zweite
Aufgabe, die dieselbe ID führt, und schiebt sie direkt hinter die aktuelle.
Suchreihenfolge: eigener Pfad in der laufenden Reihe → eigener Pfad im ganzen
Pool → nächstniedrigerer Pfad. Je Fehlvorstellung genau **eine** Nachfassaufgabe
pro Durchlauf. Die Aufgabe erklärt sich selbst („Noch einmal dasselbe — mit
anderen Zahlen“), sonst wirkt sie wie eine Strafe.

> **Grenze, ehrlich benannt:** Der Pool führt nur für einen Teil der
> Fehlvorstellungen eine zweite Aufgabe im selben Pfad. Abgedeckt sind
> **Pfad A 33 %, Pfad B 47 %, Pfad C 38 %** aller Fehlvorstellungs-/Pfad-Paare.
> In den übrigen Fällen passiert wie bisher nichts — lieber keine
> Nachfassaufgabe als eine unpassende. Wer die Quote heben will, taggt weitere
> Aufgaben mit bereits vorhandenen IDs; Code-Änderungen sind dafür nicht nötig.

**1.2 · Feedback verlinkt auf die Erklärstelle** (`engine.js`)
Die Rückmeldung zu einer Fehlvorstellung bekommt den Knopf „📖 Dazu die
Erklärung“. Er öffnet die Lernkarte **an der passenden Stelle**, hebt sie hervor
und scrollt hin. Steuerbar über ein neues Feld:

```jsonc
"misconceptions": [{ "id": "…", "value": …, "feedback": "…",
                     "verweis": { "absatz": 1 } }]
```

Ohne Angabe wird die Animation der eigenen Stufe angesteuert, sonst der
Merksatz. Der Rücksprung in die Aufgabe verliert keinen Fortschritt.

**1.3 · Lückenbeispiel auf Stufe A** (`engine.js`)
Auf Pfad A wird der **letzte** Schritt der Beispielrechnung zur Lücke: Die Zeile
endet mit einem Eingabefeld. Ausgewertet wird mit demselben Zahlenparser wie bei
den Aufgaben (Komma und Punkt). „Schritt zeigen“ löst jederzeit auf — die Lücke
darf niemanden aussperren. Greift nur, wenn hinter dem letzten
Gleichheitszeichen wirklich eine Zahl steht; sonst bleibt alles wie bisher.
Pfad B und C sind unverändert.

**1.4 · Vorhersage vor der Animation** (`animationen.js`)
18 Animationen haben jetzt eine Vorhersagefrage. Sie steht über dem Bild, und
das Bild **startet erst nach der Antwort**. Die Fragen liegen zentral in der
Tabelle `FRAGEN`; eine Animation ohne Eintrag startet wie bisher sofort.

**1.5 · Wortspeicher antippbar** (`engine.js`, alle 54 `tasks.json`)
Die Begriffe waren markiert, aber die Erklärung steckte in einem
`title`-Attribut — auf dem Handy unerreichbar, und sie wiederholte nur das Wort.
Jetzt ist jedes markierte Wort ein Knopf; ein Tipp zeigt einen Satz in einfacher
Sprache direkt darunter. **136 Begriffe** wurden erklärt und je Einheit unter
dem neuen Schlüssel `worterklaerungen` hinterlegt. Auch die Formelkarte zeigt
sie jetzt mit an.

**1.6 · Wiederholung am Stundenende** (`engine.js`, `spiral.js`)
Nach dem letzten Aufgabenschritt steht „3 Aufgaben von früher“. Der Link ruft
`warmup.html?n=3&u=<einheit>` auf; `spiral.js` versteht jetzt `?n=` (1–8,
Standard weiter 5). Auswahl, Leitner-Kartei und Fehlerprofil bleiben unverändert.

**1.7 · Selbsteinschätzung vorher und nachher** (`engine.js`)
Auf der Lernkarte vor den Aufgaben: „Kannst du das schon?“ mit dem `can_do`-Satz
des Pfades. Am Ende wird die Antwort gegen das tatsächliche Ergebnis gehalten —
„Vorhin hast du ‚noch nicht‘ angekreuzt — und dann 4 von 4 auf Anhieb richtig
gehabt.“ Für die Fehlkalibrierung in beide Richtungen gibt es eigene Sätze.

**1.8 · Pfadempfehlung** (`engine.js`)
Ab 80 % auf Anhieb wird der nächsthöhere Pfad empfohlen und optisch zur
Hauptaktion; unter 50 % wird der nächstniedrigere angeboten. Die freie Wahl
bleibt in beiden Fällen bestehen — es kommt nur eine Empfehlung dazu.

**1.9 · Animation für die Prüfungseinheiten** (`animationen.js`)
Neue Animation `signalwoerter` mit dem Feld `bereich` (`pz` · `kp` · `sk`):
Ein Signalwort erscheint, der passende Kasten leuchtet auf. Stufe A nimmt die
eindeutigen Formulierungen, C die kniffligen. Eingehängt in **PZ-14, KP-12 und
SK-12** auf allen drei Stufen — diese drei Einheiten hatten bisher gar kein Bild.

**1.10 · Verweildauer im Dashboard** (`dashboard/`)
`duration_ms` wurde erhoben, aber nie ausgewertet. Neu:
- Kennzahl **„Zeit je Aufgabe (Median)“**
- Spalte **„Zeit je Aufgabe“** je Kind in der Fortschrittstabelle
- Tafel **„Wer hängt gerade fest?“**: Aufgaben, die seit über drei Minuten offen
  sind (`task_view` ohne folgende Antwort), sowie beantwortete Aufgaben, die über
  dem Dreifachen des Klassenmedians lagen — mit Lage („noch offen“, „noch
  falsch“, „gelöst, aber lang“).

## 2 · Mobile Darstellung

**2.1 · Höhe der Grafiken begrenzt** (`anim.css`)
`max-height: 46svh` (Tablet 52 svh, Querformat 62 svh), mit `vh`-Rückfall für
ältere Browser. `preserveAspectRatio` passt den Inhalt ein — es geht nichts
verloren.

**2.2 · Querformat** (`anim.css`, `app.css`, `buch.css`)
Neue Regeln für `(orientation: landscape) and (max-height: 560px)`: flachere
Formelkartenschublade, flachere Buchnavigation, kompaktere Animationsrahmen.

**2.3 · Tablets** (`anim.css`)
`max-width` steigt ab 700 px auf 460 px, ab 1000 px auf 520 px.

**2.4 · Kein SVG-Neuaufbau je Einzelbild** (`animationen.js`)
Alle Animationen, die pro Bild ihr komplettes SVG verworfen haben, legen die
Elemente jetzt einmal an und ändern nur noch Attribute. Betroffen: `kante`,
`prisma`, `mantelprisma`, `zylinderflaeche`, `zylinder`, `zusammengesetzt`,
`zusammensk`, `rueckwaerts`, `volkegel`, `kugel`, `einheiten`, `oberflaeche`.
Dafür kamen die Aktualisierer `setzeBox()`, `Extrusion()` sowie `setzen()` an
`mkPyramide`, `mkKegel` und `mkKugel` hinzu. Zusätzlich läuft die Schleife jetzt
mit **25 Bildern je Sekunde** statt 60 — bei diesen langsamen Vorgängen sieht
das niemand, spart aber mehr als die Hälfte der Arbeit.

**2.5 · Reglerdaumen** (`anim.css`)
Bedienfläche 44 px hoch, sichtbarer Daumen 28 px, eigene Schiene für WebKit und
Firefox, sichtbarer Fokusring.

**2.6 · Bedienleiste über der Grafik** (`anim.css`)
`.anim` ist eine Flex-Spalte; unter 560 px Breite rücken Stufenabzeichen,
Vorhersagefrage und Bedienleiste per `order` über das Bild.

**2.7 · Zugänglichkeit** (`animationen.js`, `anim.css`)
Die mitlaufende Zeile unter dem Bild ist jetzt `aria-hidden`. Stattdessen: eine
feste Bildbeschreibung und eine ruhige Statuszeile (`role="status"`,
`aria-live="polite"`), die nur beim bewussten Anhalten spricht.

**2.8 · Dunkler Modus** (`app.css`, `anim.css`, `animationen.js`)
Aus 48 fest verdrahteten Farbwerten wurden Token (`--linie`, `--flaeche`,
`--merk-bg`, `--skala` …). Kopf, Hero und Formelkarte haben eigene Token
(`--kopf-bg`, `--kopf-text`), weil sie **immer** dunkel sind — sonst hätte der
dunkle Modus sie hell auf hell gedreht. `animationen.js` führt zwei Paletten und
**baut die Bilder neu auf**, wenn die Systemeinstellung während der Sitzung
wechselt. Der Druckblock setzt alle Token auf hell zurück.

**2.9 · Unterer Bildschirmrand** (`app.css`, `buch.css`)
Sobald ein Zahlenfeld den Fokus hat, weichen Formelkarte und Buchnavigation nach
unten aus (`body:has(input.zahl-feld:focus)`) und kommen beim Verlassen des
Feldes zurück. Im Querformat sind beide Leisten flacher.

## Neue Felder in `tasks.json`

```jsonc
"worterklaerungen": { "Grundwert": "Das Ganze. Der Grundwert sind 100 %." },
"misconceptions": [{ …, "verweis": { "absatz": 1 } }],
"visual": { "type": "animation", "name": "signalwoerter", "stufe": "A", "bereich": "kp" }
```

Alle drei sind optional; fehlen sie, verhält sich die Anwendung wie vorher.

## Geprüft

- 138 Animationsvarianten bauen fehlerfrei; kein Text außerhalb seines Rahmens
- Vorhersagefrage hält den Start zurück und gibt ihn nach der Antwort frei
- dunkle Palette greift bis in die SVG-Flächen
- Funktionstest der Einheitenseite (jsdom): Lückenbeispiel, Selbsteinschätzung,
  Worterklärung, Nachfassaufgabe, Erklärungsverweis, Abschluss mit Kalibrierung
  und Empfehlung — dazu die Gegenproben, dass Pfad B keine Lücke bekommt und der
  Prüfungsmodus unberührt bleibt
- Dashboard-Auswertung mit erfundenen Ereignissen geprüft
- alle 65 JSON-Dateien gültig, alle JS-Dateien syntaktisch fehlerfrei,
  Klammerbilanz aller drei Stylesheets ausgeglichen

**Nicht geprüft:** die tatsächliche Darstellung in echten Browsern. Alles oben
ist Aufbau- und Logikprüfung im Headless-DOM, keine Sichtprüfung.

## Cache

```javascript
const VERSION = 'mathe9-v24-lernwirkung-develop';
```
