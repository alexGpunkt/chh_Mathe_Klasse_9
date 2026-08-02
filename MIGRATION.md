# Datenbankmigration · Ablauf

`supabase/setup.sql` ist so geschrieben, dass es mehrfach ausgeführt werden
kann. Trotzdem gilt: **erst im Testprojekt, dann produktiv.** Die aktuelle
Fassung ändert Zugriffsrechte — ein Fehler dabei ist entweder ein Datenleck
oder ein Dashboard, das niemand mehr öffnen kann.

## Was diese Fassung verändert

| Änderung | Wirkung, wenn sie schiefgeht |
|---|---|
| Lehrer-Freigabeliste `mathe9_teachers` | Dashboard bleibt leer, bis eine Lehrkraft freigeschaltet ist |
| Sitzungstoken für Schreibzugriffe; alter Login-RPC wird gesperrt | Ohne migrierte Datenbank wird die sichere Anmeldung mit einem klaren Aktualisierungshinweis abgelehnt; ein unsicherer Rückfall ist bewusst deaktiviert |
| Neue Policies | Zu streng: niemand sieht etwas. Zu locker: alle sehen alles |
| `pg_cron`-Auftrag | Ohne ihn löscht nichts — kein Ausfall, aber ein Datenschutzversprechen, das nicht eingehalten wird |
| **V29:** `mathe9_wartung_laeufe` + `mathe9_wartung_status()` | Ohne sie zeigt das Dashboard „Status nicht abrufbar"; gelöscht wird trotzdem |
| **V29:** `mathe9_teacher_audit`, `mathe9_lehrkraft_sperren`, `mathe9_lehrkraft_uebersicht` | Ohne sie bleiben Änderungen an der Lehrkraftfreigabe unprotokolliert |
| **V29:** `mathe9_lehrkraft_freischalten` bekommt einen zweiten Parameter | Die einstellige Fassung wird **gelöscht**. Skripte, die sie aufrufen, funktionieren weiter (der zweite Parameter hat einen Vorgabewert) |

## 1 · Testprojekt anlegen

1. In Supabase ein zweites Projekt erstellen (gleiche Region wie später produktiv).
2. `assets/js/supabase-config.js` lokal auf das Testprojekt zeigen lassen —
   **nicht committen.**
3. Ein Lehrkraftkonto anlegen und freischalten:
   ```sql
   select public.mathe9_lehrkraft_freischalten('test@schule.de');
   ```
4. Zwei Testschüler in `mathe9_students` eintragen.

## 2 · Export der Produktionsdaten

Vor jeder produktiven Migration, auch wenn sie „nur Policies" ändert:

```bash
# Vollständiger Abzug
supabase db dump --db-url "$PROD_URL" -f sicherung-$(date +%F).sql

# Zusätzlich die drei Tabellen als CSV, falls ein Teilrücklauf nötig wird
psql "$PROD_URL" -c "\copy public.mathe9_students to 'students.csv' csv header"
psql "$PROD_URL" -c "\copy public.mathe9_events   to 'events.csv'   csv header"
psql "$PROD_URL" -c "\copy public.mathe9_progress to 'progress.csv' csv header"
```

Die Sicherung gehört **nicht** ins Repository.

## 3 · Testmigration

```bash
psql "$TEST_URL" -f supabase/setup.sql
```

Danach im Testprojekt prüfen:

- [ ] `select public.mathe9_ist_lehrkraft();` gibt für das freigeschaltete
      Konto `true`, für ein zweites, nicht freigeschaltetes `false`
- [ ] Dashboard zeigt mit freigeschaltetem Konto Daten, mit dem anderen nichts
- [ ] Schüleranmeldung liefert ein Token:
      `select * from public.mathe9_student_anmelden('muster.max','9');`
- [ ] `mathe9_student_sitzung()` erkennt dieses Token über den HTTP-Header und stellt beim Seitenwechsel kein neues aus
- [ ] Ein angemeldetes, aber nicht freigeschaltetes Lehrkraftkonto kann `mathe9_person_export`, `mathe9_person_loeschen` und `mathe9_aufraeumen` nicht aufrufen
- [ ] Eine Antwort in der App landet in `mathe9_events`
- [ ] Schreibversuch **ohne** Token wird abgelehnt:
      ```bash
      curl -X POST "$TEST_URL/rest/v1/mathe9_events" \
        -H "apikey: $ANON" -H "Content-Type: application/json" \
        -d '{"event_type":"test","student_id":"<fremde-id>","device_id":"...","session_id":"..."}'
      # erwartet: 401/403 wegen Row Level Security
      ```
- [ ] `select public.mathe9_aufraeumen(0, 0);` löscht im Testprojekt und
      gibt die Zeilenzahlen einschließlich abgelaufener Sitzungstoken zurück
- [ ] `select jobname, schedule from cron.job where jobname = 'mathe9-aufraeumen';`
      zeigt den Auftrag — oder das Skript hat gemeldet, dass pg_cron fehlt

Ab V29 zusätzlich:

- [ ] Nach `select public.mathe9_aufraeumen(0, 0);` steht in
      `mathe9_wartung_laeufe` eine Zeile mit `erfolg = true` und den
      Zeilenzahlen
- [ ] `select * from public.mathe9_wartung_status();` liefert **genau eine**
      Zeile — auch wenn noch nie aufgeräumt wurde (dann mit
      `ueberfaellig = true`)
- [ ] `select public.mathe9_lehrkraft_freischalten('test2@schule.de');`
      schreibt eine Zeile `aktion = 'freigeschaltet'` nach
      `mathe9_teacher_audit`; ein zweiter Aufruf mit derselben Adresse
      schreibt **keine** weitere
- [ ] `select public.mathe9_lehrkraft_sperren('test2@schule.de');` gibt
      `true` zurück und protokolliert `aktion = 'gesperrt'`
- [ ] Das gesperrte Konto sieht danach keine Dashboarddaten mehr
- [ ] `select * from public.mathe9_lehrkraft_uebersicht();` listet die
      freigeschalteten Konten mit `zuletzt_angemeldet`
- [ ] Ein **nicht** freigeschaltetes Konto bekommt bei
      `mathe9_wartung_status()` und `mathe9_lehrkraft_uebersicht()` den
      Fehler 42501 statt einer leeren Antwort

## 4 · Produktive Migration

1. Zeitpunkt außerhalb des Unterrichts wählen.
2. Sicherung aus Schritt 2 anlegen und **prüfen, dass die Datei nicht leer ist.**
3. `psql "$PROD_URL" -f supabase/setup.sql`
4. Sofort danach: mindestens eine Lehrkraft freischalten.
5. Mit einem echten Schülerzugang anmelden und eine Aufgabe lösen.
6. Im Dashboard nachsehen, ob das Ereignis ankommt.

## 5 · Rückkehrplan

Die Migration legt nur an und ersetzt Policies; sie löscht keine Daten. Wenn
etwas nicht stimmt, ist der schnellste Weg zurück, die alten Policies wieder
aufzumachen:

```sql
-- Notbremse: Lehrkraftprüfung vorübergehend aufheben
create or replace function public.mathe9_ist_lehrkraft()
returns boolean language sql stable as $$ select true $$;
```

> Das ist eine **Notbremse für Minuten, kein Zustand für Tage** — in dieser
> Fassung sieht wieder jeder angemeldete Supabase-Nutzer alle Daten.

Ist mehr kaputt, hilft nur der Abzug aus Schritt 2:

```bash
psql "$PROD_URL" -f sicherung-JJJJ-MM-TT.sql
```

## 6 · Protokoll

| Datum | Projekt | Fassung | ausgeführt von | Ergebnis |
|---|---|---|---|---|
| | Test | | | |
| | Produktiv | | | |
