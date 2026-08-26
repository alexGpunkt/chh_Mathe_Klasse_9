# -*- coding: utf-8 -*-
"""KP · Wuerfel, Quader, Prisma, Zylinder (12 Einheiten)

Siehe erarbeitung_bauen.py zur Begruendung.

Der rote Faden dieser Reihe ist der Unterschied zwischen Flaeche und
Rauminhalt. Fast jeder Fehler hier ist einer von zwei Fehlern: die
falsche Groesse berechnet (Oberflaeche statt Volumen) oder die falsche
Einheit angegeben (cm2 statt cm3). Beide haengen zusammen, und beide
lassen sich an der Einheit erkennen - deshalb steht in jeder erweiterten
Erklaerung, WARUM die Einheit die Hochzahl traegt, die sie traegt.
"""

INHALTE = {

    # ------------------------------------------------------------------
    "kp-01": {
        "A": {
            "hinfuehrung": "Jeder Körper hat Flächen, Kanten und Ecken.",
            "erklaerung": [
                "Eine Fläche ist eine Seite. Du kannst mit der Hand darüberstreichen.",
                "Eine Kante ist eine Linie zwischen zwei Flächen.",
                "Eine Ecke ist ein Punkt. Dort treffen sich mehrere Kanten.",
                "Zähle immer in der gleichen Reihenfolge: erst oben, dann unten, dann die Mitte.",
                "So vergisst du nichts und zählst nichts doppelt.",
            ],
            "beispiel": {
                "titel": "Ordentlich zählen am Würfel",
                "aufgabe": "Wie viele Flächen, Kanten und Ecken hat ein Würfel?",
                "schritte": [
                    "Flächen: oben, unten, 4 Seiten = 6",
                    "Kanten: 4 oben, 4 unten, 4 senkrecht = 12",
                    "Ecken: 4 oben, 4 unten = 8",
                ],
                "ergebnis": "Würfel: 6 Flächen, 12 Kanten, 8 Ecken.",
                "luecke": {"schritt": 2, "wert": 8},
            },
        },
        "B": {
            "hinfuehrung": "Jeder Säulenkörper hat eine Grundfläche, die sich unten und oben wiederholt. Faltet man den Körper auf, entsteht sein Netz.",
            "erklaerung": [
                "Die Grundfläche bestimmt den Körpernamen: Dreieck → Dreiecksprisma, Kreis → Zylinder.",
                "Der Mantel ist die Fläche rundherum zwischen den beiden Grundflächen. Im Netz liegt er als zusammenhängendes Rechteck neben den Grundflächen; beim Zylinder ist es ein gebogenes Rechteck.",
                "Das Netz ist mehr als eine Bastelvorlage. Es ist die Oberfläche, flach ausgebreitet — und deshalb der beste Weg, um zu sehen, welche Flächen man beim Berechnen mitzählen muss.",
                "Woran erkennst du die Grundfläche? Sie ist die Form, die sich beim Durchschneiden quer zur Länge immer wieder ergibt. Bei einer Salamischeibe ist es der Kreis, bei einem Dachfirst das Dreieck.",
            ],
            "beispiel": {
                "titel": "Grundfläche und Mantel im Netz wiederfinden",
                "aufgabe": "Beschreibe Grundfläche und Mantel eines Dreiecksprismas.",
                "schritte": [
                    "Grundfläche: das Dreieck, vorn und hinten deckungsgleich",
                    "Mantel: 3 Rechtecke, je eines an einer Dreiecksseite",
                    "Netz: 2 Dreiecke + 3 Rechtecke, insgesamt 5 Flächen",
                    "Probe mit der Regel: n = 3 Ecken der Grundfläche → n + 2 = 5 Flächen  ✓",
                ],
                "ergebnis": "Grundfläche = Dreieck, Mantel = 3 Rechtecke. Das Netz zeigt beides nebeneinander und damit genau die Flächen, die in die Oberfläche eingehen.",
            },
        },
        "C": {
            "hinfuehrung": "Bei einem Prisma musst du nicht jede Kante zählen. Aus der Eckenzahl der Grundfläche folgt alles mit einer festen Regel.",
            "erklaerung": [
                "Hat die Grundfläche n Ecken, so hat das Prisma: n + 2 Flächen (Mantel + 2 Grundflächen), 3 · n Kanten und 2 · n Ecken.",
                "Diese Regel gilt, weil sich die Grundfläche oben und unten wiederholt und der Mantel n Seitenflächen bildet.",
                "Die Kantenzahl 3n zerfällt in drei Gruppen: n Kanten unten, n Kanten oben und n senkrechte Kanten, die beide verbinden. So lässt sich die Formel herleiten statt auswendig lernen.",
                "Die Eckenzahl 2n folgt genauso: Jede Ecke der Grundfläche kommt zweimal vor, einmal unten und einmal oben. Senkrechte Verbindungen erzeugen keine neuen Ecken.",
                "Eine Kontrolle für jede Herleitung ist der Eulersche Polyedersatz: Ecken minus Kanten plus Flächen ergibt bei jedem solchen Körper 2. Für das Prisma: 2n − 3n + (n + 2) = 2  ✓",
            ],
            "beispiel": {
                "titel": "Regel anwenden und mit dem Polyedersatz prüfen",
                "aufgabe": "Wie viele Flächen, Kanten und Ecken hat ein Sechseck-Prisma? Prüfe das Ergebnis.",
                "schritte": [
                    "n = 6, denn die Grundfläche ist ein Sechseck",
                    "Flächen = n + 2 = 6 + 2 = 8   (Mantel mit 6 Rechtecken plus 2 Sechsecke)",
                    "Kanten  = 3 · n = 3 · 6 = 18  (6 unten, 6 oben, 6 senkrecht)",
                    "Ecken   = 2 · n = 2 · 6 = 12  (jede Grundflächenecke zweimal)",
                    "Kontrolle mit dem Polyedersatz: 12 − 18 + 8 = 2  ✓",
                ],
                "ergebnis": "8 Flächen, 18 Kanten, 12 Ecken. Die Zerlegung in drei Kantengruppen macht aus der Formel eine Herleitung, und der Polyedersatz bestätigt sie unabhängig.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-02": {
        "A": {
            "hinfuehrung": "Die kleine Zahl oben zeigt dir die Art der Einheit.",
            "erklaerung": [
                "cm² ist eine Fläche. Die kleine 2 zeigt zwei Richtungen.",
                "cm³ ist ein Volumen. Die kleine 3 zeigt drei Richtungen.",
                "Eine Fläche hat Länge und Breite.",
                "Ein Volumen hat Länge, Breite und Höhe.",
                "In einen Würfel mit 1 dm Kante passt genau 1 Liter.",
            ],
            "beispiel": {
                "titel": "Ein Liter ist ein Kubikdezimeter",
                "aufgabe": "Ein Würfel hat 1 dm Kantenlänge. Wie viel Liter fasst er?",
                "schritte": [
                    "Volumen = 1 dm · 1 dm · 1 dm = 1 dm³",
                    "1 dm³ = 1 l",
                ],
                "ergebnis": "Er fasst 1 Liter, denn 1 dm³ = 1 l.",
                "luecke": {"schritt": 1, "wert": 1, "einheit": "l"},
            },
        },
        "B": {
            "hinfuehrung": "Bei Längen ist der Sprung 10. Bei Flächen wird er 100, bei Volumen 1000 – weil das kleine Zeichen die Richtungen mitzählt.",
            "erklaerung": [
                "Von einer Längeneinheit zur nächstkleineren mal 10. Fläche: 10 · 10 = 100 je Stufe. Volumen: 10 · 10 · 10 = 1000 je Stufe.",
                "Nach unten (größer → kleiner) mal, nach oben (kleiner → größer) geteilt.",
                "Der Grund steht in der Hochzahl. Eine Fläche wird aus zwei Längen gebildet, also wirkt der Faktor 10 zweimal; ein Volumen aus drei Längen, also dreimal. Die Hochzahl der Einheit ist zugleich die Anzahl der Zehner im Umrechnungsfaktor.",
                "Deshalb ist der häufigste Fehler auch immer derselbe: mit 10 statt mit 100 oder 1000 umzurechnen. Das Ergebnis ist dann um den Faktor 10 oder 100 daneben — eine Größenordnung, die im Sachzusammenhang meistens auffällt.",
            ],
            "beispiel": {
                "titel": "Volumen um eine Stufe umrechnen",
                "aufgabe": "Rechne 2 dm³ in cm³ um.",
                "schritte": [
                    "Richtung: dm³ → cm³ ist eine Stufe kleiner, also wird multipliziert",
                    "Faktor: Volumen, also 10³ = 1000 je Stufe",
                    "2 dm³ · 1000 = 2000 cm³",
                    "Probe im Bild: In einen Würfel von 1 dm Kante passen 10 · 10 · 10 = 1000 Würfelchen von 1 cm  ✓",
                ],
                "ergebnis": "2 dm³ = 2000 cm³. Der Faktor 1000 ist keine Setzung, sondern 10 · 10 · 10 — einmal je Richtung.",
            },
        },
        "C": {
            "hinfuehrung": "In Sachaufgaben stehen die Einheiten bunt gemischt. Wer den Faktor begründen kann, wechselt sicher zwischen allen.",
            "erklaerung": [
                "Nützliche Brücken: 1 l = 1 dm³, 1 m³ = 1000 l, 1 dm³ = 1000 cm³.",
                "Begründung des Faktors 1000: Ein Meter sind 10 dm; ein Kubikmeter ist 10 · 10 · 10 = 1000 dm³ – deshalb 1000 l.",
                "Die Brücke zwischen Rauminhalt und Hohlmaß ist 1 l = 1 dm³. Sie ist keine Näherung, sondern die Definition des Liters — und die einzige Stelle, an der die beiden Einheitensysteme aufeinandertreffen.",
                "Daraus folgt sofort 1 ml = 1 cm³, weil beide Seiten durch 1000 geteilt werden. Ein Teelöffel von 5 ml ist also ein Würfelchen von etwa 1,7 cm Kante.",
                "Bei Sachaufgaben lohnt der Zwischenschritt über dm: Wer alle Längen zuerst in Dezimeter umrechnet, bekommt das Volumen unmittelbar in Litern und spart sich jede weitere Umrechnung.",
            ],
            "beispiel": {
                "titel": "Kubikmeter in Liter — mit Begründung des Faktors",
                "aufgabe": "Ein Becken fasst 1,5 m³. Wie viele Liter sind das? Begründe den Faktor.",
                "schritte": [
                    "Begründung: 1 m = 10 dm, also 1 m³ = 10 · 10 · 10 dm³ = 1000 dm³",
                    "Brücke: 1 dm³ = 1 l, also 1 m³ = 1000 l",
                    "1,5 m³ · 1000 = 1500 l",
                    "Plausibilität: Eine Badewanne fasst etwa 150 l, das Becken also rund zehn Badewannen  ✓",
                ],
                "ergebnis": "1,5 m³ = 1500 l. Der Faktor 1000 kommt aus 10³ — einmal 10 für jede der drei Richtungen.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-03": {
        "A": {
            "hinfuehrung": "Der Würfel hat 6 gleiche Quadrate.",
            "erklaerung": [
                "Ein Quadrat hat die Fläche a · a.",
                "Man schreibt dafür kurz a².",
                "Alle 6 Flächen sind gleich groß.",
                "Nimm die Fläche von einem Quadrat mal 6.",
                "Die Oberfläche ist eine Fläche. Die Einheit bekommt deshalb eine kleine 2 oben: cm².",
                "Die Oberfläche ist das ganze Papier, das den Würfel einwickelt.",
            ],
            "beispiel": {
                "titel": "Sechs gleiche Quadrate",
                "aufgabe": "Berechne die Oberfläche von einem Würfel mit a = 5 cm.",
                "schritte": [
                    "eine Fläche = a² = 5 cm · 5 cm = 25 cm²",
                    "O = 6 · 25 cm² = 150 cm²",
                ],
                "ergebnis": "O = 150 cm².",
                "luecke": {"schritt": 1, "wert": 150, "einheit": "cm²"},
            },
        },
        "B": {
            "hinfuehrung": "Der Quader hat drei verschiedene Flächenpaare. Du rechnest jedes Paar einmal aus und addierst.",
            "erklaerung": [
                "Gegenüberliegende Flächen sind gleich groß: vorn/hinten, links/rechts, oben/unten.",
                "O = 2 · (a·b + a·c + b·c) – die drei Rechtecke einmal berechnen, verdoppeln, addieren.",
                "Die drei Produkte entstehen dadurch, dass jede Fläche von zwei der drei Kanten aufgespannt wird. Aus drei Kanten lassen sich genau drei Paare bilden — mehr Flächenarten kann ein Quader nicht haben.",
                "Der Würfel ist darin enthalten: Sind alle Kanten gleich lang, werden alle drei Produkte zu a², und aus 2 · 3 · a² wird 6 · a². Es ist also nicht eine zweite Formel, sondern derselbe Gedanke im Sonderfall.",
            ],
            "beispiel": {
                "titel": "Drei Flächenpaare des Quaders",
                "aufgabe": "Quader mit a = 4 cm, b = 3 cm, c = 2 cm. Berechne O.",
                "schritte": [
                    "die drei verschiedenen Rechtecke:",
                    "a·b = 4·3 = 12,  a·c = 4·2 = 8,  b·c = 3·2 = 6",
                    "Summe der drei = 12 + 8 + 6 = 26",
                    "jede kommt doppelt vor: O = 2 · 26 = 52 cm²",
                    "Einheit prüfen: cm · cm = cm², eine Fläche  ✓",
                ],
                "ergebnis": "O = 52 cm². Die drei Produkte sind die drei Flächenarten, der Faktor 2 zählt die jeweils gegenüberliegende mit.",
            },
        },
        "C": {
            "hinfuehrung": "In Sachaufgaben stehen die Kanten manchmal in verschiedenen Einheiten. Erst gleichnamig machen, dann rechnen.",
            "erklaerung": [
                "Wandle alle Längen in dieselbe Einheit um, bevor du multiplizierst – sonst stimmt das Ergebnis nicht.",
                "Gib am Ende die passende Flächeneinheit an und prüfe die Größenordnung.",
                "Warum funktioniert Rechnen mit gemischten Einheiten nicht? Weil ein Produkt wie 1 m · 80 cm keine sinnvolle Einheit hat. Erst wenn beide Faktoren dieselbe Einheit tragen, ergibt das Produkt eine Fläche in m² oder cm².",
                "Welche gemeinsame Einheit du wählst, ist frei, aber nicht gleichgültig. Nimm die, in der das Ergebnis gefragt ist — dann entfällt jede Umrechnung am Schluss, und genau dort passieren die Fehler.",
                "Die Plausibilitätsprobe zum Schluss ist billig: Ein Karton von etwa einem Meter Kantenlänge hat wenige Quadratmeter Oberfläche. Kommt 34 000 heraus, ist irgendwo cm mit m verwechselt worden.",
            ],
            "beispiel": {
                "titel": "Gemischte Einheiten gleichnamig machen",
                "aufgabe": "Eine Kiste: a = 1 m, b = 80 cm, c = 50 cm. Oberfläche in m²?",
                "schritte": [
                    "Zieleinheit ist m², also alles in Meter umrechnen:",
                    "b = 80 cm = 0,8 m,   c = 50 cm = 0,5 m",
                    "a·b = 1 · 0,8 = 0,8;  a·c = 1 · 0,5 = 0,5;  b·c = 0,8 · 0,5 = 0,4",
                    "Summe = 0,8 + 0,5 + 0,4 = 1,7",
                    "O = 2 · 1,7 = 3,4 m²",
                    "Plausibilität: eine Kiste von rund einem Meter — wenige Quadratmeter Karton  ✓",
                ],
                "ergebnis": "O = 3,4 m². Weil die Antwort in m² verlangt war, wurde gleich in Meter gerechnet — so entfällt jede Umrechnung am Schluss.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-04": {
        "A": {
            "hinfuehrung": "Das Volumen sagt, wie viel hineinpasst.",
            "erklaerung": [
                "Stell dir den Körper mit kleinen Würfeln gefüllt vor.",
                "Das Volumen zählt, wie viele Würfel hineinpassen.",
                "Volumen = Länge · Breite · Höhe.",
                "Beim Würfel sind alle drei Kanten gleich lang.",
                "Die Einheit bekommt eine kleine 3 oben: cm³.",
                "Beim Quader sind die drei Kanten verschieden lang.",
            ],
            "beispiel": {
                "titel": "Drei gleiche Kanten",
                "aufgabe": "Berechne das Volumen von einem Würfel mit a = 3 cm.",
                "schritte": [
                    "V = a · a · a",
                    "V = 3 · 3 · 3",
                    "V = 27 cm³",
                ],
                "ergebnis": "V = 27 cm³. In den Würfel passen 27 Würfelchen von 1 cm Kante.",
                "luecke": {"schritt": 2, "wert": 27, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "Beim Quader multiplizierst du die drei verschiedenen Kanten. Rauminhalte lassen sich dann in Liter angeben.",
            "erklaerung": [
                "V = a · b · c – das ist Grundfläche (a·b) mal Höhe (c).",
                "Für Liter: In dm rechnen, dann ist das Ergebnis in dm³ = l.",
                "Die Lesart „Grundfläche mal Höhe“ ist die wichtigere von beiden. Sie gilt nämlich auch für Prisma und Zylinder, während a · b · c nur beim Quader funktioniert — dort ist sie derselbe Gedanke im einfachsten Fall.",
                "Anschaulich: Die Grundfläche ist eine Schicht von einer Einheit Dicke, und die Höhe zählt, wie viele solche Schichten übereinanderliegen. Genau das misst ein Volumen.",
            ],
            "beispiel": {
                "titel": "Quadervolumen direkt in Litern",
                "aufgabe": "Aquarium: 5 dm · 3 dm · 4 dm. Volumen in Litern?",
                "schritte": [
                    "als Grundfläche mal Höhe gelesen: G = 5 · 3 = 15 dm²",
                    "V = G · h = 15 · 4 = 60 dm³",
                    "1 dm³ = 1 l",
                    "Weil in dm gerechnet wurde, steht die Literzahl direkt da — ohne Umrechnung.",
                ],
                "ergebnis": "V = 60 dm³ = 60 l. Der Weg über die Grundfläche funktioniert später bei Prisma und Zylinder unverändert weiter.",
            },
        },
        "C": {
            "hinfuehrung": "Auch beim Volumen gilt: erst alle Kanten in dieselbe Einheit, dann multiplizieren – sonst ist das Ergebnis um Zehnerpotenzen daneben.",
            "erklaerung": [
                "Wähle eine sinnvolle gemeinsame Einheit (oft cm oder dm) und rechne alle Längen um.",
                "Prüfe das Ergebnis: Ein Körper von wenigen dm Kantenlänge fasst nur wenige Liter, nicht Hunderte.",
                "Beim Volumen ist ein Einheitenfehler dreimal so folgenreich wie bei einer Länge. Verwechselst du cm mit dm, ist das Ergebnis nicht um 10, sondern um 10³ = 1000 daneben — deshalb sind Volumenaufgaben die anfälligste Stelle der ganzen Reihe.",
                "Rechne in Dezimetern, wenn nach Litern gefragt ist. Das ist keine Bequemlichkeit, sondern die Vermeidung des riskantesten Schritts: der Umrechnung am Schluss.",
                "Zur Plausibilität hilft ein bekannter Vergleich: Ein Getränkekasten fasst etwa 12 l, eine Badewanne etwa 150 l, ein kleines Auto etwa 3 m³. An diesen Größen erkennst du sofort, ob eine Zehnerpotenz verrutscht ist.",
            ],
            "beispiel": {
                "titel": "Gemischte Einheiten beim Volumen",
                "aufgabe": "Ein Kasten: 40 cm · 30 cm · 2 dm. Volumen in dm³?",
                "schritte": [
                    "Zieleinheit dm³, also alle Kanten in dm:",
                    "40 cm = 4 dm,   30 cm = 3 dm,   2 dm bleibt",
                    "V = 4 · 3 · 2 = 24 dm³",
                    "Gegenprobe in cm: 40 · 30 · 20 = 24 000 cm³, und 24 000 : 1000 = 24 dm³  ✓",
                    "Plausibilität: 24 l ist etwa doppelt so viel wie ein Getränkekasten  ✓",
                ],
                "ergebnis": "V = 24 dm³ = 24 l. Die Gegenprobe in Zentimetern zeigt den Faktor 1000 — genau um diesen Betrag läge man daneben, wenn man die Einheiten mischte.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-05": {
        "A": {
            "hinfuehrung": "Du kennst das Volumen und suchst eine Kante.",
            "erklaerung": [
                "Vorwärts hast du drei Kanten mal genommen.",
                "Rückwärts teilst du deshalb.",
                "Nimm zuerst die zwei bekannten Kanten mal.",
                "Teile dann das Volumen durch dieses Ergebnis.",
                "Das Ergebnis ist eine Länge. Die Einheit ist cm, nicht cm³.",
            ],
            "beispiel": {
                "titel": "Rückwärts durch Teilen",
                "aufgabe": "V = 60 cm³, a = 5 cm, b = 4 cm. Wie lang ist c?",
                "schritte": [
                    "a · b = 5 · 4 = 20",
                    "c = V : (a·b) = 60 : 20",
                    "c = 3 cm",
                ],
                "ergebnis": "Die fehlende Kante c = 3 cm.",
                "luecke": {"schritt": 2, "wert": 3, "einheit": "cm"},
            },
        },
        "B": {
            "hinfuehrung": "Beim Würfel führt der Rückweg über eine Wurzel: aus dem Volumen die dritte Wurzel, aus der Oberfläche die Quadratwurzel.",
            "erklaerung": [
                "Aus V = a³ folgt a = ∛V (dritte Wurzel).",
                "Aus O = 6 · a² folgt zuerst eine Fläche = O : 6, dann a = √(Fläche).",
                "Welche Wurzel du brauchst, verrät die Hochzahl: Was hoch drei genommen wurde, wird mit der dritten Wurzel zurückgeholt; was quadriert wurde, mit der Quadratwurzel. Wurzelziehen ist nichts anderes als die Umkehrung des Potenzierens.",
                "Bei der Oberfläche kommt ein Schritt davor, und er wird gern vergessen: Die 96 cm² sind sechs Flächen, nicht eine. Erst nach dem Teilen durch 6 steht die Zahl da, aus der die Wurzel gezogen werden darf.",
            ],
            "beispiel": {
                "titel": "Würfelkante aus dem Volumen",
                "aufgabe": "Ein Würfel hat V = 64 cm³. Wie lang ist die Kante?",
                "schritte": [
                    "V = a³, also wird die dritte Wurzel gezogen: a = ∛V = ∛64",
                    "Suchen statt rechnen: welche Zahl dreimal mit sich selbst?",
                    "4 · 4 · 4 = 64",
                    "a = 4 cm",
                    "Probe: 4³ = 64 cm³  ✓  und die Einheit ist cm, eine Länge  ✓",
                ],
                "ergebnis": "Die Kante ist a = 4 cm. Die dritte Wurzel macht genau das rückgängig, was das Hochdrei getan hat.",
            },
        },
        "C": {
            "hinfuehrung": "Bei rückwärts gestellten Aufgaben zeigst du nicht nur das Ergebnis, sondern auch, welche Formel du wie umgestellt hast.",
            "erklaerung": [
                "Notiere die Ausgangsformel, stelle sie Schritt für Schritt nach der gesuchten Größe um und setze dann ein.",
                "Eine Probe (Ergebnis wieder einsetzen) sichert den Weg ab.",
                "Umstellen heißt auch hier: dieselbe Rechenoperation auf beiden Seiten. Das · 6 wird durch : 6 aufgehoben, das Quadrat durch die Wurzel — es sind dieselben Äquivalenzumformungen wie bei jeder Gleichung.",
                "Bei Rückwärtsaufgaben ist die Probe nicht Beiwerk, sondern die eigentliche Absicherung. Ein Umstellungsfehler liefert fast immer eine plausibel aussehende Zahl, und nur das Wiedereinsetzen deckt ihn auf.",
                "Die Einheit ist die zweite Kontrolle: Gesucht ist eine Länge, also muss cm herauskommen. Steht am Ende cm² oder cm³ da, wurde eine Wurzel vergessen.",
            ],
            "beispiel": {
                "titel": "Formel umstellen, einsetzen, Probe machen",
                "aufgabe": "Ein Würfel hat O = 96 cm². Bestimme a und mach die Probe.",
                "schritte": [
                    "Ausgangsformel notieren: O = 6 · a²",
                    "umstellen, Schritt 1:  a² = O : 6",
                    "einsetzen: a² = 96 : 6 = 16",
                    "umstellen, Schritt 2:  a = √(a²) = √16 = 4 cm",
                    "Probe: 6 · 4² = 6 · 16 = 96 cm²  ✓",
                    "Einheitenkontrolle: gesucht war eine Länge, das Ergebnis steht in cm  ✓",
                ],
                "ergebnis": "a = 4 cm, durch die Probe bestätigt. Zwei Umformungen, in dieser Reihenfolge: erst durch 6 teilen, dann die Wurzel ziehen.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-06": {
        "A": {
            "hinfuehrung": "Ein Prisma ist ein Stapel aus gleichen Flächen.",
            "erklaerung": [
                "Die Grundfläche G sieht unten und oben gleich aus.",
                "Stell dir viele gleiche Scheiben übereinander vor.",
                "Die Grundfläche ist eine Scheibe.",
                "Die Höhe h sagt, wie hoch der Stapel ist.",
                "Rechne V = G · h.",
                "Das gilt für jedes Prisma. Die Grundfläche darf jede Form haben.",
            ],
            "beispiel": {
                "titel": "Grundfläche mal Höhe",
                "aufgabe": "Ein Prisma hat G = 12 cm² und h = 5 cm. Wie groß ist das Volumen?",
                "schritte": [
                    "V = G · h",
                    "V = 12 cm² · 5 cm",
                    "V = 60 cm³",
                ],
                "ergebnis": "V = 60 cm³. Aus cm² mal cm wird cm³.",
                "luecke": {"schritt": 2, "wert": 60, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "Oft ist die Grundfläche nicht gegeben, sondern ein Dreieck oder Trapez. Erst berechnest du G, dann V = G · h.",
            "erklaerung": [
                "Dreieck: G = (g · h_d) : 2 (Grundseite mal Dreieckshöhe, geteilt durch 2).",
                "Trapez: G = (a + c) : 2 · h_d. Danach immer V = G · h.",
                "Zwei Höhen treten hier auf, und sie zu verwechseln ist der Hauptfehler dieser Einheit: h_d ist die Höhe innerhalb der Grundfläche, h die Länge des Prismas. Nur h_d gehört in die Flächenformel.",
                "Die Volumenformel selbst ändert sich dabei nie. Was sich ändert, ist allein der erste Schritt — welche Formel die Grundfläche liefert. Deshalb lohnt es, die Rechnung sichtbar in zwei Teile zu trennen.",
            ],
            "beispiel": {
                "titel": "Erst die Dreiecksfläche, dann das Volumen",
                "aufgabe": "Dreiecksprisma: g = 6 cm, h_d = 4 cm, Länge h = 10 cm. Volumen?",
                "schritte": [
                    "Schritt 1, die Grundfläche mit der Dreiecksformel:",
                    "G = (g · h_d) : 2 = (6 · 4) : 2 = 12 cm²",
                    "Schritt 2, das Volumen mit der Prismenformel:",
                    "V = G · h = 12 · 10",
                    "V = 120 cm³",
                    "Höhen prüfen: h_d = 4 stand in der Fläche, h = 10 im Volumen  ✓",
                ],
                "ergebnis": "V = 120 cm³. Die beiden Höhen h_d und h haben verschiedene Aufgaben — sie zu tauschen ist der häufigste Fehler.",
            },
        },
        "C": {
            "hinfuehrung": "Ist die Grundfläche eine ungewöhnliche Form, zerlegst du sie in Rechtecke und Dreiecke, deren Flächen du addierst.",
            "erklaerung": [
                "Teile die Grundfläche in einfache Teilflächen, berechne jede und addiere sie zu G.",
                "Dann wie immer V = G · h. Achte darauf, dass alle Teilflächen dieselbe Einheit haben.",
                "Zerlegt wird nur die Grundfläche, nicht der Körper. Das ist der Vorteil des Prismas: Eine einzige Zerlegung in der Ebene erledigt die ganze Rechnung, weil die Höhe für alle Teile dieselbe ist.",
                "Rechnerisch steckt dahinter das Distributivgesetz: G₁ · h + G₂ · h ist dasselbe wie (G₁ + G₂) · h. Deshalb darfst du die Teilflächen addieren und erst danach mit der Höhe multiplizieren.",
                "Manchmal ist Abziehen kürzer als Zerlegen. Bei einer Grundfläche mit Aussparung rechnest du das umschließende Rechteck und ziehst das Loch ab — dasselbe Prinzip mit umgekehrtem Vorzeichen.",
            ],
            "beispiel": {
                "titel": "Grundfläche zerlegen und einmal mit der Höhe rechnen",
                "aufgabe": "Die Grundfläche ist ein Rechteck (5 · 4) mit aufgesetztem Dreieck (g = 5, h_d = 2). Höhe h = 8. Volumen?",
                "schritte": [
                    "Teilfläche 1, Rechteck: 5 · 4 = 20 cm²",
                    "Teilfläche 2, Dreieck: (5 · 2) : 2 = 5 cm²",
                    "G = 20 + 5 = 25 cm²",
                    "V = G · h = 25 · 8 = 200 cm³",
                    "Gegenprobe einzeln: 20 · 8 + 5 · 8 = 160 + 40 = 200 cm³  ✓ — dasselbe Ergebnis.",
                ],
                "ergebnis": "V = 200 cm³. Die Gegenprobe zeigt, warum das Zerlegen erlaubt ist: Erst addieren und dann mal h ist dasselbe wie einzeln mal h und dann addieren.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-07": {
        "A": {
            "hinfuehrung": "Hier ist die Grundfläche ein Dreieck.",
            "erklaerung": [
                "Ein Dreieck ist ein halbes Rechteck.",
                "Deshalb teilst du bei der Dreiecksfläche durch 2.",
                "Rechne zuerst die Dreiecksfläche: G = (g · h_d) : 2.",
                "Nimm G dann mal die Länge h.",
                "Die Länge h ist nicht die Höhe im Dreieck.",
                "Es gibt hier zwei Höhen. Schreibe dazu, welche du meinst.",
            ],
            "beispiel": {
                "titel": "Dreiecksfläche, dann Länge",
                "aufgabe": "g = 8 cm, h_d = 3 cm, Länge h = 12 cm. Wie groß ist das Volumen?",
                "schritte": [
                    "G = (8 · 3) : 2 = 12 cm²",
                    "V = G · h = 12 · 12",
                    "V = 144 cm³",
                ],
                "ergebnis": "V = 144 cm³.",
                "luecke": {"schritt": 2, "wert": 144, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "Ob Dreieck oder Trapez – der zweite Schritt bleibt gleich. Nur die Grundfläche wird anders berechnet.",
            "erklaerung": [
                "Trapez: G = (a + c) : 2 · h_d, mit den parallelen Seiten a und c.",
                "Anschließend V = G · h.",
                "Die Trapezformel ist gut zu merken, wenn man sie liest als: mittlere Länge mal Höhe. Der Ausdruck (a + c) : 2 ist der Durchschnitt der beiden parallelen Seiten — das Trapez wird damit zu einem Rechteck derselben Fläche.",
                "Der Sonderfall bestätigt das: Sind a und c gleich lang, ist der Durchschnitt genau diese Länge, und die Formel wird zur Rechteckformel. Ein Trapez mit gleich langen Parallelseiten ist ein Rechteck.",
            ],
            "beispiel": {
                "titel": "Trapez als mittlere Länge mal Höhe",
                "aufgabe": "Trapez-Prisma: a = 6 cm, c = 4 cm, h_d = 3 cm, Länge h = 10 cm. Volumen?",
                "schritte": [
                    "mittlere Länge: (a + c) : 2 = (6 + 4) : 2 = 5 cm",
                    "G = 5 · h_d = 5 · 3 = 15 cm²",
                    "V = G · h = 15 · 10",
                    "V = 150 cm³",
                    "Plausibilität: Ein Rechteck von 5 · 3 hätte dieselbe Fläche — das Trapez liegt genau dazwischen  ✓",
                ],
                "ergebnis": "V = 150 cm³. Gelesen als „mittlere Länge mal Höhe“ ist die Trapezformel nichts weiter als die Rechteckformel.",
            },
        },
        "C": {
            "hinfuehrung": "Reale Körper wie ein Dachfirst oder eine Rinne bestehen aus mehreren Prismen. Du rechnest die Teile und addierst.",
            "erklaerung": [
                "Zerlege den Körper in einfache Prismen, berechne jedes Volumen und addiere.",
                "Bei Sachaufgaben zuerst die Einheiten prüfen und am Ende in eine sinnvolle Einheit (oft Liter) umrechnen.",
                "Suche die Schnittlinie dort, wo sich die Querschnittsform ändert. Beim Haus ist das die Traufe: darunter ein Rechteck, darüber ein Dreieck — zwei Prismen mit derselben Länge.",
                "Weil beide Teile dieselbe Länge haben, kannst du auch hier zuerst die Querschnittsflächen addieren und erst dann mit der Länge multiplizieren. Das spart eine Multiplikation und eine Fehlerquelle.",
                "Prüfe am Schluss die Größenordnung im Sachzusammenhang. Ein Wohnhaus hat einige hundert Kubikmeter Rauminhalt; kommen mehrere tausend heraus, stimmt eine Einheit nicht.",
            ],
            "beispiel": {
                "titel": "Haus als zwei Prismen mit gemeinsamer Länge",
                "aufgabe": "Ein Haus-Querschnitt: Rechteck (6 · 3) plus Dachdreieck (g = 6, h_d = 2), Länge 10 m. Volumen?",
                "schritte": [
                    "Schnittlinie an der Traufe: unten Rechteck, oben Dreieck",
                    "Rechteckprisma: (6 · 3) · 10 = 18 · 10 = 180 m³",
                    "Dachprisma: ((6 · 2) : 2) · 10 = 6 · 10 = 60 m³",
                    "V = 180 + 60 = 240 m³",
                    "Kürzer über die Querschnittsfläche: (18 + 6) · 10 = 24 · 10 = 240 m³  ✓",
                    "Plausibilität: ein kleines Wohnhaus, einige hundert Kubikmeter  ✓",
                ],
                "ergebnis": "V = 240 m³. Weil beide Teile dieselbe Länge haben, genügt eine einzige Multiplikation mit der Länge.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-08": {
        "A": {
            "hinfuehrung": "Rolle den Mantel ab. Es entsteht ein Rechteck.",
            "erklaerung": [
                "Der Mantel ist die Fläche rundherum.",
                "Rolle ihn auf dem Tisch aus. Er wird ein Rechteck.",
                "Die eine Seite ist der Umfang der Grundfläche.",
                "Die andere Seite ist die Höhe.",
                "Nimm den Umfang mal die Höhe.",
                "Der Mantel ist eine Fläche. Die Einheit ist deshalb cm².",
            ],
            "beispiel": {
                "titel": "Umfang mal Höhe",
                "aufgabe": "Die Grundfläche ist ein Dreieck mit 3, 4 und 5 cm. Die Höhe ist 10 cm. Wie groß ist der Mantel?",
                "schritte": [
                    "Umfang = 3 + 4 + 5 = 12 cm",
                    "Mantel = Umfang · h = 12 · 10",
                    "Mantel = 120 cm²",
                ],
                "ergebnis": "Mantel = 120 cm².",
                "luecke": {"schritt": 2, "wert": 120, "einheit": "cm²"},
            },
        },
        "B": {
            "hinfuehrung": "Die ganze Oberfläche eines Prismas sind die beiden Grundflächen plus der Mantel rundherum.",
            "erklaerung": [
                "O = 2 · Grundfläche + Mantel.",
                "Berechne die Grundfläche, verdopple sie, addiere den Mantel (Umfang · Höhe).",
                "Der Faktor 2 zählt Boden und Deckel. Bei einem oben offenen Behälter fällt einer davon weg — die Formel gilt für den geschlossenen Körper und ist im Sachzusammenhang jedes Mal zu prüfen.",
                "Achte darauf, dass in der Grundfläche und im Umfang zwei verschiedene Größen desselben Dreiecks stecken: Für die Fläche brauchst du Grundseite und Dreieckshöhe, für den Umfang alle drei Seiten. Beides kommt in derselben Aufgabe vor und wird gern vertauscht.",
            ],
            "beispiel": {
                "titel": "Zwei Grundflächen plus Mantel",
                "aufgabe": "Dreieck: g = 4, h_d = 3, Seiten 3/4/5, Länge h = 10 cm. Oberfläche?",
                "schritte": [
                    "Grundfläche mit g und h_d: G = (4 · 3) : 2 = 6 cm²  →  2 · G = 12 cm²",
                    "Umfang mit allen drei Seiten: U = 3 + 4 + 5 = 12 cm",
                    "Mantel = U · h = 12 · 10 = 120 cm²",
                    "O = 12 + 120 = 132 cm²",
                    "Beachte: Für die Fläche zählten g und h_d, für den Umfang die drei Seitenlängen.",
                ],
                "ergebnis": "O = 132 cm². Dieselbe Aufgabe braucht vom Dreieck zweierlei — Fläche und Umfang.",
            },
        },
        "C": {
            "hinfuehrung": "Manchmal fehlt eine Dreiecksseite für den Umfang. Im rechtwinkligen Dreieck hilft der Satz des Pythagoras.",
            "erklaerung": [
                "Im rechtwinkligen Dreieck gilt a² + b² = c² (c = längste Seite, Hypotenuse).",
                "Fehlt die Hypotenuse: c = √(a² + b²). Fehlt eine Kathete: a = √(c² − b²). Danach den Umfang bilden.",
                "Die beiden Fälle unterscheiden sich im Vorzeichen unter der Wurzel, und die Regel dafür ist einfach: Die Hypotenuse ist immer die längste Seite. Suchst du sie, wird addiert; suchst du eine Kathete, wird das Kleinere vom Größeren abgezogen.",
                "Der Satz gilt ausschließlich im rechtwinkligen Dreieck. Steht kein rechter Winkel in der Zeichnung oder im Text, darf er nicht angewendet werden — auch dann nicht, wenn es passen würde.",
                "Prüfe das Ergebnis auf Plausibilität: Die berechnete Hypotenuse muss länger sein als jede Kathete, aber kürzer als beide zusammen. Bei 6 und 8 muss sie also zwischen 8 und 14 liegen.",
            ],
            "beispiel": {
                "titel": "Fehlende Seite mit Pythagoras, dann der Umfang",
                "aufgabe": "Rechtwinkliges Dreieck mit Katheten 6 und 8 cm. Wie lang ist die dritte Seite?",
                "schritte": [
                    "Gesucht ist die Hypotenuse, also wird addiert:",
                    "c² = 6² + 8² = 36 + 64 = 100",
                    "c = √100 = 10 cm",
                    "Plausibilität: 10 cm ist länger als 8 cm und kürzer als 6 + 8 = 14 cm  ✓",
                    "Für den Umfang stünden nun alle drei Seiten bereit: 6 + 8 + 10 = 24 cm",
                ],
                "ergebnis": "Die dritte Seite ist 10 cm lang. Erst mit ihr lässt sich der Umfang bilden und daraus der Mantel berechnen.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-09": {
        "A": {
            "hinfuehrung": "Der Zylinder hat einen Kreis als Grundfläche.",
            "erklaerung": [
                "Ein Zylinder ist ein Stapel aus gleichen Kreisen.",
                "Deshalb rechnest du auch hier Grundfläche mal Höhe.",
                "Die Kreisfläche ist A = π · r².",
                "π ist eine feste Zahl. Sie ist ungefähr 3,14.",
                "Nimm die Kreisfläche dann mal die Höhe.",
                "Der Radius r geht von der Mitte bis zum Rand.",
            ],
            "beispiel": {
                "titel": "Kreisfläche mal Höhe",
                "aufgabe": "Ein Zylinder hat r = 5 cm und h = 10 cm. Volumen mit π ≈ 3,14?",
                "schritte": [
                    "A = π · r² = 3,14 · 25 = 78,5 cm²",
                    "V = A · h = 78,5 · 10",
                    "V = 785 cm³",
                ],
                "ergebnis": "V ≈ 785 cm³.",
                "luecke": {"schritt": 2, "wert": 785, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "In der Formel steht der Radius. Ist nur der Durchmesser d angegeben, halbierst du ihn zuerst.",
            "erklaerung": [
                "d = 2 · r, also r = d : 2.",
                "Erst r bestimmen, dann V = π · r² · h. Häufiger Fehler: den Durchmesser statt des Radius quadrieren.",
                "Der Fehler ist deshalb so folgenreich, weil der Radius quadriert wird: Ein doppelt so großer Wert liefert nicht das doppelte, sondern das vierfache Ergebnis. Aus 602,9 cm³ würden so 2411,5 cm³.",
                "Schreibe den Halbierungsschritt als eigene Zeile auf. Wer r im Kopf bildet und gleich einsetzt, hat keine Stelle, an der der Fehler beim Nachrechnen auffallen könnte.",
            ],
            "beispiel": {
                "titel": "Erst halbieren, dann quadrieren",
                "aufgabe": "Dose mit d = 8 cm, h = 12 cm. Volumen (π ≈ 3,14)?",
                "schritte": [
                    "eigener Schritt für den Radius: r = d : 2 = 8 : 2 = 4 cm",
                    "A = 3,14 · 4² = 3,14 · 16 = 50,24 cm²",
                    "V = A · h = 50,24 · 12 ≈ 602,9 cm³",
                    "Zum Vergleich der Fehlweg: mit d² = 64 käme 2411,5 cm³ heraus — das Vierfache.",
                ],
                "ergebnis": "V ≈ 602,9 cm³. Weil der Radius quadriert wird, vervierfacht ein verwechselter Durchmesser das Ergebnis.",
            },
        },
        "C": {
            "hinfuehrung": "Bei Tanks und Behältern ist die Antwort oft in Litern gefragt. Rechne in dm, dann ist das Ergebnis direkt in Litern.",
            "erklaerung": [
                "Wandle Radius und Höhe in dm um. Das Volumen in dm³ ist gleich der Literzahl.",
                "Runde sinnvoll und prüfe die Größenordnung am Sachzusammenhang.",
                "Runde erst am Schluss. π ist eine unendliche Dezimalzahl, und wer schon die Kreisfläche stark rundet, trägt den Fehler mit der Höhe multipliziert weiter — bei großen Höhen wird daraus ein sichtbarer Betrag.",
                "Wie genau gerundet wird, entscheidet die Sache. Bei einer Regentonne sind ganze Liter angemessen; Nachkommastellen täuschen eine Genauigkeit vor, die weder die Tonne noch der Wert 3,14 hergibt.",
                "Für die Plausibilität hilft eine grobe Näherung im Kopf: Ein Zylinder fasst etwa drei Viertel des umschließenden Quaders. Bei r = 3 dm und h = 8 dm wären das rund 0,75 · 6 · 6 · 8 = 216 l — nahe am Ergebnis.",
            ],
            "beispiel": {
                "titel": "Regentonne in Litern, mit Überschlag",
                "aufgabe": "Regentonne: r = 3 dm, h = 8 dm. Wie viele Liter (π ≈ 3,14)?",
                "schritte": [
                    "Überschlag zuerst: umschließender Quader 6 · 6 · 8 = 288, davon rund drei Viertel ≈ 216 l",
                    "A = 3,14 · 3² = 3,14 · 9 = 28,26 dm²",
                    "V = A · h = 28,26 · 8 = 226,08 dm³",
                    "1 dm³ = 1 l, also 226,08 l",
                    "sinnvoll runden: rund 226 l — Nachkommastellen wären bei einer Regentonne vorgetäuschte Genauigkeit",
                ],
                "ergebnis": "V ≈ 226 l. Der Überschlag von 216 l bestätigt die Größenordnung, und gerundet wird erst am Schluss.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-10": {
        "A": {
            "hinfuehrung": "Rolle den Mantel aus. Es entsteht ein Rechteck.",
            "erklaerung": [
                "Denke an das Etikett einer Dose.",
                "Nimm es ab und lege es flach hin. Es ist ein Rechteck.",
                "Die eine Seite ist der Kreisumfang: U = 2 · π · r.",
                "Die andere Seite ist die Höhe h.",
                "Der Mantel ist also 2 · π · r · h.",
                "Deckel und Boden gehören nicht zum Mantel.",
            ],
            "beispiel": {
                "titel": "Das Etikett als Rechteck",
                "aufgabe": "Ein Zylinder hat r = 4 cm und h = 10 cm. Mantelfläche mit π ≈ 3,14?",
                "schritte": [
                    "U = 2 · 3,14 · 4 = 25,12 cm",
                    "Mantel = U · h = 25,12 · 10",
                    "Mantel = 251,2 cm²",
                ],
                "ergebnis": "Mantel ≈ 251,2 cm².",
                "luecke": {"schritt": 2, "wert": 251.2, "einheit": "cm²"},
            },
        },
        "B": {
            "hinfuehrung": "Die volle Oberfläche eines Zylinders sind Deckel und Boden (zwei Kreise) plus der Mantel rundherum.",
            "erklaerung": [
                "O = 2 · π · r² + 2 · π · r · h.",
                "Berechne die Kreisfläche, verdopple sie, addiere den Mantel.",
                "Die beiden Summanden sehen ähnlich aus und meinen Verschiedenes: Im ersten steht r², im zweiten r · h. Merke sie an ihrer Bedeutung — zwei Kreise und ein Rechteck — statt an ihrer Gestalt.",
                "Der Kreisumfang enthält r einfach, die Kreisfläche r im Quadrat. Wer das verwechselt, addiert eine Länge zu einer Fläche; die Einheitenprobe deckt das sofort auf, denn cm und cm² lassen sich nicht addieren.",
            ],
            "beispiel": {
                "titel": "Zwei Kreise plus Mantel",
                "aufgabe": "Zylinder r = 4 cm, h = 10 cm. Oberfläche (π ≈ 3,14)?",
                "schritte": [
                    "2 Kreise: 2 · π · r² = 2 · 3,14 · 16 = 100,48 cm²",
                    "Mantel: 2 · π · r · h = 2 · 3,14 · 4 · 10 = 251,2 cm²",
                    "O = 100,48 + 251,2 = 351,68 cm²",
                    "Einheitenprobe: beide Summanden stehen in cm², dürfen also addiert werden  ✓",
                ],
                "ergebnis": "O ≈ 351,7 cm². Der erste Summand trägt r², der zweite r · h — beide ergeben eine Fläche, und nur deshalb darf addiert werden.",
            },
        },
        "C": {
            "hinfuehrung": "Ein Eimer oder eine offene Dose hat keinen Deckel. Dann fehlt ein Kreis in der Oberfläche – das musst du erkennen.",
            "erklaerung": [
                "Offen oben: O = 1 Kreis (Boden) + Mantel. Ganz offen (Rohr): nur der Mantel.",
                "Lies im Text genau, welche Flächen wirklich vorhanden sind, bevor du addierst.",
                "Die Formel der Formelkarte gilt für den geschlossenen Zylinder. Sie ist deshalb kein Ersatz für das Nachdenken, sondern der Ausgangspunkt: Erst klärst du, welche Flächen der Körper wirklich hat, dann streichst du die fehlenden.",
                "Signalwörter im Text sind „offen“, „ohne Deckel“, „Rohr“ und „Rinne“. Auch die gesuchte Größe verrät etwas: Nach „Materialbedarf“ oder „lackieren“ zählen nur die tatsächlich vorhandenen Flächen.",
                "Eine grobe Kontrolle: Bei einem hohen, schmalen Gefäß macht der Mantel den weitaus größten Teil aus. Fällt ein Deckel weg, ändert sich das Ergebnis nur wenig; bei einer flachen Dose dagegen sehr deutlich.",
            ],
            "beispiel": {
                "titel": "Offener Becher — den fehlenden Deckel erkennen",
                "aufgabe": "Ein oben offener Becher: r = 3 cm, h = 8 cm. Materialfläche (π ≈ 3,14)?",
                "schritte": [
                    "Signalwort „oben offen“ → nur ein Kreis, nämlich der Boden",
                    "Boden = π · r² = 3,14 · 9 = 28,26 cm²",
                    "Mantel = 2 · π · r · h = 2 · 3,14 · 3 · 8 = 150,72 cm²",
                    "O = 28,26 + 150,72 = 178,98 cm²",
                    "Zum Vergleich mit Deckel: 178,98 + 28,26 = 207,24 cm² — der Deckel macht hier rund ein Siebtel aus.",
                ],
                "ergebnis": "O ≈ 179 cm², weil oben kein Deckel vorhanden ist. Die Formelkarte gilt für den geschlossenen Zylinder — was fehlt, entscheidet der Text.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-11": {
        "A": {
            "hinfuehrung": "Viele Körper bestehen aus einfachen Teilen.",
            "erklaerung": [
                "Schau dir den Körper genau an.",
                "Suche die einfachen Teile: Quader, Würfel, Zylinder.",
                "Zeichne eine Trennlinie zwischen den Teilen.",
                "Rechne jedes Volumen einzeln aus.",
                "Zähle am Ende alles zusammen.",
                "Alle Teile brauchen dabei dieselbe Einheit.",
            ],
            "beispiel": {
                "titel": "Zerlegen, einzeln rechnen, addieren",
                "aufgabe": "Ein Quader 4 · 4 · 2 hat einen Würfel mit a = 2 darauf. Wie groß ist das Volumen?",
                "schritte": [
                    "Quader = 4 · 4 · 2 = 32 cm³",
                    "Würfel = 2³ = 8 cm³",
                    "V = 32 + 8 = 40 cm³",
                ],
                "ergebnis": "V = 40 cm³.",
                "luecke": {"schritt": 2, "wert": 40, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "Aus dem Volumen und dem Material (Dichte) lässt sich die Masse berechnen – so schwer ist der Körper.",
            "erklaerung": [
                "Masse = Volumen · Dichte. Die Dichte steht oft in g/cm³, bei Eisen etwa 7,8 g/cm³.",
                "Achte darauf, dass Volumen und Dichte zusammenpassen (cm³ zu g/cm³).",
                "Die Dichte sagt, wie schwer ein Kubikzentimeter des Stoffes ist. Deshalb ist sie der Umrechnungsfaktor zwischen Rauminhalt und Gewicht — genau wie der Preis je Kilogramm zwischen Menge und Kosten.",
                "Die Einheiten führen die Rechnung: cm³ · g/cm³ ergibt g, weil sich cm³ herauskürzt. Wer die Einheiten mitschreibt, erkennt sofort, ob multipliziert oder dividiert werden muss.",
            ],
            "beispiel": {
                "titel": "Masse aus Volumen und Dichte",
                "aufgabe": "Ein Eisenquader hat V = 50 cm³, Dichte 7,8 g/cm³. Masse?",
                "schritte": [
                    "Masse = Volumen · Dichte",
                    "= 50 cm³ · 7,8 g/cm³",
                    "Einheiten: cm³ kürzt sich heraus, übrig bleibt g",
                    "= 390 g",
                ],
                "ergebnis": "Die Masse beträgt 390 g. Die Dichte ist der Umrechnungsfaktor zwischen Rauminhalt und Gewicht.",
            },
        },
        "C": {
            "hinfuehrung": "Bei Rohren und Bechern zählt nur das Material zwischen außen und innen. Du rechnest Außenvolumen minus Innenvolumen.",
            "erklaerung": [
                "Hohlkörper: V = V_außen − V_innen.",
                "Bei mehrschrittigen Sachaufgaben zwischendurch die Einheiten sauber wechseln und Zwischenergebnisse notieren.",
                "Der Trick ist, sich den Hohlkörper als Differenz zweier voller Körper zu denken. Man rechnet also nicht die Wand, sondern zweimal einen Zylinder — und zieht ab.",
                "Der häufigste Fehler ist, die Wanddicke für den inneren Radius zu halten. Bei außen 5 cm und 1 cm Wand ist der innere Radius 4 cm, nicht 1 cm.",
                "Ein weiterer Fehler ist, die Differenz der Radien zu quadrieren statt die Differenz der Quadrate zu bilden: 5² − 4² = 9, aber (5 − 4)² = 1. Beide Male steht eine 1 im Spiel, und die Ergebnisse liegen um den Faktor 9 auseinander.",
            ],
            "beispiel": {
                "titel": "Rohr als Differenz zweier Zylinder",
                "aufgabe": "Ein Rohr: außen r = 5 cm, innen r = 4 cm, Länge 10 cm. Materialvolumen (π ≈ 3,14)?",
                "schritte": [
                    "als Differenz zweier voller Zylinder denken:",
                    "außen = 3,14 · 5² · 10 = 3,14 · 25 · 10 = 785 cm³",
                    "innen = 3,14 · 4² · 10 = 3,14 · 16 · 10 = 502,4 cm³",
                    "V = 785 − 502,4 = 282,6 cm³",
                    "Gegenprobe mit ausgeklammertem π: 3,14 · (25 − 16) · 10 = 3,14 · 9 · 10 = 282,6  ✓",
                    "Achtung: (5 − 4)² = 1 wäre falsch — gebildet wird die Differenz der Quadrate, nicht das Quadrat der Differenz.",
                ],
                "ergebnis": "Materialvolumen ≈ 282,6 cm³. Die Gegenprobe zeigt die richtige Reihenfolge: erst quadrieren, dann subtrahieren.",
            },
        },
    },

    # ------------------------------------------------------------------
    "kp-12": {
        "A": {
            "hinfuehrung": "Lies zuerst, was gesucht ist.",
            "erklaerung": [
                "Es gibt zwei Fragen: Wie viel passt hinein? Oder wie viel Material braucht man?",
                "„fasst“, „Liter“, „passt hinein“ → Volumen.",
                "„anstreichen“, „Material“, „einwickeln“ → Oberfläche.",
                "Das Volumen bekommt eine kleine 3. Die Oberfläche bekommt eine kleine 2.",
                "An der Einheit siehst du am Ende, ob du das Richtige gerechnet hast.",
            ],
            "beispiel": {
                "titel": "Am Signalwort entscheiden",
                "aufgabe": "„Wie viel Liter fasst der Tank?“ Volumen oder Oberfläche?",
                "schritte": [
                    "Signalwort „fasst“ und die Einheit „Liter“",
                    "→ es geht um den Rauminhalt",
                ],
                "ergebnis": "Gesucht ist das Volumen. Die Antwort wird in Litern oder in cm³ stehen.",
            },
        },
        "B": {
            "hinfuehrung": "Jetzt kommen Prismen und Zylinder durcheinander. Du erkennst den Körper, wählst die Formel und rechnest sicher.",
            "erklaerung": [
                "Bestimme zuerst den Körper an seiner Grundfläche und dann, ob Volumen oder Oberfläche gefragt ist.",
                "Formeln von der Formelkarte: Prisma V = G·h, O = 2G + U·h; Zylinder V = π·r²·h, O = 2πr² + 2πrh.",
                "Prisma und Zylinder folgen demselben Bauplan. Volumen ist immer Grundfläche mal Höhe, Oberfläche immer zwei Grundflächen plus Umfang mal Höhe — beim Zylinder ist die Grundfläche eben ein Kreis.",
                "Wer das sieht, muss nicht vier Formeln behalten, sondern zwei Sätze und die Kreisformeln. Die Formelkarte liegt ohnehin daneben; entscheidend ist, die richtige Zeile zu finden.",
            ],
            "beispiel": {
                "titel": "Körper erkennen, Formel wählen",
                "aufgabe": "Zylinder r = 2 cm, h = 5 cm. Volumen (π ≈ 3,14)?",
                "schritte": [
                    "Körper: runde Grundfläche → Zylinder. Gesucht: Volumen.",
                    "Bauplan: Volumen = Grundfläche · Höhe",
                    "Grundfläche: π · r² = 3,14 · 4 = 12,56 cm²",
                    "V = 12,56 · 5 = 62,8 cm³",
                    "Einheitenprobe: cm² · cm = cm³, ein Rauminhalt  ✓",
                ],
                "ergebnis": "V = 62,8 cm³. Derselbe Bauplan „Grundfläche mal Höhe“ gilt für Prisma und Zylinder.",
            },
        },
        "C": {
            "hinfuehrung": "Auf höchstem Niveau schreibst du den Weg begründet auf und prüfst, ob das Ergebnis überhaupt plausibel ist.",
            "erklaerung": [
                "Begründe jeden Schritt kurz — welche Formel und warum — und gib die Einheiten an.",
                "Plausibilitätsprüfung: Passt die Größenordnung? Ein Getränkekasten fasst Liter, keinen Kubikmeter.",
                "Bei einer Entscheidungsfrage („mehr oder weniger als 5 Liter?“) gehört die Antwort in Worten dazu. Eine Zahl allein beantwortet die gestellte Frage nicht.",
                "Zur Plausibilität braucht es Vergleichsgrößen im Kopf: ein Glas 0,2 l, eine Flasche 1 l, ein Eimer 10 l, eine Badewanne 150 l. An ihnen erkennst du eine verrutschte Zehnerpotenz sofort.",
                "Und die Umrechnung gehört sichtbar in den Weg. Von cm³ zu Litern sind es zwei Schritte über dm³, und beide werden gern übersprungen — mit dem Faktor 1000 als Folge.",
            ],
            "beispiel": {
                "titel": "Rechnen, umrechnen, entscheiden",
                "aufgabe": "Fasst ein Zylinder mit r = 10 cm, h = 20 cm mehr oder weniger als 5 Liter? (π ≈ 3,14)",
                "schritte": [
                    "Formel begründen: Zylinder, gesucht ist der Rauminhalt → V = π · r² · h",
                    "V = 3,14 · 10² · 20 = 3,14 · 100 · 20 = 6280 cm³",
                    "umrechnen, sichtbar: 6280 cm³ : 1000 = 6,28 dm³",
                    "1 dm³ = 1 l, also 6,28 l",
                    "vergleichen: 6,28 l > 5 l",
                    "Plausibilität: ein Eimer fasst rund 10 l, dieser Zylinder etwas weniger  ✓",
                ],
                "ergebnis": "Er fasst mehr als 5 Liter, nämlich rund 6,3 l. Verlangt war eine Entscheidung — die Zahl allein wäre keine Antwort auf die Frage.",
            },
        },
    },
}
