# Integration der Erweiterung

Zusammengeführt wurden der bisherige Stand mit Lehrerdashboard/Supabase-Tracking und die neue Erweiterung mit:

- Prüfungstrainer (`pruefung.html`)
- Arbeitsblattgenerator (`arbeitsblatt.html`)
- Kompetenzmatrix (`matrix.html`)
- Offline-Service-Worker (`sw.js`)
- zentralem Einheitenindex (`units/index.json`)

Die Schülerseiten und der Prüfungstrainer laden `supabase-config.js` vor `tracker.js`.
`engine.js` und `spiral.js` enthalten weiterhin die Tracking-Aufrufe. Arbeitsblatt und Kompetenzmatrix senden keine Daten.

Beim Upload nach GitHub den gesamten Inhalt dieses Ordners in die Repository-Wurzel kopieren und vorhandene Dateien ersetzen.
