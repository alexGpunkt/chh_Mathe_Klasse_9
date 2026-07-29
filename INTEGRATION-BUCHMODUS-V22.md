# V22 · Geprüfte Integration des mobilen Buchmodus

## Übernommen

- eine vertikal scrollbare Einheitsseite statt einer Smartphone-Doppelseite
- Zurück/Weiter durch 54 Einheiten
- Inhaltsverzeichnis nach Lernbereichen
- Sprung per Seitenzahl oder Kürzel
- lokale Lesezeichen
- dezente mobile Übergänge und 3-D-Andeutung erst ab 820 px
- Berücksichtigung von `prefers-reduced-motion`

## Beim Prüfen behoben

1. Das Anpassungspaket beruhte dokumentarisch teilweise auf V20 und hätte die
   geprüften V21-Angaben zurückgesetzt. Die Integration basiert deshalb auf V21.
2. `sw.js` verwendete wieder die alte V20-Cachekennung und enthielt weder
   `buch.css` noch `buch.js`. Beides wurde korrigiert.
3. Formelkarte und untere Navigation überlappten auf Smartphones um mindestens
   vier Pixel; auf Geräten mit Safe Area wäre die Überlagerung größer gewesen.
4. Der zusätzliche Leerraum blieb auch bestehen, wenn `units/index.json` nicht
   geladen werden konnte. Das Layout wird jetzt erst nach erfolgreicher
   Initialisierung über `html.buch-aktiv` aktiviert.
5. Das Inhaltsverzeichnis erhielt Fokusübergabe, Fokusbegrenzung, Rückkehr zum
   Auslöser, Scrollsperre und `aria-current=page`.
6. Ungültige oder alte Werte in `localStorage['mathe9.lesezeichen']` können den
   Modus nicht mehr abbrechen.

## Bewusste Grenze

Eine Buchseite entspricht weiterhin einer **Einheit**, nicht jeder einzelnen
Aufgabe. Beim Wechsel in eine andere Einheit wird die Seite neu geladen. Der
aktuelle In-Memory-Aufgabenstand der verlassenen Einheit wird durch die
bisherige Engine nicht wiederhergestellt. Eine spätere Fortschrittswiederaufnahme
ist daher eine sinnvolle eigenständige Erweiterung.

## Cache

```javascript
const VERSION = 'mathe9-v22-book-mode-develop';
```
