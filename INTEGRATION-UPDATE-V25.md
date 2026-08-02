# V25 · Lernwirkungs-Update integriert und technisch stabilisiert

## Ausgangslage

Das hochgeladene Update baut auf dem Buchmodus-Stand V22 auf und enthält die
inhaltlichen und technischen Erweiterungen V23/V24. Die Anpassungen wurden
nicht blind über die bestehende Struktur kopiert, sondern gegen den aktuellen
Stand geprüft. Projektinterne Git-Daten (`.git`) und lokale Werkzeugdaten
(`.claude/settings.local.json`) wurden bewusst nicht in die auslieferbare
Version übernommen.

## Gesamtbewertung

Die Anpassungen sind **didaktisch stark und für die Smartphone-Nutzung sehr
sinnvoll**. Besonders wertvoll sind die deutlich einfachere Sprache auf Pfad A,
die sofortige Nachfassaufgabe nach einer diagnostizierten Fehlvorstellung, die
antippbaren Fachbegriffe, die Selbsteinschätzung und die Vorhersagefragen vor
Animationen.

Vor der Integration war der Stand jedoch **noch nicht release-fertig**. Mehrere
Fehler hätten Fortschrittsdaten verfälscht, Eingaben beim Wechsel zur Erklärung
verloren, Animationen im Hintergrund weiterlaufen lassen oder Offlineaufrufe
mit Queryparametern scheitern lassen. Diese Punkte sind in V25 korrigiert.

## Übernommene fachliche und didaktische Verbesserungen

### Pfad A sprachlich vereinfacht

Alle 54 Lernkarten auf Pfad A wurden sprachlich überarbeitet. Im geprüften
Datenstand sank der Umfang von durchschnittlich rund 304 auf 172 Zeichen; die
Sätze liegen im Mittel bei ungefähr 5,4 Wörtern. Rechenwege, Lösungen sowie die
Pfade B und C blieben fachlich erhalten.

### Fachbegriffe auf Smartphones verständlich

Alle 54 Einheiten enthalten `worterklaerungen`. Insgesamt sind 284
Begriffsverwendungen erklärt, die 136 unterschiedliche Begriffe abdecken. Ein
Tipp auf einen markierten Begriff öffnet die Erklärung direkt im Lesefluss.

### Lernwirksame Rückmeldung

- Nach erkannter Fehlvorstellung kann direkt eine passende Nachfassaufgabe
  folgen.
- Rückmeldungen verlinken zurück zur Lernkarte.
- Pfad A erhält eine kleine Lücke im letzten Schritt der Beispielrechnung.
- Vor und nach den Aufgaben wird die Selbsteinschätzung mit dem Ergebnis
  verglichen.
- Die Anwendung empfiehlt bei eindeutigen Ergebnissen den nächsten oder einen
  niedrigeren Pfad, ohne die freie Wahl zu entfernen.
- Am Ende stehen drei Aufgaben aus früheren Themen bereit.

### Animationen und mobile Darstellung

- 18 Animationen beginnen mit einer Vorhersagefrage.
- Die neue Animation `signalwoerter` ergänzt PZ-14, KP-12 und SK-12.
- Mehrere fachlich falsche oder unpassend zugeordnete Animationen wurden
  korrigiert.
- Animationen laufen mit höchstens 25 Bildern pro Sekunde und nur im sichtbaren
  Bereich.
- Grafikhöhen, Querformat, Tabletbreiten, Regler, dunkler Modus und
  Bildschirmtastatur wurden berücksichtigt.

## Bei der Integration behobene Fehler

### 1. Exakter Aufgabenstand beim Öffnen der Erklärung

Vor V25 wurde die laufende Aufgabe beim Sprung zur Lernkarte neu gerendert.
Dabei gingen Eingaben, Rückmeldungen, genutzte Tipps, Versuchszahl und die
ursprüngliche Zeitmessung verloren. Besonders problematisch: Nach einem ersten
Fehlversuch konnte die Rückkehr zur Erklärung den nächsten Versuch wieder als
„auf Anhieb“ erscheinen lassen.

V25 parkt die vollständige Aufgaben-DOM in einem `DocumentFragment` und stellt
sie unverändert wieder her. Es entsteht kein zweites `task_view`-Ereignis; die
Rückkehr wird separat als `task_return` protokolliert.

### 2. Nachfassaufgaben verfälschten Pfadempfehlungen

Zusätzliche, teilweise leichtere Nachfassaufgaben veränderten bisher den Nenner
und damit die Empfehlung am Ende. V25 unterscheidet jetzt zwischen:

- ursprünglichen Kernaufgaben des gewählten Pfads und
- zusätzlich eingefügten Lernhilfen.

Selbsteinschätzung und Pfadempfehlung basieren nur auf den Kernaufgaben. Der
sichtbare Arbeitsfortschritt umfasst weiterhin alle tatsächlich bearbeiteten
Aufgaben.

### 3. Animationsschleifen und Observer wurden nicht beendet

Beim Wechsel der Stufe in der Galerie, beim Wechsel des Farbschemas oder beim
Verlassen einer Seite konnten alte `requestAnimationFrame`-Schleifen und
`IntersectionObserver` an bereits entfernten Elementen hängen bleiben.

V25 führt eine Host-basierte Registry mit explizitem Cleanup ein. Beim Ersetzen
oder Entfernen einer Animation werden Schleife, Eventlistener und Observer
beendet. Beim Verlassen der Seite wird ebenfalls aufgeräumt.

### 4. Falscher Play-Button wurde überwacht

Einige Animationen besitzen neben dem echten Play/Pause-Knopf weitere Knöpfe
mit derselben CSS-Klasse. Dadurch konnte die Sichtbarkeitslogik einen
„Nächster Schritt“-Knopf fälschlich als Play-Knopf behandeln. Der echte Knopf
hat jetzt die eindeutige Rolle `data-rolle="play"`.

### 5. Asynchrone Animationsfehler umgingen den Fallback

Der vorhandene Fehlerfang in `engine.js` konnte nur synchrone Fehler erfassen.
Der eigentliche Animationsbau erfolgt aber in `requestAnimationFrame`.
V25 fängt Fehler jetzt im asynchronen Builder selbst ab und zeigt einen lokalen
Fallback. Im Develop-Modus erscheint zusätzlich die technische Ursache.

### 6. Vorhersageantworten waren immer gleich angeordnet

Bei allen 18 Vorhersagefragen stand die richtige Antwort an erster Stelle.
V25 mischt die Reihenfolge bei jedem Aufbau, sperrt die Auswahl nach dem ersten
Tipp und protokolliert die Vorhersage getrennt als `animation_prediction`.

### 7. Dashboard zählte Antwortversuche als Aufgabenzeiten

`duration_ms` ist kumulativ seit Beginn einer Aufgabe. Das Dashboard behandelte
aber jeden Antwortversuch wie eine neue Aufgabe. Dadurch wurden Medianzeiten
und Festhänger mehrfach gezählt.

V25 gruppiert Ereignisse zu Aufgaben-Sitzungen:

- `task_view` eröffnet eine Sitzung,
- alle Antwortversuche werden derselben Sitzung zugeordnet,
- für die Dauer zählt nur der letzte kumulative Wert,
- offene und lange abgeschlossene Sitzungen erscheinen jeweils nur einmal.

Die Kennzahl heißt nun korrekt „Antwortversuche“. „Heute“ wurde in „letzte
24 Stunden“ umbenannt, weil genau dieses Zeitfenster technisch abgefragt wird.

### 8. Offlineaufruf mit Queryparametern

Der Service Worker speicherte `einheit.html`, suchte offline aber nach der
exakten URL `einheit.html?u=pz-05`. Eine noch nie online besuchte Einheit konnte
deshalb trotz vollständigem Cache fehlschlagen.

V25 normalisiert lokale Cache-Schlüssel auf Origin und Pfad. Das gilt auch für
Galeriefilter und weitere lokale Seiten mit Queryparametern.

### 9. Bildschirmtastatur auf älteren Android-WebViews

Die festen unteren Leisten wurden ausschließlich über CSS `:has()` ausgeblendet.
V25 ergänzt die JavaScript-Klasse `tastatur-aktiv` als Fallback. Nach einer
richtigen Eingabe wird das Feld zudem ent-fokussiert, damit die Tastatur und die
Navigation wieder sichtbar werden.

### 10. Ungeeignete automatische Lücke in PZ-05

Das automatische Verfahren blendet die Zahl rechts vom letzten
Gleichheitszeichen aus. In PZ-05 stand dort `60 € = 100 %`; damit wurde nach
100 statt nach dem gesuchten Grundwert gefragt. Die Zeile lautet jetzt
`100 % = 60 €`, sodass die Lücke den Grundwert 60 prüft.

### 11. Sicherere Ausgabe der Begriffserklärungen

Begriffe und Erklärungen aus JSON werden in Tooltip-Attributen und der
Formelkarte jetzt sicher escaped beziehungsweise über DOM-Knoten mit
`textContent` ausgegeben. Dadurch können Sonderzeichen das Markup nicht mehr
beschädigen.

## Geprüfter Projektstand

- 54 Einheiten
- 756 Aufgaben mit 756 eindeutigen IDs
- Pfad A/B/C: 216 / 324 / 216 Aufgaben
- 162 Lernkarten
- 41 registrierte Animationen
- 147 gültige Animationsverweise
- 88 externe Übungsverweise mit 51 unterschiedlichen URLs
- 65 gültige JSON-Dateien
- 284 von 284 verwendeten Wortspeicherbegriffen erklärt
- 136 unterschiedliche Begriffserklärungen ohne widersprüchliche Dubletten
- 93 vorhandene Service-Worker-Ressourcen
- alle JavaScript-Dateien mit `node --check` syntaktisch geprüft
- Dashboard-Sitzungsbildung mit mehreren Fehlversuchen und anschließend
  richtiger Lösung logisch getestet
- lokale HTML-, CSS-, JavaScript- und JSON-Verweise geprüft
- keine `.git`- oder `.claude`-Daten in der Auslieferung

## Grenzen der Prüfung

Nicht durchgeführt werden konnten:

- visuelle End-to-End-Prüfung in realen Smartphone-Browsern,
- Live-Test gegen das reale Supabase-Projekt,
- inhaltliche und technische Live-Prüfung aller externen Übungsseiten,
- Belastungstest mit einer vollständigen Klasse und schwachen Endgeräten.

Diese Punkte sollten vor einem Merge nach `master` auf echten Geräten getestet
werden.

## Weitere sinnvolle Verbesserungen

### Priorität 1 · vor Produktion

1. **Aufgabenstand dauerhaft speichern:** aktuelle Aufgabe, Eingaben,
   gelöste Aufgaben, Tipps und Pfad pro Schüler sichern und beim erneuten Öffnen
   mit „Weiterlernen“ anbieten.
2. **Explizite Aufgaben-Sitzungs-ID im Tracker:** `task_session_id` bereits beim
   `task_view` erzeugen und in jede Antwort übernehmen. Das macht die
   Dashboard-Auswertung auch bei Tabwechseln und Offline-Synchronisation
   eindeutig.
3. **Explizite Lückenmetadaten:** statt automatisch die letzte Zahl zu wählen,
   sollte die JSON-Datei festlegen, welcher Schritt und welcher Wert zur Lücke
   wird.
4. **Erklärungsverweise fachlich pflegen:** aktuell sind technisch genaue
   `verweis.absatz`-Ziele möglich, in den Daten aber noch nicht hinterlegt.
   Fehlvorstellungen sollten systematisch ihrer konkreten Erklärstelle
   zugeordnet werden.
5. **Nachfassabdeckung erhöhen:** derzeit ist eine passende Wiederholung für
   ungefähr 33 % der A-, 47 % der B- und 38 % der C-Fehlvorstellungs-/Pfad-Paare
   verfügbar. Weitere Aufgaben können mit bestehenden IDs getaggt werden.
6. **Service-Worker-Updatehinweis:** statt manueller Cache-Schritte sollte die
   App anzeigen „Neue Version verfügbar“ und nach Zustimmung kontrolliert neu
   laden.
7. **Echte Gerätetests:** mindestens iPhone/Safari, Android/Chrome,
   Android/Firefox, ein älteres günstiges Android-Gerät und Tablet testen.

### Priorität 2 · Qualität und Wartbarkeit

8. **JSON-Schema für Einheiten:** Typen, Antworten, Animationen,
   Fehlvorstellungen, Worterklärungen und externe Links automatisch validieren.
9. **GitHub-Actions-Prüfung:** bei jedem Push JSON, JavaScript, doppelte IDs,
   Service-Worker-Dateien, lokale Links und Animationsverweise prüfen.
10. **Buchfortschritt und Aufgabenfortschritt klar trennen:** zum Beispiel
    „Buchseite 18 von 54“ und „Aufgabe 3 von 6“ statt zweier unbenannter
    Prozentanzeigen.
11. **Nutzersteuerung für Bewegung:** zusätzlich zu
    `prefers-reduced-motion` einen sichtbaren Schalter „Animationen automatisch
    abspielen“ anbieten und pro Schüler speichern.
12. **Barrierefreiheits-Audit:** Screenreader, Tastatur, Zoom 200 %, Kontrast,
    Touchziele, Fokusreihenfolge und dynamische Statusmeldungen systematisch
    prüfen.
13. **Lehrer-Deep-Links:** direkte Links zu Einheit, Pfad, Lernkarte,
    Erklärabsatz oder konkreter Aufgabe erzeugen.
14. **Linkprüfung externer Übungen:** automatisierter regelmäßiger Check auf
    HTTP-Fehler und Weiterleitungen; fachliche Freigabe bleibt Aufgabe der
    Lehrkraft.
15. **Fehlerdiagnose im Develop-Modus:** optional ein exportierbares
    Diagnoseprotokoll mit App-Version, Browser, Cache-Version und letztem
    JavaScriptfehler anbieten.

### Priorität 3 · pädagogischer Ausbau

16. **Pfadempfehlung erst nach ausreichender Datenbasis:** bei sehr kurzen
    Reihen oder vielen Hilfen die Empfehlung als unsicher kennzeichnen.
17. **Lernzielstatus im Inhaltsverzeichnis:** „noch nicht begonnen“, „begonnen“,
    „abgeschlossen“ und „Wiederholung fällig“ anzeigen.
18. **Weiterlernen-Kachel auf der Startseite:** letzte Einheit und Aufgabe
    direkt fortsetzen.
19. **Lehrkraftansicht für Vorhersagen:** Anteil richtiger
    Animationsvorhersagen je Konzept, getrennt von Aufgabenleistungen.
20. **Datenschutz und Aufbewahrung:** Löschfristen, Export, Rollenrechte und
    Zweckbindung der Ereignisdaten im Dashboard dokumentieren und technisch
    abbilden.

## Cache und Commit

```javascript
const VERSION = 'mathe9-v25-integration-stability-develop';
```

Empfohlene Commit-Nachricht:

```text
Integrate learning-impact update and fix mobile stability
```
