# Testprotokoll · reale Geräte

Diese Prüfung kann nur an echten Geräten stattfinden. Emulatoren zeigen weder
das Verhalten der Bildschirmtastatur noch die tatsächliche Bildwiederholrate,
und der Offlinebetrieb lässt sich nur mit echtem Funkloch belastbar prüfen.

Vor jedem Durchgang: **Entwicklermenü → Offlinecache löschen → Service Worker
aktualisieren → Seite neu öffnen.**

## Geräte

| # | Gerät | Browser | geprüft am | von |
|---|---|---|---|---|
| 1 | iPhone (ab iOS 16) | Safari | | |
| 2 | Android (aktuell) | Chrome | | |
| 3 | Android (aktuell) | Firefox | | |
| 4 | Android, älter oder günstig | Chrome | | |
| 5 | Tablet, Hochformat | beliebig | | |
| 6 | Tablet, Querformat | beliebig | | |

## Was auf jedem Gerät zu prüfen ist

### A · Bildschirmtastatur
- [ ] Zahlenfeld öffnet die **Zifferntastatur**, nicht die Buchstabentastatur
- [ ] Aufgabentext bleibt sichtbar, während die Tastatur offen ist
- [ ] Formelkarte und Buchnavigation **weichen aus**, sobald das Feld den Fokus hat
- [ ] „Prüfen“ ist ohne Zuklappen der Tastatur erreichbar
- [ ] Komma **und** Punkt werden als Dezimaltrennzeichen akzeptiert

### B · Feste Navigation
- [ ] Buchleiste unten überlagert keinen Inhalt
- [ ] Formelkarte lässt sich öffnen und schließen, ohne die Aufgabe zu verlieren
- [ ] Safe Area (Notch, Home-Indikator) schneidet nichts ab
- [ ] Kein waagerechtes Scrollen auf irgendeiner Seite

### C · Animationen
- [ ] laufen flüssig, auch auf Gerät 4
- [ ] Vorhersagefrage erscheint und hält den Start zurück
- [ ] Bild bleibt vollständig sichtbar, ohne den Bildschirm zu füllen
- [ ] Reglerdaumen ist mit dem Daumen sicher zu treffen
- [ ] Animation pausiert beim Wegscrollen und läuft beim Zurückscrollen weiter

### D · Wischgesten
- [ ] Vor/Zurück im Buchmodus funktioniert, ohne den Regler auszulösen
- [ ] Kein Konflikt mit der Zurück-Geste des Systems
- [ ] Scrollen innerhalb der Formelkarte scrollt nicht die Seite mit

### E · Dunkler Modus
- [ ] Systemumschaltung ändert die Seite **und** die Zeichnungen
- [ ] Kein weißer Kasten auf dunklem Grund und umgekehrt
- [ ] Alle Texte bleiben lesbar (auch Merke- und Hinweiskästen)
- [ ] Umschalten während einer laufenden Aufgabe verliert keine Eingabe

### F · Verbindung
- [ ] Erster Aufruf über langsame Verbindung: Seite ist vor den Bildern nutzbar
- [ ] **Flugmodus:** Einheit öffnen, Aufgaben lösen, Warm-up starten
- [ ] Wieder online: Ereignisse werden nachgeliefert (Dashboard prüfen)
- [ ] Neue Fassung: Updatehinweis erscheint, Aktualisieren lädt alle Tabs neu

### G · Bearbeitungsstand
- [ ] Aufgabe halb ausgefüllt, Tab schließen, neu öffnen → Angebot „Weiterlernen“
- [ ] Die getippte, noch nicht geprüfte Zahl ist wieder da
- [ ] „Von vorn beginnen“ verwirft den Stand wirklich
- [ ] Gerätewechsel: Der Stand bleibt lokal, es erscheint kein fremder Stand

## Befunde

| Gerät | Punkt | Beobachtung | Schwere | erledigt |
|---|---|---|---|---|
| | | | | |

Schwere: **A** blockiert den Unterricht · **B** stört spürbar · **C** Schönheitsfehler.

## Freigabe für master

Alle Punkte auf allen sechs Geräten abgehakt oder mit Schwere C dokumentiert.
Datum, Name:
