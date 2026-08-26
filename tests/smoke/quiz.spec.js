const { test, expect } = require('@playwright/test');

/* ============================================================
   Abschlussquiz am Ende der Einheit (V36)

   Der Prüflauf `node werkzeuge/quiz-pruefen.js` baut die Fragensätze
   für alle 54 Einheiten und prüft ihren Inhalt — er führt die Datei
   aber ohne Browser aus. Was er deshalb NICHT prüfen kann, steht hier:
   ob die Einladung im Abschluss überhaupt erscheint, ob ein Lauf
   bedienbar ist und ob am Ende ein Ergebnis dasteht.

   Bewusst über den Entwicklermodus und ohne Supabase: Ohne Server soll
   das Quiz laufen und das Ergebnis lokal gesichert werden. Genau das
   ist der Fall, in dem ein Kind zu Hause ohne Anmeldung arbeitet.
   ============================================================ */

/* Ans Ende des Pfades kommen, ohne 14 Aufgaben zu lösen: Die
   Einheitenseite kennt einen Deep-Link auf eine Aufgabe, und von dort
   ist es nur ein Schritt. Kürzer und stabiler ist, den Abschluss direkt
   aufzurufen — dafür gibt es die Diagnosefunktion. */
async function zumAbschluss(page, unit = 'pz-08', pfad = 'A') {
  await page.goto(`/einheit.html?u=${unit}&p=${pfad}`);
  await expect(page.locator('.lernkarte')).toBeVisible();
  await page.getByRole('button', { name: /Aufgaben starten/ }).click();
  await expect(page.locator('.frage')).toBeVisible();

  /* Alle Aufgaben als gelöst markieren und den Abschluss aufbauen.
     Der Weg über die Engine ist Absicht: Er prüft denselben Aufbau,
     den ein Kind nach der letzten Aufgabe sieht. */
  // eslint-disable-next-line no-undef
  await page.evaluate(() => abschluss());
}

test('Abschluss lädt die Einladung zum Quiz', async ({ page }) => {
  await zumAbschluss(page);

  const einladung = page.locator('.quizeinladung');
  await expect(einladung).toBeVisible();
  /* Vor dem Start muss dastehen, dass dieser Lauf zählt. Eine Prüfung,
     deren Bedingungen man erst hinterher erfährt, ist keine faire. */
  await expect(einladung).toContainText('erster Lauf zählt');
  await expect(page.getByRole('button', { name: /Quiz starten/ })).toBeVisible();
});

test('Ein Quizlauf ist bedienbar und endet mit einem Ergebnis', async ({ page }) => {
  await zumAbschluss(page);
  await page.getByRole('button', { name: /Quiz starten/ }).click();

  const karte = page.locator('.quizkarte');
  await expect(karte).toBeVisible();
  await expect(karte.locator('.quiz-zaehler')).toContainText('von 5');

  /* Fünf Fragen durchklicken. Es geht nicht darum, richtig zu liegen —
     geprüft wird, dass jede Frage bedienbar ist und weiterführt. */
  for (let i = 0; i < 5; i++) {
    await expect(karte.locator('.quiz-zaehler')).toContainText(`Frage ${i + 1} von 5`);

    const zahlfeld = karte.locator('.zahl-feld');
    if (await zahlfeld.count()) {
      await zahlfeld.fill('1');
      await karte.getByRole('button', { name: 'Antwort prüfen' }).click();
    } else {
      await karte.locator('.optionen .opt').first().click();
    }

    /* Nach jeder Antwort steht eine Rückmeldung da — richtig oder nicht. */
    await expect(karte.locator('.quiz-rueck .rueck')).toBeVisible();
    await karte.getByRole('button', { name: /^(Weiter|Ergebnis anzeigen)$/ }).click();
  }

  await expect(page.locator('.quizkarte .frage')).toContainText(/Quiz beendet: \d von 5 richtig/);
  /* Ohne Supabase geht nichts an den Server — das muss dastehen und darf
     nicht so aussehen, als sei gemeldet worden. */
  await expect(page.locator('#quiz-meldung')).toContainText(/auf diesem Gerät gespeichert/);
});

test('Der Stand des ersten Laufs bleibt erhalten', async ({ page }) => {
  await zumAbschluss(page);
  await page.getByRole('button', { name: /Quiz starten/ }).click();

  for (let i = 0; i < 5; i++) {
    const karte = page.locator('.quizkarte');
    const zahlfeld = karte.locator('.zahl-feld');
    if (await zahlfeld.count()) {
      await zahlfeld.fill('1');
      await karte.getByRole('button', { name: 'Antwort prüfen' }).click();
    } else {
      await karte.locator('.optionen .opt').first().click();
    }
    await karte.getByRole('button', { name: /^(Weiter|Ergebnis anzeigen)$/ }).click();
  }
  /* Auf die FERTIGE Meldung warten, nicht nur auf ihr Erscheinen: Sie
     steht zuerst als „wird gesichert …" da und bekommt ihren endgültigen
     Text erst, wenn das Sichern durch ist. Wer nur auf Sichtbarkeit
     wartet, klickt manchmal vorher weiter. */
  await expect(page.locator('#quiz-meldung')).toContainText(/auf diesem Gerät gespeichert/);

  /* Zurück zum Abschluss: Die Einladung zeigt jetzt den Stand und sagt,
     dass der erste Lauf der gewertete war. */
  await page.getByRole('button', { name: 'Zurück zum Abschluss' }).click();
  const einladung = page.locator('.quizeinladung');
  await expect(einladung).toHaveClass(/quizeinladung-erledigt/);
  await expect(einladung).toContainText(/Abschlussquiz: \d von 5 richtig/);
  await expect(einladung).toContainText('erster');

  /* Und er liegt im lokalen Stand — auch ohne Server. */
  const stand = await page.evaluate(() => Stand.lies('pz-08'));
  expect(stand.quiz.A.gesamt).toBe(5);
  expect(stand.quiz.A.erster).toBeTruthy();
});

test('Das Quiz fragt nur Dinge aus dieser Einheit', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-08&p=B');
  await expect(page.locator('.lernkarte')).toBeVisible();

  /* Die Herkunft steht unter jeder Frage. Sie muss auf diese Einheit
     zeigen — eine Frage von woanders wäre genau das, was dieses Quiz
     nicht sein soll. */
  const satz = await page.evaluate(async () => {
    const daten = await (await fetch('units/pz/pz-08/tasks.json')).json();
    return Quiz.bauen(daten, 'B').fragen.map(f => f.herkunft);
  });

  expect(satz.length).toBe(5);
  for (const h of satz) {
    /* Entweder eine Aufgabe dieser Einheit (PZ08-…) oder eine der
       benannten Quellen der Einheit selbst. */
    expect(h).toMatch(/^Aufgabe PZ08-|Merksatz dieser Einheit|Erklärung deines Pfades|Formelkarte dieser Einheit|Wortspeicher dieser Einheit/);
  }
});
