# Patch-Hinweise V31

## Welches Archiv?

- `mathe9-v31-integrationspatch-ab-v28.zip` enthält das gesamte angelieferte
  V29/V30-Update plus die V31-Korrekturen. Dieses Archiv verwenden, wenn das
  Repository noch auf dem zuletzt geprüften V28-Stand steht.
- `mathe9-v31-korrekturpatch-fuer-v30-upload.zip` enthält nur die gegenüber
  `chh_Mathe_Klasse_9(2).zip` vorgenommenen V31-Korrekturen.

## Einbau

1. In GitHub Desktop den Branch `develop` auswählen.
2. Das passende Patcharchiv entpacken.
3. Den **Inhalt** des Patchordners in die Repository-Wurzel kopieren.
4. Vorhandene Dateien ersetzen.
5. Nicht `.git`, `.claude`, `node_modules` oder lokale Testergebnisse kopieren.
6. Änderungen kontrollieren und committen.
7. `Push origin` ausführen.
8. GitHub Actions vollständig abwarten.
9. Auf einem Testgerät Offlinecache beziehungsweise Service Worker aktualisieren.

Empfohlene Commit-Nachricht:

```text
Integrate V30 learning mode and harden shared-device behavior
```

Die Supabase-V30-Migration wurde in V31 nicht live ausgeführt. V31 zunächst
auf `develop` belassen und den Supabase-Testabgleich anschließend fortsetzen.
