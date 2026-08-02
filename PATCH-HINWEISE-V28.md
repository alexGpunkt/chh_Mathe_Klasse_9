# Patch-Hinweise V28

Dieses Patch ist für den unmittelbar hochgeladenen Projektstand `chh_Mathe_Klasse_9(1).zip` bestimmt.

## Einbau

1. Sicherstellen, dass GitHub Desktop auf dem Branch `develop` steht.
2. Patch entpacken.
3. Den Inhalt des Patchordners in die Wurzel des lokalen Repositorys kopieren.
4. Vorhandene Dateien ersetzen.
5. Die Prüfungen ausführen oder nach dem Push in GitHub Actions abwarten.

## Nicht in Git übernehmen

Falls diese lokalen Dateien oder Ordner vorhanden sind, entfernen beziehungsweise nicht committen:

- `.claude/`
- `tests/node_modules/`
- `tests/test-results/`
- `tests/playwright-report/`
- `anpassungen.txt`
- `PATCH-ANWENDUNG-V27.txt`

Den vorhandenen `.git/`-Ordner niemals durch Dateien aus einem ZIP ersetzen oder löschen.

## Empfohlene Commit-Nachricht

`Harden V28 authentication, accessibility and automated tests`
