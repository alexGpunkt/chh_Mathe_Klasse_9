// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function einheit(id) {
  const bereich = id.split('-')[0];
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../units/${bereich}/${id}/tasks.json`), 'utf8'));
}

/* ============================================================
   Browser-Smoke-Tests · der Weg, den ein Kind tatsächlich geht

   Geprüft wird das Zusammenspiel, das sich in jsdom nicht abbilden lässt:
   echtes Rendern, echte Eingaben, echter Service Worker.
   Bewusst ohne Supabase — getestet wird die Anwendung, nicht das Backend.
   ============================================================ */

/* Das Tracking würde ohne Server in Fehlermeldungen laufen. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    /* Die echte Konfigurationsdatei darf unverändert bleiben. Die vorhandenen
       Develop-Schalter sorgen für einen Testschüler ohne Netzwerkzugriff. */
    localStorage.setItem('mathe9.dev.skipLogin', 'true');
    localStorage.setItem('mathe9.dev.supabaseDisabled', 'true');
    localStorage.setItem('mathe9.dev.trackerDisabled', 'true');
    localStorage.setItem('mathe9.dev.student', 'test1');
  });
});

test('Lernkarte, Aufgabe und Antwort', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-08&p=A');

  await expect(page.locator('.lernkarte')).toBeVisible();
  await expect(page.locator('.lk-titel')).toContainText('Grundwert');

  /* Lückenbeispiel auf Pfad A */
  const luecke = page.locator('.lk-luecke-feld');
  await expect(luecke).toBeVisible();
  await luecke.fill('60');
  await page.getByRole('button', { name: 'Prüfen' }).first().click();
  await expect(page.locator('.lk-luecke-echo.gut')).toBeVisible();

  await page.getByRole('button', { name: /Los geht/ }).click();

  await expect(page.locator('.frage')).toBeVisible();
  await expect(page.locator('.stufe-zeile')).toContainText('Pfad A');

  /* Falsche Antwort: Rückmeldung mit Diagnose statt „leider falsch" */
  await page.locator('.zahl-feld').fill('1');
  await page.locator('#pruefen').click();
  await expect(page.locator('.rueck.nope')).toBeVisible();

  /* Richtige Antwort: der Fortschrittsstreifen bewegt sich */
  const diagnose = await page.evaluate(() => window.MATHE9_DIAGNOSE_STATE());
  const aufgabe = einheit('pz-08').tasks.find(t => t.id === diagnose.task);
  expect(aufgabe).toBeTruthy();
  await page.locator('.zahl-feld').fill(String(aufgabe.answer).replace('.', ','));
  await page.locator('#pruefen').click();
  await expect(page.locator('.rueck.ok')).toBeVisible();
  await expect(page.locator('#absolut')).not.toHaveText('0 von 4');
});

/* Das Speichern ist entprellt. Eine feste Wartezeit hat den Test auf
   langsamen Runnern scheitern lassen — und die bloße Existenz des
   Schlüssels genügt nicht, weil er schon beim Öffnen der Aufgabe angelegt
   wird. Gewartet wird deshalb darauf, dass die Eingabe wirklich drinsteht. */
async function standGespeichert(page, einheit, eingabe) {
  await expect.poll(
    () => page.evaluate(id => localStorage.getItem(
      'mathe9.stand.' + Stand.kennung() + '.' + id) || '', einheit),
    { timeout: 8000, message: `Bearbeitungsstand für ${einheit} wurde nicht gespeichert` }
  ).toContain(eingabe);
}

test('Bearbeitungsstand überlebt das Neuladen', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-06&p=A');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await expect(page.locator('.frage')).toBeVisible();

  /* Getippt, aber nicht geprüft — genau der Fall, der bisher verloren ging. */
  await page.locator('.zahl-feld').fill('12,5');
  await standGespeichert(page, 'pz-06', '12,5');

  await page.reload();
  await expect(page.locator('.stand-karte')).toBeVisible();
  await page.getByRole('button', { name: 'Dort weiterlernen' }).click();
  await expect(page.locator('.zahl-feld')).toHaveValue('12,5');
});

test('Wiederaufnahme nach Browserneustart', async ({ page, context }) => {
  await page.goto('/einheit.html?u=pz-06&p=A');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await page.locator('.zahl-feld').fill('7,5');
  await standGespeichert(page, 'pz-06', '7,5');

  /* Was ein Neustart tatsächlich verändert: Der Arbeitsspeicher ist weg,
     die Sitzung ebenfalls — der lokale Speicher bleibt. Genau daran muss
     die Wiederaufnahme hängen und nicht an einer Variablen im Tab. */
  await page.evaluate(() => sessionStorage.clear());
  await page.close();

  const spaeter = await context.newPage();
  await spaeter.goto('/einheit.html?u=pz-06&p=A');
  await expect(spaeter.locator('.stand-karte')).toBeVisible();
  await spaeter.getByRole('button', { name: 'Dort weiterlernen' }).click();
  await expect(spaeter.locator('.zahl-feld')).toHaveValue('7,5');
});

test('Deep-Link führt direkt zur Aufgabe', async ({ page }) => {
  const id = einheit('pz-08').tasks.filter(t => t.path === 'C')[2].id;
  await page.goto(`/einheit.html?u=pz-08&p=C&aufgabe=${id}`);
  await expect(page.locator('.frage')).toBeVisible();
  expect((await page.evaluate(() => window.MATHE9_DIAGNOSE_STATE())).task).toBe(id);
});

test('Deep-Link führt zu einer Stelle der Erklärung', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-05&p=A&abschnitt=beispiel');
  await expect(page.locator('.lk-beispiel.lk-hervor')).toBeVisible();
});

test('Buchnavigation blättert weiter', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-05');
  await expect(page.locator('#buchSeite')).toContainText('Buchseite');

  await page.locator('.buch-next').click();
  await page.waitForURL(/u=pz-06/, { timeout: 10000 });
  await expect(page.locator('#code')).toContainText('PZ-06');
});

test('Inhaltsverzeichnis zeigt den Lernstatus', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-05');
  await page.locator('#buchMitte').click();
  await expect(page.locator('#buchToc')).toBeVisible();
  /* Der Bereich der aktuellen Einheit ist offen — dort steht die Marke. */
  const marke = page.locator('.buch-eintrag.aktuell .e-status');
  await expect(marke).toBeVisible();
  expect(await marke.getAttribute('title')).toBeTruthy();
  /* Das Zeichen allein genügt nicht — der Status muss auch vorlesbar sein. */
  const eintrag = page.locator('.buch-eintrag').first();
  expect(await eintrag.getAttribute('aria-label')).toContain('begonnen');
});

test('Animation läuft erst nach der Vorhersage', async ({ page }) => {
  await page.goto('/einheit.html?u=lf-04&p=A');
  const frage = page.locator('.anim-frage');
  await expect(frage).toBeVisible();

  /* Die Textfassung macht die Aussage auch ohne Bewegung zugänglich. */
  await expect(page.locator('.anim-text summary')).toBeVisible();
  await page.locator('.anim-text summary').click();
  await expect(page.locator('.anim-text-liste li').first()).toBeVisible();

  await frage.locator('.anim-tipp-btn').first().click();
  await expect(page.locator('.anim-frage-echo')).not.toBeEmpty();
});

test('Offline: Einheit kommt aus dem Cache', async ({ page, context }) => {
  await page.goto('/index.html');
  /* Der Service Worker muss die Schale erst vollständig geladen haben. */
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(2500);

  await context.setOffline(true);
  await page.goto('/einheit.html?u=pz-05');
  await expect(page.locator('#titel')).not.toBeEmpty();
  await expect(page.locator('.lernkarte, .karte')).toBeVisible();
  await context.setOffline(false);
});

/* ============================================================
   Betrieb: Was passiert, wenn es NICHT rund läuft

   Diese Fälle sind im Unterricht die häufigen — Netz weg, Update mitten
   in der Stunde, das nächste Kind am selben Gerät. Ohne Supabase, weil
   hier die Anwendung geprüft wird und nicht das Backend.
   ============================================================ */

test('Ereignisse bleiben in der Offlinewarteschlange', async ({ page, context }) => {
  /* Tracker an, Supabase aber unerreichbar: genau die Lage im Schul-WLAN,
     wenn die Verbindung steht, der Server aber nicht antwortet. */
  await page.addInitScript(() => {
    localStorage.setItem('mathe9.dev.supabaseDisabled', 'false');
    localStorage.setItem('mathe9.dev.trackerDisabled', 'false');
  });
  await context.route(/supabase\.co/, route => route.abort());

  await page.goto('/einheit.html?u=pz-08&p=A');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await expect(page.locator('.frage')).toBeVisible();
  await page.locator('.zahl-feld').fill('1');
  await page.locator('#pruefen').click();
  await expect(page.locator('.rueck')).toBeVisible();

  /* Nichts geht verloren: Die Ereignisse liegen im Speicher und warten. */
  await expect.poll(
    () => page.evaluate(() => (window.Tracker?.status?.().wartend) || 0),
    { timeout: 8000 }
  ).toBeGreaterThan(0);

  /* Und sie überleben das Neuladen — sonst wäre die Stunde weg. */
  const vorher = await page.evaluate(() => Tracker.status().wartend);
  await page.reload();
  await expect.poll(
    () => page.evaluate(() => (window.Tracker?.status?.().wartend) || 0),
    { timeout: 8000 }
  ).toBeGreaterThanOrEqual(vorher);

  const zustand = await page.evaluate(() => Tracker.status());
  expect(zustand.zuletzt_gesendet).toBeFalsy();
  expect(zustand.letzter_fehler).toBeTruthy();
});

test('Abmelden löscht auf Wunsch die lokalen Lernstände', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-06&p=A');
  await page.getByRole('button', { name: /Los geht/ }).click();
  await page.locator('.zahl-feld').fill('9');
  await standGespeichert(page, 'pz-06', '9');

  await page.locator('.m9-user-chip button').click();
  await expect(page.locator('.m9-abmelden')).toBeVisible();

  /* „Nur abmelden" darf den Stand des Geräts nicht anfassen — geprüft wird
     hier der andere Weg: das Kind gibt das Gerät weiter. */
  await page.locator('[data-alles]').click();
  await page.waitForURL(/index\.html/);

  /* Nichts vom vorherigen Kind bleibt liegen — auch nicht unter „lokal",
     wo ein noch laufender Speichervorgang es bis V29 wieder abgelegt hat.
     Die Anmeldung selbst wird hier nicht geprüft: Im Entwicklermodus legt
     das 🐞-Menü sofort wieder einen Testschüler an. */
  const reste = await page.evaluate(() =>
    Object.keys(localStorage).filter(k => k.startsWith('mathe9.stand.')));
  expect(reste).toEqual([]);
});

test('Neue Fassung wird angeboten und erst nach Zustimmung übernommen', async ({ page }) => {
  /* Zwei vollständige Service-Worker-Installationen nacheinander — das
     dauert länger als eine Aufgabe im Lernweg. */
  test.setTimeout(90000);
  await page.goto('/index.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  /* Der Erstbesuch darf die Seite nicht von selbst neu laden — bis V29 tat
     er das, weil clients.claim() denselben Controllerwechsel auslöst. */
  await expect(page.locator('.update-leiste')).toHaveCount(0);

  /* Eine zweite Skriptadresse im selben Geltungsbereich ist für den Browser
     eine neue Fassung desselben Service Workers: Er installiert sie und
     lässt sie warten. Genau die Lage, die im Unterricht entsteht, wenn
     während der Stunde eine neue Version veröffentlicht wird. */
  await page.evaluate(() => navigator.serviceWorker.register('sw.js?fassung=test'));

  const leiste = page.locator('.update-leiste');
  await expect(leiste).toBeVisible({ timeout: 20000 });
  await expect(leiste).toContainText('neue Fassung');

  /* Solange niemand zustimmt, wartet die neue Fassung — sie darf nicht
     mitten in einer Aufgabe alte und neue Dateien mischen. */
  expect(await page.evaluate(async () =>
    Boolean((await navigator.serviceWorker.getRegistration()).waiting))).toBe(true);

  /* Nach der Zustimmung übernimmt sie und die Seite lädt einmal neu.

     Was danach kommt, prüft dieser Test bewusst nicht: Die neu geladene
     Seite registriert wieder die echte Adresse `sw.js`, für den Browser
     also erneut ein anderes Skript — und bietet folgerichtig wieder ein
     Update an. Das ist eine Folge des Testaufbaus mit zwei Adressen, im
     Betrieb gibt es nur eine. */
  await page.getByRole('button', { name: 'Jetzt aktualisieren' }).click();
  await page.waitForURL(/index\.html/, { timeout: 20000 });
  await expect.poll(
    () => page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration())?.active?.scriptURL || ''),
    { timeout: 20000 }
  ).toContain('fassung=test');
});

test('Buchnavigation gibt das Eingabefeld frei', async ({ page }, testInfo) => {
  /* Nur auf dem Handyprofil sinnvoll: Dort kommen feste Navigation,
     Benutzer-Chip und Bildschirmtastatur auf engem Raum zusammen. */
  test.skip(testInfo.project.name !== 'handy', 'gilt für das Handyprofil');

  await page.goto('/einheit.html?u=pz-06&p=A');
  await page.getByRole('button', { name: /Los geht/ }).click();
  const feld = page.locator('.zahl-feld');
  await expect(feld).toBeVisible();

  /* Nichts darf über dem Eingabefeld oder dem Prüfen-Knopf liegen —
     genau das ist der Fehler, der sich am Schreibtisch nie zeigt. */
  for (const ziel of [feld, page.locator('#pruefen')]) {
    const kasten = await ziel.boundingBox();
    expect(kasten).not.toBeNull();
    const oben = await page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el ? (el.className || el.tagName) : '';
    }, [kasten.x + kasten.width / 2, kasten.y + kasten.height / 2]);
    expect(String(oben)).not.toContain('m9-user-chip');
    expect(String(oben)).not.toContain('buch-nav');
  }

  /* Bei fokussiertem Feld fährt die Buchleiste weg — sonst steht sie dort,
     wo auf dem Gerät die Tastatur aufgeht. */
  await feld.focus();
  const verschoben = await page.locator('.buch-nav').evaluate(el =>
    getComputedStyle(el).transform);
  expect(verschoben).not.toBe('none');
});

test('Erklärvideos werden verlinkt, nicht eingebettet', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-08&p=B');

  const karte = page.locator('#videokarte');
  await expect(karte).toBeVisible();
  await karte.locator('summary').click();

  const links = karte.locator('a.ua-link');
  await expect(links.first()).toBeVisible();

  /* Eingebettet wäre es ein Datenschutzproblem und ein CSP-Verstoß:
     YouTube würde beim bloßen Öffnen der Einheit mitlesen. */
  await expect(page.locator('iframe')).toHaveCount(0);

  const erste = links.first();
  await expect(erste).toHaveAttribute('target', '_blank');
  await expect(erste).toHaveAttribute('rel', /noopener/);
  expect(await erste.getAttribute('href')).toMatch(
    /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/);

  /* Ein an Pfad C gebundenes Video darf auf Pfad A nicht auftauchen —
     sonst schickt die Einheit ein Kind auf Basisniveau in eine Erklärung,
     die zwei Stufen darüber ansetzt. */
  const nurC = (einheit('pz-08').videos || []).filter(x => x.pfad === 'C');
  expect(nurC.length).toBeGreaterThan(0);
  await page.goto('/einheit.html?u=pz-08&p=A');
  for (const eintrag of nurC) {
    await expect(page.locator(`#videokarte a[href="${eintrag.url}"]`)).toHaveCount(0);
  }
});

test('Übungsblatt wird angeboten und ist erreichbar', async ({ page, request }) => {
  await page.goto('/einheit.html?u=pz-08&p=B');

  const karte = page.locator('#blattkarte');
  await expect(karte).toBeVisible();
  await expect(karte).toContainText('von Hand');

  const link = page.locator('#blattkarte-link');
  const pfad = await link.getAttribute('href');
  expect(pfad).toBe('units/pz/pz-08/uebungsblatt.pdf');
  await expect(link).not.toHaveAttribute('download', /.+/);

  /* Ein Verweis auf ein fehlendes PDF fiele erst im Unterricht auf. */
  const antwort = await request.get('http://127.0.0.1:8123/' + pfad);
  expect(antwort.status()).toBe(200);
  const kopf = (await antwort.body()).subarray(0, 8).toString('latin1');
  expect(kopf).toContain('%PDF-');
});

test('Externe Übung öffnet im Rahmen statt im neuen Tab', async ({ page, context }) => {
  /* Die fremde Seite wird nicht wirklich geladen — geprüft wird, dass die
     Anwendung bestehen bleibt und der Rückweg da ist. */
  await context.route(/learningapps\.org/, route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Testübung</p>' }));

  await page.goto('/einheit.html?u=pz-01&p=B');
  await page.locator('#uebungskarte summary').click();

  const link = page.locator('#uebungskarte a.ua-link').first();
  await expect(link).toBeVisible();
  await link.focus();

  /* Kein neuer Tab: Die Seitenzahl des Kontextes bleibt gleich. */
  const vorher = context.pages().length;
  await link.click();
  const rahmen = page.locator('.m9-rahmen');
  await expect(rahmen).toBeVisible();
  await expect(rahmen).toHaveAttribute('role', 'dialog');
  await expect(rahmen).toHaveAttribute('aria-modal', 'true');
  expect(context.pages().length).toBe(vorher);

  await expect(rahmen.locator('iframe')).toHaveCount(1);
  /* Der Weg in den neuen Tab steht immer daneben — manche Plattformen
     verbieten das Einbetten. */
  await expect(rahmen.locator('a[target="_blank"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('.m9-rahmen')).toHaveCount(0);
  await expect(page.locator('#uebungskarte')).toBeVisible();
  await expect(link).toBeFocused();
});

test('Lernzeit zählt nur bei Aktivität', async ({ page }) => {
  await page.goto('/einheit.html?u=pz-06&p=A');
  await expect(page.locator('.lernkarte')).toBeVisible();

  const zustand = await page.evaluate(() => window.Lernmodus?.zustand?.() || null);
  expect(zustand).not.toBeNull();
  /* Im Entwicklermodus wird nichts gemeldet — geprüft wird, dass das Modul
     überhaupt läuft und keinen Modus vortäuscht, den es nicht kennt. */
  expect(['uebung', 'bewertung']).toContain(zustand.modus);

  const urteil = await page.evaluate(() => window.Lernmodus.darfOeffnen('sk-12'));
  expect(urteil.erlaubt).toBe(true);
});

test('Sicherheitsrichtlinie bricht keine Seite', async ({ page }) => {
  /* Eine CSP, die etwas Notwendiges blockiert, fällt sonst erst im
     Unterricht auf — als „bei mir geht das nicht". */
  const verstoesse = [];
  page.on('console', m => {
    if (/Content Security Policy|Refused to/i.test(m.text())) verstoesse.push(m.text());
  });

  for (const adresse of ['/index.html', '/einheit.html?u=pz-05&p=B',
                         '/warmup.html', '/uebungen.html', '/animationen.html?bereich=PZ']) {
    await page.goto(adresse);
    await expect(page.locator('main')).toBeVisible();
  }
  expect(verstoesse).toEqual([]);
});
