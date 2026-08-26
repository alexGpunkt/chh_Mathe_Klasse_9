# -*- coding: utf-8 -*-
"""SK · Spitzkoerper: Pyramide, Kegel, Kugel (12 Einheiten)

Siehe erarbeitung_bauen.py zur Begruendung.

Der rote Faden dieser Reihe sind zwei Stolperstellen, und sie erklaeren
zusammen fast jeden Fehler im Aufgabenpool:

  1. Der Faktor ein Drittel. Er wird vergessen, weil die Rechnung ohne
     ihn vollstaendig aussieht - "faktor_drittel_vergessen" ist mit 30
     Vorkommen eine der haeufigsten Fehlvorstellungen des Projekts.

  2. Die zwei Hoehen. h steht senkrecht im Inneren, s liegt schraeg auf
     der Aussenflaeche. Das Volumen braucht h, die Oberflaeche braucht s.
     Wer sie vertauscht, rechnet richtig und bekommt das falsche Ergebnis.

Deshalb steht in jeder erweiterten Erklaerung dieser Reihe, WORAN man die
gebrauchte Groesse erkennt - und nicht nur, welche Formel gilt.
"""

INHALTE = {

    # ------------------------------------------------------------------
    "sk-01": {
        "A": {
            "hinfuehrung": "Die Pyramide läuft oben in einer Spitze zusammen.",
            "erklaerung": [
                "Unten liegt die Grundfläche. Oft ist sie ein Quadrat.",
                "Eine Seite der Grundfläche ist die Grundkante a.",
                "An jeder Grundkante hängt ein Dreieck. Diese Dreiecke laufen nach oben.",
                "Oben treffen sich alle Dreiecke in einem Punkt. Das ist die Spitze.",
                "Die Höhe h geht von der Spitze senkrecht nach unten zur Mitte.",
            ],
            "beispiel": {
                "titel": "Die vier Teile benennen",
                "aufgabe": "Benenne die vier Teile der Pyramide.",
                "schritte": [
                    "Spitze: der oberste Punkt",
                    "Grundfläche: das Quadrat unten",
                    "Grundkante a: eine Seite des Quadrats",
                    "Höhe h: senkrecht von der Spitze zur Mitte",
                ],
                "ergebnis": "Spitze, Grundfläche, Grundkante a und Höhe h.",
            },
        },
        "B": {
            "hinfuehrung": "Zwei „Höhen“ treffen an der Spitze zusammen – die Körperhöhe h und die Seitenhöhe s. Sie zu verwechseln ist der häufigste Fehler.",
            "erklaerung": [
                "Höhe h: senkrecht durch das Innere zur Mitte der Grundfläche.",
                "Seitenhöhe s: die Höhe eines Seitendreiecks, gemessen auf der schrägen Außenfläche. s ist immer länger als h.",
                "Warum ist s länger? Weil s die schräge Verbindung ist und h die senkrechte. Beide enden an derselben Spitze, aber s legt zusätzlich den Weg von der Mitte zur Grundkante zurück — im rechtwinkligen Dreieck ist s die Hypotenuse.",
                "Die Merkregel für die Wahl: Das Volumen misst den Rauminhalt und braucht deshalb die senkrechte Höhe h. Die Oberfläche misst die Außenhaut und braucht die Seitenhöhe s, die auf dieser Haut liegt.",
            ],
            "beispiel": {
                "titel": "Welche Höhe gehört in welche Formel?",
                "aufgabe": "Welche Größe brauchst du für die Fläche eines Seitendreiecks – h oder s?",
                "schritte": [
                    "Das Seitendreieck liegt auf der schrägen Außenfläche.",
                    "Seine Höhe muss deshalb ebenfalls auf dieser Fläche liegen.",
                    "Das ist die Seitenhöhe s, nicht die Körperhöhe h.",
                    "Kontrolle: Mit h käme eine zu kleine Fläche heraus, denn h < s.",
                ],
                "ergebnis": "Für die Seitenfläche brauchst du die Seitenhöhe s. Die Körperhöhe h gehört ins Volumen — sie liegt im Inneren und nicht auf der Fläche, die berechnet wird.",
            },
        },
        "C": {
            "hinfuehrung": "Die Form der Grundfläche bestimmt, wie viele Seitendreiecke die Pyramide hat und wie sie aussehen.",
            "erklaerung": [
                "Jede Kante der Grundfläche trägt genau ein Seitendreieck. Ein n-Eck als Grundfläche → n Seitendreiecke.",
                "Bei regelmäßiger Grundfläche sind alle Seitendreiecke gleich; die Gesamtzahl der Flächen ist n + 1 (Grundfläche dazu).",
                "Vergleiche das mit dem Prisma: Dort waren es n + 2 Flächen, weil sich die Grundfläche oben wiederholt. Bei der Pyramide zieht sich das obere Ende zu einem einzigen Punkt zusammen — deshalb eine Fläche weniger.",
                "Auch Kanten und Ecken folgen daraus: 2n Kanten (n unten, n zur Spitze) und n + 1 Ecken (n unten, eine oben). Der Polyedersatz bestätigt es: (n + 1) − 2n + (n + 1) = 2  ✓",
                "Die Formel O = a² + 2 · a · s gilt nur für die regelmäßige quadratische Pyramide. Ist die Grundfläche kein Quadrat oder steht die Spitze nicht über der Mitte, sind die Seitendreiecke verschieden groß und müssen einzeln berechnet werden.",
            ],
            "beispiel": {
                "titel": "Flächenzahl herleiten und mit dem Prisma vergleichen",
                "aufgabe": "Wie viele Flächen hat eine Pyramide mit sechseckiger Grundfläche? Vergleiche mit dem Sechseck-Prisma.",
                "schritte": [
                    "n = 6 Grundkanten, also 6 Seitendreiecke",
                    "dazu die Grundfläche: Flächen = 6 + 1 = 7",
                    "Kanten = 2n = 12, Ecken = n + 1 = 7",
                    "Kontrolle mit dem Polyedersatz: 7 − 12 + 7 = 2  ✓",
                    "Vergleich: Das Sechseck-Prisma hat 8 Flächen. Die Pyramide hat eine weniger, weil ihr oberes Ende ein Punkt statt einer Fläche ist.",
                ],
                "ergebnis": "7 Flächen, nämlich 6 Dreiecke und die Grundfläche. Der Unterschied zum Prisma ist genau die fehlende zweite Grundfläche.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-02": {
        "A": {
            "hinfuehrung": "In der Pyramide steckt ein rechtwinkliges Dreieck.",
            "erklaerung": [
                "Schneide die Pyramide in der Mitte auf.",
                "Die Höhe h steht senkrecht in der Mitte.",
                "Daneben liegt die halbe Grundkante a : 2.",
                "Zwischen h und a : 2 ist ein rechter Winkel.",
                "Die Seitenhöhe s ist die schräge Seite. Sie ist die längste.",
            ],
            "beispiel": {
                "titel": "Das Dreieck in der Pyramide finden",
                "aufgabe": "Welche drei Größen bilden das rechtwinklige Dreieck?",
                "schritte": [
                    "eine Kathete: die Höhe h",
                    "andere Kathete: die halbe Grundkante a : 2",
                    "Hypotenuse: die Seitenhöhe s",
                ],
                "ergebnis": "h, a : 2 und s. Der rechte Winkel liegt zwischen h und a : 2.",
            },
        },
        "B": {
            "hinfuehrung": "Kennst du Höhe und Grundkante, berechnest du die Seitenhöhe s mit dem Satz des Pythagoras.",
            "erklaerung": [
                "Im rechtwinkligen Dreieck gilt s² = h² + (a : 2)².",
                "Also s = √( h² + (a : 2)² ). Zuerst quadrieren und addieren, dann die Wurzel ziehen.",
                "Der häufigste Fehler ist, die ganze Grundkante einzusetzen statt der halben. Die Höhe trifft die Grundfläche in ihrer Mitte, also reicht das Dreieck nur bis zur Mitte der Grundkante — deshalb a : 2.",
                "Beachte auch die Reihenfolge der Rechenarten: Erst wird quadriert, dann addiert, zuletzt die Wurzel gezogen. √(16 + 9) ist 5, nicht 4 + 3 = 7 — eine Wurzel darf nicht auf die Summanden einzeln angewendet werden.",
            ],
            "beispiel": {
                "titel": "Seitenhöhe aus Höhe und Grundkante",
                "aufgabe": "Pyramide mit h = 4 cm, a = 6 cm. Berechne die Seitenhöhe s.",
                "schritte": [
                    "zuerst halbieren: a : 2 = 6 : 2 = 3 cm",
                    "s² = h² + (a:2)² = 4² + 3² = 16 + 9 = 25",
                    "s = √25 = 5 cm",
                    "Plausibilität: s = 5 cm ist länger als h = 4 cm  ✓ — die Hypotenuse ist immer die längste Seite.",
                    "Gegenprobe zum Fehlweg: Mit a = 6 statt 3 käme √52 ≈ 7,2 cm heraus.",
                ],
                "ergebnis": "s = 5 cm. Eingesetzt wird die halbe Grundkante, weil die Höhe die Grundfläche in der Mitte trifft.",
            },
        },
        "C": {
            "hinfuehrung": "Der Pythagoras lässt sich umstellen: Aus s und a bekommst du h, aus s und h die halbe Grundkante.",
            "erklaerung": [
                "Nach h umgestellt: h = √( s² − (a : 2)² ).",
                "Nach der halben Grundkante: (a : 2) = √( s² − h² ), dann mal 2 für a. Die längere Größe ist immer s (Hypotenuse).",
                "Ob addiert oder subtrahiert wird, entscheidet allein, ob die Hypotenuse gesucht oder gegeben ist. Suchst du s, wird addiert; suchst du eine Kathete, wird das Quadrat der Kathete vom Quadrat der Hypotenuse abgezogen.",
                "Steht unter der Wurzel eine negative Zahl, sind die Angaben widersprüchlich: Eine Kathete kann nicht länger sein als die Hypotenuse. Das ist keine Rechenpanne, sondern ein Hinweis, dass s und h vertauscht wurden.",
                "Beim Weg zur ganzen Grundkante folgt am Schluss noch ein Schritt: Die Wurzel liefert a : 2, gefragt ist aber meist a. Das Verdoppeln wird ebenso oft vergessen wie das Halbieren zu Beginn.",
            ],
            "beispiel": {
                "titel": "Nach der Höhe umstellen und das Vorzeichen begründen",
                "aufgabe": "Pyramide mit s = 13 cm, a = 10 cm. Berechne die Höhe h.",
                "schritte": [
                    "gesucht ist eine Kathete, also wird subtrahiert",
                    "a : 2 = 10 : 2 = 5 cm",
                    "h² = s² − (a:2)² = 13² − 5² = 169 − 25 = 144",
                    "h = √144 = 12 cm",
                    "Plausibilität: h = 12 cm ist kürzer als s = 13 cm  ✓",
                    "Probe vorwärts: √(12² + 5²) = √169 = 13 cm  ✓",
                ],
                "ergebnis": "h = 12 cm. Subtrahiert wird, weil eine Kathete gesucht ist — die Hypotenuse s ist gegeben und stets die längste Seite.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-03": {
        "A": {
            "hinfuehrung": "Die Pyramide fasst ein Drittel vom Prisma.",
            "erklaerung": [
                "Ein Prisma und eine Pyramide können gleich aussehen. Unten dieselbe Fläche, oben dieselbe Höhe.",
                "Trotzdem passt in die Pyramide weniger hinein.",
                "Genau dreimal die Pyramide füllt das Prisma.",
                "Rechne deshalb erst die Grundfläche mal die Höhe.",
                "Teile das Ergebnis danach durch 3.",
            ],
            "beispiel": {
                "titel": "Erst wie ein Prisma, dann durch 3",
                "aufgabe": "Eine Pyramide hat G = 30 cm² und h = 6 cm. Wie groß ist das Volumen?",
                "schritte": [
                    "V = (G · h) : 3",
                    "V = (30 · 6) : 3 = 180 : 3",
                    "V = 60 cm³",
                ],
                "ergebnis": "V = 60 cm³. Ein Prisma mit denselben Maßen fasste 180 cm³.",
                "luecke": {"schritt": 2, "wert": 60, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "Bei einer quadratischen Pyramide berechnest du zuerst die Grundfläche a² und setzt sie in die Volumenformel ein.",
            "erklaerung": [
                "Grundfläche: G = a · a = a².",
                "Volumen: V = (a² · h) : 3.",
                "Teile zum Schluss durch 3. Dieser Schritt wird am häufigsten vergessen, weil die Rechnung auch ohne ihn fertig aussieht — im Aufgabenpool ist das mit Abstand der häufigste Fehler.",
                "Eingesetzt wird die Körperhöhe h, nie die Seitenhöhe s. Steht in der Aufgabe nur s, musst du h erst mit dem Satz des Pythagoras bestimmen; s einzusetzen liefert ein zu großes Volumen.",
                "Eine schnelle Kontrolle: Das Ergebnis muss deutlich kleiner sein als a² · h, nämlich genau ein Drittel davon. Wer im Kopf durch drei teilt, merkt einen vergessenen Schritt sofort.",
            ],
            "beispiel": {
                "titel": "Grundfläche, Volumen, Drittel",
                "aufgabe": "Quadratische Pyramide: a = 6 cm, h = 10 cm. Volumen?",
                "schritte": [
                    "Grundfläche: G = a² = 6² = 36 cm²",
                    "wie ein Prisma: 36 · 10 = 360 cm³",
                    "der entscheidende Schritt: V = 360 : 3",
                    "V = 120 cm³",
                    "Kontrolle: Eingesetzt wurde h = 10, die Körperhöhe — nicht die Seitenhöhe  ✓",
                ],
                "ergebnis": "V = 120 cm³. Ohne das Teilen durch 3 stünde hier 360 cm³ — dreimal zu viel.",
            },
        },
        "C": {
            "hinfuehrung": "Der Faktor ⅓ hat eine anschauliche Bedeutung: Drei gleiche Pyramiden füllen genau ein Prisma.",
            "erklaerung": [
                "Bei Sachaufgaben zu Zelt, Dach oder Spitze zuerst Grundfläche und Höhe klären, dann V = (G · h) : 3.",
                "Vergleich: Prisma V = G · h, Pyramide V = (G · h) : 3 – die Pyramide fasst genau ein Drittel.",
                "Das Drittel ist kein Näherungswert und keine Faustregel, sondern exakt. Ein Würfel lässt sich in genau drei deckungsgleiche Pyramiden zerlegen, deren gemeinsame Spitze in einer Würfelecke liegt — daher der Faktor.",
                "Er gilt für jede Grundflächenform, also auch für Kegel und Zylinder. Wer das einmal verstanden hat, muss sich nicht zwei Formeln merken, sondern eine Regel: Spitzkörper fassen ein Drittel des Säulenkörpers mit gleicher Grundfläche und Höhe.",
                "Für Überschläge ist der Faktor nützlich: Ein Zelt mit einer Grundfläche von 4 m² und 3 m Höhe fasst rund 4 m³ — deutlich weniger, als die 12 m³ des umschließenden Quaders vermuten lassen.",
            ],
            "beispiel": {
                "titel": "Prisma und Pyramide im Verhältnis 3 : 1",
                "aufgabe": "Ein Prisma und eine Pyramide haben G = 24 cm², h = 9 cm. Wie viel fasst jede?",
                "schritte": [
                    "Prisma: V = G · h = 24 · 9 = 216 cm³",
                    "Pyramide: V = (G · h) : 3 = 216 : 3 = 72 cm³",
                    "Verhältnis: 216 : 72 = 3 : 1",
                    "Deutung: Drei solche Pyramiden füllen dieses Prisma restlos aus.",
                    "Dieselbe Regel gilt für Kegel und Zylinder — nur die Grundflächenform wechselt.",
                ],
                "ergebnis": "Prisma 216 cm³, Pyramide 72 cm³ — genau ein Drittel. Der Faktor ist exakt und gilt für jede Grundflächenform.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-04": {
        "A": {
            "hinfuehrung": "Jede Seitenfläche der Pyramide ist ein Dreieck.",
            "erklaerung": [
                "Die Grundseite des Dreiecks ist die Grundkante a.",
                "Die Höhe in diesem Dreieck ist die Seitenhöhe s.",
                "Ein Dreieck ist ein halbes Rechteck.",
                "Deshalb rechnest du (a · s) : 2.",
                "Bei einer quadratischen Pyramide gibt es vier solche Dreiecke.",
            ],
            "beispiel": {
                "titel": "Ein Seitendreieck berechnen",
                "aufgabe": "Ein Seitendreieck hat a = 6 cm und s = 5 cm. Wie groß ist die Fläche?",
                "schritte": [
                    "Fläche = (a · s) : 2",
                    "= (6 · 5) : 2 = 30 : 2",
                    "= 15 cm²",
                ],
                "ergebnis": "Ein Seitendreieck hat 15 cm². Alle vier zusammen sind 60 cm².",
                "luecke": {"schritt": 2, "wert": 15, "einheit": "cm²"},
            },
        },
        "B": {
            "hinfuehrung": "Die Oberfläche der quadratischen Pyramide sind das Grundquadrat und die vier gleichen Seitendreiecke.",
            "erklaerung": [
                "Mantel = 4 · (a · s) : 2 = 2 · a · s.",
                "Oberfläche O = a² + 2 · a · s (Grundfläche plus Mantel).",
                "Die Kurzform 2 · a · s entsteht durch Kürzen: vier Dreiecke, jedes halb so groß wie a · s, ergeben zusammen zweimal a · s. Beide Schreibweisen liefern dasselbe — die kurze spart einen Rechenschritt.",
                "Anders als beim Prisma steht hier nur EINE Grundfläche in der Formel. Eine Pyramide hat keinen Deckel, sondern eine Spitze; ein Faktor 2 vor dem a² wäre der zweithäufigste Fehler dieser Einheit.",
            ],
            "beispiel": {
                "titel": "Grundfläche plus vier Dreiecke",
                "aufgabe": "Quadratische Pyramide: a = 6 cm, s = 5 cm. Oberfläche?",
                "schritte": [
                    "Grundfläche: a² = 6² = 36 cm²   (nur einmal, die Pyramide hat keinen Deckel)",
                    "ein Dreieck: (6 · 5) : 2 = 15 cm²",
                    "Mantel: 4 · 15 = 60 cm², kurz 2 · a · s = 2 · 6 · 5 = 60 cm²  ✓",
                    "O = 36 + 60 = 96 cm²",
                ],
                "ergebnis": "O = 96 cm². Beide Wege zum Mantel — vier Dreiecke einzeln oder 2 · a · s — führen zur selben Zahl.",
            },
        },
        "C": {
            "hinfuehrung": "Oft ist s nicht gegeben, sondern nur h und a. Dann berechnest du zuerst s mit Pythagoras und danach die Oberfläche.",
            "erklaerung": [
                "Seitenhöhe: s = √( h² + (a : 2)² ).",
                "Dann O = a² + 2 · a · s. Zwei Schritte, sauber getrennt.",
                "Die Reihenfolge ist zwingend und nicht bloß bequem: Ohne s lässt sich der Mantel nicht berechnen, und h darf an dieser Stelle nicht ersatzweise eingesetzt werden. Weil h kleiner ist als s, käme eine zu kleine Oberfläche heraus.",
                "Schreibe s als eigenes Zwischenergebnis mit Einheit auf. Bei Aufgaben mit zwei Schritten ist das die Stelle, an der sich beim Nachrechnen zeigt, ob der Fehler im Pythagoras oder in der Oberflächenformel steckt.",
                "Zur Kontrolle taugt die Größenordnung: Der Mantel einer flachen Pyramide ist nur wenig größer als die Grundfläche, bei einer spitzen deutlich größer. Ist der Mantel kleiner als die Grundfläche, wurde h statt s eingesetzt.",
            ],
            "beispiel": {
                "titel": "Erst Pythagoras, dann Oberfläche",
                "aufgabe": "Pyramide mit a = 6 cm, h = 4 cm. Berechne die Oberfläche.",
                "schritte": [
                    "Schritt 1, Seitenhöhe: a : 2 = 3 cm",
                    "s = √(4² + 3²) = √(16 + 9) = √25 = 5 cm     ← Zwischenergebnis mit Einheit",
                    "Schritt 2, Oberfläche mit s:",
                    "Mantel = 2 · a · s = 2 · 6 · 5 = 60 cm²",
                    "O = a² + Mantel = 36 + 60 = 96 cm²",
                    "Kontrolle: Der Mantel (60) ist größer als die Grundfläche (36)  ✓ — mit h = 4 statt s = 5 wären es nur 48 gewesen.",
                ],
                "ergebnis": "O = 96 cm². Das Zwischenergebnis s = 5 cm gehört sichtbar in den Rechenweg — dort entscheidet sich, ob die Oberfläche stimmt.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-05": {
        "A": {
            "hinfuehrung": "Lies zuerst, was gesucht ist.",
            "erklaerung": [
                "Es gibt wieder zwei Fragen: Wie viel passt hinein? Oder wie viel Material braucht man?",
                "„passt hinein“ oder „Liter“ → Volumen: V = (a² · h) : 3.",
                "„Material“ oder „anstreichen“ → Oberfläche: O = a² + 2 · a · s.",
                "Das Volumen braucht die Höhe h. Die Oberfläche braucht die Seitenhöhe s.",
                "Deshalb sagt dir die Frage auch, welche Höhe du brauchst.",
            ],
            "beispiel": {
                "titel": "Signalwort und Höhe zugleich bestimmen",
                "aufgabe": "„Wie viel Sand passt in die Pyramide?“ Welche Formel?",
                "schritte": [
                    "Signalwort „passt hinein“ → Rauminhalt",
                    "also Volumen",
                    "Volumen braucht die Höhe h",
                ],
                "ergebnis": "Volumen: V = (a² · h) : 3. Gebraucht wird die Höhe h, nicht die Seitenhöhe s.",
            },
        },
        "B": {
            "hinfuehrung": "Ist das Volumen gegeben und eine Kante gesucht, stellst du die Formel um.",
            "erklaerung": [
                "Aus V = (a² · h) : 3 folgt h = 3 · V : a² oder a = √(3 · V : h).",
                "Setze die bekannten Werte ein und ziehe – falls nötig – die Wurzel.",
                "Die 3 wandert beim Umstellen auf die andere Seite und wird dort zum Faktor. Das ist die Umkehrung des Teilens durch 3, und wer sie vergisst, bekommt ein Ergebnis, das um den Faktor 3 danebenliegt.",
                "Bei der Grundkante kommt eine Wurzel dazu, weil a in der Formel quadriert vorkommt. Erst 3 · V : h ausrechnen, dann die Wurzel ziehen — die Reihenfolge ist nicht vertauschbar.",
                "Die Probe ist hier besonders billig: Setze das Ergebnis in die Ausgangsformel ein. Kommt das gegebene Volumen heraus, war die Umstellung richtig.",
            ],
            "beispiel": {
                "titel": "Volumenformel nach der Höhe umstellen",
                "aufgabe": "Pyramide mit V = 100 cm³, a = 5 cm. Berechne die Höhe h.",
                "schritte": [
                    "Ausgangsformel: V = (a² · h) : 3     | · 3",
                    "3 · V = a² · h                       | : a²",
                    "h = 3 · V : a²",
                    "einsetzen: h = 3 · 100 : 25 = 300 : 25 = 12 cm",
                    "Probe: (5² · 12) : 3 = 300 : 3 = 100 cm³  ✓",
                ],
                "ergebnis": "h = 12 cm. Die 3 wird beim Umstellen zum Faktor — ohne sie käme 4 cm heraus, ein Drittel des richtigen Werts.",
            },
        },
        "C": {
            "hinfuehrung": "Anspruchsvolle Aufgaben verketten mehrere Schritte: erst Pythagoras, dann Fläche, dann Volumen oder Oberfläche.",
            "erklaerung": [
                "Plane die Reihenfolge: Welche Größe brauche ich zuerst? Häufig s aus h und a, danach die Oberfläche.",
                "Halte Zwischenergebnisse mit Einheit fest und schreibe zu jedem Schritt eine kurze Begründung.",
                "Die Planung beginnt am Ziel und arbeitet rückwärts: Gesucht ist die Oberfläche, dafür braucht es s, dafür h und a — und beide sind gegeben. So findest du die Reihenfolge, ohne zu probieren.",
                "Ein häufiger Umweg entsteht, wenn man mitten in der Rechnung merkt, dass eine Größe fehlt. Wer vorher plant, bemerkt das, solange das Blatt noch leer ist.",
                "Zwischenergebnisse ohne Einheit sind der zweite Stolperstein. In einer Aufgabe stehen Längen in cm, Flächen in cm² und Rauminhalte in cm³ nebeneinander — die Einheit unterscheidet sie zuverlässiger als die Zahl.",
            ],
            "beispiel": {
                "titel": "Vom Ziel rückwärts planen",
                "aufgabe": "Pyramide: a = 10 cm, h = 12 cm. Berechne die Oberfläche.",
                "schritte": [
                    "Planung rückwärts: O braucht a und s. s braucht h und a : 2. Beide gegeben → Reihenfolge steht.",
                    "a : 2 = 5 cm",
                    "s = √(12² + 5²) = √(144 + 25) = √169 = 13 cm     ← Länge in cm",
                    "Mantel = 2 · a · s = 2 · 10 · 13 = 260 cm²        ← Fläche in cm²",
                    "O = a² + Mantel = 100 + 260 = 360 cm²",
                    "Kontrolle: Mantel größer als Grundfläche  ✓, alle Zwischenergebnisse mit passender Einheit  ✓",
                ],
                "ergebnis": "O = 360 cm². Die Planung vom Ziel her legt die Reihenfolge fest, bevor die erste Zahl geschrieben wird.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-06": {
        "A": {
            "hinfuehrung": "Der Kegel hat unten einen Kreis und oben eine Spitze.",
            "erklaerung": [
                "Unten liegt der Grundkreis.",
                "Der Radius r geht von der Mitte zum Rand.",
                "Die Höhe h steht senkrecht von der Spitze zur Mitte.",
                "Die Mantellinie s läuft schräg von der Spitze zum Kreisrand.",
                "Zwischen r und h ist ein rechter Winkel. Die Mantellinie s ist die längste.",
            ],
            "beispiel": {
                "titel": "Das Dreieck im Kegel finden",
                "aufgabe": "Welche drei Größen bilden beim Kegel das rechtwinklige Dreieck?",
                "schritte": [
                    "eine Kathete: der Radius r",
                    "andere Kathete: die Höhe h",
                    "Hypotenuse: die Mantellinie s",
                ],
                "ergebnis": "r, h und s. Der rechte Winkel liegt zwischen r und h.",
            },
        },
        "B": {
            "hinfuehrung": "Wie bei der Pyramide steckt im Kegel ein rechtwinkliges Dreieck. Aus r und h berechnest du die Mantellinie s.",
            "erklaerung": [
                "Es gilt s² = r² + h².",
                "Also s = √( r² + h² ). Erst quadrieren und addieren, dann die Wurzel.",
                "Der Unterschied zur Pyramide ist nur eine Bezeichnung: Dort stand die halbe Grundkante a : 2, hier steht der Radius r. Beide messen dasselbe — den Weg von der Mitte der Grundfläche zu ihrem Rand.",
                "Halbiert wird deshalb auch hier, sobald statt des Radius der Durchmesser gegeben ist. Mit d statt r wäre die Mantellinie erheblich zu groß.",
                "Auch die Reihenfolge der Rechenarten gilt unverändert: erst quadrieren, dann addieren, zuletzt die Wurzel. √(9 + 16) ist 5 und nicht 3 + 4 = 7.",
            ],
            "beispiel": {
                "titel": "Mantellinie aus Radius und Höhe",
                "aufgabe": "Kegel mit r = 3 cm, h = 4 cm. Berechne die Mantellinie s.",
                "schritte": [
                    "s² = r² + h² = 3² + 4² = 9 + 16 = 25",
                    "s = √25",
                    "s = 5 cm",
                    "Plausibilität: s = 5 cm ist länger als r = 3 cm und länger als h = 4 cm  ✓",
                ],
                "ergebnis": "s = 5 cm. Der Radius spielt hier dieselbe Rolle wie die halbe Grundkante bei der Pyramide.",
            },
        },
        "C": {
            "hinfuehrung": "Die Beziehung s² = r² + h² lässt sich nach jeder Größe umstellen – so findest du auch r oder h.",
            "erklaerung": [
                "Nach der Höhe: h = √( s² − r² ). Nach dem Radius: r = √( s² − h² ).",
                "s ist immer die längste Größe (Hypotenuse); unter der Wurzel steht das Große minus das Kleine.",
                "Damit gilt für den Kegel wörtlich dieselbe Regel wie für die Pyramide: Ist die Hypotenuse gesucht, wird addiert; ist eine Kathete gesucht, wird subtrahiert. Nur die Buchstaben unterscheiden sich.",
                "Ein negativer Radikand ist auch hier ein Hinweis und kein Rechenfehler: Er bedeutet, dass die angegebene Mantellinie kürzer wäre als der Radius — ein Kegel, den es nicht gibt.",
                "Und der Grenzfall lohnt einen Gedanken: Wird h immer kleiner, nähert sich s dem Radius r an, und der Kegel wird flach. Wird h sehr groß, ist s kaum noch länger als h, und der Kegel wird spitz und schlank.",
            ],
            "beispiel": {
                "titel": "Höhe aus Mantellinie und Radius",
                "aufgabe": "Kegel mit s = 13 cm, r = 5 cm. Berechne die Höhe h.",
                "schritte": [
                    "gesucht ist eine Kathete, also wird subtrahiert",
                    "h² = s² − r² = 13² − 5² = 169 − 25 = 144",
                    "h = √144",
                    "h = 12 cm",
                    "Plausibilität: h = 12 cm ist kürzer als s = 13 cm  ✓",
                    "Probe vorwärts: √(5² + 12²) = √169 = 13 cm  ✓",
                ],
                "ergebnis": "h = 12 cm. Es ist dieselbe Regel wie bei der Pyramide — nur heißt die zweite Kathete hier r statt a : 2.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-07": {
        "A": {
            "hinfuehrung": "Der Kegel fasst ein Drittel vom Zylinder.",
            "erklaerung": [
                "Ein Zylinder und ein Kegel können gleich aussehen. Unten derselbe Kreis, oben dieselbe Höhe.",
                "Trotzdem passt in den Kegel weniger hinein.",
                "Genau dreimal der Kegel füllt den Zylinder.",
                "Rechne zuerst die Kreisfläche mal die Höhe.",
                "Teile das Ergebnis danach durch 3.",
            ],
            "beispiel": {
                "titel": "Erst wie ein Zylinder, dann durch 3",
                "aufgabe": "Ein Kegel hat r = 3 cm und h = 10 cm. Volumen mit π ≈ 3,14?",
                "schritte": [
                    "π · r² = 3,14 · 9 = 28,26",
                    "· h = 28,26 · 10 = 282,6",
                    "V = 282,6 : 3 = 94,2 cm³",
                ],
                "ergebnis": "V ≈ 94,2 cm³. Ein Zylinder mit denselben Maßen fasste 282,6 cm³.",
                "luecke": {"schritt": 2, "wert": 94.2, "einheit": "cm³"},
            },
        },
        "B": {
            "hinfuehrung": "Steht statt r der Durchmesser d da, halbierst du zuerst: r = d : 2. Dann rechnest du wie gewohnt.",
            "erklaerung": [
                "r = d : 2.",
                "Dann V = (π · r² · h) : 3. Den Durchmesser zu quadrieren wäre falsch.",
                "Der Fehler wirkt sich vierfach aus, weil der Radius quadriert wird: Ein doppelt so großer Wert liefert das vierfache Ergebnis. Beim Kegel kommt das Vergessen des Drittels oft noch dazu, und dann liegt das Ergebnis um den Faktor 12 daneben.",
                "Schreibe die Halbierung als eigene Zeile. Zwei getrennte Schritte lassen sich nachrechnen; eine Rechnung, in der r nur im Kopf gebildet wurde, nicht.",
            ],
            "beispiel": {
                "titel": "Erst halbieren, dann quadrieren, dann dritteln",
                "aufgabe": "Kegel mit d = 6 cm, h = 7 cm. Volumen (π ≈ 3,14)?",
                "schritte": [
                    "eigener Schritt: r = d : 2 = 6 : 2 = 3 cm",
                    "π · r² · h = 3,14 · 9 · 7 = 197,82",
                    "V = 197,82 : 3 ≈ 65,9 cm³",
                    "Kontrolle: Beide Stolperstellen beachtet — halbiert  ✓ und gedrittelt  ✓",
                ],
                "ergebnis": "V ≈ 65,9 cm³. Zwei Schritte werden hier gern übersehen: das Halbieren am Anfang und das Teilen durch 3 am Ende.",
            },
        },
        "C": {
            "hinfuehrung": "Der Faktor ⅓ heißt anschaulich: Drei Kegel füllen genau einen Zylinder gleicher Grundfläche und Höhe.",
            "erklaerung": [
                "Für Liter in dm rechnen, denn dm³ = l.",
                "Vergleich: Zylinder V = π·r²·h, Kegel V = (π·r²·h) : 3 – der Kegel fasst ein Drittel.",
                "Es ist derselbe Faktor wie bei der Pyramide, und das ist kein Zufall: Er hängt nicht von der Form der Grundfläche ab, sondern nur davon, dass sich der Körper zu einer Spitze verjüngt.",
                "Für den Überschlag ist der Vergleich mit dem Zylinder der bequemste Weg. Wer weiß, wie viel der Zylinder fasst, teilt durch drei — das lässt sich im Kopf machen und deckt Rechenfehler zuverlässig auf.",
                "Ein anschaulicher Nebeneffekt: Eine Eiswaffel wirkt größer, als sie ist. Bei gleichem Rand fasst sie nur ein Drittel dessen, was ein Becher gleicher Höhe fassen würde.",
            ],
            "beispiel": {
                "titel": "Kegelvolumen in Litern, über den Zylinder geprüft",
                "aufgabe": "Kegel mit r = 2 dm, h = 3 dm. Volumen in Litern (π ≈ 3,14)?",
                "schritte": [
                    "Zylinder zum Vergleich: π · r² · h = 3,14 · 4 · 3 = 37,68 dm³",
                    "Kegel = ein Drittel davon: V = 37,68 : 3 = 12,56 dm³",
                    "1 dm³ = 1 l, also 12,56 l",
                    "Überschlag im Kopf: rund 38 l im Zylinder, ein Drittel sind gut 12 l  ✓",
                ],
                "ergebnis": "V ≈ 12,56 l, genau ein Drittel des Zylinders. Der Umweg über den Zylinder macht den Überschlag im Kopf möglich.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-08": {
        "A": {
            "hinfuehrung": "Für den Mantel brauchst du r und s.",
            "erklaerung": [
                "Der Mantel ist die schräge Fläche außen herum.",
                "Rechne M = π · r · s.",
                "Nimm dafür die Mantellinie s.",
                "Die Höhe h ist hier falsch. Sie liegt im Inneren.",
                "Der Mantel ist eine Fläche. Die Einheit ist deshalb cm².",
                "Der Grundkreis gehört nicht zum Mantel. Er kommt erst bei der Oberfläche dazu.",
            ],
            "beispiel": {
                "titel": "Mantelfläche des Kegels",
                "aufgabe": "Ein Kegel hat r = 3 cm und s = 5 cm. Mantelfläche mit π ≈ 3,14?",
                "schritte": [
                    "M = π · r · s",
                    "= 3,14 · 3 · 5",
                    "= 47,1 cm²",
                ],
                "ergebnis": "M ≈ 47,1 cm². Gerechnet wurde mit s, nicht mit h.",
                "luecke": {"schritt": 2, "wert": 47.1, "einheit": "cm²"},
            },
        },
        "B": {
            "hinfuehrung": "Die ganze Oberfläche des Kegels sind der Grundkreis und der Mantel zusammen.",
            "erklaerung": [
                "O = π · r² + π · r · s. Ausklammern ergibt O = π · r · (r + s).",
                "Erst Grundkreis, dann Mantel, dann addieren.",
                "Wie bei der Pyramide steht nur EIN Kreis in der Formel. Ein Kegel hat keinen Deckel, sondern eine Spitze — der Faktor 2 aus der Zylinderformel gehört hier nicht hin.",
                "Die ausgeklammerte Form π · r · (r + s) ist dieselbe Rechnung mit einer Multiplikation weniger. Beide Schreibweisen sind richtig; die ausführliche zeigt deutlicher, welcher Summand welche Fläche ist.",
                "Im ersten Summanden steht r², im zweiten r · s. Beide ergeben eine Fläche, und nur deshalb dürfen sie addiert werden — die Einheitenprobe bestätigt es.",
            ],
            "beispiel": {
                "titel": "Grundkreis plus Mantel",
                "aufgabe": "Kegel mit r = 3 cm, s = 5 cm. Oberfläche (π ≈ 3,14)?",
                "schritte": [
                    "Grundkreis: π · r² = 3,14 · 3² = 28,26 cm²   (nur einer, der Kegel hat keinen Deckel)",
                    "Mantel: π · r · s = 3,14 · 3 · 5 = 47,1 cm²",
                    "O = 28,26 + 47,1 = 75,36 cm²",
                    "Gegenprobe mit der Kurzform: π · r · (r + s) = 3,14 · 3 · 8 = 75,36 cm²  ✓",
                ],
                "ergebnis": "O ≈ 75,36 cm². Beide Schreibweisen liefern dasselbe — die Kurzform spart eine Multiplikation.",
            },
        },
        "C": {
            "hinfuehrung": "Ist nur r und h gegeben, berechnest du zuerst die Mantellinie s und danach die Oberfläche.",
            "erklaerung": [
                "s = √( r² + h² ).",
                "Dann O = π · r · (r + s). Wieder zwei saubere Schritte.",
                "Es ist derselbe Ablauf wie bei der Pyramide: erst die schräge Größe mit Pythagoras, dann die Oberfläche mit dieser Größe. Wer den Ablauf einmal kann, kann ihn für beide Körper.",
                "Die Höhe h taucht in der Oberflächenformel überhaupt nicht auf. Sie wird ausschließlich gebraucht, um s zu bestimmen — danach wird sie nicht mehr benötigt, und das ist die beste Kontrolle gegen ein Vertauschen.",
                "Umgekehrt kommt s im Volumen nicht vor. Volumen und Oberfläche brauchen jeweils genau eine der beiden Größen, und welche das ist, entscheidet die Frage der Aufgabe.",
            ],
            "beispiel": {
                "titel": "Erst Mantellinie, dann Oberfläche",
                "aufgabe": "Kegel mit r = 6 cm, h = 8 cm. Oberfläche (π ≈ 3,14)?",
                "schritte": [
                    "Schritt 1, Mantellinie mit Pythagoras:",
                    "s = √(6² + 8²) = √(36 + 64) = √100 = 10 cm     ← Zwischenergebnis",
                    "Schritt 2, Oberfläche mit s — h wird jetzt nicht mehr gebraucht:",
                    "O = π · r · (r + s) = 3,14 · 6 · (6 + 10)",
                    "O = 3,14 · 6 · 16 = 301,44 cm²",
                    "Kontrolle: In der Oberflächenformel steht kein h  ✓",
                ],
                "ergebnis": "O ≈ 301,44 cm². Die Höhe h diente nur der Berechnung von s und kommt in der Oberflächenformel nicht mehr vor.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-09": {
        "A": {
            "hinfuehrung": "Lies zuerst, was gesucht ist.",
            "erklaerung": [
                "Auch beim Kegel gibt es die zwei Fragen.",
                "„passt hinein“ oder „Liter“ → Volumen: V = (π · r² · h) : 3.",
                "„Material“ oder „anstreichen“ → Oberfläche: O = π · r · (r + s).",
                "Das Volumen braucht die Höhe h. Die Oberfläche braucht die Mantellinie s.",
                "Die Frage sagt dir also auch, welche der beiden Größen du brauchst.",
            ],
            "beispiel": {
                "titel": "Signalwort und benötigte Größe",
                "aufgabe": "„Wie viel Eis passt in die Waffel?“ Welche Formel?",
                "schritte": [
                    "Signalwort „passt hinein“ → Rauminhalt",
                    "also Volumen",
                    "Volumen braucht die Höhe h",
                ],
                "ergebnis": "Volumen: V = (π · r² · h) : 3. Gebraucht wird h, nicht die Mantellinie s.",
            },
        },
        "B": {
            "hinfuehrung": "Ist das Volumen gegeben und die Höhe gesucht, stellst du die Volumenformel nach h um.",
            "erklaerung": [
                "Aus V = (π · r² · h) : 3 folgt h = 3 · V : (π · r²).",
                "Erst π · r² ausrechnen, dann 3 · V dadurch teilen.",
                "Die Klammer im Nenner ist wichtig: Geteilt wird durch das ganze Produkt π · r², nicht nur durch π. Wer sie im Taschenrechner vergisst, multipliziert am Ende versehentlich mit r² statt zu teilen.",
                "Der Zwischenwert π · r² hat eine Bedeutung — er ist die Grundkreisfläche. Ihn getrennt auszurechnen macht die Rechnung nicht nur sicherer, sondern auch nachvollziehbar.",
                "Die Probe kostet eine Zeile: Setze die gefundene Höhe in die Volumenformel ein und prüfe, ob das gegebene Volumen herauskommt.",
            ],
            "beispiel": {
                "titel": "Volumenformel des Kegels nach h umstellen",
                "aufgabe": "Kegel mit V = 94,2 cm³, r = 3 cm. Höhe h (π ≈ 3,14)?",
                "schritte": [
                    "Grundkreisfläche zuerst: π · r² = 3,14 · 9 = 28,26 cm²",
                    "umgestellt: h = 3 · V : (π · r²)",
                    "Zähler: 3 · 94,2 = 282,6",
                    "h = 282,6 : 28,26 = 10 cm",
                    "Probe: (3,14 · 9 · 10) : 3 = 282,6 : 3 = 94,2 cm³  ✓",
                ],
                "ergebnis": "h = 10 cm. Der getrennt berechnete Zwischenwert 28,26 cm² ist die Grundkreisfläche — und die sichere Klammer im Nenner.",
            },
        },
        "C": {
            "hinfuehrung": "Anspruchsvolle Aufgaben verlangen mehrere verkettete Schritte – etwa erst s, dann Oberfläche, oder erst r, dann Volumen.",
            "erklaerung": [
                "Plane die Reihenfolge und notiere Zwischenergebnisse mit Einheit.",
                "Prüfe am Ende die Plausibilität, also die Größenordnung im Sachzusammenhang.",
                "Bei drei verketteten Schritten hilft die Rückwärtsplanung: Gesucht ist das Volumen, dafür braucht es h, dafür s und r, und r folgt aus d. So steht die Reihenfolge fest, bevor gerechnet wird.",
                "Achte darauf, welche Größe der Pythagoras liefert. Ist s gegeben und h gesucht, wird subtrahiert; die häufigste Verwechslung an dieser Stelle ist, stattdessen zu addieren und ein zu großes h zu erhalten.",
                "Behalte am Ende die Genauigkeit im Blick: Wer zwischendurch stark rundet, trägt den Fehler durch alle folgenden Schritte. Runde erst im Ergebnis und gib an, worauf.",
            ],
            "beispiel": {
                "titel": "Drei verkettete Schritte planen",
                "aufgabe": "Kegel mit d = 6 cm, s = 5 cm. Berechne Höhe und Volumen (π ≈ 3,14).",
                "schritte": [
                    "Planung rückwärts: V braucht r und h. h braucht s und r. r folgt aus d.",
                    "Schritt 1: r = d : 2 = 3 cm",
                    "Schritt 2: h gesucht, s gegeben → subtrahieren: h = √(s² − r²) = √(25 − 9) = √16 = 4 cm",
                    "Schritt 3: V = (π · r² · h) : 3 = (3,14 · 9 · 4) : 3 = 113,04 : 3 ≈ 37,7 cm³",
                    "Kontrolle: h = 4 cm ist kürzer als s = 5 cm  ✓, und das Drittel wurde gerechnet  ✓",
                ],
                "ergebnis": "h = 4 cm, V ≈ 37,7 cm³. Die Rückwärtsplanung legt die Reihenfolge der drei Schritte fest, bevor die erste Zahl notiert wird.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-10": {
        "A": {
            "hinfuehrung": "Bei der Kugel brauchst du nur den Radius.",
            "erklaerung": [
                "Eine Kugel hat keine Ecken und keine Kanten.",
                "Sie hat auch keine Höhe. Der Radius genügt.",
                "Rechne zuerst r · r.",
                "r² heißt r · r. Es heißt nicht r · 2.",
                "Nimm das Ergebnis dann mal 4 und mal π.",
                "Die Oberfläche ist eine Fläche. Die Einheit ist deshalb cm².",
                "Ist nur der Durchmesser gegeben, halbiere ihn zuerst.",
            ],
            "beispiel": {
                "titel": "Oberfläche der Kugel",
                "aufgabe": "Eine Kugel hat r = 5 cm. Oberfläche mit π ≈ 3,14?",
                "schritte": [
                    "O = 4 · π · r²",
                    "= 4 · 3,14 · 25",
                    "= 314 cm²",
                ],
                "ergebnis": "O = 314 cm².",
                "luecke": {"schritt": 2, "wert": 314, "einheit": "cm²"},
            },
        },
        "B": {
            "hinfuehrung": "Beim Volumen kommt der Radius sogar dreimal vor: r hoch drei. Davor steht der Faktor 4/3.",
            "erklaerung": [
                "Volumen: V = 4/3 · π · r³ = (4 · π · r³) : 3.",
                "Erst r³ (r · r · r), dann mit π multiplizieren, dann · 4 : 3.",
                "Die Hochzahlen sagen, was gemeint ist: In der Oberfläche steht r², denn eine Fläche entsteht aus zwei Längen; im Volumen steht r³, denn ein Rauminhalt entsteht aus drei. Wer die Formeln verwechselt, merkt es an der Einheit.",
                "Der Faktor 4/3 ist keine Zahl, die man herleiten kann wie das Drittel beim Kegel; er muss von der Formelkarte kommen. Wichtig ist nur, ihn vollständig zu nehmen — die 4 gehört ebenso dazu wie das Teilen durch 3.",
            ],
            "beispiel": {
                "titel": "Kugelvolumen mit r hoch drei",
                "aufgabe": "Kugel mit r = 3 cm. Volumen (π ≈ 3,14)?",
                "schritte": [
                    "r³ = 3 · 3 · 3 = 27     (dreimal r, nicht r · 3)",
                    "4 · π · r³ = 4 · 3,14 · 27 = 339,12",
                    "V = 339,12 : 3 = 113,04 cm³",
                    "Einheitenprobe: r³ ergibt cm³, also ein Rauminhalt  ✓",
                ],
                "ergebnis": "V ≈ 113,04 cm³. Die Hochzahl 3 macht aus der Rechnung ein Volumen — daran unterscheidest du sie von der Oberflächenformel mit r².",
            },
        },
        "C": {
            "hinfuehrung": "Ob Ball, Murmel oder Tank: Ist nur der Durchmesser gegeben, halbiere zuerst; für Liter rechne in dm.",
            "erklaerung": [
                "r = d : 2 zuerst bestimmen.",
                "Für Liter in dm rechnen, denn dm³ = l, und am Ende sinnvoll runden.",
                "Bei der Kugel wirkt sich ein verwechselter Durchmesser noch stärker aus als beim Zylinder: Weil r hoch drei eingeht, liefert der doppelte Wert das achtfache Volumen. Der Halbierungsschritt gehört deshalb als eigene Zeile aufs Blatt.",
                "Umgekehrt bedeutet das auch: Eine Kugel mit doppeltem Radius fasst das Achtfache. Ein Ball von 20 cm Durchmesser hat achtmal so viel Volumen wie einer von 10 cm — das widerspricht der ersten Vermutung und lohnt es, gemerkt zu werden.",
                "Zur Plausibilität hilft der Vergleich mit dem umschließenden Würfel: Eine Kugel füllt gut die Hälfte davon aus. Bei d = 4 dm wären das rund die Hälfte von 64 l, also etwa 33 l.",
            ],
            "beispiel": {
                "titel": "Kugeltank in Litern, mit Überschlag",
                "aufgabe": "Kugeltank mit d = 4 dm. Volumen in Litern (π ≈ 3,14)?",
                "schritte": [
                    "eigener Schritt: r = d : 2 = 2 dm",
                    "Überschlag: umschließender Würfel 4 · 4 · 4 = 64 l, die Kugel gut die Hälfte ≈ 33 l",
                    "r³ = 2 · 2 · 2 = 8",
                    "4 · π · r³ = 4 · 3,14 · 8 = 100,48",
                    "V = 100,48 : 3 ≈ 33,5 dm³ = 33,5 l",
                    "Abgleich mit dem Überschlag  ✓",
                ],
                "ergebnis": "V ≈ 33,5 l. Der Überschlag über den umschließenden Würfel bestätigt die Größenordnung und deckt einen verwechselten Durchmesser sofort auf.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-11": {
        "A": {
            "hinfuehrung": "Eine Eistüte besteht aus zwei Teilen.",
            "erklaerung": [
                "Schau dir den Körper genau an.",
                "Suche die einfachen Körper: Kegel, Halbkugel, Zylinder.",
                "Zeichne eine Trennlinie zwischen den Teilen.",
                "Schreibe zu jedem Teil die passende Formel auf.",
                "Rechne jedes Teil einzeln und zähle am Ende alles zusammen.",
            ],
            "beispiel": {
                "titel": "Eine Eistüte zerlegen",
                "aufgabe": "Eine Eistüte ist ein Kegel mit einer Halbkugel oben. In welche Teile zerlegst du sie?",
                "schritte": [
                    "unten: Kegel → V = (π · r² · h) : 3",
                    "oben: Halbkugel → die Hälfte vom Kugelvolumen",
                    "Gesamt = Kegel + Halbkugel",
                ],
                "ergebnis": "Kegel plus Halbkugel. Beide Volumen werden einzeln berechnet und dann addiert.",
            },
        },
        "B": {
            "hinfuehrung": "Nach dem Zerlegen berechnest du jedes Teilvolumen und addierst alles zum Gesamtvolumen.",
            "erklaerung": [
                "Halbkugel = halbes Kugelvolumen = (4 · π · r³) : 3 : 2 = (2 · π · r³) : 3.",
                "Rechne die Teile getrennt und achte auf gemeinsame Einheiten.",
                "Die Kurzform entsteht durch Kürzen: Die 4 halbiert sich zu 2, der Rest bleibt stehen. Beide Wege liefern dasselbe, und wer unsicher ist, rechnet erst die ganze Kugel und halbiert danach.",
                "Häufig teilen sich die Teilkörper eine Größe — hier haben Kegel und Halbkugel denselben Radius, weil sie an derselben Kreisfläche aneinanderstoßen. Diese gemeinsame Größe steht meist nur einmal in der Aufgabe.",
            ],
            "beispiel": {
                "titel": "Zwei Teilvolumen addieren",
                "aufgabe": "Kegel (r = 3, h = 8) mit Halbkugel (r = 3) oben. Gesamtvolumen (π ≈ 3,14)?",
                "schritte": [
                    "gemeinsamer Radius r = 3 cm an der Nahtstelle",
                    "Kegel = (3,14 · 9 · 8) : 3 = 226,08 : 3 = 75,36 cm³",
                    "Halbkugel = (2 · 3,14 · 27) : 3 = 169,56 : 3 = 56,52 cm³",
                    "Gegenprobe zur Halbkugel: ganze Kugel (4 · 3,14 · 27) : 3 = 113,04, davon die Hälfte = 56,52  ✓",
                    "V = 75,36 + 56,52 = 131,88 cm³",
                ],
                "ergebnis": "V ≈ 131,88 cm³. Beide Teile teilen sich den Radius, weil sie an derselben Kreisfläche aneinanderstoßen.",
            },
        },
        "C": {
            "hinfuehrung": "Bei komplexen Aufgaben kommen Pythagoras, mehrere Körper und Einheitenwechsel zusammen. Struktur ist alles.",
            "erklaerung": [
                "Plane zuerst: Welche fehlenden Größen brauche ich, oft s oder h mit Pythagoras? Welche Teilkörper?",
                "Rechne Schritt für Schritt, halte Zwischenergebnisse fest und prüfe am Ende die Größenordnung.",
                "Bei Oberflächen zusammengesetzter Körper gilt eine zusätzliche Regel, die beim Volumen fehlt: Die Berührflächen zählen nicht mit. Wo Kegel und Halbkugel aneinanderstoßen, liegt keine Außenhaut, und der Kreis dort gehört nicht in die Oberfläche.",
                "Beim Volumen gibt es dieses Problem nicht — Rauminhalte addieren sich ohne Abzug. Genau deshalb ist die Frage „Volumen oder Oberfläche?“ bei zusammengesetzten Körpern noch wichtiger als bei einfachen.",
                "Eine Skizze mit eingetragenen Maßen ist hier keine Kür. Sie zeigt, welche Größe zu welchem Teilkörper gehört, und verhindert, dass eine Höhe versehentlich zweimal verwendet wird.",
            ],
            "beispiel": {
                "titel": "Silo aus Zylinder und Kegeldach",
                "aufgabe": "Silo: Zylinder (r = 2 m, h = 5 m) mit Kegeldach (r = 2 m, h = 1,5 m). Volumen (π ≈ 3,14)?",
                "schritte": [
                    "Zerlegung: unten Zylinder, oben Kegel, gemeinsamer Radius r = 2 m",
                    "Zylinder = π · r² · h = 3,14 · 4 · 5 = 62,8 m³",
                    "Kegel = (π · r² · h) : 3 = (3,14 · 4 · 1,5) : 3 = 18,84 : 3 = 6,28 m³",
                    "V = 62,8 + 6,28 = 69,08 m³",
                    "Beachte: Die beiden Höhen 5 m und 1,5 m gehören zu verschiedenen Teilkörpern und dürfen nicht addiert werden.",
                    "Plausibilität: Das Dach steuert wenig bei — es ist niedrig und läuft spitz zu  ✓",
                ],
                "ergebnis": "V ≈ 69,08 m³. Beim Volumen werden die Teile schlicht addiert; bei einer Oberfläche müsste die Berührfläche abgezogen werden.",
            },
        },
    },

    # ------------------------------------------------------------------
    "sk-12": {
        "A": {
            "hinfuehrung": "Erkenne zuerst den Körper.",
            "erklaerung": [
                "Schau dir an, was unten liegt und was oben ist.",
                "Eckig unten mit Spitze: Pyramide.",
                "Rund unten mit Spitze: Kegel.",
                "Überall rund und ohne Spitze: Kugel.",
                "Dann nimmst du die passende Formel von der Formelkarte.",
                "Bei Pyramide und Kegel teilst du am Ende immer durch 3.",
            ],
            "beispiel": {
                "titel": "Körper am Bild erkennen",
                "aufgabe": "Ein Körper hat einen Grundkreis und eine Spitze. Welche Volumenformel?",
                "schritte": [
                    "unten rund, oben eine Spitze",
                    "→ das ist ein Kegel",
                ],
                "ergebnis": "V = (π · r² · h) : 3.",
            },
        },
        "B": {
            "hinfuehrung": "Jetzt stehen die Spitzkörper bunt gemischt und ohne Ansage, was gefragt ist. Du erkennst Typ und Größe selbst.",
            "erklaerung": [
                "Bestimme Körper und gesuchte Größe (Volumen oder Oberfläche) und sammle die gegebenen Werte.",
                "Fehlt s oder h, hole es mit Pythagoras, bevor du die Hauptformel anwendest.",
                "Drei Kontrollen decken fast jeden Fehler dieser Reihe ab: Wurde bei Pyramide und Kegel durch 3 geteilt? Wurde ein gegebener Durchmesser halbiert? Und passt die verwendete Höhe zur Frage — h beim Volumen, s bei der Oberfläche?",
                "Die Einheit ist die vierte Kontrolle und die schnellste: Ein Volumen endet auf hoch 3, eine Oberfläche auf hoch 2. Steht die falsche Hochzahl da, wurde die falsche Formel genommen.",
            ],
            "beispiel": {
                "titel": "Körper und Größe selbst bestimmen",
                "aufgabe": "Kugel mit r = 6 cm. Oberfläche (π ≈ 3,14)?",
                "schritte": [
                    "Körper: überall rund, keine Spitze → Kugel. Gesucht: Oberfläche.",
                    "O = 4 · π · r² = 4 · 3,14 · 36",
                    "O = 452,16 cm²",
                    "Kontrollen: kein Drittel nötig (keine Spitze)  ✓, r war gegeben  ✓, Einheit cm² für eine Fläche  ✓",
                ],
                "ergebnis": "O ≈ 452,16 cm². Die Einheit cm² bestätigt, dass die Oberflächen- und nicht die Volumenformel verwendet wurde.",
            },
        },
        "C": {
            "hinfuehrung": "Auf MSA-Niveau begründest du deinen Weg schriftlich und prüfst, ob dein Ergebnis sinnvoll ist.",
            "erklaerung": [
                "Schreibe zu jedem Schritt die verwendete Formel und die Begründung; führe die Einheiten mit.",
                "Plausibilität: Vergleiche mit einem bekannten Körper — ein Kegel fasst ein Drittel des Zylinders — oder prüfe die Größenordnung.",
                "Die Operatoren geben vor, was verlangt ist. „Berechne“ will den Rechenweg, „Begründe“ will einen Grund, „Beurteile“ will ein Urteil mit Zahl. Bei einer Entscheidungsfrage ist eine Zahl allein keine vollständige Antwort.",
                "Zur Begründung gehört auch die Umrechnung, sichtbar aufgeschrieben. Von cm³ zu Litern führt der Weg über dm³, und übersprungen wird er mit dem Faktor 1000 als Folge.",
                "Als Vergleichsgrößen für die Plausibilität dienen bekannte Gefäße: ein Glas 0,2 l, eine Flasche 1 l, ein Eimer 10 l. An ihnen erkennst du eine verrutschte Zehnerpotenz sofort.",
            ],
            "beispiel": {
                "titel": "Rechnen, umrechnen, beurteilen",
                "aufgabe": "Passt in einen Kegel mit r = 5 cm und h = 12 cm mehr als ein halber Liter? (π ≈ 3,14)",
                "schritte": [
                    "Formel begründen: Kegel, gesucht ist der Rauminhalt → V = (π · r² · h) : 3",
                    "V = (3,14 · 25 · 12) : 3 = 942 : 3 = 314 cm³",
                    "umrechnen, sichtbar: 314 cm³ : 1000 = 0,314 dm³ = 0,314 l",
                    "vergleichen: 0,314 l < 0,5 l",
                    "Plausibilität: gut anderthalb Trinkgläser — für einen Kegel dieser Größe stimmig  ✓",
                ],
                "ergebnis": "Nein, es passen nur rund 0,31 l hinein — weniger als ein halber Liter. Verlangt war ein Urteil, nicht nur die Zahl.",
            },
        },
    },
}
