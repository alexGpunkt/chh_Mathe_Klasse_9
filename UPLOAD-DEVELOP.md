# Upload in den Develop-Branch

1. In GitHub Desktop **Current branch: develop** kontrollieren.
2. Das V20-Patch entpacken.
3. Den **Inhalt** des Patch-Ordners in die Wurzel des lokalen Repositorys kopieren.
4. Vorhandene Dateien ersetzen lassen.
5. In GitHub Desktop die Änderungen prüfen.
6. Commit-Nachricht: `Integrate external exercise platforms into develop`.
7. **Commit to develop** und danach **Push origin**.
8. Auf der Testseite im Entwicklermenü zuerst **Offlinecache löschen** und danach
   **Service Worker aktualisieren**; anschließend die Seite neu laden.

Die Develop-Konfiguration bleibt:

```javascript
devMode: true
```

Die Cache-Version lautet:

```javascript
const VERSION = 'mathe9-v20-external-exercises-develop';
```
