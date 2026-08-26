# -*- coding: utf-8 -*-
"""Traegt Erklaerungstexte und Musterbeispiele in die Einheiten ein.

WARUM ES DIESE DATEI GIBT

Die Leitfrage von V36: Kann sich ein Kind eine Einheit ALLEIN erarbeiten -
auf seiner Niveaustufe? Der Bestand von V35 war dafuer an zwei Stellen zu
duenn, und beide Male war die Kuerze richtig gedacht:

  1. Die Erklaerungen trugen im Mittel 99 Zeichen auf Pfad A, 146 auf B
     und 190 auf C - zwei kurze Saetze je Stufe. Das entsprach genau dem
     Richtwert im README, und im begleiteten Unterricht reicht es auch:
     Wer danebensitzt, ergaenzt den fehlenden Schritt muendlich. Wer
     allein davorsitzt, bekommt ihn nirgends. Es fehlte nicht die
     Ausfuehrlichkeit, sondern der Schritt DAZWISCHEN - das Warum
     zwischen "so ist es" und "merke".

  2. Die Musterbeispiele waren zwei- bis dreischrittig und trugen keine
     Ueberschrift. Auf Pfad C ist das zu wenig: Die Operatoren dieser
     Stufe sind begruende, vergleiche, beurteile - ein Musterbeispiel
     muss zeigen, wie eine solche ANTWORT aussieht, nicht nur, dass sie
     verlangt wird.

Die Sprache der Stufen bleibt unangetastet (siehe README, Abschnitt
"Lernkarten"): Pfad A behaelt kurze Hauptsaetze ohne Nebensaetze,
Einschuebe und Abkuerzungen. Mehr Text heisst hier mehr Schritte, nicht
laengere Saetze.

WAS HIER STEHT UND WAS NICHT

Nur das Ergaenzte, und zwar VOLLSTAENDIG - alte und neue Saetze zusammen.
Ein Anhaengen waere nicht wiederholbar: Beim zweiten Lauf staende alles
doppelt in der Datei. Der Lauf setzt Felder, er haengt nichts an.

Alles andere - Aufgaben, Videos, Uebungslinks, Formelkarte, Wortspeicher,
can_do - bleibt unberuehrt. Diese Datei setzt genau drei Felder:

    lernkarten[stufe]["hinfuehrung"]   (nur wo angegeben)
    lernkarten[stufe]["erklaerung"]
    lernkarten[stufe]["beispiel"]

Der Fachinhalt liegt je Lernbereich in einer eigenen Datei
(erarbeitung_pz.py, erarbeitung_lf.py, ...) - wie bei den Einheiten
selbst auch. Eine Datei mit 54 Einheiten waere nicht mehr zu pruefen.

Aufruf:  python werkzeuge/erarbeitung_bauen.py           (alle Bereiche)
         python werkzeuge/erarbeitung_bauen.py pz lf     (nur diese)
         python werkzeuge/erarbeitung_bauen.py --pruefen (nur berichten)
"""
import importlib
import io
import json
import os
import re
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HIER)
UNITS = os.path.join(PROJ, "units")

BEREICHE = ["pz", "lf", "kp", "sk"]

# Die Felder, die eine Lernkarte tragen darf. Steht in einem Inhaltsblock
# etwas anderes, ist es ein Tippfehler - und ein Tippfehler, der still
# durchgeht, faellt erst im Unterricht auf.
ERLAUBT = {"hinfuehrung", "erklaerung", "beispiel"}
BEISPIEL_FELDER = {"titel", "aufgabe", "schritte", "ergebnis", "luecke"}

# Richtwerte je Stufe. Sie sind kein Selbstzweck: Wer eine Erklaerung auf
# Pfad A auf B-Laenge aufblaeht, hat die Stufe verlassen, und wer sie bei
# der alten Kuerze belaesst, hat das Problem nicht geloest. Unterschritten
# meldet der Lauf, ueberschritten ebenfalls.
LAENGE = {
    "A": (300, 900),
    "B": (600, 1700),
    "C": (750, 2200),
}

# Auf Pfad A gilt der Satzbau der Stufe weiter. Diese Zeichen zeigen an,
# dass ein Satz die Stufe verlassen hat.
#
A_VERBOTEN = (" bzw.", " z. B.", " ca.", " d. h.", " u. a.")

# Klammern werden gesondert geprueft, weil nicht jede eine ist: "(0 | 0)"
# und "P(4 | 2)" sind Koordinatenschreibweise und auf jeder Stufe richtig,
# " (siehe oben)" ist ein Einschub und auf Pfad A unerwuenscht.
# Unterschieden werden sie am Inhalt - steht ein echtes Wort darin, ist es
# ein Einschub; stehen nur Zahlen, Achsenbuchstaben und Trennzeichen
# darin, ist es Schreibweise.
A_EINSCHUB = re.compile(r"\(([^)]*)\)")
A_WORT = re.compile(r"[A-Za-zÄÖÜäöüß]{3,}")


def einheit_datei(unit):
    bereich = unit.split("-")[0]
    return os.path.join(UNITS, bereich, unit, "tasks.json")


def lies(pfad):
    with io.open(pfad, encoding="utf-8") as f:
        return json.load(f)


def schreib(pfad, daten):
    with io.open(pfad, "w", encoding="utf-8", newline="\n") as f:
        json.dump(daten, f, ensure_ascii=False, indent=2)
        f.write("\n")


def inhalte_des_bereichs(bereich):
    """Laedt erarbeitung_<bereich>.py, falls vorhanden."""
    name = "erarbeitung_" + bereich
    if not os.path.exists(os.path.join(HIER, name + ".py")):
        return {}
    modul = importlib.import_module(name)
    return getattr(modul, "INHALTE", {})


def block_pruefen(unit, stufe, block, fehler, hinweis):
    unbekannt = set(block) - ERLAUBT
    if unbekannt:
        fehler.append("%s/%s: unbekannte Felder %s" % (unit, stufe, sorted(unbekannt)))

    erkl = block.get("erklaerung")
    if erkl is not None:
        if not isinstance(erkl, list) or not erkl:
            fehler.append("%s/%s: erklaerung ist keine nichtleere Liste" % (unit, stufe))
        else:
            for satz in erkl:
                if not isinstance(satz, str) or len(satz.strip()) < 10:
                    fehler.append("%s/%s: zu kurzer Erklaerungssatz %r" % (unit, stufe, satz))
            if stufe == "A":
                for satz in erkl:
                    for zeichen in A_VERBOTEN:
                        if zeichen in satz:
                            hinweis.append("%s/A: %r im Satz %r - auf Pfad A vermeiden"
                                           % (unit, zeichen.strip(), satz[:60]))
                    for inhalt in A_EINSCHUB.findall(satz):
                        if A_WORT.search(inhalt):
                            hinweis.append("%s/A: Einschub '(%s)' - auf Pfad A vermeiden"
                                           % (unit, inhalt[:40]))

    bsp = block.get("beispiel")
    if bsp is not None:
        unbekannt = set(bsp) - BEISPIEL_FELDER
        if unbekannt:
            fehler.append("%s/%s beispiel: unbekannte Felder %s" % (unit, stufe, sorted(unbekannt)))
        if not bsp.get("aufgabe"):
            fehler.append("%s/%s beispiel: ohne Aufgabenstellung" % (unit, stufe))
        schritte = bsp.get("schritte") or []
        if len(schritte) < 2:
            fehler.append("%s/%s beispiel: weniger als zwei Schritte" % (unit, stufe))
        # Ein Musterbeispiel ohne Ergebnis laesst offen, worauf es hinauslief.
        if not bsp.get("ergebnis"):
            fehler.append("%s/%s beispiel: ohne Ergebnis" % (unit, stufe))
        luecke = bsp.get("luecke")
        if luecke is not None:
            if stufe != "A":
                fehler.append("%s/%s beispiel: Luecken gibt es nur auf Pfad A" % (unit, stufe))
            elif not (0 <= luecke.get("schritt", -1) < len(schritte)):
                fehler.append("%s/%s beispiel: Luecke zeigt auf Schritt %s von %d"
                              % (unit, stufe, luecke.get("schritt"), len(schritte)))


def karte_messen(karte):
    """Zeichen der zusammenhaengenden Erklaerung einer Lernkarte."""
    return (len(karte.get("hinfuehrung") or "")
            + len(" ".join(karte.get("erklaerung") or []))
            + len(karte.get("merke") or ""))


def main(argv):
    nur_pruefen = "--pruefen" in argv
    gewuenscht = [a for a in argv if not a.startswith("-")] or BEREICHE

    fehler = []
    hinweis = []
    geaendert = 0
    felder = 0
    ohne_inhalt = []
    laengen = {"A": [], "B": [], "C": []}

    for bereich in gewuenscht:
        inhalte = inhalte_des_bereichs(bereich)
        if not inhalte:
            ohne_inhalt.append(bereich)
            continue

        for unit in sorted(inhalte):
            datei = einheit_datei(unit)
            if not os.path.exists(datei):
                fehler.append("%s: units/.../tasks.json fehlt" % unit)
                continue

            daten = lies(datei)
            vorher = json.dumps(daten, ensure_ascii=False, sort_keys=True)

            for stufe in ("A", "B", "C"):
                block = inhalte[unit].get(stufe)
                if not block:
                    continue
                block_pruefen(unit, stufe, block, fehler, hinweis)
                karte = daten["lernkarten"][stufe]
                for feld in ("hinfuehrung", "erklaerung", "beispiel"):
                    if feld in block:
                        karte[feld] = block[feld]
                        felder += 1

                gemessen = karte_messen(karte)
                laengen[stufe].append(gemessen)
                unten, oben = LAENGE[stufe]
                if gemessen < unten:
                    hinweis.append("%s/%s: nur %d Zeichen (Richtwert ab %d)"
                                   % (unit, stufe, gemessen, unten))
                elif gemessen > oben:
                    hinweis.append("%s/%s: %d Zeichen (Richtwert bis %d) - Stufe verlassen?"
                                   % (unit, stufe, gemessen, oben))

            if json.dumps(daten, ensure_ascii=False, sort_keys=True) != vorher:
                geaendert += 1
                if not nur_pruefen:
                    schreib(datei, daten)

    print("Bereiche bearbeitet: %s" % ", ".join(b for b in gewuenscht if b not in ohne_inhalt))
    if ohne_inhalt:
        print("Noch ohne Inhaltsdatei: %s" % ", ".join(ohne_inhalt))
    print("%d Einheiten %s, %d Felder gesetzt"
          % (geaendert, "waeren geaendert worden" if nur_pruefen else "geaendert", felder))

    for stufe in ("A", "B", "C"):
        werte = laengen[stufe]
        if werte:
            print("  Pfad %s: %d Karten, %d Zeichen im Mittel (%d bis %d)"
                  % (stufe, len(werte), sum(werte) // len(werte), min(werte), max(werte)))

    if hinweis:
        print("\nHinweise (%d):" % len(hinweis))
        for h in hinweis[:30]:
            print("  · " + h)
        if len(hinweis) > 30:
            print("  … und %d weitere" % (len(hinweis) - 30))

    if fehler:
        print("\nFehler (%d):" % len(fehler))
        for f in fehler:
            print("  x " + f)
        return 1
    return 0


if __name__ == "__main__":
    sys.path.insert(0, HIER)
    sys.exit(main(sys.argv[1:]))
