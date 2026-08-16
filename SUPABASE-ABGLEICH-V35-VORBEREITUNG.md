# Supabase-Abgleich V35 · Vorbereitung für den nächsten Schritt

## Ziel

Vor jeder Migration wird zuerst festgestellt, welcher Stand im bestehenden Supabase-Projekt tatsächlich vorhanden ist. In diesem ersten Abgleich werden **keine Daten, Policies, Funktionen oder Rechte verändert**.

## Benötigte Projektdateien

- `supabase/abgleich-readonly.sql` — zuerst ausführen, streng lesend
- `supabase/setup.sql` — noch nicht ausführen; dient zunächst nur als V35-Sollstand
- `MIGRATION.md` — Sicherheits- und Rollouthinweise
- `assets/js/supabase-config.js` — später für URL/Publishable-Key-Abgleich

## Reihenfolge im nächsten Schritt

1. Supabase-Projekt öffnen und Projektname/URL notieren.
2. **Noch kein `setup.sql` ausführen.**
3. SQL Editor öffnen.
4. gesamten Inhalt von `supabase/abgleich-readonly.sql` einfügen.
5. Abfrage ausführen.
6. Ergebnisblöcke A–G sichern beziehungsweise als Screenshots/CSV bereitstellen.
7. Gemeinsam abgleichen:
   - welche der zehn Solltabellen existieren,
   - wo RLS aktiv ist,
   - welche Policies vorhanden sind,
   - welche RPCs/Funktionen vorhanden sind,
   - welche Funktionen `SECURITY DEFINER` verwenden,
   - welche Rechte `anon` und `authenticated` haben,
   - ob `pg_cron` installiert ist.
8. Erst danach Backup und Testmigration planen.
9. `setup.sql` zuerst in einem separaten Testprojekt ausführen.
10. Danach echte API-/RLS-Tests mit `anon`, Schüler-Token und Lehrkraftkonto durchführen.
11. Erst wenn alle Tests bestehen, Produktivmigration vorbereiten.

## Erwarteter V35-Tabellenstand

- `mathe9_students`
- `mathe9_events`
- `mathe9_progress`
- `mathe9_wartung_laeufe`
- `mathe9_teachers`
- `mathe9_teacher_audit`
- `mathe9_student_tokens`
- `mathe9_unterricht`
- `mathe9_freigaben`
- `mathe9_lernzeit`

Bei allen zehn Tabellen erwartet V35 aktiviertes Row Level Security.

## Kritische Sollrechte

Nach vollständiger V35-Migration soll gelten:

- `anon` darf `mathe9_student_anmelden(...)` ausführen.
- `anon` darf `mathe9_student_sitzung()` ausführen; ohne gültiges Sitzungstoken erhält er aber keine fremden Daten.
- `anon` darf `mathe9_lernmodus()` und `mathe9_lernzeit_melden(...)` nur im durch Schüler-Token abgesicherten Ablauf nutzen.
- der alte RPC `mathe9_validate_student_login(text,text)` darf für `public`, `anon` und `authenticated` **nicht** mehr ausführbar sein.
- ein normales `authenticated`-Konto darf sich nicht selbst mit `mathe9_lehrkraft_freischalten(...)` zur Lehrkraft machen.
- ein normales `authenticated`-Konto darf nicht über `mathe9_lehrkraft_sperren(...)` andere Lehrkräfte verwalten.

## Was der erste SQL-Abgleich noch nicht beweist

Der SQL Editor arbeitet mit administrativen Rechten. Deshalb beweist der reine Inventarabgleich noch nicht:

- dass `anon` tatsächlich keine Schülerliste lesen kann,
- dass ein Schüler-Token nur die eigene Schüler-ID schreiben darf,
- dass ein deaktivierter Schüler mit altem Token gesperrt ist,
- dass ein nicht freigeschaltetes Auth-Konto keine Dashboarddaten sieht,
- dass Verwaltungs-RPCs gegenüber normalen Auth-Nutzern korrekt blockieren.

Diese Tests folgen **nach** der Bestandsaufnahme und der Testmigration über die Data API beziehungsweise die Anwendung.

## Abbruchregel

Sobald beim lesenden Abgleich unerwartete Tabellen, Rechte oder alte Policies sichtbar werden, wird nicht improvisiert migriert. Erst wird die Abweichung dokumentiert und gegen `setup.sql` bewertet.
