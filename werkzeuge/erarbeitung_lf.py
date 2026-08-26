# -*- coding: utf-8 -*-
"""LF · Lineare Funktionen (16 Einheiten)

Siehe erarbeitung_bauen.py zur Begruendung.

Der rote Faden dieser Reihe sind die beiden Zahlen m und b. Jede Einheit
beantwortet dieselbe Frage aus einer anderen Richtung: Wo stehen m und b
im Bild, in der Tabelle, im Text, in der Gleichung? Deshalb steht in den
erweiterten Erklaerungen immer dabei, WAS m und b bedeuten - nicht nur,
wie man sie ausrechnet.

LF-09 und LF-15 waren zusaetzlich die beiden Einheiten, in denen das
Abschlussquiz mangels Material nicht auf fuenf Fragen kam (alle Aufgaben
vom Typ multi, alle Erklaerungssaetze unter 40 Zeichen). Die erweiterten
Erklaerungen beheben das nebenbei - siehe werkzeuge/quiz-pruefen.js.
"""

INHALTE = {

    # ------------------------------------------------------------------
    "lf-01": {
        "A": {
            "hinfuehrung": "Zu jedem x-Wert gehört ein y-Wert.",
            "erklaerung": [
                "Ein Graph ist eine Linie in einem Koordinatensystem.",
                "Die waagerechte Achse ist die x-Achse. Die senkrechte Achse ist die y-Achse.",
                "Suche den x-Wert unten. Gehe von dort nach oben bis zur Linie.",
                "Gehe dann nach links. Lies den y-Wert ab.",
                "Gehe immer im rechten Winkel. So verrutschst du nicht.",
            ],
            "beispiel": {
                "titel": "Erst hoch, dann nach links",
                "aufgabe": "Welcher y-Wert gehört zu x = 3?",
                "schritte": [
                    "bei x = 3 senkrecht nach oben",
                    "Graph getroffen bei Höhe 4",
                    "nach links zur y-Achse: y = 4",
                ],
                "ergebnis": "Zu x = 3 gehört y = 4.",
                "luecke": {"schritt": 2, "wert": 4},
            },
        },
        "B": {
            "hinfuehrung": "Ein Graph lässt sich in Worte fassen – steigt er, fällt er, bleibt er gleich? Und du kannst auch rückwärts lesen: von y zu x.",
            "erklaerung": [
                "Beschreibe abschnittsweise: steigend (geht nach oben), fallend (nach unten), konstant (waagerecht).",
                "Rückwärts ablesen: Suche den y-Wert links, gehe waagerecht zum Graphen und dann senkrecht nach unten zum x-Wert.",
                "Beide Richtungen beantworten verschiedene Fragen. Vorwärts fragst du „Wie hoch ist es nach 3 Stunden?“, rückwärts „Wann war die Höhe 4 erreicht?“. Im Sachzusammenhang entscheidet die Frage, in welche Richtung du liest.",
                "Wichtig ist, was auf den Achsen steht. Erst die Beschriftung macht aus der Linie eine Aussage über Zeit und Weg, über Menge und Preis oder über Zeit und Temperatur.",
            ],
            "beispiel": {
                "titel": "Rückwärts lesen: von der Höhe zur Zeit",
                "aufgabe": "Ein Wanderweg-Graph steigt gleichmäßig. Bei welcher Zeit x ist die Höhe y = 4 erreicht?",
                "schritte": [
                    "Frage deuten: gesucht ist die Zeit, gegeben ist die Höhe → rückwärts lesen",
                    "Höhe y = 4 auf der senkrechten Achse suchen",
                    "waagerecht bis zum Graphen gehen",
                    "senkrecht nach unten zur x-Achse: x = 3",
                ],
                "ergebnis": "Die Höhe 4 ist bei x = 3 erreicht, also nach 3 Zeiteinheiten.",
            },
        },
        "C": {
            "hinfuehrung": "Wo ein Graph knickt oder fällt, passiert in der Geschichte etwas Besonderes. Das erkennst du – und kannst es begründen.",
            "erklaerung": [
                "Ein Knick bedeutet: Die Änderungsrate wechselt. Der Graph wird steiler, flacher oder kehrt die Richtung um.",
                "Ein fallender Abschnitt heißt: Während x wächst, wird y kleiner – etwa Rückweg, Abkühlung, Entladung.",
                "Steilheit und Höhe sind zwei verschiedene Aussagen. Ein Graph kann hoch verlaufen und trotzdem flach sein: Dann ist der Wert groß, ändert sich aber kaum. Wer beides verwechselt, deutet einen Wanderweg als Tempo statt als Höhe.",
                "Ein waagerechter Abschnitt bedeutet deshalb nicht Stillstand des Geschehens, sondern Stillstand der Größe auf der senkrechten Achse. Bei einem Höhenprofil ist das ein ebener Weg — gelaufen wird weiter.",
                "Achte auf die Beschriftung, bevor du deutest. Ein fallender Graph ist beim Wasserstand ein Leerlaufen, bei der Entfernung zum Ziel dagegen ein Fortschritt.",
            ],
            "beispiel": {
                "titel": "Einen Graphen abschnittsweise deuten",
                "aufgabe": "Deute den Graphen: erst steil hoch, dann flach, dann abwärts. Auf der y-Achse steht die Höhe über dem Meeresspiegel.",
                "schritte": [
                    "0–2: steigt steil → Aufstieg, die Höhe nimmt schnell zu",
                    "2–4: waagerecht → die Höhe bleibt gleich, der Weg verläuft eben. Es wird weiter gegangen, nur nicht mehr aufwärts.",
                    "4–6: fällt → Abstieg, y wird kleiner, obwohl x weiter wächst",
                    "Knick bei x = 2: Hier wechselt die Änderungsrate von steil auf null.",
                ],
                "ergebnis": "Steigen–Ebene–Fallen. Der waagerechte Teil ist kein Halt, sondern ebener Weg — das sagt die Beschriftung der y-Achse.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-02": {
        "A": {
            "hinfuehrung": "Ein Punkt hat zwei Zahlen.",
            "erklaerung": [
                "Die erste Zahl ist der x-Wert. Er geht nach rechts.",
                "Die zweite Zahl ist der y-Wert. Er geht nach oben.",
                "Man schreibt sie in Klammern: P(4 | 2).",
                "Die Reihenfolge ist fest. Erst x, dann y.",
                "P(4 | 2) und P(2 | 4) sind zwei verschiedene Punkte.",
            ],
            "beispiel": {
                "titel": "Koordinaten in der richtigen Reihenfolge",
                "aufgabe": "Lies die Koordinaten von P ab.",
                "schritte": [
                    "nach rechts: 4  → x = 4",
                    "nach oben:   2  → y = 2",
                ],
                "ergebnis": "P(4 | 2).",
                "luecke": {"schritt": 1, "wert": 2},
            },
        },
        "B": {
            "hinfuehrung": "Aus der Gleichung machst du eine Tabelle: Du setzt x-Werte ein und rechnest y aus – auch mit negativen Zahlen.",
            "erklaerung": [
                "Für jeden x-Wert der Tabelle setzt du in y = mx + b ein und berechnest y.",
                "Achte auf Vorzeichen: −2 mal eine negative Steigung wird positiv.",
                "Die Wertetabelle ist die Brücke zwischen Gleichung und Bild. Jede Zeile liefert einen Punkt, und die Punkte zusammen ergeben die Gerade. Drei Zeilen reichen: zwei bestimmen die Gerade, die dritte ist die Kontrolle.",
                "Wähle die x-Werte selbst, wenn du darfst. x = 0 ist immer nützlich, weil dort sofort b herauskommt, und kleine ganze Zahlen ersparen dir Brüche.",
            ],
            "beispiel": {
                "titel": "Wertetabelle mit negativen x-Werten",
                "aufgabe": "Fülle die Tabelle für y = 2x − 1 bei x = −1, 0, 2.",
                "schritte": [
                    "x = −1: y = 2·(−1) − 1 = −2 − 1 = −3",
                    "x =  0: y = 2·0 − 1 = −1        (das ist b)",
                    "x =  2: y = 2·2 − 1 = 4 − 1 = 3",
                    "Kontrolle: x steigt um 1, y steigt jedes Mal um 2 — das ist die Steigung  ✓",
                ],
                "ergebnis": "(−1 | −3), (0 | −1), (2 | 3). Die Zeile x = 0 verrät nebenbei den y-Achsenabschnitt b = −1.",
            },
        },
        "C": {
            "hinfuehrung": "Ob eine Zuordnung linear ist, siehst du an der Tabelle: Bei gleichen x-Schritten müssen sich die y-Werte immer gleich verändern.",
            "erklaerung": [
                "Steigt x um immer 1, muss y um einen festen Betrag steigen oder fallen. Diese konstante Differenz ist die Steigung m.",
                "Ist die Differenz nicht konstant, ist die Zuordnung nicht linear.",
                "Die x-Schritte müssen dafür selbst gleich groß sein. Bei x = 0, 1, 3 vergleichst du sonst einen Einerschritt mit einem Zweierschritt und hältst eine lineare Zuordnung für nicht linear.",
                "Ungleiche x-Schritte prüfst du deshalb über den Quotienten: Δy geteilt durch Δx muss zwischen je zwei Zeilen denselben Wert ergeben. Das ist die allgemeine Fassung derselben Regel.",
                "Verwechsle diesen Test nicht mit dem auf Proportionalität. Konstante Differenz heißt linear, konstanter Quotient y : x heißt proportional. Proportional ist der Sonderfall mit b = 0.",
            ],
            "beispiel": {
                "titel": "Auf linear prüfen — und von proportional unterscheiden",
                "aufgabe": "Ist diese Zuordnung linear? x: 0, 1, 2, 3 → y: 5, 8, 11, 14. Ist sie auch proportional?",
                "schritte": [
                    "x-Schritte prüfen: immer +1  ✓ — die Differenzen sind vergleichbar",
                    "8 − 5 = 3",
                    "11 − 8 = 3",
                    "14 − 11 = 3   → konstante Differenz, also linear mit m = 3",
                    "Auf proportional prüfen: 8 : 1 = 8, aber 11 : 2 = 5,5 — der Quotient ist nicht konstant.",
                    "Grund: Bei x = 0 ist y = 5 und nicht 0, also b = 5.",
                ],
                "ergebnis": "Linear mit m = 3 und b = 5, aber nicht proportional — die Gerade geht nicht durch den Ursprung.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-03": {
        "A": {
            "hinfuehrung": "Die Gerade geht durch den Punkt (0 | 0).",
            "erklaerung": [
                "Proportional heißt: Doppeltes x gibt doppeltes y.",
                "Dreifaches x gibt dreifaches y.",
                "Du rechnest y = m · x.",
                "Bei x = 0 ist auch y = 0. Genau deshalb geht die Gerade durch den Punkt (0 | 0).",
                "Keine Ware kostet kein Geld. So kannst du es dir merken.",
            ],
            "beispiel": {
                "titel": "y = m · x anwenden",
                "aufgabe": "y = 2x. Welcher y-Wert gehört zu x = 3?",
                "schritte": [
                    "y = 2 · x",
                    "y = 2 · 3",
                    "y = 6",
                ],
                "ergebnis": "Zu x = 3 gehört y = 6.",
                "luecke": {"schritt": 2, "wert": 6},
            },
        },
        "B": {
            "hinfuehrung": "Den Faktor m findest du in jeder Zeile der Tabelle: Er ist y geteilt durch x – und bei einer Ursprungsgeraden überall gleich.",
            "erklaerung": [
                "Bei y = m · x gilt m = y : x. Nimm ein Wertepaar und teile.",
                "Zur Kontrolle: In jeder Zeile muss derselbe Wert herauskommen.",
                "Diese Kontrolle ist zugleich der Test auf Proportionalität. Kommt in zwei Zeilen ein verschiedener Quotient heraus, ist die Zuordnung nicht proportional — dann gehört ein b in die Gleichung.",
                "Die Zeile x = 0 ist für diese Rechnung unbrauchbar, weil durch null nicht geteilt werden darf. Nimm irgendein anderes Wertepaar; bei einer Ursprungsgeraden liefern alle dasselbe m.",
            ],
            "beispiel": {
                "titel": "m aus der Tabelle und die Kontrollzeile",
                "aufgabe": "Tabelle: x = 2 → y = 5, x = 4 → y = 10. Bestimme m und die Gleichung.",
                "schritte": [
                    "m = y : x = 5 : 2 = 2,5",
                    "Kontrolle mit der zweiten Zeile: 10 : 4 = 2,5  ✓",
                    "Beide Zeilen liefern denselben Wert → die Zuordnung ist proportional.",
                    "Gleichung aufschreiben: y = 2,5 · x",
                ],
                "ergebnis": "m = 2,5, also y = 2,5 · x. Die übereinstimmende Kontrollzeile belegt die Proportionalität.",
            },
        },
        "C": {
            "hinfuehrung": "Hinter der Ursprungsgeraden steckt der Dreisatz-Faktor. Wer das sieht, versteht, warum (0 | 0) immer dabei ist.",
            "erklaerung": [
                "Proportional bedeutet konstantes Verhältnis y : x = m. Für x = 0 muss dann auch y = 0 sein – null Ware, null Preis.",
                "Der Faktor m ist genau der Dreisatz-Faktor (Preis je Einheit) aus der Prozentrechnung – dieselbe Idee, neue Schreibweise.",
                "Damit ist die Ursprungsgerade der grafische Dreisatz. Was dort der Weg über die Einheit war, ist hier die Steigung: der Zuwachs von y je einem Schritt in x.",
                "Eine Grundgebühr zerstört die Proportionalität sofort. y = 2,5x + 5 ist noch linear, aber nicht mehr proportional: Doppelte Menge kostet dann nicht doppelt so viel, weil die 5 € nur einmal anfallen.",
                "Deshalb ist die Probe im Sachzusammenhang so einfach: Frag, was bei null Einheiten zu zahlen ist. Kommt ein Betrag heraus, ist die Zuordnung nicht proportional.",
            ],
            "beispiel": {
                "titel": "Proportionalität begründen und gegen einen Tarif abgrenzen",
                "aufgabe": "Begründe, warum y = 2,5x durch den Ursprung geht, und nenne den Faktor. Vergleiche mit y = 2,5x + 5.",
                "schritte": [
                    "Faktor m = 2,5, also der Preis je Einheit (y je x)",
                    "x = 0 → y = 2,5 · 0 = 0, der Punkt (0 | 0) liegt auf der Geraden",
                    "Probe auf konstantes Verhältnis: 5 : 2 = 2,5 und 10 : 4 = 2,5  ✓",
                    "Vergleich: Bei y = 2,5x + 5 ist y(0) = 5, der Ursprung liegt nicht auf der Geraden.",
                    "Folge: Doppelte Menge ergibt dort nicht den doppelten Preis — 4 Einheiten kosten 15 €, 8 Einheiten aber 25 € statt 30 €.",
                ],
                "ergebnis": "y = 2,5x ist proportional, weil bei x = 0 auch y = 0 ist; m = 2,5 ist der Dreisatzfaktor. Eine Grundgebühr macht daraus eine lineare, aber nicht proportionale Zuordnung.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-04": {
        "A": {
            "hinfuehrung": "Die Steigung sagt, wie steil die Gerade ist.",
            "erklaerung": [
                "Suche einen Punkt auf der Geraden.",
                "Gehe von dort 1 Kästchen nach rechts.",
                "Zähle, wie viele Kästchen es nach oben geht. Das ist m.",
                "Geht es nach unten, ist m negativ.",
                "Eine große Zahl bedeutet eine steile Gerade.",
                "Bei m = 0 ist die Gerade waagerecht.",
            ],
            "beispiel": {
                "titel": "Ein Kästchen nach rechts",
                "aufgabe": "1 nach rechts, 2 nach oben. Wie groß ist m?",
                "schritte": [
                    "Δx = 1 (nach rechts)",
                    "Δy = 2 (nach oben)",
                    "m = 2 nach oben je 1 nach rechts",
                ],
                "ergebnis": "Die Steigung ist m = 2.",
                "luecke": {"schritt": 2, "wert": 1, "einheit": "nach rechts"},
            },
        },
        "B": {
            "hinfuehrung": "Steigung ist Höhenunterschied geteilt durch waagerechten Weg. Als Formel: m = Δy geteilt durch Δx – auch negativ und als Bruch.",
            "erklaerung": [
                "Δy ist der Unterschied nach oben (positiv) oder unten (negativ), Δx der Weg nach rechts.",
                "Fällt die Gerade, ist Δy negativ, also m negativ. Passt es nicht glatt, bleibt m ein Bruch.",
                "Δx wird immer nach rechts gezählt und ist deshalb positiv. Das Vorzeichen der Steigung kommt allein aus Δy — so kann es nicht zweimal auftreten und sich versehentlich aufheben.",
                "Ein Bruch als Steigung ist kein unfertiges Ergebnis. m = 3/4 heißt: vier nach rechts, drei nach oben. Als Dezimalzahl 0,75 stimmt das ebenso, nur zeichnen lässt sich der Bruch leichter.",
            ],
            "beispiel": {
                "titel": "Negative Steigung berechnen",
                "aufgabe": "Eine Gerade fällt um 2 auf 2 nach rechts. Bestimme m.",
                "schritte": [
                    "Δx = 2 (nach rechts, immer positiv)",
                    "Δy = −2 (nach unten, deshalb negativ)",
                    "m = Δy : Δx = −2 : 2",
                    "m = −1",
                    "Probe: m ist negativ, und die Gerade fällt  ✓",
                ],
                "ergebnis": "m = −1. Die Gerade fällt um genau ein Kästchen je Schritt nach rechts.",
            },
        },
        "C": {
            "hinfuehrung": "Egal wie groß du das Steigungsdreieck zeichnest – m bleibt gleich. Und aus zwei Punkten rechnest du m ganz ohne Bild.",
            "erklaerung": [
                "Verdoppelst du Δx, verdoppelt sich auch Δy – der Quotient m ändert sich nicht. Das ist der Kern des Steigungsbegriffs.",
                "Aus zwei Punkten P(x1|y1), Q(x2|y2): m = (y2 − y1) : (x2 − x1).",
                "Praktisch heißt das: Zeichne das Dreieck möglichst groß und so, dass beide Ecken auf Gitterpunkten liegen. Ein kleines Dreieck vergrößert jeden Ablesefehler, ein großes verkleinert ihn.",
                "In der Formel darfst du die beiden Punkte vertauschen, solange du oben und unten dieselbe Reihenfolge verwendest. Beide Differenzen wechseln dann das Vorzeichen, und der Quotient bleibt gleich.",
                "Genau das ist der häufigste Fehler: oben y2 − y1 und unten x1 − x2. Dann steht das Vorzeichen falsch, und aus einer steigenden Geraden wird eine fallende.",
            ],
            "beispiel": {
                "titel": "m aus zwei Punkten — und die Reihenfolge prüfen",
                "aufgabe": "Berechne m aus P(1 | 2) und Q(4 | 8). Rechne zur Kontrolle mit vertauschten Punkten.",
                "schritte": [
                    "m = (y2 − y1) : (x2 − x1)",
                    "m = (8 − 2) : (4 − 1)",
                    "m = 6 : 3 = 2",
                    "Vertauscht gerechnet: (2 − 8) : (1 − 4) = (−6) : (−3) = 2  ✓ — gleiches Ergebnis",
                    "Falsch gemischt: (2 − 8) : (4 − 1) = −2 — hier wurde oben und unten verschieden herum gerechnet.",
                ],
                "ergebnis": "m = 2, unabhängig von der Größe des Dreiecks und von der Reihenfolge der Punkte — solange oben und unten dieselbe Reihenfolge gilt.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-05": {
        "A": {
            "hinfuehrung": "b ist die Starthöhe der Geraden.",
            "erklaerung": [
                "Suche die senkrechte Achse. Das ist die y-Achse.",
                "Lies ab, in welcher Höhe die Gerade sie schneidet.",
                "Diese Höhe ist b.",
                "An dieser Stelle ist x = 0.",
                "Liegt der Schnitt unter null, ist b negativ.",
                "Geht die Gerade durch den Nullpunkt, ist b = 0.",
            ],
            "beispiel": {
                "titel": "b an der y-Achse ablesen",
                "aufgabe": "Wo schneidet die Gerade die senkrechte Achse?",
                "schritte": [
                    "Blick auf die y-Achse (x = 0)",
                    "Gerade kreuzt bei Höhe 2",
                ],
                "ergebnis": "b = 2.",
                "luecke": {"schritt": 1, "wert": 2},
            },
        },
        "B": {
            "hinfuehrung": "b findest du überall: im Graphen die Starthöhe, in der Tabelle der Wert bei x = 0, im Text die Grundgebühr.",
            "erklaerung": [
                "Tabelle: b ist der y-Wert zu x = 0.",
                "Sachkontext: b ist der feste Betrag, der auch ohne Verbrauch anfällt – die Grundgebühr.",
                "Alle drei Zugänge beschreiben dieselbe Zahl. Wer im Text die Grundgebühr findet, hat damit auch die Starthöhe des Graphen und die Zeile x = 0 der Tabelle gefunden.",
                "Verwechsle b nicht mit m. Der y-Achsenabschnitt ist ein einmaliger Betrag, die Steigung ein Betrag je Einheit. Im Text erkennst du sie am Wort: „pro“, „je“ und „pro Stunde“ gehören zu m, „Grundgebühr“ und „Startguthaben“ zu b.",
            ],
            "beispiel": {
                "titel": "b im Sachtext finden",
                "aufgabe": "Ein Tarif kostet 5 € Grundgebühr plus 2 € je Stunde. Was ist b?",
                "schritte": [
                    "Signalwort suchen: „Grundgebühr“ → fester Betrag, fällt auch ohne Nutzung an",
                    "Grundgebühr = 5 €  →  b = 5",
                    "Abgrenzung: „je Stunde“ gehört zu m, also m = 2",
                    "Gleichung: y = 2x + 5",
                ],
                "ergebnis": "b = 5, die Grundgebühr. Bei null Stunden sind 5 € fällig — das ist der Punkt (0 | 5).",
            },
        },
        "C": {
            "hinfuehrung": "Ist die Gerade nicht bis zur y-Achse gezeichnet, rechnest du b aus: Setze einen bekannten Punkt und m in die Gleichung ein.",
            "erklaerung": [
                "Aus y = m · x + b folgt b = y − m · x.",
                "Setze die Koordinaten eines Punktes und die bekannte Steigung ein.",
                "Die Umstellung entsteht durch eine einzige Äquivalenzumformung: Von y = mx + b subtrahierst du auf beiden Seiten mx. Auswendig lernen musst du sie deshalb nicht.",
                "Der Punkt darf jeder beliebige Punkt der Geraden sein. Nimm einen, der auf einem Gitterpunkt liegt und möglichst kleine Zahlen hat — das Ergebnis für b ist immer dasselbe.",
                "Kontrolliere danach mit einem zweiten Punkt: Setzt du ihn in die fertige Gleichung ein, muss sein y-Wert herauskommen. Diese Punktprobe deckt Vorzeichenfehler bei negativem m zuverlässig auf.",
            ],
            "beispiel": {
                "titel": "b aus Punkt und Steigung berechnen",
                "aufgabe": "Eine Gerade hat m = 3 und geht durch P(2 | 5). Bestimme b und kontrolliere das Ergebnis.",
                "schritte": [
                    "Umstellen: aus y = m · x + b folgt b = y − m · x",
                    "Einsetzen: b = 5 − 3 · 2",
                    "b = 5 − 6 = −1",
                    "Gleichung: y = 3x − 1",
                    "Kontrolle mit P: 3 · 2 − 1 = 5  ✓ — der Punkt liegt auf der Geraden.",
                ],
                "ergebnis": "b = −1, also y = 3x − 1. Die Gerade schneidet die y-Achse unterhalb des Ursprungs.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-06": {
        "A": {
            "hinfuehrung": "Zeichne in drei Schritten.",
            "erklaerung": [
                "1. Markiere b auf der senkrechten Achse. Das ist dein erster Punkt.",
                "2. Gehe von dort 1 nach rechts und m nach oben.",
                "3. Markiere den zweiten Punkt. Ziehe die Linie durch beide Punkte.",
                "Ist m negativ, gehst du nach unten.",
                "Nimm ein Lineal. Die Linie geht über beide Punkte hinaus.",
            ],
            "beispiel": {
                "titel": "Drei Schritte zur Geraden",
                "aufgabe": "Zeichne y = 2x + 1.",
                "schritte": [
                    "1. b = 1 auf der y-Achse markieren  →  Punkt (0 | 1)",
                    "2. Dreieck: 1 nach rechts, 2 nach oben",
                    "3. zweiter Punkt (1 | 3), Linie durch beide ziehen",
                ],
                "ergebnis": "Gerade durch (0 | 1) und (1 | 3).",
            },
        },
        "B": {
            "hinfuehrung": "Mit Bruchsteigung oder negativem m ändert sich nur das Dreieck – der Ablauf bleibt gleich.",
            "erklaerung": [
                "m als Bruch, z. B. 3/4: 4 nach rechts, 3 nach oben. Der Nenner ist der Weg nach rechts, der Zähler der Weg nach oben.",
                "m negativ: von b aus nach rechts und nach unten.",
                "Der Bruch ist hier ein Vorteil und kein Hindernis. Er nennt dir direkt zwei ganze Zahlen, und damit landet der zweite Punkt genau auf einem Gitterpunkt — bei 0,75 müsstest du dreiviertel Kästchen schätzen.",
                "Bei einer ganzen Zahl funktioniert derselbe Trick: m = 2 ist 2/1, also eins nach rechts und zwei nach oben. Jede Steigung lässt sich als Bruch lesen.",
                "Zeichne zur Sicherheit einen dritten Punkt, indem du das Dreieck noch einmal anlegst. Liegt er nicht auf der Linie, hast du dich beim Abzählen vertan.",
            ],
            "beispiel": {
                "titel": "Gerade mit Bruchsteigung zeichnen",
                "aufgabe": "Zeichne y = 3/4 x + 1.",
                "schritte": [
                    "b = 1 markieren  →  Punkt (0 | 1)",
                    "Bruch lesen: Nenner 4 nach rechts, Zähler 3 nach oben",
                    "zweiter Punkt (4 | 4), Linie ziehen",
                    "Kontrollpunkt: Dreieck noch einmal anlegen  →  (8 | 7) muss auf der Linie liegen  ✓",
                ],
                "ergebnis": "Gerade durch (0 | 1) und (4 | 4). Der Bruch liefert beide Schritte als ganze Kästchen.",
            },
        },
        "C": {
            "hinfuehrung": "Manche Geraden sind besonders: waagerecht, senkrecht. Eine davon ist gar keine Funktion – und dafür gibt es einen Grund.",
            "erklaerung": [
                "y = c ist waagerecht (Steigung 0). x = c ist senkrecht.",
                "Bei x = c gehören zu einem einzigen x unendlich viele y-Werte. Eine Funktion darf zu jedem x aber nur genau ein y haben – deshalb ist x = c keine Funktion.",
                "Die senkrechte Gerade hat auch keine Steigung. Δx wäre null, und durch null darf nicht geteilt werden. Man sagt deshalb nicht „Steigung unendlich“, sondern: Die Steigung ist nicht definiert.",
                "Bei y = c ist die Steigung dagegen sehr wohl definiert und beträgt null: Ein Schritt nach rechts ändert die Höhe um nichts. Steigung null und keine Steigung sind zwei verschiedene Aussagen.",
                "Prüfen lässt sich das mit einem Blick, dem senkrechten Strich: Trifft eine senkrechte Linie den Graphen mehr als einmal, ist es keine Funktion.",
            ],
            "beispiel": {
                "titel": "Begründen, warum x = 3 keine Funktion ist",
                "aufgabe": "Begründe, warum x = 3 keine Funktion ist, und vergleiche mit y = 3.",
                "schritte": [
                    "bei x = 3 liegen alle Punkte (3 | 0), (3 | 1), (3 | 2), … auf der Geraden",
                    "zu einem einzigen x gehören also unendlich viele y",
                    "Eine Funktion erlaubt aber nur ein y je x  →  x = 3 ist keine Funktion",
                    "Steigung: Δx = 0, also ist m nicht definiert — nicht etwa unendlich.",
                    "Vergleich y = 3: Zu jedem x gehört genau ein y, nämlich 3. Das ist eine Funktion mit m = 0.",
                ],
                "ergebnis": "x = 3 ist keine Funktion (ein x, viele y) und hat keine definierte Steigung. y = 3 ist eine Funktion mit der Steigung null.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-07": {
        "A": {
            "hinfuehrung": "Zwei Blicke reichen: Starthöhe und Richtung.",
            "erklaerung": [
                "Lies b ab. Wo schneidet die Gerade die y-Achse?",
                "Steigt die Gerade, ist m positiv.",
                "Fällt die Gerade, ist m negativ.",
                "So kannst du falsche Gleichungen ausschließen.",
                "Zwei Blicke genügen oft schon für die richtige Wahl.",
                "Prüfe zum Schluss mit einem Punkt der Geraden.",
            ],
            "beispiel": {
                "titel": "Falsche Gleichungen ausschließen",
                "aufgabe": "Welche Gleichung passt: y = x + 2, y = x − 2 oder y = −x + 2?",
                "schritte": [
                    "b ablesen: schneidet bei +2 → b = 2, also nicht y = x − 2",
                    "Richtung: die Gerade steigt → m positiv, also nicht y = −x + 2",
                ],
                "ergebnis": "Es passt y = x + 2.",
            },
        },
        "B": {
            "hinfuehrung": "Du brauchst keine Auswahl mehr: Lies m und b direkt ab und schreibe die Gleichung y = mx + b selbst.",
            "erklaerung": [
                "b: Schnittpunkt mit der y-Achse. m: Steigungsdreieck ablesen (Δy : Δx).",
                "Setze beide in y = m · x + b ein.",
                "Lies immer b zuerst ab. Der Schnittpunkt mit der y-Achse ist ein einzelner Punkt und schnell gefunden; für m brauchst du danach nur noch einen zweiten Gitterpunkt.",
                "Kontrolliere die fertige Gleichung mit einem dritten Punkt der Zeichnung. Setzt du dessen x ein, muss sein y herauskommen — das ist die Punktprobe und die einzige echte Absicherung gegen Ablesefehler.",
            ],
            "beispiel": {
                "titel": "m und b ablesen, Gleichung aufstellen",
                "aufgabe": "Lies m und b ab und stelle die Gleichung auf.",
                "schritte": [
                    "b = −1 (Schnitt mit der y-Achse)",
                    "Dreieck: 1 nach rechts, 2 nach oben → m = 2",
                    "Einsetzen: y = 2x − 1",
                    "Punktprobe mit (2 | 3): 2 · 2 − 1 = 3  ✓",
                ],
                "ergebnis": "y = 2x − 1, durch die Punktprobe bestätigt.",
            },
        },
        "C": {
            "hinfuehrung": "Manchmal ist m ein Bruch und b liegt nicht auf einem Gitterpunkt. Dann liest du sorgfältig ab oder rechnest b aus.",
            "erklaerung": [
                "Bruchsteigung: wähle ein großes Dreieck, das auf Gitterpunkten endet, und bilde Δy : Δx.",
                "Ist b nicht ablesbar, nimm einen klaren Gitterpunkt und rechne b = y − m · x.",
                "Die Reihenfolge kehrt sich dabei um: Sonst liest du erst b und dann m, hier erst m und dann b. Der Grund ist, dass die Formel für b die Steigung schon voraussetzt.",
                "Ein großes Dreieck ist hier nicht Bequemlichkeit, sondern Genauigkeit. Verschätzt du dich beim Ablesen um ein halbes Kästchen, wirkt sich das bei Δx = 8 nur halb so stark aus wie bei Δx = 4.",
                "Kommt für b eine krumme Zahl heraus, prüfe zuerst die Steigung. Ein falsch abgelesenes m verschiebt b immer mit — die beiden Fehler treten fast nie einzeln auf.",
            ],
            "beispiel": {
                "titel": "b berechnen, wenn es nicht ablesbar ist",
                "aufgabe": "Eine Gerade geht durch (4 | 3) und hat die Steigung 3/4. Bestimme die Gleichung.",
                "schritte": [
                    "m = 3/4 (aus dem großen Dreieck abgelesen)",
                    "Gitterpunkt wählen: (4 | 3)",
                    "b = y − m · x = 3 − 3/4 · 4",
                    "b = 3 − 3 = 0",
                    "Deutung: b = 0 heißt, die Gerade geht durch den Ursprung — sie ist proportional.",
                ],
                "ergebnis": "y = 3/4 x. Dass b genau null herauskommt, ist hier kein Zufall, sondern die Aussage: Die Gerade läuft durch (0 | 0).",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-08": {
        "A": {
            "hinfuehrung": "Setze den x-Wert in die Gleichung ein.",
            "erklaerung": [
                "Schreibe die Gleichung ab.",
                "Ersetze x durch die Zahl. Schreibe die Zahl in Klammern.",
                "Rechne aus. Punkt vor Strich.",
                "Das Ergebnis ist der y-Wert.",
                "So findest du zu jedem x den passenden y-Wert.",
                "Der y-Wert des Punktes wird nie eingesetzt. Er ist der Vergleichswert.",
            ],
            "beispiel": {
                "titel": "Einsetzen und ausrechnen",
                "aufgabe": "Die Gleichung ist y = 2x + 1. Welchen y-Wert gibt x = 3?",
                "schritte": [
                    "y = 2 · x + 1",
                    "y = 2 · 3 + 1",
                    "y = 7",
                ],
                "ergebnis": "Bei x = 3 liefert die Gerade y = 7.",
                "luecke": {"schritt": 2, "wert": 7},
            },
        },
        "B": {
            "hinfuehrung": "Jetzt vergleichst du: Passt der ausgerechnete y-Wert zum Punkt? Das Ergebnis schreibst du als vollständigen Satz.",
            "erklaerung": [
                "Setze x ein und rechne y aus. Vergleiche mit dem y-Wert des Punktes.",
                "Stimmt beides überein, liegt der Punkt auf der Geraden – sonst nicht. Schreibe einen Antwortsatz.",
                "Die Punktprobe beantwortet eine Ja-Nein-Frage. Deshalb gehört in die Antwort nicht nur das Ergebnis, sondern die Rechnung als Begründung: „…, denn 2 · 3 + 1 = 7.“",
                "Wichtig ist, welche Zahl eingesetzt wird. Eingesetzt wird immer der x-Wert; der y-Wert des Punktes ist der Vergleichswert und wird nie in die Gleichung eingesetzt.",
            ],
            "beispiel": {
                "titel": "Punktprobe mit Antwortsatz",
                "aufgabe": "Liegt P(3 | 7) auf y = 2x + 1?",
                "schritte": [
                    "x-Wert des Punktes einsetzen: x = 3",
                    "y = 2 · 3 + 1 = 7",
                    "Vergleich: berechnet 7, der Punkt hat 7 → gleich",
                ],
                "ergebnis": "P(3 | 7) liegt auf der Geraden, denn 2 · 3 + 1 = 7. Die Begründung gehört in den Antwortsatz.",
            },
        },
        "C": {
            "hinfuehrung": "Wenn ein Punkt auf der Geraden liegen SOLL, aber eine Koordinate fehlt, rechnest du sie aus – rückwärts oder durch Einsetzen.",
            "erklaerung": [
                "Fehlt y, setzt du x ein und rechnest y aus.",
                "Fehlt x, setzt du den bekannten y-Wert ein und löst die Gleichung nach x auf.",
                "Die beiden Fälle sind verschieden schwer, und das hat einen Grund: Bei fehlendem y steht die Unbekannte allein auf einer Seite und ist nur auszurechnen. Bei fehlendem x steckt sie im Term, und es ist eine Gleichung zu lösen.",
                "Diese Unterscheidung ist dieselbe wie zwischen Wertetabelle und Nullstelle. Die Nullstelle ist genau der Fall „y ist bekannt und gleich null, x wird gesucht“.",
                "Kontrolliere am Ende immer mit der Punktprobe. Sie kostet eine Zeile und deckt jeden Umformungsfehler auf.",
            ],
            "beispiel": {
                "titel": "Fehlende x-Koordinate durch Auflösen bestimmen",
                "aufgabe": "Für welches x liegt (x | 9) auf y = 2x + 1?",
                "schritte": [
                    "Bekannt ist y = 9, gesucht ist x → einsetzen und nach x auflösen",
                    "9 = 2x + 1        | − 1",
                    "8 = 2x            | : 2",
                    "x = 4",
                    "Punktprobe: 2 · 4 + 1 = 9  ✓",
                ],
                "ergebnis": "Für x = 4 liegt der Punkt (4 | 9) auf der Geraden. Weil y gegeben war, musste hier eine Gleichung gelöst und nicht nur eingesetzt werden.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-09": {
        "A": {
            "hinfuehrung": "Zwei Punkte geben genau eine Gerade.",
            "erklaerung": [
                "Trage beide Punkte in das Koordinatensystem ein.",
                "Ziehe eine Linie durch beide Punkte. Nimm ein Lineal.",
                "Verlängere die Linie bis zur senkrechten Achse.",
                "Dort liest du den y-Achsenabschnitt ab.",
                "Zwischen den beiden Punkten liest du die Steigung ab.",
            ],
            "beispiel": {
                "titel": "Zeichnen, dann ablesen",
                "aufgabe": "Zeichne die Gerade durch P(1 | 2) und Q(3 | 4). Lies m und b ab.",
                "schritte": [
                    "P und Q eintragen, Linie mit dem Lineal ziehen",
                    "Linie bis zur y-Achse verlängern: b = 1",
                    "Dreieck von P nach Q: 2 nach rechts, 2 nach oben → m = 1",
                ],
                "ergebnis": "y = x + 1.",
                "luecke": {"schritt": 2, "wert": 1},
            },
        },
        "B": {
            "hinfuehrung": "Ohne Zeichnung geht es schneller: m aus der Formel, b durch Einsetzen eines Punktes.",
            "erklaerung": [
                "Die Steigung berechnest du aus den beiden Punkten mit m = (y2 − y1) : (x2 − x1).",
                "Danach setzt du die gefundene Steigung und einen der beiden Punkte in y = mx + b ein und löst nach b auf.",
                "Warum genügt ein einziger Punkt für den zweiten Schritt? Weil die Steigung bereits feststeht. Eine Gerade mit bekannter Richtung ist durch einen Punkt vollständig festgelegt.",
                "Welchen der beiden Punkte du zum Einsetzen nimmst, ist gleichgültig — beide liefern denselben y-Achsenabschnitt. Nimm den mit den kleineren Zahlen.",
                "Der andere Punkt ist damit frei für die Probe. Setze ihn in die fertige Gleichung ein; kommt sein y-Wert heraus, stimmt die Rechnung.",
            ],
            "beispiel": {
                "titel": "Erst die Steigung, dann der y-Achsenabschnitt",
                "aufgabe": "Bestimme die Gleichung der Geraden durch P(1 | 3) und Q(3 | 7).",
                "schritte": [
                    "m = (7 − 3) : (3 − 1) = 4 : 2 = 2",
                    "Punkt P einsetzen: 3 = 2 · 1 + b",
                    "3 = 2 + b   | − 2   →   b = 1",
                    "Gleichung: y = 2x + 1",
                    "Probe mit dem anderen Punkt Q: 2 · 3 + 1 = 7  ✓",
                ],
                "ergebnis": "y = 2x + 1. Der zweite Punkt wurde für die Probe aufgehoben — deshalb ist das Ergebnis abgesichert.",
            },
        },
        "C": {
            "hinfuehrung": "Der Zweipunkte-Weg funktioniert immer, sogar mit negativen Werten und Brüchen. Beschreibe ihn allgemein und wende ihn an.",
            "erklaerung": [
                "Der allgemeine Weg hat drei Schritte: erst m = (y2 − y1) : (x2 − x1), dann b = y1 − m · x1, zuletzt die Gleichung y = mx + b aufschreiben.",
                "Bei Brüchen musst du sorgfältig kürzen und die Vorzeichen prüfen, besonders wenn eine Koordinate negativ ist.",
                "Die gefährlichste Stelle ist die Differenz zweier negativer Zahlen. In 2 − (−2) stehen zwei Minuszeichen nebeneinander, und aus ihnen wird ein Plus: Der Nenner ist 4 und nicht 0.",
                "Ebenso beim Einsetzen: Ein negativer Wert für die Steigung, multipliziert mit einer negativen Koordinate, ergibt einen positiven Beitrag. Schreibe deshalb jede eingesetzte Zahl in Klammern.",
                "Es gibt genau einen Fall, in dem das Verfahren scheitert: Haben beide Punkte denselben x-Wert, wird der Nenner null. Dann ist die Gerade senkrecht und gar keine Funktion.",
            ],
            "beispiel": {
                "titel": "Zwei Punkte mit negativen Koordinaten",
                "aufgabe": "Bestimme die Gleichung der Geraden durch P(−2 | 4) und Q(2 | 1).",
                "schritte": [
                    "m = (1 − 4) : (2 − (−2))",
                    "Nenner sorgfältig: 2 − (−2) = 2 + 2 = 4",
                    "m = (−3) : 4 = −3/4",
                    "b = y1 − m · x1 = 4 − (−3/4) · (−2)",
                    "minus mal minus ergibt plus: (−3/4) · (−2) = 3/2, also b = 4 − 1,5 = 2,5",
                    "Probe mit Q: (−3/4) · 2 + 2,5 = −1,5 + 2,5 = 1  ✓",
                ],
                "ergebnis": "y = −3/4 x + 2,5. Beide Vorzeichenfallen — die Differenz und das Produkt — treten in dieser einen Aufgabe gemeinsam auf.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-10": {
        "A": {
            "hinfuehrung": "An der Nullstelle ist y = 0.",
            "erklaerung": [
                "Suche den Schnittpunkt mit der waagerechten Achse.",
                "Auf der waagerechten Achse ist die Höhe überall null.",
                "Der x-Wert an dieser Stelle ist die Nullstelle.",
                "Die Nullstelle ist ein x-Wert. Sie ist kein y-Wert.",
                "Eine Gerade hat höchstens eine Nullstelle.",
            ],
            "beispiel": {
                "titel": "Die Nullstelle ablesen",
                "aufgabe": "Wo schneidet die Gerade die waagerechte Achse?",
                "schritte": [
                    "Blick auf die x-Achse (y = 0)",
                    "Gerade kreuzt bei x = 2",
                ],
                "ergebnis": "Die Nullstelle ist bei x = 2.",
                "luecke": {"schritt": 1, "wert": 2},
            },
        },
        "B": {
            "hinfuehrung": "An der Nullstelle ist y = 0. Setzt du das in die Gleichung ein, kannst du x ausrechnen.",
            "erklaerung": [
                "Setze y = 0: 0 = m · x + b.",
                "Löse nach x auf: erst b auf die andere Seite, dann durch m teilen.",
                "Das Einsetzen von null ist der ganze Trick. Aus der Funktionsgleichung mit zwei Unbekannten wird dadurch eine lineare Gleichung mit nur noch einer — und die kannst du längst lösen.",
                "Der häufigste Fehler ist, b statt y gleich null zu setzen oder am Ende den y-Wert anzugeben. Die Antwort auf die Frage nach der Nullstelle ist immer eine x-Koordinate.",
                "Eine Gerade hat höchstens eine Nullstelle, und sie hat gar keine, wenn m = 0 und b ungleich null ist: Eine waagerechte Gerade oberhalb der x-Achse trifft diese nie.",
            ],
            "beispiel": {
                "titel": "Nullstelle berechnen",
                "aufgabe": "Berechne die Nullstelle von y = 2x − 6.",
                "schritte": [
                    "y = 0 setzen:  0 = 2x − 6",
                    "0 = 2x − 6      | + 6",
                    "6 = 2x          | : 2",
                    "x = 3",
                    "Probe: 2 · 3 − 6 = 0  ✓",
                ],
                "ergebnis": "Die Nullstelle ist bei x = 3. Der zugehörige Punkt ist (3 | 0).",
            },
        },
        "C": {
            "hinfuehrung": "In Anwendungen bedeutet die Nullstelle oft etwas Konkretes – und manchmal endet das Modell genau dort.",
            "erklaerung": [
                "Beispiel Guthaben: Die Nullstelle ist der Zeitpunkt, zu dem das Konto leer ist.",
                "Grenze des Modells: Danach würde die Gerade negative Werte liefern, die real nicht mehr passen (kein negatives Wasser im Tank).",
                "Ein mathematisch korrektes Ergebnis kann also sachlich unbrauchbar sein. Beides gehört in die Antwort: die Zahl und der Gültigkeitsbereich, in dem sie etwas bedeutet.",
                "Manchmal ist der negative Bereich auch sinnvoll — bei einem Konto heißt er Dispo, bei einer Temperatur Frost. Ob das Modell weitergilt, entscheidet die Sache und nicht die Gleichung.",
                "Ebenso ist der Bereich vor dem Start zu prüfen: Negative x bedeuten hier eine Zeit vor Beobachtungsbeginn, über die das Modell nichts aussagt.",
            ],
            "beispiel": {
                "titel": "Nullstelle deuten und den Gültigkeitsbereich angeben",
                "aufgabe": "Ein Tank leert sich: y = 100 − 20x (Liter nach x Stunden). Wann ist er leer? Beurteile den Wert y(7).",
                "schritte": [
                    "0 = 100 − 20x     | − 100",
                    "−100 = −20x       | : (−20)",
                    "x = 5",
                    "Deutung: Nach 5 Stunden ist der Tank leer.",
                    "Beurteilung von y(7): 100 − 20 · 7 = −40. Ein Tank kann keine −40 Liter enthalten.",
                    "Folge: Das Modell gilt nur für 0 ≤ x ≤ 5. Danach bleibt der Tank leer, der Graph verliefe waagerecht bei null.",
                ],
                "ergebnis": "Nach 5 Stunden ist der Tank leer. Der Gültigkeitsbereich des Modells endet genau an der Nullstelle — die Rechnung für 7 Stunden ist formal richtig und sachlich sinnlos.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-11": {
        "A": {
            "hinfuehrung": "Eine Gleichung ist wie eine Waage.",
            "erklaerung": [
                "Links und rechts vom Gleichheitszeichen ist gleich viel.",
                "Rechne links und rechts immer dasselbe. Dann bleibt die Waage im Gleichgewicht.",
                "Schaffe zuerst die Zahl ohne x weg.",
                "Dann teile durch die Zahl vor dem x.",
                "Schreibe jeden Schritt hinter einen senkrechten Strich.",
            ],
            "beispiel": {
                "titel": "Erst plus oder minus, dann geteilt",
                "aufgabe": "Löse 3x + 4 = 19.",
                "schritte": [
                    "3x + 4 = 19     | − 4",
                    "3x = 15         | : 3",
                    "x = 5",
                ],
                "ergebnis": "x = 5.",
                "luecke": {"schritt": 2, "wert": 5},
            },
        },
        "B": {
            "hinfuehrung": "Steht x links und rechts, sammelst du es zuerst auf einer Seite. Am Ende sichert die Probe dein Ergebnis.",
            "erklaerung": [
                "Bringe alle x auf eine Seite (z. B. − 2x auf beiden Seiten), die Zahlen auf die andere.",
                "Probe: setze deine Lösung in die Ausgangsgleichung ein – beide Seiten müssen gleich sein.",
                "Die Reihenfolge ist kein Zufall. Sie packt die Gleichung von außen nach innen aus: erst das, was addiert wird, zuletzt das, was multipliziert wird — genau umgekehrt zur Punkt-vor-Strich-Regel.",
                "Sammle das x auf der Seite, auf der mehr davon steht. Dann bleibt die Zahl vor dem x positiv, und du sparst dir eine Division durch eine negative Zahl.",
                "Die Probe gehört in die Ausgangsgleichung, nicht in eine Zwischenzeile. Nur so entdeckst du auch einen Fehler, der schon im ersten Schritt passiert ist.",
            ],
            "beispiel": {
                "titel": "x auf beiden Seiten, mit Probe",
                "aufgabe": "Löse 5x − 3 = 2x + 9 und mach die Probe.",
                "schritte": [
                    "Mehr x steht links, also dorthin sammeln:",
                    "5x − 3 = 2x + 9   | − 2x",
                    "3x − 3 = 9        | + 3",
                    "3x = 12           | : 3",
                    "x = 4",
                    "Probe in der Ausgangsgleichung: links 5 · 4 − 3 = 17, rechts 2 · 4 + 9 = 17  ✓",
                ],
                "ergebnis": "x = 4, durch die Probe bestätigt. Beide Seiten liefern denselben Wert 17.",
            },
        },
        "C": {
            "hinfuehrung": "Mit Klammern löst du zuerst diese auf. Und manchmal gibt es keine oder unendlich viele Lösungen – das erkennst du am Ergebnis.",
            "erklaerung": [
                "Klammern mit dem Distributivgesetz auflösen: 2(x + 3) = 2x + 6.",
                "Fällt x ganz heraus und es bleibt eine wahre Aussage (z. B. 6 = 6), gibt es unendlich viele Lösungen. Bleibt eine falsche Aussage (z. B. 6 = 8), gibt es keine Lösung.",
                "Dass x herausfällt, ist kein Rechenfehler und kein Grund, von vorn anzufangen. Es ist selbst das Ergebnis und will gedeutet werden.",
                "Anschaulich sind das dieselben beiden Fälle wie bei zwei Geraden: Eine wahre Aussage bedeutet, dass beide Seiten dieselbe Gerade beschreiben, eine falsche, dass sie parallel verlaufen und sich nie treffen.",
                "Steht ein Minus vor der Klammer, kehren sich beim Auflösen alle Vorzeichen darin um: −2(x − 3) wird zu −2x + 6. Das ist die häufigste Fehlerquelle in dieser Einheit.",
            ],
            "beispiel": {
                "titel": "Klammern auflösen und einen Sonderfall deuten",
                "aufgabe": "Löse 2(x + 3) = 2x + 6 und deute das Ergebnis.",
                "schritte": [
                    "Klammer auflösen: 2(x + 3) = 2x + 6",
                    "2x + 6 = 2x + 6   | − 2x",
                    "6 = 6   → eine wahre Aussage, x ist verschwunden",
                    "Deutung: Beide Seiten sind derselbe Term, nur verschieden geschrieben.",
                    "Geometrisch: Es ist zweimal dieselbe Gerade — jeder Punkt ist gemeinsam.",
                ],
                "ergebnis": "Unendlich viele Lösungen: Jede Zahl für x macht die Gleichung wahr. Das Verschwinden von x ist hier die Antwort und nicht das Problem.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-12": {
        "A": {
            "hinfuehrung": "Der Schnittpunkt ist die Kreuzung.",
            "erklaerung": [
                "Zwei Geraden kreuzen sich meistens an einer Stelle.",
                "Suche die Stelle, wo sich die beiden Geraden kreuzen.",
                "Lies dort den x-Wert und den y-Wert ab.",
                "Schreibe beide Zahlen als Paar: S(x | y).",
                "Dieser Punkt liegt auf beiden Geraden.",
            ],
            "beispiel": {
                "titel": "Die Kreuzung ablesen",
                "aufgabe": "Lies den Schnittpunkt der beiden Geraden ab.",
                "schritte": [
                    "Kreuzungspunkt suchen",
                    "x = 2, y = 3",
                ],
                "ergebnis": "S(2 | 3).",
                "luecke": {"schritt": 1, "wert": 3},
            },
        },
        "B": {
            "hinfuehrung": "Der Schnittpunkt liegt auf beiden Geraden – dort sind beide y gleich. Das nutzt du zum Rechnen und prüfst am Graphen.",
            "erklaerung": [
                "Im Schnittpunkt gilt y1 = y2. Setze die beiden Terme gleich und löse nach x.",
                "Setze x in eine Gleichung ein, um y zu bekommen. Vergleiche mit dem abgelesenen Punkt.",
                "Warum darf man die Terme gleichsetzen? Weil sie im Schnittpunkt denselben Wert haben. Genau das bedeutet „der Punkt liegt auf beiden Geraden“ — und nur an dieser einen Stelle stimmt es.",
                "Zeichnung und Rechnung kontrollieren einander. Die Zeichnung zeigt sofort, ob es überhaupt einen Schnittpunkt gibt; die Rechnung liefert die genauen Werte, auch wenn sie krumm sind.",
            ],
            "beispiel": {
                "titel": "Gleichsetzen und am Bild prüfen",
                "aufgabe": "Schnittpunkt von y = x + 1 und y = −x + 5.",
                "schritte": [
                    "Im Schnittpunkt sind beide y gleich, also Terme gleichsetzen:",
                    "x + 1 = −x + 5   | + x",
                    "2x + 1 = 5       | − 1",
                    "2x = 4           | : 2   →   x = 2",
                    "y bestimmen: y = 2 + 1 = 3",
                    "Gegenprobe in der anderen Gleichung: −2 + 5 = 3  ✓",
                ],
                "ergebnis": "S(2 | 3). Dass beide Gleichungen denselben y-Wert liefern, ist die Probe.",
            },
        },
        "C": {
            "hinfuehrung": "Nicht immer schneiden sich zwei Geraden. Parallel heißt kein Schnittpunkt, deckungsgleich heißt unendlich viele.",
            "erklaerung": [
                "Gleiche Steigung, verschiedenes b → parallel → kein Schnittpunkt. Beim Gleichsetzen fällt x heraus und es bleibt etwas Falsches.",
                "Gleiche Steigung und gleiches b → identische Geraden → jeder Punkt ist Schnittpunkt (unendlich viele).",
                "Vor jeder Rechnung lohnt deshalb ein Blick auf die beiden Steigungen. Sind sie verschieden, gibt es genau einen Schnittpunkt — dann kannst du getrost rechnen.",
                "Sind sie gleich, entscheidet allein b. Zwei Geraden mit gleicher Richtung laufen entweder nebeneinander her oder liegen aufeinander; etwas Drittes gibt es nicht.",
                "Diese drei Fälle sind dieselben wie bei den Lösungsmengen linearer Gleichungen: genau eine Lösung, keine Lösung, unendlich viele. Bild und Rechnung sagen dasselbe.",
            ],
            "beispiel": {
                "titel": "Parallelität am Ergebnis erkennen",
                "aufgabe": "Was ergibt der Schnitt von y = x + 1 und y = x + 4?",
                "schritte": [
                    "Vorabblick: beide haben m = 1, aber b = 1 und b = 4 — Verdacht auf parallel",
                    "x + 1 = x + 4    | − x",
                    "1 = 4  → eine falsche Aussage, x ist verschwunden",
                    "Deutung: Es gibt kein x, für das beide Geraden denselben Wert haben.",
                    "Geometrisch: Die Geraden laufen im Abstand 3 nebeneinander her.",
                ],
                "ergebnis": "Kein Schnittpunkt — die Geraden sind parallel (gleiches m, verschiedenes b). Die falsche Aussage 1 = 4 ist das Ergebnis, nicht ein Rechenfehler.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-13": {
        "A": {
            "hinfuehrung": "Im Schnittpunkt ist y bei beiden Geraden gleich.",
            "erklaerung": [
                "Beide Gleichungen fangen mit y = an.",
                "Schreibe die beiden rechten Seiten gleich.",
                "Jetzt steht nur noch x in der Gleichung.",
                "Löse die Gleichung nach x auf.",
                "Danach setzt du x ein und rechnest y aus.",
                "Beide Zahlen zusammen sind der Schnittpunkt.",
            ],
            "beispiel": {
                "titel": "Gleichsetzen und nach x lösen",
                "aufgabe": "Setze gleich und bestimme x: y = 2x und y = x + 3.",
                "schritte": [
                    "2x = x + 3      | − x",
                    "x = 3",
                ],
                "ergebnis": "x = 3. Der y-Wert folgt im nächsten Schritt.",
                "luecke": {"schritt": 1, "wert": 3},
            },
        },
        "B": {
            "hinfuehrung": "Nach dem x brauchst du noch das y. Einsetzen in eine der Gleichungen liefert es – fertig ist der Schnittpunkt.",
            "erklaerung": [
                "1. Terme gleichsetzen, x berechnen. 2. x in eine Gleichung einsetzen, y berechnen.",
                "3. Ergebnis als Paar S(x | y) angeben.",
                "Der zweite Schritt wird oft vergessen, und dann steht als Antwort eine Zahl statt eines Punktes. Ein Schnittpunkt hat immer zwei Koordinaten.",
                "In welche der beiden Gleichungen du x einsetzt, ist gleichgültig — beide müssen dasselbe y liefern. Genau darum setze x in die eine ein und prüfe mit der anderen: Die Probe kostet eine Zeile.",
            ],
            "beispiel": {
                "titel": "Das Gleichsetzungsverfahren vollständig",
                "aufgabe": "Schnittpunkt von y = 2x und y = x + 3.",
                "schritte": [
                    "2x = x + 3   | − x   →   x = 3",
                    "x in die erste Gleichung: y = 2 · 3 = 6",
                    "Probe mit der zweiten: y = 3 + 3 = 6  ✓",
                    "als Paar schreiben: S(3 | 6)",
                ],
                "ergebnis": "S(3 | 6). Beide Gleichungen liefern für x = 3 denselben y-Wert — das ist die Bestätigung.",
            },
        },
        "C": {
            "hinfuehrung": "Fällt beim Gleichsetzen das x weg, bist du bei den Sonderfällen: parallel oder identisch. Du deutest das Ergebnis.",
            "erklaerung": [
                "Bleibt eine falsche Aussage (z. B. 2 = 5), sind die Geraden parallel – kein Schnittpunkt.",
                "Bleibt eine wahre Aussage (z. B. 3 = 3), sind sie identisch – unendlich viele gemeinsame Punkte. Es ist dieselbe Logik wie beim grafischen Fall.",
                "Beide Male ist das Verschwinden von x kein Zeichen für einen Fehler. Es sagt: Der Vergleich hängt gar nicht von x ab — entweder stimmen die Geraden überall überein oder nirgends.",
                "Für die Antwort reicht die Aussage „x fällt weg“ nicht aus. Verlangt ist die Deutung: kein Schnittpunkt oder unendlich viele, und dazu die Begründung über m und b.",
                "Die Probe machst du an den Steigungen: Gleiche Steigung erklärt beide Sonderfälle, verschiedene Steigung schließt sie aus.",
            ],
            "beispiel": {
                "titel": "Wenn x herausfällt — das Ergebnis deuten",
                "aufgabe": "Setze gleich: y = 2x + 1 und y = 2x + 5. Deute das Ergebnis.",
                "schritte": [
                    "2x + 1 = 2x + 5   | − 2x",
                    "1 = 5  → falsch, und x ist verschwunden",
                    "Deutung: Es gibt kein x, das beide Gleichungen erfüllt.",
                    "Begründung über die Kennzahlen: gleiches m = 2, aber b = 1 gegen b = 5.",
                    "Also verlaufen die Geraden parallel im senkrechten Abstand 4.",
                ],
                "ergebnis": "Kein Schnittpunkt: Die Geraden sind parallel. Die falsche Aussage ist das Ergebnis, die Begründung liefert der Vergleich von m und b.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-14": {
        "A": {
            "hinfuehrung": "Rechne beide Tarife aus.",
            "erklaerung": [
                "Ein Tarif hat oft zwei Teile.",
                "Der feste Teil ist die Grundgebühr. Sie fällt immer an.",
                "Der zweite Teil hängt von der Menge ab.",
                "Setze die Menge in Tarif A ein und rechne die Kosten aus.",
                "Mache das Gleiche mit Tarif B. Der kleinere Preis gewinnt.",
            ],
            "beispiel": {
                "titel": "Beide Tarife ausrechnen und vergleichen",
                "aufgabe": "Tarif A: 10 € + 2 € pro Stunde. Tarif B: 4 € pro Stunde. Was ist bei 8 Stunden günstiger?",
                "schritte": [
                    "A: 10 + 2·8 = 26 €",
                    "B: 4·8 = 32 €",
                    "26 € < 32 €",
                ],
                "ergebnis": "Bei 8 Stunden ist Tarif A günstiger.",
                "luecke": {"schritt": 1, "wert": 32, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Ab welcher Nutzung lohnt welcher Tarif? Der Schnittpunkt der beiden Kostengeraden ist die Grenze.",
            "erklaerung": [
                "Schreibe beide Tarife als y = mx + b (b = Grundgebühr, m = Preis je Einheit).",
                "Der Schnittpunkt zeigt, bei welcher Menge beide gleich viel kosten. Darüber und darunter kehrt sich der Vorteil um – daraus formst du eine Empfehlung.",
                "Welcher Tarif auf welcher Seite gewinnt, sagt dir die Grundgebühr: Vor dem Schnittpunkt liegt der mit der kleineren Grundgebühr vorn, danach der mit dem kleineren Preis je Einheit.",
                "Die Grenzmenge allein ist noch keine Antwort. Verlangt ist der Satz, was sie für die Entscheidung bedeutet — und der braucht beide Bereiche, nicht nur die Zahl.",
            ],
            "beispiel": {
                "titel": "Grenzmenge berechnen und Empfehlung geben",
                "aufgabe": "Ab wann lohnt Tarif A (10 + 2x) gegenüber B (4x)?",
                "schritte": [
                    "Gleichsetzen: 10 + 2x = 4x   | − 2x",
                    "10 = 2x   | : 2   →   x = 5",
                    "Kosten an der Grenze: A = 10 + 10 = 20 €, B = 20 €  ✓ gleich teuer",
                    "Unter 5 Stunden: B hat keine Grundgebühr und ist günstiger.",
                    "Über 5 Stunden: A hat den kleineren Preis je Stunde und ist günstiger.",
                ],
                "ergebnis": "Ab 5 Stunden lohnt Tarif A, darunter Tarif B. Bei genau 5 Stunden kosten beide 20 €.",
            },
        },
        "C": {
            "hinfuehrung": "Mit drei Tarifen gibt es nicht mehr den einen Sieger, sondern Bereiche. Du empfiehlst je nach Nutzungsprofil.",
            "erklaerung": [
                "Berechne die Schnittpunkte paarweise und finde heraus, welcher Tarif in welchem Bereich am tiefsten liegt.",
                "Die Empfehlung nennt Bereiche: „Bis … Tarif X, zwischen … Tarif Y, ab … Tarif Z.“",
                "Eine Flatrate ist dabei ein Sonderfall mit der Steigung null: Ihre Kostengerade verläuft waagerecht. Sie gewinnt deshalb immer irgendwann, sobald die Nutzung groß genug ist.",
                "Nicht jeder berechnete Schnittpunkt ist auch eine Bereichsgrenze. Liegt an dieser Stelle bereits ein dritter Tarif darunter, ist der Schnittpunkt für die Empfehlung ohne Bedeutung — prüfe deshalb jeden Bereich mit einer Beispielmenge.",
                "Und die Grenzen des Modells gehören genannt: Verglichen werden reine Kosten, nicht Vertragslaufzeit, Datenvolumen oder Kündigungsfristen.",
            ],
            "beispiel": {
                "titel": "Dritte Option prüfen und Bereiche empfehlen",
                "aufgabe": "C ist eine Flatrate für 22 €. Wann ist C besser als A (10 + 2x)?",
                "schritte": [
                    "Gleichsetzen: 22 = 10 + 2x   | − 10",
                    "12 = 2x   | : 2   →   x = 6",
                    "Steigung von C ist null — die Kosten bleiben bei 22 €, egal wie lange genutzt wird.",
                    "Bereich prüfen mit x = 10: A kostet 30 €, C kostet 22 € → C liegt darunter.",
                    "Bereich prüfen mit x = 4: A kostet 18 €, C kostet 22 € → A liegt darunter.",
                    "Grenze des Modells: Verglichen wurden nur die Preise, nicht Vertragslaufzeit oder Leistungsumfang.",
                ],
                "ergebnis": "Ab 6 Stunden ist die Flatrate C günstiger als A, darunter A. Weil C die Steigung null hat, gewinnt sie bei ausreichend großer Nutzung zwangsläufig.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-15": {
        "A": {
            "hinfuehrung": "Zwei Gleichungen, eine Lösung.",
            "erklaerung": [
                "Beide Gleichungen fangen mit y = an.",
                "Setze die rechten Seiten gleich. Dann steht nur noch x da.",
                "Rechne x aus.",
                "Setze x in eine der beiden Gleichungen ein.",
                "Rechne y aus. Schreibe beide Zahlen als Paar auf.",
                "Prüfe zum Schluss beide Gleichungen mit deinen Zahlen.",
            ],
            "beispiel": {
                "titel": "Gleichsetzen, x, dann y",
                "aufgabe": "Löse: y = x + 2 und y = 3x − 4.",
                "schritte": [
                    "x + 2 = 3x − 4   | − x",
                    "2 = 2x − 4  | + 4  | : 2 → x = 3",
                    "y = 3 + 2 = 5",
                ],
                "ergebnis": "L = (3 | 5).",
                "luecke": {"schritt": 2, "wert": 5},
            },
        },
        "B": {
            "hinfuehrung": "Ist nur eine Gleichung nach y aufgelöst, setzt du diesen Term in die andere ein. So bleibt nur eine Unbekannte übrig.",
            "erklaerung": [
                "Beim Einsetzungsverfahren nimmst du den y-Term der aufgelösten Gleichung und setzt ihn in die andere Gleichung an die Stelle von y ein.",
                "Danach löst du die entstandene Gleichung nach x auf und bestimmst zum Schluss den zugehörigen Wert für y.",
                "Der Sinn des Verfahrens ist immer derselbe: Aus zwei Gleichungen mit zwei Unbekannten wird eine Gleichung mit einer Unbekannten, und die kannst du längst lösen.",
                "Setze den eingesetzten Term in Klammern. Ohne sie geht bei einem Minus davor das Vorzeichen verloren, und das ist hier der häufigste Fehler überhaupt.",
                "Die Probe gehört in beide Ausgangsgleichungen. Ein Zahlenpaar, das nur eine davon erfüllt, ist keine Lösung des Gleichungssystems.",
            ],
            "beispiel": {
                "titel": "Einsetzungsverfahren mit Klammer",
                "aufgabe": "Löse: y = 2x − 1 und 3x + y = 9.",
                "schritte": [
                    "y-Term aus der ersten Gleichung in die zweite einsetzen, mit Klammer:",
                    "3x + (2x − 1) = 9",
                    "5x − 1 = 9   | + 1   | : 5   →   x = 2",
                    "y bestimmen: y = 2 · 2 − 1 = 3",
                    "Probe in beiden Gleichungen: 2 · 2 − 1 = 3  ✓  und  3 · 2 + 3 = 9  ✓",
                ],
                "ergebnis": "L = (2 | 3). Erst die Probe in beiden Gleichungen macht das Paar zur Lösung des Systems.",
            },
        },
        "C": {
            "hinfuehrung": "Beim Additionsverfahren addierst du die Gleichungen so, dass eine Variable wegfällt. Der Profi wählt je nach Aufgabe das günstigste Verfahren.",
            "erklaerung": [
                "Bringe beide Gleichungen in die Form ax + by = c. Multipliziere so, dass bei einer Variablen entgegengesetzte Koeffizienten stehen, und addiere – eine Variable verschwindet.",
                "Als Faustregel gilt: Ist eine Gleichung nach y aufgelöst, nimmst du Gleichsetzen oder Einsetzen; stehen beide in Standardform mit passenden Koeffizienten, ist das Additionsverfahren am kürzesten.",
                "Warum darf man zwei Gleichungen überhaupt addieren? Weil links und rechts jeweils dasselbe steht. Addiert man zu einer wahren Gleichung auf beiden Seiten gleich viel, bleibt sie wahr.",
                "Alle drei Verfahren führen zum selben Ergebnis, und alle drei sind derselbe Gedanke: eine Unbekannte beseitigen. Die Wahl ist eine Frage des Aufwands, nicht der Richtigkeit.",
                "Die Sonderfälle sehen hier genauso aus wie sonst: Fallen beide Variablen weg und bleibt eine falsche Aussage, hat das Gleichungssystem keine Lösung; bleibt eine wahre, hat es unendlich viele.",
            ],
            "beispiel": {
                "titel": "Additionsverfahren und die Wahl begründen",
                "aufgabe": "Löse mit Addition: 2x + y = 7 und x − y = 2. Begründe die Wahl des Verfahrens.",
                "schritte": [
                    "Wahl begründen: Beide Gleichungen stehen in Standardform, und y hat die Koeffizienten +1 und −1. Also fällt y schon beim bloßen Addieren weg.",
                    "beide addieren: (2x + y) + (x − y) = 7 + 2",
                    "3x = 9   →   x = 3",
                    "einsetzen in die zweite Gleichung: 3 − y = 2   →   y = 1",
                    "Probe in beiden: 2 · 3 + 1 = 7  ✓  und  3 − 1 = 2  ✓",
                ],
                "ergebnis": "L = (3 | 1). Das Additionsverfahren war hier das kürzeste, weil die Koeffizienten von y bereits entgegengesetzt waren — umformen musste man nichts.",
            },
        },
    },

    # ------------------------------------------------------------------
    "lf-16": {
        "A": {
            "hinfuehrung": "Vier Aufgaben kommen immer wieder.",
            "erklaerung": [
                "Ablesen: b an der y-Achse, m am Steigungsdreieck.",
                "Zeichnen: erst b, dann das Dreieck, dann die Linie.",
                "Punktprobe: x einsetzen und mit y vergleichen.",
                "Nullstelle: y = 0 setzen und nach x auflösen.",
                "Die Formelkarte liegt daneben. Du musst nichts auswendig können.",
            ],
            "beispiel": {
                "titel": "Nullstelle als Grundaufgabe",
                "aufgabe": "Bestimme die Nullstelle von y = 2x − 4.",
                "schritte": [
                    "y = 0 setzen:  0 = 2x − 4   | + 4",
                    "4 = 2x  | : 2 → x = 2",
                ],
                "ergebnis": "Nullstelle bei x = 2.",
                "luecke": {"schritt": 1, "wert": 2},
            },
        },
        "B": {
            "hinfuehrung": "Jetzt steht nicht dabei, welcher Aufgabentyp gefragt ist. Du erkennst ihn an der Fragestellung und wählst den Weg selbst.",
            "erklaerung": [
                "Signalwörter: „schneidet die x-Achse“ → Nullstelle; „liegt auf“ → Punktprobe; „stelle die Gleichung auf“ → m und b bestimmen.",
                "Erst Typ erkennen, dann Verfahren anwenden, dann Antwortsatz.",
                "Wenn kein Signalwort greift, hilft die Frage nach dem Gesuchten: Wird ein x gesucht, ist meistens eine Gleichung zu lösen; wird ein y gesucht, wird meistens nur eingesetzt.",
                "Vier Aufgabentypen und vier Kontrollen gehören zusammen: Die Punktprobe sichert eine Gleichung, die Probe durch Einsetzen sichert eine Nullstelle, die Gegenprobe in der anderen Gleichung sichert einen Schnittpunkt.",
            ],
            "beispiel": {
                "titel": "Typ erkennen und rechnen",
                "aufgabe": "„Liegt P(2 | 5) auf y = 3x − 1?“ Welcher Typ, welche Rechnung?",
                "schritte": [
                    "Signalwort „liegt auf“ → Punktprobe",
                    "x-Wert des Punktes einsetzen: x = 2",
                    "y = 3 · 2 − 1 = 5",
                    "berechnet 5, Punkt hat 5  ✓",
                ],
                "ergebnis": "Punktprobe: P(2 | 5) liegt auf der Geraden, denn 3 · 2 − 1 = 5.",
            },
        },
        "C": {
            "hinfuehrung": "Auf MSA-Niveau reicht die Zahl nicht – du begründest den Lösungsweg schriftlich und deutest das Ergebnis im Kontext.",
            "erklaerung": [
                "Kombiniere mehrere Schritte (z. B. Gleichung aufstellen, Schnittpunkt berechnen, im Sachzusammenhang deuten).",
                "Schreibe zu jedem Schritt eine kurze Begründung und einen Antwortsatz – so wie es die Prüfung verlangt.",
                "Die Operatoren sagen, was verlangt ist: „Berechne“ will den Rechenweg, „Begründe“ will einen Grund, „Interpretiere“ will die Bedeutung im Sachzusammenhang. Wer nur rechnet, verschenkt bei den letzten beiden alle Punkte.",
                "Eine Begründung ist kein zweites Aufschreiben der Rechnung. Sie beantwortet die Frage, warum der gewählte Weg zur Antwort führt — etwa: „Im Schnittpunkt kosten beide Anbieter gleich viel, deshalb wird gleichgesetzt.“",
                "Und zur Deutung gehört die Einheit. „x = 5“ ist eine Zahl, „ab 5 Einheiten“ ist eine Aussage über die Sache — nur die zweite ist eine Antwort auf die gestellte Frage.",
            ],
            "beispiel": {
                "titel": "Rechnen, begründen, im Kontext deuten",
                "aufgabe": "Zwei Anbieter: A y = 2x + 10, B y = 4x. Ab wann lohnt A? Begründe.",
                "schritte": [
                    "Ansatz begründen: Gesucht ist die Menge, bei der beide gleich viel kosten. Also werden die Terme gleichgesetzt.",
                    "2x + 10 = 4x   | − 2x   →   10 = 2x   | : 2   →   x = 5",
                    "Kontrolle: A kostet 2 · 5 + 10 = 20 €, B kostet 4 · 5 = 20 €  ✓",
                    "Begründung der Bereiche: A hat die kleinere Steigung, jede weitere Einheit kostet dort nur 2 € statt 4 €. Rechts vom Schnittpunkt ist A deshalb günstiger.",
                    "Deutung mit Einheit: Ab 5 Einheiten lohnt sich Anbieter A, darunter Anbieter B.",
                ],
                "ergebnis": "Ab 5 Einheiten ist A günstiger. Verlangt waren drei Dinge: die Rechnung, die Begründung über die Steigungen und die Deutung im Sachzusammenhang.",
            },
        },
    },
}
