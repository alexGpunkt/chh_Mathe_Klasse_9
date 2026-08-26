-- ============================================================
-- Mathe 9 · Supabase-Abgleich V36 · STRENG LESEND
--
-- Diese Datei enthält ausschließlich SELECT-Abfragen. Sie verändert
-- weder Tabellen noch Funktionen, Policies, Rechte oder Nutzdaten.
-- Sie ist absichtlich auch auf einem älteren/unvollständigen Mathe9-
-- Schema ausführbar: fehlende Sollobjekte werden als "vorhanden = false"
-- beziehungsweise mit NULL bei Rechten angezeigt, statt den Abgleich
-- vorzeitig abzubrechen.
--
-- Im nächsten Arbeitsschritt im Supabase SQL Editor ausführen und die
-- Ergebnisblöcke mit dem V36-Sollstand vergleichen.
-- ============================================================

-- A · Solltabellen, Existenz, RLS und grobe Statistik
with soll(tabelle) as (
  values
    ('mathe9_students'),
    ('mathe9_events'),
    ('mathe9_progress'),
    ('mathe9_wartung_laeufe'),
    ('mathe9_teachers'),
    ('mathe9_teacher_audit'),
    ('mathe9_student_tokens'),
    ('mathe9_unterricht'),
    ('mathe9_freigaben'),
    ('mathe9_lernzeit'),
    -- V36: Abschlussquiz als Bewertungsgrundlage
    ('mathe9_quiz_ergebnisse')
), tabellen as (
  select c.relname as tabelle,
         c.relrowsecurity as rls_aktiv,
         c.relforcerowsecurity as rls_erzwungen
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
), statistik as (
  select relname as tabelle, n_live_tup::bigint as geschaetzte_zeilen
  from pg_stat_user_tables
  where schemaname = 'public'
)
select s.tabelle,
       (t.tabelle is not null) as vorhanden,
       t.rls_aktiv,
       t.rls_erzwungen,
       st.geschaetzte_zeilen
from soll s
left join tabellen t using (tabelle)
left join statistik st using (tabelle)
order by s.tabelle;

-- B · Vorhandene Mathe9-Policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename like 'mathe9_%'
order by tablename, policyname;

-- C · Vorhandene Funktionen, Signaturen und SECURITY DEFINER
select p.proname as funktion,
       pg_get_function_identity_arguments(p.oid) as argumente,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'mathe9_%'
order by p.proname, argumente;

-- D · Tabellenrechte der Browserrollen
select grantee, table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as rechte
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'mathe9_%'
  and grantee in ('anon','authenticated')
group by grantee, table_name
order by table_name, grantee;

-- E · Kritische Funktionsrechte.
-- to_regprocedure() liefert bei einer noch fehlenden Funktion NULL;
-- dadurch funktioniert dieser Block auch VOR der V35-Migration.
with pruefung(rolle, signatur, soll_execute) as (
  values
    ('anon',          'public.mathe9_student_anmelden(text,text,integer)', true),
    ('anon',          'public.mathe9_student_sitzung()',                  true),
    ('anon',          'public.mathe9_lernmodus()',                        true),
    ('anon',          'public.mathe9_lernzeit_melden(text,integer)',      true),
    ('anon',          'public.mathe9_validate_student_login(text,text)',  false),
    ('authenticated', 'public.mathe9_lehrkraft_freischalten(text,text)',  false),
    ('authenticated', 'public.mathe9_lehrkraft_sperren(text,text)',       false),
    -- V36: Das Abschlussquiz meldet mit dem Schueler-Token; die Auswertung
    -- und die Wahl der Bewertungsart bleiben der Lehrkraft vorbehalten.
    ('anon',          'public.mathe9_quiz_melden(text,text,integer,integer,integer,text[])', true),
    ('anon',          'public.mathe9_quiz_uebersicht(text,integer,boolean)', false),
    ('anon',          'public.mathe9_quiz_einheiten(text,integer,boolean)',  false),
    ('anon',          'public.mathe9_bewertungsart_setzen(uuid,text)',       false),
    ('authenticated', 'public.mathe9_quiz_uebersicht(text,integer,boolean)', true),
    ('authenticated', 'public.mathe9_quiz_einheiten(text,integer,boolean)',  true),
    ('authenticated', 'public.mathe9_bewertungsart_setzen(uuid,text)',       true)
), aufloesung as (
  select rolle, signatur, soll_execute, to_regprocedure(signatur) as oid
  from pruefung
)
select rolle,
       signatur,
       soll_execute,
       (oid is not null) as vorhanden,
       case when oid is null then null
            else has_function_privilege(rolle, oid, 'EXECUTE')
       end as execute_aktuell
from aufloesung
order by rolle, signatur;

-- F · Cron-Erweiterung. Keine Abfrage von cron.job, weil die Relation bei
-- nicht installierter Erweiterung selbst in einer bedingten SELECT-Abfrage
-- nicht auflösbar wäre.
select exists (
  select 1 from pg_extension where extname = 'pg_cron'
) as pg_cron_installiert,
(
  select extversion from pg_extension where extname = 'pg_cron'
) as pg_cron_version;

-- G · Zusammenfassung aller aktuell vorhandenen Mathe9-Tabellen mit
-- statistischer Zeilenschätzung. Es werden keine Inhaltsdaten ausgegeben.
select schemaname,
       relname as tabelle,
       n_live_tup::bigint as geschaetzte_zeilen,
       last_analyze,
       last_autoanalyze
from pg_stat_user_tables
where schemaname = 'public' and relname like 'mathe9_%'
order by relname;
