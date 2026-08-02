# V23 · Niveaustufe A sprachlich gesenkt, Animationen geprüft

## Ausgangsbefund

Die Lernkarten der Stufe A waren **so lang wie die der Stufe B** (304 gegenüber
301 Zeichen im Mittel für Hinführung, Erklärung und Merksatz). Die Hinführung
war durchgehend die literarischste Zeile der ganzen Karte — mit Metaphern
(„Zinsen sind die Miete fürs Geld“, „wie ein Türcode“, „Ein Graph erzählt eine
Geschichte“), Nebensätzen und Gedankenstricheinschüben. Für einen Pfad auf
Niveaustufe D–E mit hohem DaZ-Anteil ist genau das die Hürde vor der Mathematik.

## Texte · alle 54 Einheiten, Stufe A

Neu geschrieben wurden `hinfuehrung`, `erklaerung`, `merke` und — wo verschachtelt —
der Aufgabentext des Beispiels. **Rechenwege, Ergebnisse, Aufgaben, Stufen B und C
sind unverändert.**

Regeln:

- Hinführung: genau **ein** kurzer Hauptsatz.
- Erklärung: zwei Einträge, je ein bis zwei kurze Hauptsätze.
- keine Metaphern, keine Nebensätze, keine Einschübe in Klammern
- keine Abkürzungen („bzw.“, „z. B.“, „ca.“)
- Fachwörter bleiben — sie stehen im Wortspeicher und sind das Lernziel;
  alles andere ist Alltagssprache

| | vorher | nachher |
|---|---:|---:|
| Zeichen je A-Karte (Ø) | 304 | **172** |
| Wörter je Satz (Ø) | — | **6,0** |
| Zeichen je B-Karte (Ø) | 301 | 301 |
| Zeichen je C-Karte (Ø) | 364 | 364 |

Die Stufen sind damit erstmals sprachlich unterscheidbar und nicht nur
mathematisch.

## Animationen · sachlich falsch, jetzt behoben

1. **Koordinatenfeld skalierte beide Achsen gleich.** Bei `nullstelle` Stufe C
   (0…7 Stunden gegen −40…100 Liter) ergab das ein SVG mit `viewBox 360 × 6440`
   — ein Bild im Verhältnis **1 : 18**, auf dem Handy unbrauchbar. `tarifvergleich`
   lag bei 1 : 3. `Feld()` hält die Kästchen jetzt quadratisch, solange das
   Verhältnis unter 1,6 bleibt (nötig fürs Steigungsdreieck), und skaliert die
   Achsen erst darüber getrennt. Höchstes Verhältnis jetzt: **1 : 1,53**.
2. **Dasselbe Feld zeichnete jede Gitterlinie einzeln** — bei `nullstelle` C
   141 Linien übereinander, also eine graue Fläche; die Achse war mit
   14, 28, 42 … beschriftet. Gitter und Beschriftung laufen jetzt in
   „netten“ Schritten (1, 2, 5, 10, 20 …).
3. **Quadernetz KP-03 (Stufen B und C) war falsch.** Es zeigte fünf statt
   sechs Flächen, die Rechtecke überlappten einander, und die angezeigte Summe
   war **44 cm²**, während direkt daneben `O = 2·(a·b + a·c + b·c)` stand — also
   52 cm². Das Netz ist jetzt ein sauberes Kreuz aus sechs überschneidungsfreien
   Flächen; die Summe ist 52 cm² und stimmt mit der Lernkarte überein.
4. **KP-11 Stufe C zeigte einen Quader mit rechteckigem Loch**, rechnete aber
   mit Zylindervolumen (785 − 502,4). Jetzt steht dort das Rohr der Lernkarte,
   mit Maßen beschriftet.
5. **KP-11 Stufe B zeigte denselben zusammengesetzten Körper wie Stufe A** —
   auf A mit 40 cm³, auf B mit 50 cm³. Stufe B zeigt jetzt den Vollquader
   der Lernkarte, dessen Masse mitwächst.
6. **SK-11 Stufe B zeigte das Silo**, während die Karte die Eistüte rechnet.
   A und B sind jetzt die Eistüte, C das Silo — beide mit Maßen, die Zahlen
   fielen vorher vom Himmel.
7. **`tarifvergleich` rief im Schnittpunkt einen Sieger aus**, obwohl beide
   Tarife dort gleich viel kosten — genau an der Stelle, um die es geht.
8. **`schaetzen` Stufe B nannte einen Ankerwert, der die Schätzung nicht trug**
   („nächster Ankerwert: 50 % → Schätzung ≈ 40 %“). Jetzt wird eingeordnet
   („zwischen 25 % und 50 %, näher an 50 %“) und daraus geschätzt.
9. Beschriftungen am rechten Streifenrand wurden abgeschnitten; die Ausrichtung
   richtet sich jetzt nach der Lage auf dem Streifen.
10. Kleinigkeiten: fehlende Einheit bei KP-05, doppelte Zuweisung mit ungültigem
    `<tspan>` in KP-11, tote Referenz in `zinsen`.

## Animationen · für Stufe A ungeeignet, jetzt überarbeitet

Auffällig war ein Muster: **die Basisstufe bekam die ärmste Darstellung.**

- **`volpyr` und `volkegel`:** Stufe A war ein Standbild mit der Formel; die
  Füllanimation „3 Pyramiden füllen 1 Prisma“ gab es nur in der Vertiefung.
  Genau der Faktor ⅓ ist aber das, was man *sehen* muss. Die Füllung läuft
  jetzt auf allen drei Stufen, nur der Rechenweg unterscheidet sich.
- **`grundgroessen` Stufen A und B:** ein fester Satz und ein Abspielknopf, der
  nichts bewegte. Jetzt wandert die Markierung zwischen „das Ganze“ (Grundwert)
  und „der Teil“ (Prozentwert) — die Unterscheidung, um die es geht.
- **`rueckwaerts` Stufe A:** nur ein Textwechsel, das Bild stand still. Jetzt
  füllt sich der Körper (Rauminhalt) und die Umrisslinie wird nachgezogen
  (Außenhaut).
- **`obpyr` Stufe A:** es leuchteten nacheinander alle vier Seitendreiecke auf,
  während der Text von **einem** sprach. Jetzt ist immer genau eines hervorgehoben.
- **`gleichung` (Waagemodell):** Die Waage stand nur als Bild daneben. Der Kern
  des Modells ist, dass auf **beiden** Schalen dasselbe passiert — die Umformung
  steht jetzt unter beiden Schalen.

## Animationen · falsch zugeordnet, jetzt über Optionen getrennt

Mehrere Einheiten teilen sich eine Animation. Bisher wurde dafür die
**Niveaustufe** missbraucht: `zinsen` Stufe B hieß „3 Monate“ und Stufe C
„Zinseszins“ — also zeigte PZ-12 (Monatszinsen) auf Stufe A die Jahreszinsen
und PZ-13 (Zinseszins) ebenfalls. Die Stufe meint jetzt wieder die Niveaustufe;
das Thema steht daneben:

```jsonc
"visual": { "type": "animation", "name": "zinsen", "stufe": "A", "thema": "zeit" }
```

| Einheit | neu |
|---|---|
| PZ-09 | `veraenderung` + `"thema": "rabatt"` |
| PZ-10 | `veraenderung` + `"thema": "richtung"` (vorher: Rabattbild) |
| PZ-11 | `zinsen` + `"thema": "jahr"` (A sucht Z, B sucht p, C sucht K) |
| PZ-12 | `zinsen` + `"thema": "zeit"` (A halbes Jahr, B m/12, C Laufzeit zurück) |
| PZ-13 | `zinsen` + `"thema": "eszins"` (A Tabelle, B K·qⁿ, C Vergleich) |
| SK-05 | `rueckwaerts` + `"form": "pyramide"` |
| SK-09 | `rueckwaerts` + `"form": "kegel"` (vorher: Pyramide auf der Kegeleinheit) |
| LF-13 | `schnittpunkt` + `"rechnung": true` (A zeigte nur das Ablesen) |

`ANIM.block()` reicht dafür das ganze `visual`-Objekt an die Animation durch.
Fehlt eine Option, bleibt es beim bisherigen Verhalten.

## Animationen laufen nur noch sichtbar

Auf einer Einheitenseite liefen bisher mehrere Endlosschleifen gleichzeitig —
auch weit außerhalb des Bildschirms. Ein `IntersectionObserver` startet eine
Animation jetzt beim Einscrollen und pausiert sie beim Verlassen. Wer selbst
auf Pause drückt, behält die Pause auch beim Zurückscrollen.
`prefers-reduced-motion` gilt unverändert vorrangig.

## Geprüft

- 135 Varianten (40 Animationen × 3 Stufen, dazu alle `thema`/`form`-Kombinationen)
  bauen ohne Fehler; kein Text liegt außerhalb seines viewBox-Rahmens
- alle 65 JSON-Dateien gültig; außerhalb von `lernkarten.A` und den
  `visual`-Feldern hat sich in den Einheiten nichts geändert

## Cache

```javascript
const VERSION = 'mathe9-v23-stufe-a-animationen-develop';
```
