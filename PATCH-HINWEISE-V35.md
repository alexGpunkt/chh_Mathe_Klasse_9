# Patch-Hinweise V35

## Welche Datei verwenden?

### Repository steht noch auf dem geprüften V31-Stand

`mathe9-v35-integrationspatch-ab-v31.zip` verwenden.

Der Patch integriert V32–V35. Danach die veralteten Dateien entfernen:

- `assets/js/animationen.js`
- alle 54 Dateien `units/*/*/uebungsblatt.pdf`

Sie wurden durch die fünf Animationsmodule sowie `uebungsblatt-a.pdf`, `-b.pdf`, `-c.pdf` ersetzt.

### Der hochgeladene V34-Stand ist bereits im Repository

`mathe9-v35-korrekturpatch-fuer-v34-upload.zip` verwenden.

Zusätzlich können lokale Entwicklungsreste gelöscht werden, falls sie im Arbeitsverzeichnis vorhanden sind:

- `tests/test-results/`
- `tests/playwright-report/`
- `tests/smoke/tmp-blatt.spec.js`
- `anpassungen.txt`
- `PATCH-ANWENDUNG-V27.txt`

`.git/` selbstverständlich **nicht** löschen.

### Ausgangsstand ist unklar

Die vollständige Datei `chh_Mathe_Klasse_9-develop-v35-integriert-geprueft.zip` verwenden und den Projektinhalt daraus übernehmen. Das ist die sicherste Variante.

## Zeilenenden unter Windows

Der Upload enthielt viele reine CRLF/LF-Scheinänderungen. V35 ergänzt deshalb:

```text
* text=auto eol=lf
```

in `.gitattributes`.

Wenn GitHub Desktop danach weiterhin zahlreiche unveränderte Textdateien als geändert zeigt, im Repository-Terminal einmal ausführen:

```bash
git add --renormalize .
```

Danach die Änderungen in GitHub Desktop prüfen. PDFs bleiben durch `.gitattributes` ausdrücklich binär und dürfen nicht als Text normalisiert werden.

## Empfohlener Commit

```text
Integrate V34 features, fix runtime issues and prepare Supabase preflight
```

Danach:

1. Commit auf `develop`
2. `Push origin`
3. GitHub Actions abwarten
4. Service Worker/Offlinecache aktualisieren
5. noch nicht nach `master` mergen
6. als nächsten Schritt `supabase/abgleich-readonly.sql` im bestehenden Supabase-Projekt ausführen
