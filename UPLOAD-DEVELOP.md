# Upload in den Develop-Branch · V25

1. In GitHub Desktop **Current branch: develop** kontrollieren.
2. Das V25-Patch entpacken.
3. Den **Inhalt** des Patch-Ordners in die Wurzel des lokalen Repositorys kopieren.
4. Vorhandene Dateien ersetzen lassen.
5. In GitHub Desktop prüfen, dass keine `.git`- oder `.claude`-Ordner neu hinzukommen.
6. Commit-Nachricht:

   `Integrate learning-impact update and fix mobile stability`

7. **Commit to develop** und danach **Push origin**.
8. Auf der Testseite im Entwicklermenü zuerst **Offlinecache löschen**, danach
   **Service Worker aktualisieren** und die Seite neu laden.
9. Mindestens PZ-05, eine LF-Animation, eine KP-Einheit, eine SK-Einheit sowie
   das Lehrerdashboard auf einem Smartphone testen.

Die Develop-Konfiguration bleibt:

```javascript
devMode: true
```

Die Cache-Version lautet:

```javascript
const VERSION = 'mathe9-v25-integration-stability-develop';
```

Vor einem späteren Merge nach `master` muss `devMode` auf `false` gesetzt und
für die Produktionsfassung eine neue Cache-Version vergeben werden.
