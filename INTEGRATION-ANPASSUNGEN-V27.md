# V27 · Prüfung und Integration der aktuellen Anpassungen

## Ergebnis in einem Satz

Die hochgeladene V26-Erweiterung ist fachlich und didaktisch ein deutlicher
Fortschritt. In der gelieferten Form war sie jedoch noch nicht sicher als
aktueller Develop-Stand einsetzbar: insbesondere die Wiederaufnahme laufender
Aufgaben, die Trennung mehrerer Schüler auf einem Gerät, Service-Worker-Updates,
Diagnosedaten und einige Prüfwerkzeuge mussten nachgebessert werden. Diese
Punkte sind in V27 integriert und korrigiert.

## Gesamtbewertung

### Didaktik: sehr gut

Besonders sinnvoll sind:

- dauerhafte Wiederaufnahme statt Verlust des Bearbeitungsstands,
- direkte Nachfassaufgaben nach diagnostizierten Denkfehlern,
- explizite Lücken in Beispielrechnungen,
- Verweise von Fehlvorstellungen auf passende Erklärabsätze,
- Vorhersagefragen vor Animationen,
- Selbsteinschätzung und vorsichtig formulierte Pfadempfehlungen,
- Lernstatus, Inhaltsverzeichnis und Weiterlernen-Kachel,
- klare Trennung von Buchseite und Aufgabenfortschritt.

### Technische Architektur: gut, nach V27 deutlich stabiler

Die Erweiterung bleibt beim bisherigen Ansatz ohne Framework und Build-Schritt.
Daten, Rendering, Tracking, Buchnavigation und Offlinebetrieb bleiben getrennt.
JSON-Schema und GitHub Actions verbessern die Wartbarkeit erheblich.

### Produktionsreife: noch nicht vollständig

Der lokale Projektstand ist strukturell und in simulierten Browserläufen
funktionsfähig. Vor einer Veröffentlichung auf `master` bleiben reale Geräte-
und Supabase-Tests sowie eine strengere Lehrkraft-Autorisierung erforderlich.

---

# In V27 vorgenommene Integrationskorrekturen

## 1. Laufende Aufgaben vollständig wiederherstellen

Die ursprüngliche V26-Speicherung merkte zwar Aufgabe und Entwurf, stellte nach
einem Neuladen aber nicht den vollständigen Bearbeitungszustand wieder her.
V27 speichert und rekonstruiert jetzt zusätzlich:

- dynamische Aufgabenreihenfolge einschließlich Nachfassaufgaben,
- bereits eingesetzte Nachfassaufgaben,
- aktuelle Fehlversuche,
- bereits verwendete Tipps,
- bisherige Bearbeitungszeit,
- Gesamtzahl verwendeter Tipps,
- aktuelle Fehlvorstellung,
- dieselbe `task_session_id`.

Eine wiederaufgenommene Aufgabe kann dadurch nicht erneut als „auf Anhieb"
gewertet werden. Nach einer bereits richtig gelösten Aufgabe wird beim nächsten
Start außerdem korrekt mit der folgenden Aufgabe fortgesetzt.

## 2. Eingabewert `0` bleibt erhalten

Der Entwurf einer Zahleneingabe mit dem Wert `0` konnte durch eine Wahrheitswert-
prüfung verloren gehen. V27 prüft ausdrücklich auf `null` beziehungsweise
`undefined`; die Eingabe `0` wird wiederhergestellt.

## 3. Unvollständige oder ungültige Eingaben zählen nicht als Fehlversuch

Leere Felder, unvollständige Zuordnungen und Texte, die keine Zahl ergeben,
werden nicht als fachlicher Fehlversuch gezählt. Dadurch bleiben Diagnose,
Erstversuchsquote und Pfadempfehlung belastbarer.

## 4. Gespeicherter Stand je Schüler statt je Gerät

V26 hatte den letzten Lernort und das lokale Fehlerprofil teilweise noch
anlagenweit gespeichert. Auf gemeinsam verwendeten Smartphones hätte Kind B
dadurch den letzten Lernort oder Schwierigkeiten von Kind A sehen können.

V27 trennt jetzt je Schülerkennung:

- Zwischenstände,
- zuletzt bearbeitete Einheit,
- Lesezeichen,
- lokale Fehlvorstellungsprofile.

Alte globale Daten werden nur in das nicht angemeldete lokale Profil migriert,
niemals automatisch in ein Schülerkonto.

## 5. Echtes Löschen statt gespeicherter `null`-Werte

`Speicher.loesche()` entfernt lokale Schlüssel tatsächlich. Abgelaufene oder
verworfene Zwischenstände hinterlassen dadurch keine scheinbar vorhandenen
Datensätze mehr.

## 6. Deep-Links haben zuverlässig Vorrang

Ein Lehrerlink mit einer konkreten Aufgabe wird nicht mehr von einem lokalen
Zwischenstand unterbrochen. Fehlt `p=`, wird der Pfad aus der eindeutigen
Aufgaben-ID bestimmt. Auch ein reiner Pfadlink überschreibt den gespeicherten
Pfad bewusst.

Beispiele:

```text
einheit.html?u=lf-04&p=B
einheit.html?u=lf-04&aufgabe=LF04-B2-003
einheit.html?u=pz-05&p=A&abschnitt=beispiel
```

## 7. Kein falscher Fortschritts-Reset bei Wiederaufnahme

Beim Wiederaufnehmen wurde dem Dashboard kurzzeitig ein Fortschritt von null
übertragen, bevor der gespeicherte Wert erschien. V27 sendet unmittelbar den
wiederhergestellten Stand.

## 8. Aufgaben-Sitzungs-ID wird sauber beendet

Wenn der Tracker-Kontext die aktuelle Aufgabe auf `null` setzt, wird auch eine
alte `task_session_id` entfernt. Herzschläge oder Navigationen nach dem
Aufgabenende werden damit nicht einer bereits abgeschlossenen Aufgabe
zugerechnet.

## 9. Weiterlernen-Kachel nur bei sinnvoller Fortsetzung

Eine gerade vollständig abgeschlossene Einheit erscheint nicht mehr als
„Weiterlernen". Die Kachel wird nur bei begonnenen oder zur Wiederholung
anstehenden Einheiten angezeigt.

## 10. Service Worker atomar installiert

V26 fing Fehler beim Vorladen einzelner Dateien ab und konnte dadurch einen
unvollständigen neuen Cache aktivieren. V27 installiert eine neue Fassung nur,
wenn alle verpflichtenden Dateien erfolgreich gespeichert wurden. Scheitert
eine Datei, wird der angefangene neue Cache gelöscht und die alte Version bleibt
intakt.

## 11. Nur projektzugehörige Caches werden gelöscht

Beim Aktivieren oder über das Entwicklermenü werden ausschließlich Caches mit
dem Präfix `mathe9-` entfernt. Andere GitHub-Pages-Anwendungen unter derselben
Domain bleiben unberührt.

## 12. Direkte Einstiegsseiten registrieren Updates korrekt

`animationen.html` und `uebungen.html` laden nun ebenfalls `store.js`. Dadurch
funktionieren Service-Worker-Registrierung und Updatehinweis auch, wenn eine
dieser Seiten direkt als erste Projektseite geöffnet wird.

## 13. Diagnoseexport datensparsamer

Der vollständige interne Engine-Zustand wird nicht mehr global freigegeben.
Stattdessen existiert eine begrenzte Diagnose-Schnittstelle mit:

- Einheit,
- Pfad,
- Aufgabe,
- Aufgaben-Sitzungs-ID,
- Position und Umfang.

Der Export enthält keine Schüler-ID und löscht beim Cachetest nur eigene
Projektcaches. Die Bedienelemente im Entwicklermenü besitzen mindestens 44 px
Touchhöhe.

## 14. Dashboard: Folgeantwort zur Animation enger zugeordnet

Eine Antwort gilt nur dann als Folge einer Vorhersage, wenn sie:

- vom selben Schüler stammt,
- in derselben Einheit und demselben Pfad erfolgt,
- nach der Vorhersage liegt,
- innerhalb von 15 Minuten eintrifft.

Dadurch werden spätere, fachlich unverbundene Antworten seltener als
„Lernwirkung der Animation" fehlgedeutet.

## 15. Projektprüfung verschärft

`werkzeuge/pruefen.js` prüft zusätzlich:

- Übereinstimmung aller 54 Einheiten mit `units/index.json`,
- Titel, Aufgabenanzahl und Einheitscode,
- Sollverteilung A/B/C = 4/6/4 je Einheit,
- echte Animationsdefinitionen statt beliebiger interner `id`-Felder,
- fehlende Offlinecache-Dateien als Fehler statt als Hinweis,
- `devMode` sowohl für `develop` als auch für `master`,
- tatsächliche Änderung der Cache-Version gegenüber dem Zielzweig,
- grundlegende Struktur von `supabase/setup.sql`.

Der frühere Zähler hatte zwei interne SVG-IDs als Animationen gezählt. Der
korrekte Stand lautet 41 Animationen, nicht 43.

## 16. GitHub Actions erhält die nötige Historie

`actions/checkout` verwendet `fetch-depth: 0`. Erst dadurch kann die Prüfung
die Cache-Version zuverlässig mit dem Zielzweig vergleichen.

## 17. Statische Touchzielprüfung präzisiert

Kleine sichtbare Checkboxen oder Slider-Daumen werden nicht mehr fälschlich als
zu kleine Bedienfläche gemeldet, wenn ihr umgebendes Bedienelement mindestens
44 px hoch ist. Die Zeilen der Kompetenzmatrix besitzen nun selbst mindestens
44 px Höhe.

## 18. Verteilungsarchiv bereinigt

Nicht in eine auslieferbare Projektversion übernommen wurden:

- `.git/`,
- `.claude/`,
- die interne Planungsdatei `anpassungen.txt`.

Drei historische Integrationsdokumente, die im Upload fehlten, wurden aus dem
letzten geprüften Stand wiederhergestellt.

## 19. Dokumentation korrigiert

Korrigiert wurden unter anderem:

- 41 Animationen und 123 A/B/C-Varianten,
- 66 JSON-Dateien,
- aktuelle Nachfassabdeckung A 33 %, B 49 %, C 42 %,
- Cache-Version und Upload-Anleitung für V27.

---

# Validierung des integrierten Stands

## Struktur und Daten

| Bestandteil | Ergebnis |
|---|---:|
| Lernbereiche | 4 |
| Einheiten | 54 |
| Aufgaben | 756 |
| Pfad A / B / C | 216 / 324 / 216 |
| Lernkarten | 162 |
| explizite Beispiellücken | 42 |
| Fehlvorstellungs-Vorkommen | 800 |
| Fehlvorstellungs-/Einheits-/Pfad-Paare | 552 |
| konkrete Absatzverweise | 77 |
| Animationen | 41 |
| Animationsverweise | 147 |
| externe Übungsverweise | 88 |
| unterschiedliche externe URLs | 51 |
| JSON-Dateien insgesamt | 66 |
| Service-Worker-Ressourcen | 93 |

## Nachfassabdeckung

Nach Zusammenfassung eng verwandter Fehlvorstellungs-IDs:

| Pfad | mit verfügbarer zweiter Aufgabe |
|---|---:|
| A | 43 von 132 · 33 % |
| B | 89 von 183 · 49 % |
| C | 97 von 230 · 42 % |
| Gesamt | 229 von 545 · 42 % |

## Automatische Prüfungen

Erfolgreich ausgeführt:

- JSON-Schema für alle 54 Einheiten,
- 756 eindeutige Aufgaben-IDs,
- Einheitenverzeichnis und Sollverteilung 4/6/4,
- Auswahl-, Zuordnungs-, Lücken- und Absatzreferenzen,
- 147 Animationsverweise auf 41 vorhandene Animationen,
- 93 vorhandene Offlinecache-Ressourcen,
- 88 externe Übungsverweise mit freigegebenen HTTPS-Hosts,
- Syntax aller JavaScript-Dateien,
- statische Barrierefreiheitsprüfung von 9 Seiten und 287 Bildern,
- grundlegende SQL-Strukturprüfung,
- keine Merge-Konfliktmarker,
- keine lokalen Verwaltungsordner im Verteilerstand.

## Simulierte Browserläufe

Mit Chromium und lokal injizierten Projektdateien geprüft:

- Wiederaufnahme einer Aufgabe nach Fehlversuch und Tipp,
- Wiederherstellung einer bereits eingetragenen `0`,
- Beibehaltung der Aufgaben-Sitzungs-ID,
- kein erneutes Zählen als „auf Anhieb",
- Fortsetzung mit der nächsten Aufgabe nach korrekter Lösung,
- Deep-Link auf eine Aufgabe ohne zusätzliches `p=`,
- Vorrang eines Lehrerlinks vor gespeichertem Fortschritt,
- alle 41 Animationen in A, B und C: 123 Varianten ohne Laufzeitfehler,
- lokale Trennung von Zwischenstand und Fehlerprofil zwischen zwei Schülern.

## Nicht vollständig geprüft

- reale Darstellung auf physischen Smartphones,
- Live-Anmeldung und Datentransfer mit dem echten Supabase-Projekt,
- tatsächliche Ausführung des SQL-Skripts in PostgreSQL,
- fachlicher Inhalt und aktuelle Erreichbarkeit sämtlicher Drittanbieterlinks,
- Screenreader, 400-%-Zoom und reale Farbkontrastmessung.

---

# Detaillierte Verbesserungsvorschläge

## Priorität A · vor einem Merge nach `master`

### 1. Lehrkraftrolle in Supabase wirklich autorisieren

Aktuell werden alle Supabase-Nutzer mit der Rolle `authenticated` wie
Lehrkräfte behandelt. Das ist nur sicher, wenn es garantiert keinerlei andere
authentifizierte Konten gibt. Besser:

- Tabelle `mathe9_teachers` mit freigegebenen Auth-UIDs oder
- Custom Claim `role = teacher`,
- RLS-Policies und Verwaltungsfunktionen prüfen diese Rolle explizit.

Dies ist der wichtigste offene Sicherheitsblocker.

### 2. Schüler-Schreibzugriffe an eine geprüfte Anmeldung binden

Die anonyme App darf Ereignisse und Fortschritt für eine beliebige nichtleere
`student_id` schreiben. Die Freigabelistenprüfung verhindert zwar normale
Fehlbedienung, bindet die ID aber nicht kryptografisch an den Schreibzugriff.
Robuster wäre:

- kurzlebiges signiertes Sitzungstoken nach erfolgreicher RPC-Anmeldung,
- Schreiben über eine Supabase Edge Function oder
- echte, stark eingeschränkte Schülerauthentifizierung.

### 3. Aufräumfunktion wirklich planen

`mathe9_aufraeumen()` löscht nur, wenn die Funktion aufgerufen wird. Für die
versprochenen Fristen ist ein wöchentlicher `pg_cron`-Job oder ein dokumentierter
manueller Prozess nötig. Der letzte Lauf sollte protokolliert und im Dashboard
sichtbar sein.

### 4. Datenbankmigration mit Backup und Rollback

Vor dem erneuten Ausführen von `supabase/setup.sql`:

- Tabellen exportieren,
- Migration in einem Testprojekt ausführen,
- vorhandene Constraints und Daten prüfen,
- Rückkehrplan dokumentieren.

Das SQL wurde lokal strukturell, aber nicht gegen eine echte PostgreSQL-
Instanz ausgeführt.

### 5. Reale Smartphone-Testmatrix abarbeiten

Mindestens:

- iPhone/Safari,
- aktuelles Android/Chrome,
- günstiges älteres Android-Gerät,
- Firefox auf Android,
- Tablet hoch und quer,
- online, instabile Verbindung und vollständig offline.

Besonders zu prüfen: Bildschirmtastatur, feste Navigation, Inhaltsverzeichnis,
Animationen, Updateleiste und Wiederaufnahme nach Browserneustart.

### 6. Produktionsbuild automatisieren

Ein eigenes Skript sollte beim Release:

- `devMode: false` setzen,
- Testschüler-Bypass ausschalten,
- Produktions-Cache-Version vergeben,
- Diagnosemenü entfernen oder deaktivieren,
- alle Prüfungen erneut ausführen.

So kann der Develop-Stand nicht versehentlich unverändert auf `master` landen.

## Priorität B · Stabilität und Datenqualität

### 7. Browser-Smoke-Tests in GitHub Actions

Die aktuelle CI ist statisch. Ergänzt werden sollten automatisierte Tests mit
Playwright für:

- Einheit laden,
- Pfad wählen,
- Lernkarte öffnen,
- Aufgabe beantworten,
- Erklärung öffnen und zurückkehren,
- Stand speichern und nach Reload fortsetzen,
- Offlineaufruf mit Queryparametern,
- Buchnavigation und Deep-Link.

### 8. Dashboard konsequent nach `task_session_id` gruppieren

Die ID wird bereits erfasst, die Auswertung verwendet jedoch teilweise noch
Reihenfolge und Zeitfenster. Sitzungen sollten primär über
`payload.task_session_id` zusammengeführt und nur bei alten Daten über eine
Heuristik rekonstruiert werden.

### 9. Versionierte Migration lokaler Zwischenstände

Der Stand trägt bereits `version: 2`. Es fehlt noch eine zentrale Migration:

- unbekannte neuere Version nicht laden,
- alte Versionen gezielt umwandeln,
- beschädigte Datensätze protokolliert verwerfen,
- optional Diagnosehinweis im Develop-Modus.

### 10. Optionaler Cloud-Abgleich des Lernstands

LocalStorage gilt nur für dieses Gerät und diesen Browser. Für wechselnde
Schulgeräte wäre ein datensparsamer Cloud-Stand sinnvoll. Dabei nur nötige
Felder speichern, nicht komplette Eingaben oder Lösungstexte.

### 11. „Lokale Daten löschen" beim Abmelden

Die Konten sind zwar voneinander getrennt, aber Daten bleiben 45 Tage auf dem
Gerät. Auf gemeinsam genutzten Geräten sollte beim Abmelden optional angeboten
werden:

> Nur abmelden · Abmelden und lokale Lernstände dieses Kontos löschen

### 12. Externe Linkprüfung planmäßig ausführen

Der Linkchecker läuft derzeit nur manuell. Sinnvoll wäre ein wöchentlicher
Workflow mit Bericht oder GitHub Issue bei Ausfällen. Fachliche Qualität und
Datenschutz der Zielseiten bleiben weiterhin manuell zu prüfen.

### 13. Updatefehler sichtbar machen

Scheitert die Installation einer neuen Offlinefassung, bleibt korrekt die alte
Version aktiv. Zusätzlich sollte die Develop-Oberfläche anzeigen:

- aktuelle Cache-Version,
- wartende Version,
- letzter Updatefehler,
- fehlgeschlagene Ressource.

### 14. Diagnosebericht um Projektmanifest ergänzen

Eine kleine `version.json` könnte enthalten:

- Projektversion,
- Builddatum,
- Commit-SHA,
- Datenstand,
- Cache-Version.

Damit lässt sich ein Schüler-Screenshot eindeutig einem Codebestand zuordnen.

## Priorität C · Pädagogische Qualität

### 15. Absatzverweise fachlich manuell überprüfen

77 Verweise wurden regelbasiert erzeugt. Jeder sollte stichprobenartig oder
vollständig fachlich geprüft werden. Ein falscher Verweis ist didaktisch
schlechter als der allgemeine Rückfall zur Animation oder zum Merksatz.

### 16. Nachfassabdeckung gezielt erweitern

58 % der zusammengefassten Fehlvorstellungs-/Pfad-Paare besitzen noch keine
zweite passende Aufgabe. Priorität sollten häufige, folgenreiche Denkfehler
haben. `node werkzeuge/nachfass-luecken.js` liefert die konkrete Arbeitsliste.

### 17. Nachfassaufgaben nicht nur über ID-Stämme koppeln

Der Wortstamm ist transparent, aber begrenzt. Langfristig wäre ein eigenes Feld
sinnvoll:

```json
"konzeptfehler": "grundwert_prozentwert_vertauscht"
```

Mehrere konkrete Fehlvorstellungs-IDs könnten dann kontrolliert derselben
fachlichen Kategorie zugeordnet werden.

### 18. Pfadempfehlung mit Einstufungsaufgaben kalibrieren

Die Schwellen 50 % und 80 % sowie die Regel „ein Tipp pro Aufgabe" sind
plausibel, aber noch nicht empirisch kalibriert. Nach einer Testphase sollten
Empfehlung und tatsächlicher Erfolg auf dem empfohlenen Pfad verglichen werden.

### 19. Lernstatus um „mehrfach begonnen" und „sicher beherrscht" erweitern

`offen`, `begonnen`, `fertig`, `wiederholen` sind verständlich. Ergänzend könnte
zwischen einmaligem Abschluss und später bestätigter Beherrschung unterschieden
werden. Das verhindert, dass ein einmaliges Durchlaufen dauerhaft als sicher
gelernt gilt.

### 20. Nächste sinnvolle Einheit statt abgeschlossener Weiterlernen-Kachel

Nach Abschluss könnte die Startseite nicht einfach keine Kachel zeigen, sondern
anbieten:

> Kapitel fortsetzen: nächste Einheit

Dabei sollte die Lehrkraft die Reihenfolge optional sperren oder freigeben
können.

## Priorität D · Barrierefreiheit und Bedienung

### 21. Screenreader- und Fokus-Test durchführen

Die statische Prüfung ersetzt keinen Test mit VoiceOver, TalkBack oder NVDA.
Insbesondere dynamische Rückmeldungen sollten über geeignete Live-Regionen
angekündigt werden, ohne jede kleine Änderung mehrfach vorzulesen.

### 22. Kontrastwerte automatisch messen

Die CSS-Prüfung erkennt keine tatsächlich berechneten Farbkontraste. Ein
Browser-Audit sollte helle und dunkle Darstellung, Pfadfarben, Warnungen,
Diagrammbeschriftungen und deaktivierte Bedienelemente prüfen.

### 23. Animationen vollständig ohne Bewegung nutzbar machen

`prefers-reduced-motion` und der Autostartschalter sind vorhanden. Zusätzlich
sollte jede Animation einen aussagekräftigen statischen Endzustand und eine
textliche Kernaussage besitzen, sodass kein Lernziel von Bewegung abhängt.

### 24. Touch- und Einhandbedienung testen

Für 320–390 px Breite prüfen:

- Daumenreichweite der Hauptaktionen,
- keine horizontale Seitenscrollleiste,
- keine Überlagerung durch Tastatur oder Safe Area,
- ausreichend Abstand zwischen „Prüfen", „Tipp" und Navigation.

---

# Empfohlener nächster Schritt

V27 zunächst auf `develop` hochladen. Danach:

1. GitHub-Actions-Prüfung abwarten,
2. SQL in einem Supabase-Testprojekt ausführen,
3. Lehrkraft- und Schülerlogin live testen,
4. Geräteprotokoll abarbeiten,
5. erst nach Absicherung der RLS-Rollen nach `master` übernehmen.

Empfohlene Commit-Nachricht:

```text
Integrate V26 improvements and harden progress, cache and diagnostics
```
