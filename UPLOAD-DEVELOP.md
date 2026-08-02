# Upload in den Develop-Branch · V28

1. In GitHub Desktop **Current branch: develop** kontrollieren.
2. Das V28-Patch entpacken.
3. Den **Inhalt** in die Wurzel des lokalen Repositorys kopieren und vorhandene Dateien ersetzen.
4. Prüfen, dass `.git`, `.claude`, `tests/node_modules`, Testberichte und lokale Logdateien nicht zum Commit gehören. Die neue `.gitignore` verhindert dies künftig.
5. Lokal ausführen:

   ```text
   node werkzeuge/pruefen.js
   node werkzeuge/a11y-pruefen.js
   ```

6. Optional nach `npm ci` im Ordner `tests`:

   ```text
   npm test
   ```

7. Commit-Nachricht:

   `Harden V28 authentication, accessibility and automated tests`

8. **Commit to develop** und danach **Push origin**.
9. GitHub Actions vollständig abwarten: statische Prüfung und Browser-Smoke-Tests müssen grün sein.
10. `supabase/setup.sql` zuerst im Testprojekt ausführen. Danach Lehrkraftfreigabe, Schüler-Token, Verwaltungs-RPCs und Dashboard prüfen.
11. Vor `master` das Geräteprotokoll aus `TESTPROTOKOLL-GERAETE.md` abarbeiten.

Develop-Konfiguration:

```javascript
devMode: true
```

Cache-Version:

```javascript
const VERSION = 'mathe9-v28-secure-integration-develop';
```

Die Produktionsfassung wird kontrolliert vorbereitet mit:

```text
node werkzeuge/release.js
node werkzeuge/release.js --schreiben
```

Das Skript verändert die Tracking-Einstellung nicht heimlich. Eine bewusste Änderung erfolgt nur über `--tracking` oder `--ohne-tracking`.
