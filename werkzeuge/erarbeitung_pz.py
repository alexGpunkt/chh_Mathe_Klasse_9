# -*- coding: utf-8 -*-
"""PZ · Prozent- und Zinsrechnung (14 Einheiten)

Siehe erarbeitung_bauen.py zur Begruendung.

Der rote Faden dieser Reihe ist der Grundwert. Fast jeder Fehler in der
Prozentrechnung ist ein Fehler beim Grundwert: von der falschen Zahl
Prozente genommen, nach einem Rabatt vom Endpreis statt vom Startpreis
gerechnet, zwei Prozentsaetze addiert, die verschiedene Grundwerte haben.
Deshalb steht die Frage "wovon?" in jeder erweiterten Erklaerung.
"""

INHALTE = {

    # ------------------------------------------------------------------
    "pz-01": {
        "A": {
            "hinfuehrung": "Der ganze Streifen ist immer 100 %.",
            "erklaerung": [
                "Prozent heißt: von hundert. Ein Prozent ist ein Hundertstel.",
                "Stell dir den Streifen in 100 gleiche Kästchen geteilt vor. Jedes Kästchen ist 1 %.",
                "Zähle, wie viel vom Streifen gefärbt ist. So viele Kästchen sind es.",
                "Die Hälfte sind 50 Kästchen. Also 50 %.",
                "Ein Viertel sind 25 Kästchen. Also 25 %.",
            ],
            "beispiel": {
                "titel": "Von der Hälfte zum Prozentsatz",
                "aufgabe": "Der halbe Streifen ist gefärbt. Wie viel Prozent sind das?",
                "schritte": [
                    "Der ganze Streifen  = 100 %",
                    "Die Hälfte davon    = 100 % : 2",
                    "                    = 50 %",
                ],
                "ergebnis": "Die Hälfte sind 50 %.",
                "luecke": {"schritt": 2, "wert": 50, "einheit": "%"},
            },
        },
        "B": {
            "hinfuehrung": "Bruch, Dezimalzahl und Prozent sind drei Schreibweisen für denselben Anteil. Mit zwei Rechenschritten wechselst du zwischen ihnen.",
            "erklaerung": [
                "Vom Bruch zur Dezimalzahl teilst du den Zähler durch den Nenner. Der Bruchstrich ist ein Geteiltzeichen — mehr steckt nicht dahinter.",
                "Von der Dezimalzahl zum Prozentsatz nimmst du mal 100 und hängst das Prozentzeichen an. Zurück geht es geteilt durch 100.",
                "Warum gerade 100? Weil Prozent „von hundert“ heißt. 0,75 bedeutet 75 Hundertstel, und 75 Hundertstel schreibt man als 75 %. Die Zahl ändert sich nicht, nur die Schreibweise.",
                "Deshalb ist das Prozentzeichen kein Schmuck: Es ersetzt das „: 100“. Wer die 100 wegnimmt und das Zeichen trotzdem stehen lässt, hat den Wert verhundertfacht.",
            ],
            "beispiel": {
                "titel": "Drei Schreibweisen, ein Anteil",
                "aufgabe": "Schreibe 3/4 als Dezimalzahl und als Prozent.",
                "schritte": [
                    "Bruch → Dezimalzahl:   3 : 4       = 0,75",
                    "Dezimalzahl → Prozent: 0,75 · 100  = 75 %",
                    "Probe rückwärts:       75 : 100    = 0,75  ✓",
                ],
                "ergebnis": "3/4 = 0,75 = 75 % — drei Schreibweisen für denselben Anteil.",
            },
        },
        "C": {
            "hinfuehrung": "Nicht jeder Bruch ergibt eine glatte Dezimalzahl. Dann rundest du – und sagst, warum und wie weit.",
            "erklaerung": [
                "Manche Divisionen hören nicht auf (2 : 3 = 0,666…). Solche Zahlen rundest du auf so viele Stellen, wie für die Aufgabe sinnvoll sind – bei Prozent meist auf ganze oder eine Nachkommastelle.",
                "Beim Runden schaust du auf die erste weggelassene Ziffer: 0–4 abrunden, 5–9 aufrunden. Schreibe das Rundungszeichen ≈, nicht =.",
                "Die Rundung ist keine Ungenauigkeit, die man verschweigt, sondern eine Entscheidung, die man angibt. „Rund 67 %“ ist eine vollständige Antwort, „67 %“ ohne Zusatz ist eine falsche.",
                "Wie weit gerundet wird, entscheidet der Sachzusammenhang und nicht der Taschenrechner: Bei einer Klassenumfrage mit 28 Kindern sind Nachkommastellen im Prozentsatz sinnlos, weil ein einzelnes Kind schon 3,6 % ausmacht.",
                "Die Probe für eine Rundung ist die Summe: Drei gerundete Drittel ergeben 99 % statt 100 %. Genau an dieser Lücke erkennt man, dass gerundet wurde.",
            ],
            "beispiel": {
                "titel": "Runden und die Rundung begründen",
                "aufgabe": "Schreibe 2/3 als Prozent, gerundet auf ganze Prozent. Begründe, warum hier ≈ statt = steht.",
                "schritte": [
                    "2 : 3                       = 0,6666…",
                    "· 100                       = 66,66… %",
                    "Runden, erste weggelassene Ziffer ist 6 → aufrunden:  ≈ 67 %",
                    "Begründung: Die Division bricht nicht ab, 67 % ist also nicht der Wert, sondern sein Näherungswert.",
                    "Probe: 3 · 67 % = 201 % statt 200 % — die Abweichung ist die Rundung selbst.",
                ],
                "ergebnis": "2/3 ≈ 67 %. Das Zeichen ≈ ist Teil der Antwort, nicht eine Nachlässigkeit beim Aufschreiben.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-02": {
        "A": {
            "hinfuehrung": "Du musst nicht rechnen. Du schaust.",
            "erklaerung": [
                "Die Hälfte sind 50 %. In der Mitte steht eine Marke.",
                "Endet die Farbe vor der Mitte, sind es weniger als 50 %.",
                "Endet die Farbe hinter der Mitte, sind es mehr als 50 %.",
                "Schätzen ist kein Raten. Du vergleichst mit einer Stelle, die du kennst.",
                "Diese Stellen kennst du schon: die Mitte ist 50 %, die Hälfte davon ist 25 %.",
            ],
            "beispiel": {
                "titel": "Am Mittelstrich vergleichen",
                "aufgabe": "Der Streifen ist bis kurz vor die Mitte gefärbt. Mehr oder weniger als 50 %?",
                "schritte": [
                    "Mitte des Streifens  = 50 %",
                    "Färbung endet davor  → kleiner",
                    "geschätzt            = 45 %",
                ],
                "ergebnis": "Weniger als 50 %. Geschätzt sind es etwa 45 %.",
                "luecke": {"schritt": 2, "wert": 45, "einheit": "%"},
            },
        },
        "B": {
            "hinfuehrung": "Du musst nicht raten. Nimm einen bekannten Ankerwert (25 %, 50 %, 75 %) und schätze von dort aus.",
            "erklaerung": [
                "Ankerwerte sind Prozentsätze, die du sofort siehst: 25 %, 50 %, 75 %, 10 %.",
                "Suche den nächsten Anker und schätze, ob dein Anteil etwas darüber oder darunter liegt – auf 5 % genau reicht.",
                "Der 10-%-Anker ist der nützlichste, weil er ohne Rechnung entsteht: Komma eine Stelle nach links. 10 % von 480 € sind 48 €. Aus ihm baust du jeden anderen Wert: 30 % sind dreimal so viel, 5 % die Hälfte davon.",
                "Wozu schätzen, wenn der Taschenrechner rechnet? Weil eine Schätzung Tippfehler aufdeckt. Wer vorher weiß, dass ungefähr 50 € herauskommen müssen, erkennt die 500 € auf dem Display sofort als Kommafehler.",
            ],
            "beispiel": {
                "titel": "Zwischen zwei Ankern einordnen",
                "aufgabe": "Ein Glas ist etwas mehr als zur Hälfte, aber noch nicht zu drei Vierteln voll. Schätze den Prozentsatz.",
                "schritte": [
                    "Anker Hälfte        = 50 %",
                    "Anker drei Viertel  = 75 %",
                    "Der Füllstand liegt dazwischen, näher an der Hälfte.",
                    "Also etwas über 50 %, aber deutlich unter 75 %  →  etwa 60 %",
                ],
                "ergebnis": "Schätzung: ungefähr 60 %. Zwei Anker grenzen den Wert ein, das Auge entscheidet nur noch dazwischen.",
            },
        },
        "C": {
            "hinfuehrung": "Es gibt mehrere Wege zu schätzen. Der Profi wählt den, der zur Aufgabe passt, und kann seine Wahl begründen.",
            "erklaerung": [
                "Ankerstrategie: am nächsten bekannten Prozentsatz orientieren. Gut bei Bildern und Füllständen, weil das Auge Hälften und Viertel zuverlässig trifft.",
                "Zerlegen: 30 % = 3 · 10 %. Gut, wenn 10 % leicht zu bestimmen ist, also bei glatten Grundwerten. Auch 5 % und 1 % entstehen so ohne Rechnung.",
                "Vergleichen: „etwa jeder Fünfte“ → 20 %. Gut bei Anzahlen, weil der Grundwert dann keine runde Zahl ist und Anker nicht greifen.",
                "Runden gehört zur Strategie dazu: 28 Kinder werden zu 30, weil sich mit 30 zehnteln lässt. Diese Vereinfachung musst du benennen — sie ist der Grund, warum das Ergebnis eine Schätzung bleibt.",
                "Und du solltest sagen können, in welche Richtung du dich vermutlich irrst: Wer 28 auf 30 aufrundet, macht den Grundwert größer und den geschätzten Prozentsatz damit kleiner als den echten.",
            ],
            "beispiel": {
                "titel": "Strategie wählen und die Abweichung einschätzen",
                "aufgabe": "In einer Klasse von 28 sind 6 krank. Schätze den Prozentsatz, begründe deine Strategie und sage, in welche Richtung du dich irrst.",
                "schritte": [
                    "Strategiewahl: Anker greifen nicht, 6 von 28 ist kein Viertel und keine Hälfte. Also zerlegen.",
                    "Runden für den 10-%-Schritt: 28 ≈ 30",
                    "10 % von 30 = 3   →   6 sind etwa 2 · 10 %",
                    "Schätzung: ungefähr 20 %",
                    "Richtung der Abweichung: Der Grundwert wurde vergrößert, der echte Prozentsatz liegt also etwas höher. Kontrolle: 6 : 28 ≈ 21,4 %.",
                ],
                "ergebnis": "Etwa 20 %, über die Strategie „10 % zerlegen“ — und mit der Angabe, dass der wahre Wert leicht darüber liegt.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-03": {
        "A": {
            "hinfuehrung": "Rechne zuerst den Preis für 1 Stück aus.",
            "erklaerung": [
                "Mehr Ware kostet mehr Geld. Doppelt so viel Ware kostet doppelt so viel.",
                "Der Preis für 1 Stück ist immer gleich. Er ist der Schlüssel.",
                "Teile durch die Anzahl. Dann weißt du, was 1 Stück kostet.",
                "Dann nimm mal die neue Anzahl.",
                "Der Weg geht immer über die 1. Deshalb heißt er Dreisatz.",
            ],
            "beispiel": {
                "titel": "Der Weg über ein Stück",
                "aufgabe": "5 Brötchen kosten 2,00 €. Was kosten 8 Brötchen?",
                "schritte": [
                    "5 Brötchen → 2,00 €",
                    ": 5   1 Brötchen → 0,40 €",
                    "· 8   8 Brötchen → 3,20 €",
                ],
                "ergebnis": "8 Brötchen kosten 3,20 €.",
                "luecke": {"schritt": 2, "wert": 3.2, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Wenn du das Schema selbst notierst und die Pfeile beschriftest, machst du keine Fehler mehr – auch bei krummen Zahlen.",
            "erklaerung": [
                "Schreibe links die eine Größe, rechts die andere. Notiere an jeden Pfeil, wodurch du teilst oder multiplizierst.",
                "Beide Seiten bekommen denselben Pfeil. Das ist der Kern des Verfahrens: Eine Zuordnung bleibt nur dann richtig, wenn beide Spalten dieselbe Behandlung bekommen.",
                "Der Zwischenschritt auf 1 ist nicht Vorschrift, sondern Bequemlichkeit. Von 1 aus kommst du mit einer einzigen Multiplikation zu jeder Menge, ohne über Brüche nachzudenken.",
                "Prüfe zum Schluss die Richtung: Bei mehr Ware muss mehr herauskommen. Ein Ergebnis, das kleiner ist als der Ausgangswert, obwohl die Menge gestiegen ist, entsteht durch vertauschte Pfeile.",
            ],
            "beispiel": {
                "titel": "Das Schema mit beschrifteten Pfeilen",
                "aufgabe": "3 m Stoff kosten 7,50 €. Was kosten 7 m?",
                "schritte": [
                    "3 m      → 7,50 €",
                    ": 3          : 3",
                    "1 m      → 2,50 €",
                    "· 7          · 7",
                    "7 m      → 17,50 €",
                    "Richtungsprobe: mehr Stoff, mehr Geld — 17,50 € > 7,50 €  ✓",
                ],
                "ergebnis": "7 m Stoff kosten 17,50 €.",
            },
        },
        "C": {
            "hinfuehrung": "Der Umweg über die 1 ist nur eine Hilfe. Dahinter steckt ein einziger Faktor, der beide Größen verbindet.",
            "erklaerung": [
                "Bei proportionalen Zuordnungen ist das Verhältnis Preis : Menge immer gleich. Diese Konstante ist der Faktor (hier: Preis pro Einheit).",
                "Statt zweier Schritte kannst du direkt mit dem Faktor multiplizieren: neue Menge · Faktor = neuer Preis. Der Dreisatz berechnet den Faktor nur nebenbei mit.",
                "Der Faktor hat eine Einheit, und sie sagt, was er bedeutet: 1,50 €/kg ist ein Preis je Kilogramm. Wer die Einheit mitschreibt, sieht am Ergebnis sofort, ob die Rechnung sinnvoll ist — €/kg · kg ergibt €.",
                "Der Faktor ist zugleich die Steigung der zugehörigen Geraden y = k · x. Prozentrechnung, Dreisatz und lineare Funktionen beschreiben hier dieselbe Sache in drei Sprachen.",
                "Die Grenze des Verfahrens gehört dazu: Ein Mengenrabatt macht die Zuordnung nicht proportional. Dann ist der Preis je Einheit nicht mehr konstant, und der Dreisatz liefert ein falsches Ergebnis.",
            ],
            "beispiel": {
                "titel": "Faktor bestimmen und seine Aussage prüfen",
                "aufgabe": "4 kg Äpfel kosten 6,00 €. Bestimme den Faktor, berechne 10 kg in einem Schritt und beurteile, ob das Verfahren hier zulässig ist.",
                "schritte": [
                    "Faktor = 6,00 € : 4 kg = 1,50 €/kg",
                    "Einheitenprobe: €/kg · kg = € — das Ergebnis wird ein Preis.",
                    "10 kg · 1,50 €/kg = 15,00 €",
                    "Zulässigkeit: Der Kilopreis gilt laut Aufgabe für jede Menge, es gibt keinen Mengenrabatt. Also ist die Zuordnung proportional und der Faktor konstant.",
                ],
                "ergebnis": "10 kg kosten 15,00 € – in einem Schritt über den Faktor 1,50 €/kg, und das Verfahren ist hier zulässig, weil der Kilopreis konstant bleibt.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-04": {
        "A": {
            "hinfuehrung": "Manchmal führt mehr zu weniger.",
            "erklaerung": [
                "Mehr Arbeiter, mehr Lohn. Das ist proportional.",
                "Mehr Arbeiter, weniger Zeit. Das ist antiproportional.",
                "Denke an die Arbeit selbst. Sie bleibt gleich groß.",
                "Mehr Leute teilen sich dieselbe Arbeit. Jeder macht weniger.",
                "Deshalb wird die Zeit kürzer.",
            ],
            "beispiel": {
                "titel": "Die Richtung erkennen",
                "aufgabe": "6 Maler brauchen 8 Tage. Es kommen mehr Maler. Mehr oder weniger Tage?",
                "schritte": [
                    "Die Arbeit bleibt gleich groß.",
                    "Mehr Maler teilen sich die Arbeit.",
                    "Jeder Einzelne muss weniger tun.",
                    "→ die Zeit wird kürzer",
                ],
                "ergebnis": "Mehr Maler → weniger Tage. Das ist antiproportional.",
            },
        },
        "B": {
            "hinfuehrung": "Erst entscheidest du die Art, dann rechnest du – der Weg ist bei beiden fast gleich, nur der zweite Pfeil dreht sich um.",
            "erklaerung": [
                "Proportional: auf 1 herunter (:), auf die Menge hoch (·).",
                "Antiproportional: auf 1 zusammenrechnen bedeutet mal (·), auf die Menge dann geteilt (:). Der Gesamtaufwand bleibt gleich (Arbeiter · Tage = konstant).",
                "Warum dreht sich der Pfeil um? Weil bei 1 Maler die ganze Arbeit auf einer Person liegt — das ist der längste Fall, nicht der kürzeste. Der Schritt auf 1 vergrößert die Zeit, statt sie zu verkleinern.",
                "Der handlichste Weg führt deshalb gar nicht über die 1, sondern über das Produkt: 6 Maler · 8 Tage = 48 Maler-Tage. Diese Zahl ist die Arbeit selbst und bleibt in jeder Spalte gleich.",
                "Der häufigste Fehler ist, den proportionalen Dreisatz stur weiterzuverwenden. Die Richtungsprobe deckt ihn auf: Mehr Maler und trotzdem mehr Tage kann nicht stimmen.",
            ],
            "beispiel": {
                "titel": "Über das konstante Produkt rechnen",
                "aufgabe": "6 Maler brauchen 8 Tage. Wie lange brauchen 8 Maler?",
                "schritte": [
                    "Art bestimmen: mehr Maler → weniger Tage, also antiproportional.",
                    "Produkt bilden: 6 Maler · 8 Tage = 48 „Maler-Tage“",
                    "Dieses Produkt bleibt gleich: 48 : 8 Maler = 6 Tage",
                    "Richtungsprobe: 8 Maler > 6 Maler und 6 Tage < 8 Tage  ✓",
                ],
                "ergebnis": "8 Maler brauchen 6 Tage.",
            },
        },
        "C": {
            "hinfuehrung": "„Mehr führt zu weniger“ allein macht eine Zuordnung noch nicht antiproportional. Der Test ist das Produkt.",
            "erklaerung": [
                "Bei echter Antiproportionalität ist das Produkt beider Werte in jeder Spalte gleich. Das ist die Produktprobe.",
                "Steht in einer Spalte ein anderes Produkt, ist die Zuordnung weder proportional noch antiproportional – dann darfst du nicht so rechnen.",
                "Der Unterschied zur Proportionalität liegt darin, was konstant bleibt: dort der Quotient y : x, hier das Produkt x · y. Eine Tabelle prüfst du, indem du beides ausrechnest und schaust, welches der beiden sich nicht ändert.",
                "Auch die Sachlogik muss halten. Ob 100 Maler eine Wohnung in einem Zwanzigstel der Zeit streichen, ist keine Frage der Mathematik: Sie stehen sich im Weg. Das Modell gilt nur in einem sinnvollen Bereich, und den darfst du benennen.",
                "Genau deshalb reicht die Produktprobe an drei Spalten nicht als Beweis, sondern nur als starkes Argument. Sie zeigt, dass die vorliegenden Werte zusammenpassen — nicht, dass jede weitere Spalte es auch tut.",
            ],
            "beispiel": {
                "titel": "Produktprobe durchführen und den Gültigkeitsbereich benennen",
                "aufgabe": "Prüfe, ob die Tabelle antiproportional ist: 2 Pumpen – 6 h, 3 Pumpen – 4 h, 4 Pumpen – 3 h. Beurteile anschließend, ob 100 Pumpen 0,12 h brauchen.",
                "schritte": [
                    "2 · 6 = 12",
                    "3 · 4 = 12",
                    "4 · 3 = 12   → alle Produkte gleich, die Werte sind antiproportional",
                    "Gegenprobe auf proportional: 6 : 2 = 3, aber 4 : 3 ≈ 1,3 — der Quotient ist nicht konstant, also nicht proportional.",
                    "Beurteilung: Rechnerisch ergäbe 12 : 100 = 0,12 h. Sachlich ist das unbrauchbar, weil 100 Pumpen nicht an dasselbe Becken passen. Das Modell gilt nur für wenige Pumpen.",
                ],
                "ergebnis": "Produkt konstant (12) → die Zuordnung ist antiproportional. Die Rechnung für 100 Pumpen ist formal richtig und sachlich sinnlos — beides gehört in die Antwort.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-05": {
        "A": {
            "hinfuehrung": "Der Grundwert ist das Ganze.",
            "erklaerung": [
                "Der Grundwert G sind 100 %.",
                "Frage dich: Wovon werden die Prozente genommen?",
                "Die Antwort auf diese Frage ist der Grundwert.",
                "Bei einem Rabatt ist der Grundwert der volle Preis.",
                "Der Grundwert steht oft vor dem Wort „von“.",
                "Er ist meistens die größte Zahl in der Aufgabe.",
            ],
            "beispiel": {
                "titel": "Die Frage „wovon?“ stellen",
                "aufgabe": "„20 % von 60 € Rabatt.“ Was ist der Grundwert?",
                "schritte": [
                    "Wovon werden die 20 % genommen?",
                    "Von den 60 €, also vom vollen Preis.",
                    "→ 100 % = 60 €",
                ],
                "ergebnis": "Grundwert G = 60 €. Das Ganze ist 100 %.",
                "luecke": {"schritt": 2, "wert": 60, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Drei Größen, drei Namen: Grundwert, Prozentwert, Prozentsatz. Wer sie sicher benennt, wählt danach mühelos die richtige Rechnung.",
            "erklaerung": [
                "Grundwert G = das Ganze (100 %). Prozentwert W = der Teil davon (in € oder Stück). Prozentsatz p % = wie viel Prozent der Teil ausmacht.",
                "Der Prozentsatz trägt das %-Zeichen, der Prozentwert die Sacheinheit (€, kg, …). An den Einheiten erkennst du die Rollen, ohne den Text zu deuten.",
                "Das Benennen ist der eigentliche Rechenschritt. Alle drei Formeln der Prozentrechnung sind dieselbe Gleichung, umgestellt — welche du brauchst, entscheidet allein, welche der drei Größen fehlt.",
                "Verlass dich nicht auf die Reihenfolge im Satz. In „12 von 30 Schülern“ steht der Prozentwert vorn, in „20 % von 60 €“ der Prozentsatz. Das Wort „von“ zeigt auf den Grundwert, nicht auf den Teil.",
            ],
            "beispiel": {
                "titel": "Drei Größen im Satz markieren",
                "aufgabe": "„12 von 30 Schülern, also 40 %, tragen eine Brille.“ Benenne G, W und p %.",
                "schritte": [
                    "das Ganze:       30 Schüler   → G    (steht hinter „von“)",
                    "der Teil:        12 Schüler   → W    (trägt die Sacheinheit)",
                    "der Prozentsatz: 40 %         → p %  (trägt das Prozentzeichen)",
                    "Plausibilität: 12 ist deutlich weniger als die Hälfte von 30, und 40 % ist weniger als 50 %  ✓",
                ],
                "ergebnis": "G = 30, W = 12, p % = 40 %. Alle drei sind gegeben, also ist hier nichts zu rechnen — nur zu benennen.",
            },
        },
        "C": {
            "hinfuehrung": "Manche Texte nennen den Grundwert gar nicht – und trotzdem lässt sich sagen, was er ist und ob man rechnen kann.",
            "erklaerung": [
                "Steht „der Preis steigt um 8 %“, ohne einen Betrag, ist der Grundwert der alte Preis – auch wenn keine Zahl dasteht.",
                "Prozentangaben ohne Grundwert („20 % mehr Leistung“) sind oft Werbung: ohne das Ganze ist der Zuwachs nicht bezifferbar. Das darfst du benennen.",
                "Gefährlicher als der fehlende Grundwert ist der gewechselte. Wenn zwei Prozentsätze in einem Text stehen, gehören sie oft zu verschiedenen Ganzen — „30 % der Schüler, davon 20 %“ meint 20 % von den 30 %, also 6 % aller Schüler.",
                "Deshalb lohnt eine feste Rückfrage bei jedem Prozentsatz: Wovon genau? Wer sie stellt, erkennt auch die Fälle, in denen ein Vergleich zweier Prozentsätze gar nicht zulässig ist, weil ihre Grundwerte verschieden sind.",
                "Bei Prozentpunkten ist derselbe Unterschied gemeint: Von 4 % auf 6 % sind zwei Prozentpunkte, aber 50 % Steigerung. Beides ist richtig, und beide Aussagen wirken völlig verschieden.",
            ],
            "beispiel": {
                "titel": "Eine Werbeaussage auf ihren Grundwert prüfen",
                "aufgabe": "„Neu: 25 % mehr Inhalt!“ Warum ist der Grundwert wichtig – und wo steckt er?",
                "schritte": [
                    "Rückfrage stellen: 25 % – wovon?",
                    "Vom alten Inhalt, der 100 % ist und in der Anzeige nicht genannt wird.",
                    "Folge: Ohne diese Menge ist „mehr“ nicht in Gramm sagbar. 25 % von 40 g sind 10 g, 25 % von 400 g sind 100 g.",
                    "Beurteilung: Die Aussage ist nicht falsch, aber unvollständig. Prüfbar wird sie erst mit der Angabe der alten Füllmenge.",
                ],
                "ergebnis": "Grundwert = alter Inhalt (100 %); fehlt er, bleibt der Zuwachs unbestimmt. Genau das macht solche Angaben in der Werbung so beliebt.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-06": {
        "A": {
            "hinfuehrung": "Rechne zuerst 1 % aus.",
            "erklaerung": [
                "1 % ist der Grundwert geteilt durch 100.",
                "Von 1 % kommst du zu jedem Prozentsatz.",
                "Dann nimm 1 % mal den Prozentsatz.",
                "20 % sind zwanzigmal so viel wie 1 %.",
                "So kommst du von 1 % zu jeder Zahl.",
                "Das Ergebnis ist kleiner als das Ganze. Prüfe das immer.",
                "Denn 20 % sind weniger als 100 %.",
            ],
            "beispiel": {
                "titel": "Der 1-%-Schritt",
                "aufgabe": "Berechne 20 % von 250 €.",
                "schritte": [
                    "1 %  = 250 € : 100 = 2,50 €",
                    "20 % = 2,50 € · 20 = 50 €",
                    "Probe: 50 € ist kleiner als 250 €  ✓",
                ],
                "ergebnis": "20 % von 250 € sind 50 €.",
                "luecke": {"schritt": 1, "wert": 50, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Der 1-%-Schritt steckt in einer Formel: W = G · p : 100. Ein Bruchstrich statt zweier Schritte.",
            "erklaerung": [
                "W ist der gesuchte Teil, G der Grundwert (100 %), p der Prozentsatz.",
                "Prüfe am Streifen: Ist p kleiner als 100 %, muss W kleiner als G sein.",
                "Die Formel ist der 1-%-Schritt in einer Zeile: G : 100 ist 1 %, und das · p ist der zweite Schritt. Ob du erst teilst oder erst multiplizierst, ändert am Ergebnis nichts — meist ist das Multiplizieren zuerst bequemer, weil die Zahlen glatt bleiben.",
                "Der häufigste Fehler ist, nach dem 1-%-Schritt aufzuhören. 2,50 € ist eine Zwischenzahl, nicht die Antwort. Wer das Ergebnis mit dem Prozentsatz vergleicht, merkt es: 20 % von 250 € können nicht 2,50 € sein.",
            ],
            "beispiel": {
                "titel": "Prozentwert mit der Formel — Rabatt in Euro",
                "aufgabe": "Ein Pullover kostet 80 €, der Rabatt beträgt 35 %. Wie viel Euro sind das?",
                "schritte": [
                    "Benennen: G = 80 €, p = 35 %, gesucht ist W",
                    "W = G · p : 100",
                    "W = 80 € · 35 : 100",
                    "W = 2800 : 100 = 28 €",
                    "Probe: 35 % ist etwa ein Drittel, ein Drittel von 80 € ist knapp 27 €  ✓",
                ],
                "ergebnis": "Der Rabatt beträgt 28 €. Der Pullover kostet danach 80 € − 28 € = 52 €.",
            },
        },
        "C": {
            "hinfuehrung": "Profis rechnen Prozentwerte mit einem Faktor und prüfen das Ergebnis vorher im Kopf durch einen Überschlag.",
            "erklaerung": [
                "p % als Faktor: 35 % = 0,35. Dann ist W = G · 0,35 – ein Schritt.",
                "Überschlag zuerst: 35 % ist gut ein Drittel. Ein Drittel von 80 ist knapp 27 – dein Ergebnis muss in dieser Nähe liegen.",
                "Der Faktor ist nichts Neues, sondern p : 100 in Dezimalschreibweise. Sein Vorteil ist, dass er sich mit anderen Faktoren verketten lässt — genau das brauchst du später bei mehrfachen Rabatten und beim Zinseszins.",
                "Der Überschlag ist die einzige Kontrolle, die vor Kommafehlern schützt. Ein vertipptes Komma verzehnfacht das Ergebnis, und der Taschenrechner meldet das nicht. Eine grobe Zahl im Kopf, vorher gebildet, tut es.",
                "Nützliche Umrechnungen für den Kopf: 25 % ist ein Viertel, 33 % ist ein Drittel, 20 % ist ein Fünftel, 12,5 % ist ein Achtel.",
            ],
            "beispiel": {
                "titel": "Überschlag vor der Rechnung",
                "aufgabe": "Berechne 35 % von 80 € mit dem Faktor und überschlage vorher.",
                "schritte": [
                    "Überschlag im Kopf: 35 % ≈ 1/3 von 80 € ≈ 27 €",
                    "Faktor bilden: 35 % = 35 : 100 = 0,35",
                    "W = 80 € · 0,35 = 28 €",
                    "Abgleich: 28 € liegt neben dem Überschlag von 27 €  ✓",
                    "Gegenprobe für den Nutzen des Überschlags: Ein Tippfehler wie 0,035 ergäbe 2,80 € — das fällt jetzt sofort auf.",
                ],
                "ergebnis": "28 €. Der Überschlag (≈ 27 €) bestätigt das Ergebnis und hätte einen Kommafehler aufgedeckt.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-07": {
        "A": {
            "hinfuehrung": "Bei glatten Zahlen siehst du den Prozentsatz sofort.",
            "erklaerung": [
                "Schreibe den Teil als Bruch vom Ganzen.",
                "Der Teil steht oben. Das Ganze steht unten.",
                "Kürze den Bruch so weit wie möglich.",
                "Dann liest du den Prozentsatz ab.",
                "Diese vier Brüche kennst du: 1/2, 1/4, 1/5 und 1/10.",
            ],
            "beispiel": {
                "titel": "Kürzen und ablesen",
                "aufgabe": "15 von 60 Plätzen sind besetzt. Wie viel Prozent sind das?",
                "schritte": [
                    "15 von 60 = 15/60",
                    "kürzen: 15/60 = 1/4",
                    "1/4 = 25 %",
                ],
                "ergebnis": "25 % der Plätze sind besetzt.",
                "luecke": {"schritt": 2, "wert": 25, "einheit": "%"},
            },
        },
        "B": {
            "hinfuehrung": "Auch bei krummen Zahlen gibt es einen sicheren Weg: p = W : G · 100.",
            "erklaerung": [
                "Teile den Prozentwert durch den Grundwert und nimm mal 100.",
                "Mit dem Taschenrechner ergibt sich oft eine lange Zahl – runde sinnvoll und schreibe das %-Zeichen dazu.",
                "Die Reihenfolge Teil : Ganzes ist entscheidend und nicht vertauschbar. Der Zwischenwert 0,85 ist der Anteil als Dezimalzahl; das · 100 macht daraus die Prozentschreibweise.",
                "Dreht man die Division um, kommt 40 : 34 ≈ 1,18 heraus, also 118 %. Ein Prozentsatz über 100 % bei einem Teil, der kleiner ist als das Ganze, ist immer ein Zeichen für die vertauschte Division.",
            ],
            "beispiel": {
                "titel": "Prozentsatz mit der Formel — Punkte im Test",
                "aufgabe": "In einem Test wurden 34 von 40 Punkten erreicht. Wie viel Prozent sind das?",
                "schritte": [
                    "Benennen: W = 34 Punkte (Teil), G = 40 Punkte (Ganzes), gesucht ist p",
                    "p = W : G · 100",
                    "p = 34 : 40 · 100",
                    "p = 0,85 · 100 = 85 %",
                    "Probe: 34 liegt nahe bei 40, also muss p deutlich über 50 % und unter 100 % liegen  ✓",
                ],
                "ergebnis": "85 % der Punkte wurden erreicht.",
            },
        },
        "C": {
            "hinfuehrung": "Wie viel Prozent hat sich etwas verändert? Und ist die Zahl überhaupt aussagekräftig? Beides gehört zusammen.",
            "erklaerung": [
                "Die prozentuale Veränderung berechnest du aus der Differenz geteilt durch den alten Wert: p = (neu − alt) : alt · 100.",
                "Ein hoher Prozentwert bei winzigem Grundwert (2 → 3 Fälle = +50 %) klingt dramatisch, sagt aber wenig. Das darfst du einordnen.",
                "Warum immer durch den alten Wert? Weil die Veränderung angibt, um welchen Anteil ihrer selbst die Ausgangsgröße gewachsen ist. Der neue Wert ist das Ergebnis und kann nicht zugleich der Maßstab sein.",
                "Daraus folgt eine Unsymmetrie, die viele überrascht: Von 40 auf 50 sind +25 %, von 50 zurück auf 40 sind −20 %. Dieselbe Differenz, verschiedene Prozentsätze — weil der Grundwert wechselt.",
                "Für die Beurteilung einer Prozentangabe brauchst du deshalb beides: den Prozentsatz und die absoluten Zahlen. Wer nur eines nennt, kann jede Entwicklung dramatisch oder harmlos aussehen lassen.",
            ],
            "beispiel": {
                "titel": "Veränderung berechnen und die Aussagekraft beurteilen",
                "aufgabe": "Ein Preis steigt von 40 € auf 46 €. Um wie viel Prozent? Beurteile anschließend die Schlagzeile „Preisexplosion: plus 50 %!“ bei einem Anstieg von 2 auf 3 Cent.",
                "schritte": [
                    "Differenz = 46 € − 40 € = 6 €",
                    "p = 6 : 40 · 100 = 15 %   (geteilt wird durch den ALTEN Wert)",
                    "Gegenprobe: 40 € · 1,15 = 46 €  ✓",
                    "Beurteilung der Schlagzeile: 1 Cent von 2 Cent sind rechnerisch tatsächlich +50 %.",
                    "Einordnung: Der Grundwert ist winzig. Der Prozentsatz ist richtig, aber ohne die absoluten Zahlen irreführend — ein Cent ist keine Explosion.",
                ],
                "ergebnis": "Der Preis ist um 15 % gestiegen. Bei der Schlagzeile stimmt die Rechnung und trotzdem nicht die Aussage: Prozentsätze brauchen ihren Grundwert daneben.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-08": {
        "A": {
            "hinfuehrung": "Jetzt ist das Ganze gesucht.",
            "erklaerung": [
                "Du kennst den Teil. Du kennst den Prozentsatz.",
                "Teile den Prozentwert durch den Prozentsatz. Das ist 1 %.",
                "Dann nimm mal 100. Das ist das Ganze.",
                "Wieder geht der Weg über 1 %. Nur die Richtung ist neu.",
                "Das Ganze ist größer als der Teil. Prüfe das immer.",
            ],
            "beispiel": {
                "titel": "Vom Teil zurück zum Ganzen",
                "aufgabe": "12 € sind 20 % eines Preises. Wie hoch ist der ganze Preis?",
                "schritte": [
                    "20 %  = 12 €",
                    "1 %   = 12 € : 20 = 0,60 €",
                    "100 % = 0,60 € · 100 = 60 €",
                    "Probe: 60 € ist größer als 12 €  ✓",
                ],
                "ergebnis": "Der ganze Preis beträgt 60 €.",
                "luecke": {"schritt": 2, "wert": 60, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Der Grundwert ist das Ganze – er muss größer sein als ein Teil davon. Diese Kontrolle bewahrt dich vor dem häufigsten Fehler.",
            "erklaerung": [
                "Mit Formel: G = W : p · 100.",
                "Prüfe danach: Ist p kleiner als 100 %, muss G größer sein als W. Kommt etwas Kleineres heraus, hast du mal und geteilt vertauscht.",
                "Der Unterschied zur Prozentwertaufgabe steckt allein in der Richtung: Dort war das Ganze bekannt und wurde verkleinert, hier ist der Teil bekannt und wird vergrößert. Deshalb wird geteilt, wo vorher multipliziert wurde.",
                "Das erklärt auch den häufigsten Fehler: 12 € · 20 : 100 = 2,40 € ist die Rechnung für den Prozentwert, angewandt auf eine Grundwertaufgabe. Das Ergebnis ist kleiner als der gegebene Teil — und daran erkennst du es sofort.",
            ],
            "beispiel": {
                "titel": "Grundwert bestimmen und die Größenkontrolle nutzen",
                "aufgabe": "35 € entsprechen 70 % des Preises. Wie hoch ist der Grundwert?",
                "schritte": [
                    "Benennen: W = 35 €, p = 70 %, gesucht ist G",
                    "G = W : p · 100",
                    "G = 35 : 70 · 100",
                    "G = 0,5 · 100 = 50 €",
                    "Größenkontrolle: 50 € > 35 €, und p = 70 % < 100 %  ✓",
                ],
                "ergebnis": "Der Grundwert beträgt 50 €.",
            },
        },
        "C": {
            "hinfuehrung": "Nach einem Rabatt zurückzurechnen ist eine echte Stolperfalle: Abziehen ist hier falsch. Du musst durch den Restanteil teilen.",
            "erklaerung": [
                "Steht der Preis NACH −20 % fest, entspricht er nicht 100 %, sondern nur 80 % des alten Preises.",
                "Deshalb: alten Preis = neuer Preis : 80 · 100. Wer stattdessen 20 % addiert, rechnet vom falschen Grundwert.",
                "Der Kern ist der Wechsel des Grundwerts. Die 20 % wurden vom alten Preis genommen, den du suchst. Rechnest du 20 % auf den neuen Preis auf, nimmst du sie von einer kleineren Zahl — und landest zu tief.",
                "Der Fehler bleibt unauffällig, weil das Ergebnis plausibel aussieht: 48 € + 20 % = 57,60 € statt 60 €. Nur eine Probe deckt ihn auf, und die ist billig: 60 € · 0,80 = 48 €  ✓, 57,60 € · 0,80 = 46,08 €  ✗.",
                "Als Regel: Vorwärts wird multipliziert, rückwärts wird durch denselben Faktor geteilt. Ein Prozentsatz lässt sich nie einfach in die Gegenrichtung anwenden.",
            ],
            "beispiel": {
                "titel": "Vom rabattierten Preis zurückrechnen — und die Falle zeigen",
                "aufgabe": "Nach 20 % Rabatt kostet eine Jacke 48 €. Wie war der Originalpreis? Zeige, warum „48 € + 20 %“ falsch ist.",
                "schritte": [
                    "Anteil bestimmen: nach −20 % sind 80 % übrig, also 48 € = 80 %",
                    "1 %   = 48 € : 80 = 0,60 €",
                    "100 % = 0,60 € · 100 = 60 €",
                    "Probe: 60 € · 0,80 = 48 €  ✓",
                    "Der falsche Weg: 48 € + 20 % = 57,60 €. Probe: 57,60 € · 0,80 = 46,08 € ≠ 48 €  ✗ — die 20 % wurden vom falschen Grundwert genommen.",
                ],
                "ergebnis": "Der Originalpreis war 60 €. Die Probe ist hier nicht Zierde, sondern der einzige Weg, den Fehler überhaupt zu bemerken.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-09": {
        "A": {
            "hinfuehrung": "Rechne den Rabatt zuerst in Euro aus.",
            "erklaerung": [
                "Ein Rabatt ist ein Nachlass. Der Preis wird kleiner.",
                "Schritt 1: Rabatt = G · p : 100.",
                "Jetzt weißt du, wie viel Euro du sparst.",
                "Schritt 2: Ziehe diese Euro vom Preis ab.",
                "Bei einem Aufschlag rechnest du genauso. Nur addierst du am Ende.",
            ],
            "beispiel": {
                "titel": "Rabatt ausrechnen, dann abziehen",
                "aufgabe": "Ein Rad kostet 200 €. Es gibt 15 % Rabatt. Was ist der Endpreis?",
                "schritte": [
                    "Rabatt = 200 € · 15 : 100 = 30 €",
                    "Endpreis = 200 € − 30 € = 170 €",
                ],
                "ergebnis": "Der Endpreis beträgt 170 €.",
                "luecke": {"schritt": 1, "wert": 170, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Statt zweier Schritte reicht ein Faktor: 100 % minus/plus p % ergibt sofort den Endpreis.",
            "erklaerung": [
                "Bei −15 % bleiben 85 % übrig → Faktor 0,85. Endpreis = G · 0,85.",
                "Bei +19 % sind es 119 % → Faktor 1,19. Endpreis = G · 1,19.",
                "Der Faktor spart nicht nur einen Schritt, er verhindert auch einen Fehler: Wer in zwei Schritten rechnet, kann das Abziehen vergessen und gibt den Rabatt als Preis an. Mit dem Faktor steht am Ende zwangsläufig der Endpreis da.",
                "Am Faktor liest du außerdem sofort die Richtung ab: kleiner als 1 heißt billiger, größer als 1 heißt teurer. Ein Faktor von 1,15 für einen Rabatt fällt beim Hinsehen auf.",
                "Und der Faktor ist die Brücke zu allem, was folgt: Mehrfache Änderungen, Zinseszins und Wachstum rechnest du mit genau derselben Zahl.",
            ],
            "beispiel": {
                "titel": "Endpreis in einem Schritt über den Faktor",
                "aufgabe": "Ein Rad kostet 200 €, 15 % Rabatt. Endpreis in einem Schritt.",
                "schritte": [
                    "Restanteil: 100 % − 15 % = 85 %",
                    "Faktor: 85 % = 0,85   (kleiner als 1, also wird es billiger  ✓)",
                    "Endpreis = 200 € · 0,85 = 170 €",
                    "Abgleich mit dem Zweischrittweg: 200 € − 30 € = 170 €  ✓",
                ],
                "ergebnis": "Endpreis 170 € – in einem Schritt über den Faktor 0,85.",
            },
        },
        "C": {
            "hinfuehrung": "Vom Endpreis auf den Startpreis kommst du nur, wenn du durch den Faktor teilst. Abziehen führt in die Irre.",
            "erklaerung": [
                "Ist der Endpreis nach +19 % bekannt, entspricht er 119 % des Nettopreises. Also: Netto = Endpreis : 1,19.",
                "Warum kein Abziehen? Die 19 % wurden vom kleineren Nettopreis genommen, nicht vom größeren Endpreis – die Grundwerte sind verschieden.",
                "Man kann den Unterschied beziffern: 19 % von 100 € sind 19 €, 19 % von 119 € sind 22,61 €. Wer vom Bruttopreis abzieht, zieht 3,61 € zu viel ab und landet bei 96,39 € statt bei 100 €.",
                "Die saubere Denkweise ist die Faktorkette: Vorwärts · 1,19, rückwärts : 1,19. Multiplizieren und Dividieren heben sich auf, Addieren und Subtrahieren eines Prozentsatzes nicht.",
                "Diese eine Regel deckt die ganze Reihe ab — Rabatt, Mehrwertsteuer, Zinsen und Wachstum. Wo ein Faktor hinführt, führt derselbe Faktor auch zurück.",
            ],
            "beispiel": {
                "titel": "Nettopreis aus dem Bruttopreis — mit Gegenrechnung",
                "aufgabe": "Ein Preis enthält 19 % Mehrwertsteuer und beträgt 119 €. Wie hoch war der Nettopreis? Beziffere den Fehler des Abziehens.",
                "schritte": [
                    "Anteil bestimmen: Endpreis = 100 % + 19 % = 119 %, also 119 € = 119 %",
                    "Faktor 1,19, rückwärts wird geteilt:  Netto = 119 € : 1,19 = 100 €",
                    "Probe: 100 € · 1,19 = 119 €  ✓",
                    "Der falsche Weg: 19 % von 119 € = 22,61 €, also 119 € − 22,61 € = 96,39 €",
                    "Fehlerbetrag: 100 € − 96,39 € = 3,61 €. Er entsteht, weil die 19 % vom Brutto- statt vom Nettopreis genommen wurden.",
                ],
                "ergebnis": "Der Nettopreis war 100 €. Das Abziehen liegt um 3,61 € daneben — der Fehler wächst mit dem Preis und ist deshalb keine Kleinigkeit.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-10": {
        "A": {
            "hinfuehrung": "Vergleiche zuerst den alten und den neuen Wert.",
            "erklaerung": [
                "Neu ist größer: gestiegen. Neu ist kleiner: gefallen.",
                "Die Differenz ist neu minus alt.",
                "Bei einer Zunahme ist die Differenz positiv.",
                "Bei einer Abnahme ist die Differenz negativ.",
                "Erst die Richtung, dann die Zahl. So machst du keinen Vorzeichenfehler.",
            ],
            "beispiel": {
                "titel": "Richtung und Differenz",
                "aufgabe": "Ein Preis war 50 €. Jetzt sind es 58 €. Gestiegen oder gefallen?",
                "schritte": [
                    "58 € > 50 €  → gestiegen",
                    "Differenz = 58 € − 50 € = 8 €",
                ],
                "ergebnis": "Gestiegen um 8 €.",
                "luecke": {"schritt": 1, "wert": 8, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Die Veränderung in Prozent bezieht sich immer auf den alten Wert. Aus ihr wird ein Faktor, mit dem du weiterrechnest.",
            "erklaerung": [
                "p = (neu − alt) : alt · 100.",
                "Der Wachstumsfaktor fasst die Veränderung zusammen: +16 % → q = 1,16; −16 % → q = 0,84.",
                "Faktor und Prozentsatz sind zwei Schreibweisen derselben Sache. Der Prozentsatz beschreibt die Änderung, der Faktor beschreibt den neuen Wert im Verhältnis zum alten — deshalb ist im Faktor die 1 für den Ausgangswert schon enthalten.",
                "Genau deshalb ist der Faktor beim Weiterrechnen überlegen: Aus q = 1,16 folgt der neue Wert mit einer Multiplikation, und aus dem neuen Wert der alte mit einer Division. Der Prozentsatz allein kann das nicht.",
            ],
            "beispiel": {
                "titel": "Von zwei Werten zum Wachstumsfaktor",
                "aufgabe": "Von 50 € auf 58 €: Wie viel Prozent, und wie lautet der Faktor?",
                "schritte": [
                    "Differenz und Grundwert: (58 − 50) = 8, geteilt wird durch den ALTEN Wert 50",
                    "p = 8 : 50 · 100 = 16 %",
                    "Faktor q = 1 + 16/100 = 1,16",
                    "Probe: 50 € · 1,16 = 58 €  ✓",
                ],
                "ergebnis": "+16 %, Wachstumsfaktor q = 1,16.",
            },
        },
        "C": {
            "hinfuehrung": "Mehrere Veränderungen hintereinander multiplizierst du als Faktoren. Dabei zeigt sich: Rauf und wieder runter landet nicht beim Start.",
            "erklaerung": [
                "Nacheinander wirkende Änderungen: Faktoren multiplizieren, nicht Prozente addieren.",
                "+10 % dann −10 % → 1,10 · 0,90 = 0,99. Der zweite Prozentsatz wird vom bereits größeren Wert genommen – deshalb bleibt ein Verlust von 1 %.",
                "Der Grund ist wieder der Grundwert: Die 10 % Zuwachs beziehen sich auf 100 €, die 10 % Abschlag auf 110 €. Zehn Prozent von einer größeren Zahl sind mehr, also überwiegt der Abschlag.",
                "Das gilt in beide Richtungen und ist unabhängig von der Reihenfolge: 0,90 · 1,10 ergibt ebenfalls 0,99. Multiplikation ist vertauschbar, und deshalb verliert man in jedem Fall.",
                "Der Effekt wächst mit dem Prozentsatz: Bei ±10 % bleiben 99 %, bei ±50 % nur noch 75 %. Wer eine Halbierung durch eine Verdopplung ausgleichen will, braucht +100 %, nicht +50 %.",
            ],
            "beispiel": {
                "titel": "Faktorkette und warum sie nicht bei 1 landet",
                "aufgabe": "100 € werden erst um 10 % erhöht, dann um 10 % gesenkt. Endwert? Erkläre, warum nicht 100 € herauskommen.",
                "schritte": [
                    "· 1,10 → 110 €   (10 % von 100 € sind 10 €)",
                    "· 0,90 → 99 €    (10 % von 110 € sind 11 €, nicht 10 €)",
                    "Kette: 1,10 · 0,90 = 0,99, also 99 % des Ausgangswerts",
                    "Begründung: Die beiden Prozentsätze haben verschiedene Grundwerte — 100 € und 110 €.",
                    "Gegenprobe zur Reihenfolge: 0,90 · 1,10 = 0,99 ebenfalls. Es liegt nicht an der Reihenfolge, sondern am Wechsel des Grundwerts.",
                ],
                "ergebnis": "99 € – nicht 100 €. +10 % und −10 % heben sich nie auf, weil der zweite Prozentsatz von der größeren Zahl genommen wird.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-11": {
        "A": {
            "hinfuehrung": "Zinsen sind das Geld für ein Jahr.",
            "erklaerung": [
                "Wer Geld auf die Bank bringt, bekommt Zinsen dafür.",
                "Das Kapital K ist das Geld auf dem Konto. Es ist der Grundwert.",
                "Der Zinssatz p ist der Prozentsatz.",
                "Rechne Z = K · p : 100.",
                "Das ist dieselbe Rechnung wie beim Prozentwert. Nur die Namen sind neu.",
                "Die Zinsen sind viel kleiner als das Kapital. Prüfe das immer.",
            ],
            "beispiel": {
                "titel": "Zinsen für ein Jahr",
                "aufgabe": "2000 € liegen ein Jahr zu 3 %. Wie viel Zinsen gibt es?",
                "schritte": [
                    "Z = K · p : 100",
                    "Z = 2000 € · 3 : 100",
                    "Z = 60 €",
                ],
                "ergebnis": "Die Jahreszinsen betragen 60 €.",
                "luecke": {"schritt": 2, "wert": 60, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Die Zinsformel hat drei Größen. Zuerst erkennst du, welche fehlt, dann stellst du passend um.",
            "erklaerung": [
                "Zinsen gesucht: Z = K · p : 100.",
                "Zinssatz gesucht: p = Z : K · 100. Kapital gesucht: K = Z : p · 100.",
                "Diese drei Formeln sind nicht auswendig zu lernen. Es sind die drei Prozentformeln mit anderen Buchstaben: Kapital ist der Grundwert, Zinsen sind der Prozentwert, der Zinssatz ist der Prozentsatz.",
                "Wer das erkennt, spart sich die Hälfte des Stoffs — und kann die Größenkontrollen mitnehmen. Die Zinsen sind bei üblichen Zinssätzen viel kleiner als das Kapital; kommt etwas Größeres heraus, ist die Division vertauscht.",
            ],
            "beispiel": {
                "titel": "Erst die gesuchte Größe, dann die Formel",
                "aufgabe": "Für 2000 € gab es 60 € Zinsen. Wie hoch war der Zinssatz?",
                "schritte": [
                    "Benennen: K = 2000 € (Grundwert), Z = 60 € (Prozentwert), gesucht ist p",
                    "p = Z : K · 100",
                    "p = 60 : 2000 · 100",
                    "p = 0,03 · 100 = 3 %",
                    "Probe: 2000 € · 3 : 100 = 60 €  ✓",
                ],
                "ergebnis": "Der Zinssatz betrug 3 %.",
            },
        },
        "C": {
            "hinfuehrung": "Wer die Formel wirklich beherrscht, stellt sie selbst um – nach K, nach p, nach Z – und muss sich nur eine merken.",
            "erklaerung": [
                "Ausgangspunkt Z = K · p : 100.",
                "Nach K: K = Z · 100 : p. Nach p: p = Z · 100 : K. Das Umstellen folgt den Regeln der Äquivalenzumformung – dieselbe Rechenoperation auf beiden Seiten.",
                "Umstellen heißt: Was auf der einen Seite stört, hebst du mit der Gegenoperation auf und tust dasselbe auf der anderen Seite. Das : 100 verschwindet durch · 100, das · p durch : p.",
                "Die Kontrolle für jede Umstellung ist eine Zahlenprobe: Setze ein Beispiel ein, das du schon gerechnet hast. Wenn 2000, 3 und 60 in der umgestellten Formel zusammenpassen, stimmt sie.",
                "Und die Einheiten helfen ein zweites Mal: Ein Kapital kommt in Euro heraus, ein Zinssatz in Prozent. Steht am Ende ein Prozentsatz, wo Euro stehen müssten, ist die Formel falsch umgestellt.",
            ],
            "beispiel": {
                "titel": "Formel nach dem Kapital umstellen",
                "aufgabe": "Wie viel Kapital bringt bei 4 % genau 100 € Jahreszinsen? Stelle die Formel Schritt für Schritt um.",
                "schritte": [
                    "Z = K · p : 100          | · 100",
                    "Z · 100 = K · p          | : p",
                    "K = Z · 100 : p",
                    "Einsetzen: K = 100 € · 100 : 4 = 2500 €",
                    "Zahlenprobe: 2500 € · 4 : 100 = 100 €  ✓  und die Einheit ist Euro, wie es sein muss.",
                ],
                "ergebnis": "2500 € bringen bei 4 % genau 100 € Zinsen. Eine einzige Formel und zwei Umformungsschritte ersetzen drei auswendig gelernte Formeln.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-12": {
        "A": {
            "hinfuehrung": "Kürzere Zeit heißt weniger Zinsen.",
            "erklaerung": [
                "Zinsen gibt es normalerweise für ein ganzes Jahr.",
                "Rechne deshalb zuerst die Zinsen für ein ganzes Jahr aus.",
                "Ein halbes Jahr: teile durch 2.",
                "Ein viertel Jahr: teile durch 4. Das sind 3 Monate.",
                "Das Ergebnis muss kleiner sein als die Jahreszinsen.",
            ],
            "beispiel": {
                "titel": "Halbes Jahr, halbe Zinsen",
                "aufgabe": "1200 € liegen ein halbes Jahr zu 5 %. Wie viel Zinsen?",
                "schritte": [
                    "Jahreszinsen = 1200 € · 5 : 100 = 60 €",
                    "halbes Jahr = 60 € : 2 = 30 €",
                    "Probe: 30 € ist kleiner als 60 €  ✓",
                ],
                "ergebnis": "Für ein halbes Jahr gibt es 30 € Zinsen.",
                "luecke": {"schritt": 1, "wert": 30, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Für beliebige Laufzeiten multiplizierst du die Jahreszinsen mit einem Zeitfaktor – Monate über 12, Tage über 360.",
            "erklaerung": [
                "Monate: Z = K · p : 100 · m/12.",
                "Tage: Z = K · p : 100 · t/360 (im Bankjahr hat jeder Monat 30 Tage, das Jahr 360).",
                "Der Zeitfaktor ist immer ein Bruchteil eines Jahres und deshalb kleiner als 1. Genau daran erkennst du, dass die Teilzinsen kleiner sein müssen als die Jahreszinsen.",
                "Das Bankjahr mit 360 Tagen ist eine Vereinbarung, keine Naturkonstante. Sie macht jeden Monat gleich lang und die Rechnung damit einfach; Banken rechnen heute teilweise anders. Für diesen Kurs gilt 30/360.",
                "Rechne immer erst die Jahreszinsen und dann den Zeitanteil. Wer beides zugleich in den Taschenrechner tippt, verliert leicht eine Klammer — und der Fehler fällt nicht auf.",
            ],
            "beispiel": {
                "titel": "Zinsen für drei Monate",
                "aufgabe": "1200 € zu 5 % für 3 Monate. Wie viel Zinsen?",
                "schritte": [
                    "Jahreszinsen = 1200 € · 5 : 100 = 60 €",
                    "Zeitfaktor = 3/12 = 1/4     (kleiner als 1  ✓)",
                    "Z = 60 € · 1/4 = 15 €",
                    "Probe: 15 € ist ein Viertel von 60 €, wie 3 Monate ein Viertel des Jahres sind  ✓",
                ],
                "ergebnis": "Für 3 Monate gibt es 15 € Zinsen.",
            },
        },
        "C": {
            "hinfuehrung": "Sind Zinsen, Kapital und Zinssatz bekannt, lässt sich die Laufzeit bestimmen – du stellst die Formel nach der Zeit um.",
            "erklaerung": [
                "Aus Z = K · p : 100 · t/360 folgt: t = Z · 360 · 100 : (K · p).",
                "Rechne zuerst die Jahreszinsen aus, dann vergleiche, welcher Bruchteil eines Jahres deine Zinsen ergibt.",
                "Der zweite Weg ist der anschaulichere und weniger fehleranfällige: Teilzinsen geteilt durch Jahreszinsen ergibt unmittelbar den Anteil des Jahres. Mal 12 macht daraus Monate, mal 360 Tage.",
                "Er hat außerdem den Vorteil, dass er ohne die große Formel auskommt und sich selbst kontrolliert: Der Anteil muss zwischen 0 und 1 liegen. Kommt mehr als 1 heraus, war die Laufzeit länger als ein Jahr — oder die Division ist vertauscht.",
                "Beim Umrechnen in Monate gilt weiter das Bankjahr: 1/6 Jahr sind 2 Monate, 1/8 Jahr sind 45 Tage. Ein krummer Anteil ergibt oft eine glatte Tageszahl.",
            ],
            "beispiel": {
                "titel": "Laufzeit über den Anteil am Jahr",
                "aufgabe": "1200 € zu 5 % bringen 15 € Zinsen. Über wie viele Monate?",
                "schritte": [
                    "Jahreszinsen = 1200 € · 5 : 100 = 60 €",
                    "Anteil = 15 € : 60 € = 0,25 = 1/4 Jahr     (zwischen 0 und 1  ✓)",
                    "In Monate: 12 · 1/4 = 3 Monate",
                    "In Tagen zur Gegenprobe: 360 · 1/4 = 90 Tage = 3 Monate im Bankjahr  ✓",
                ],
                "ergebnis": "Die Laufzeit betrug 3 Monate. Der Umweg über den Anteil am Jahr ersetzt die umgestellte Formel und kontrolliert sich selbst.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-13": {
        "A": {
            "hinfuehrung": "Auch die Zinsen bekommen im nächsten Jahr Zinsen.",
            "erklaerung": [
                "Die Zinsen bleiben am Ende des Jahres auf dem Konto.",
                "Im nächsten Jahr ist das Kapital deshalb größer.",
                "Von einem größeren Kapital gibt es mehr Zinsen.",
                "Jede Zeile: Kapital plus Zinsen ist das neue Kapital.",
                "Das neue Kapital startet die nächste Zeile.",
            ],
            "beispiel": {
                "titel": "Zwei Jahre in einer Tabelle",
                "aufgabe": "1000 € liegen 2 Jahre zu 2 %. Fülle die Tabelle aus.",
                "schritte": [
                    "Jahr 1: 1000 € + 2 % = 1000 + 20 = 1020 €",
                    "Jahr 2: 1020 € + 2 % = 1020 + 20,40 = 1040,40 €",
                ],
                "ergebnis": "Nach 2 Jahren: 1040,40 €. Im zweiten Jahr gab es 40 Cent mehr Zinsen als im ersten.",
                "luecke": {"schritt": 1, "wert": 1040.4, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Statt jede Zeile einzeln zu rechnen, fasst der Zinseszins alles in einer Formel zusammen: Kapital mal Wachstumsfaktor hoch Jahre.",
            "erklaerung": [
                "Der Wachstumsfaktor ist q = 1 + p/100. Bei 2 % ist q = 1,02.",
                "Endkapital = K · q^n (n = Anzahl der Jahre). Das Ergebnis muss mit der Tabelle übereinstimmen.",
                "Woher kommt die Potenz? Jedes Jahr wird mit demselben Faktor multipliziert. Zwei Jahre sind also · 1,02 · 1,02, und das ist 1,02². Die Hochzahl zählt schlicht die Jahre.",
                "Damit ist der Zinseszins dieselbe Faktorkette wie bei mehrfachen Rabatten — nur mit lauter gleichen Faktoren. Runde deshalb erst am Schluss: Wer jedes Jahr auf Cent rundet, sammelt Rundungsfehler auf.",
            ],
            "beispiel": {
                "titel": "Tabelle und Formel liefern dasselbe",
                "aufgabe": "1000 € zu 2 % über 2 Jahre – mit der Formel.",
                "schritte": [
                    "q = 1 + 2/100 = 1,02",
                    "K · q^n = 1000 € · 1,02²",
                    "1,02² = 1,0404",
                    "= 1000 € · 1,0404 = 1040,40 €",
                    "Abgleich mit der Tabelle aus Pfad A: 1040,40 €  ✓",
                ],
                "ergebnis": "1040,40 € – gleiches Ergebnis wie die Tabelle, aber in einer Zeile statt in zweien.",
            },
        },
        "C": {
            "hinfuehrung": "Wie lange dauert es, bis sich das Kapital lohnt? Und wie viel bringt der Zinseszins gegenüber dem einfachen Zins? Beides lässt sich zeigen.",
            "erklaerung": [
                "Die Laufzeit bei gegebenem Zielkapital findest du durch systematisches Probieren mit q^n (n hochzählen, bis das Ziel erreicht ist).",
                "Einfacher Zins wächst linear (jedes Jahr gleich viel), Zinseszins wächst schneller, weil die Zinsen mitverzinst werden – der Abstand wird mit den Jahren größer.",
                "Der Unterschied ist der zwischen einer Geraden und einer Kurve. Beim einfachen Zins ist der Zuwachs jedes Jahr derselbe Betrag; beim Zinseszins ist er jedes Jahr derselbe Anteil, und ein gleicher Anteil von einer wachsenden Zahl ist ein wachsender Betrag.",
                "Über kurze Zeiträume ist der Unterschied klein und wird deshalb leicht unterschätzt: Nach 2 Jahren trennen die beiden Verfahren bei 1000 € und 2 % nur 40 Cent. Nach 30 Jahren sind es über 200 €.",
                "Das systematische Probieren ist hier keine Notlösung, sondern das angemessene Verfahren: Die Gleichung nach n aufzulösen bräuchte den Logarithmus, und der kommt erst später.",
            ],
            "beispiel": {
                "titel": "Laufzeit durch systematisches Probieren",
                "aufgabe": "Ab wann sind aus 1000 € bei 2 % mehr als 1060 € geworden? Vergleiche danach mit dem einfachen Zins.",
                "schritte": [
                    "q = 1,02, gesucht ist das kleinste n mit 1000 · q^n > 1060",
                    "n = 2: 1000 · 1,02² = 1040,40 €   — noch zu wenig",
                    "n = 3: 1000 · 1,02³ = 1061,21 €   > 1060 €  ✓",
                    "Einfacher Zins zum Vergleich: 3 · 20 € = 60 €, also 1060,00 € — knapp unter der Marke.",
                    "Deutung: Der Zinseszins bringt nach drei Jahren 1,21 € mehr. Der Vorsprung ist klein, aber er wächst in jedem weiteren Jahr.",
                ],
                "ergebnis": "Nach 3 Jahren übersteigt das Kapital 1060 €. Der einfache Zins schafft es im selben Zeitraum nicht — daran sieht man den Zinseszins in Zahlen.",
            },
        },
    },

    # ------------------------------------------------------------------
    "pz-14": {
        "A": {
            "hinfuehrung": "Frage dich zuerst: Was ist gegeben? Was ist gesucht?",
            "erklaerung": [
                "In jeder Prozentaufgabe gibt es drei Größen.",
                "Unterstreiche im Text den Grundwert, den Prozentwert und den Prozentsatz.",
                "Zwei Größen sind gegeben. Die dritte suchst du.",
                "Erst dann suchst du die passende Formel.",
                "Wer sofort rechnet, wählt oft die falsche Formel.",
            ],
            "beispiel": {
                "titel": "Gegeben und gesucht bestimmen",
                "aufgabe": "„18 € sind 30 % wovon?“ Welche Größe fehlt?",
                "schritte": [
                    "gegeben: W = 18 €, p = 30 %",
                    "gesucht: G, also das Ganze",
                    "G = W : p · 100 = 18 : 30 · 100 = 60 €",
                ],
                "ergebnis": "Gesucht war der Grundwert: 60 €.",
                "luecke": {"schritt": 2, "wert": 60, "einheit": "€"},
            },
        },
        "B": {
            "hinfuehrung": "Jetzt kommen die Aufgaben durcheinander – Rabatt, Zinsen, Veränderung. Du erkennst den Typ selbst und rechnest sicher.",
            "erklaerung": [
                "Achte auf Signalwörter: „Rabatt/Aufschlag“ → vermehrter/verminderter Grundwert; „pro Jahr“ → Zinsen; „von … auf …“ → prozentuale Veränderung.",
                "Notiere gegeben/gesucht, wähle die Formel, prüfe das Ergebnis auf Plausibilität.",
                "Die vier Plausibilitätsprüfungen der ganzen Reihe passen auf eine Zeile: Der Prozentwert ist kleiner als der Grundwert. Der Grundwert ist größer als der Prozentwert. Ein Rabatt macht billiger. Zinsen sind viel kleiner als das Kapital.",
                "Wenn ein Signalwort fehlt, hilft die Frage nach dem Grundwert weiter: Wovon werden die Prozente genommen? Steht diese Zahl im Text, ist der Grundwert gegeben; wird sie gesucht, ist es eine Grundwertaufgabe.",
            ],
            "beispiel": {
                "titel": "Aufgabentyp am Signalwort erkennen",
                "aufgabe": "Ein Handy kostet 300 €, im Angebot 20 % günstiger. Endpreis?",
                "schritte": [
                    "Signalwort „günstiger“ → verminderter Grundwert, gesucht ist der Endpreis",
                    "Grundwert prüfen: Die 20 % werden vom alten Preis 300 € genommen.",
                    "Faktor = 100 % − 20 % = 80 % = 0,80",
                    "300 € · 0,80 = 240 €",
                    "Plausibilität: Ein Rabatt macht billiger, 240 € < 300 €  ✓",
                ],
                "ergebnis": "Der Endpreis beträgt 240 €.",
            },
        },
        "C": {
            "hinfuehrung": "Reale Aufgaben brauchen mehrere Schritte und am Ende eine begründete Entscheidung – nicht nur eine Zahl.",
            "erklaerung": [
                "Zerlege die Aufgabe in Teilrechnungen und halte Zwischenergebnisse fest.",
                "Vergleiche die Ergebnisse und formuliere eine Empfehlung mit Begründung – das ist der geforderte Modellierungsschritt.",
                "Eine Empfehlung ohne Zahl ist eine Meinung, eine Zahl ohne Empfehlung ist eine unfertige Antwort. Verlangt ist beides: das Ergebnis und der Satz, was daraus folgt.",
                "Zur Begründung gehört, warum die naheliegende Vermutung nicht trägt. Zwei Rabatte von 15 % und 10 % ergeben eben nicht 25 %, weil der zweite vom schon verringerten Preis genommen wird — genau das ist hier die Pointe.",
                "Und die Grenzen des Modells gehören genannt: Der Rechenweg vergleicht Preise, nicht Versandkosten, Garantie oder Lieferzeit. Eine Empfehlung, die das verschweigt, ist mathematisch richtig und praktisch unvollständig.",
            ],
            "beispiel": {
                "titel": "Zwei Angebote vergleichen und begründet empfehlen",
                "aufgabe": "Angebot A: 100 € − 25 %. Angebot B: 100 € − 15 %, dann noch − 10 %. Welches ist günstiger?",
                "schritte": [
                    "A: 100 € · 0,75 = 75 €",
                    "B: 100 € · 0,85 = 85 €, davon nochmals − 10 %:  85 € · 0,90 = 76,50 €",
                    "Kette für B: 0,85 · 0,90 = 0,765, also 76,50 €",
                    "Vergleich: 75 € < 76,50 €, Angebot A ist um 1,50 € günstiger.",
                    "Begründung: Die zweiten 10 % werden von 85 € genommen, nicht von 100 €. Deshalb ergeben 15 % und 10 % zusammen nur 23,5 % und nicht 25 %.",
                    "Grenze des Modells: Verglichen wurden allein die Preise. Versandkosten oder Lieferzeit könnten die Empfehlung umkehren.",
                ],
                "ergebnis": "Angebot A ist günstiger. Zwei Rabatte nacheinander ergeben nicht die Summe der Prozentsätze — sie werden von verschiedenen Grundwerten genommen.",
            },
        },
    },
}
