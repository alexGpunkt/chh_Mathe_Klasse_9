// @ts-check
const { test, expect } = require('@playwright/test');

/* ============================================================
   Smoke-Tests für den Taschenrechner und die Beameransicht

   Zwei Zusagen werden hier gemessen, nicht nur behauptet:

   1. Bei geöffnetem Rechner ist NICHTS sichtbar außer der laufenden
      Aufgabe und dem Rechner — und die Seite scrollt nicht.
   2. Die Beameransicht zeigt genau die drei Ping-Zustände, die im
      Lehrerdashboard eingestellt werden.
   ============================================================ */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mathe9.dev.skipLogin', 'true');
    localStorage.setItem('mathe9.dev.supabaseDisabled', 'true');
    localStorage.setItem('mathe9.dev.trackerDisabled', 'true');
    localStorage.setItem('mathe9.dev.student', 'test1');
  });
});

test.describe('Taschenrechner', () => {
  test('rechnet und übernimmt das Ergebnis ins Antwortfeld', async ({ page }) => {
    await page.goto('/einheit.html?u=pz-08&p=B');
    await page.getByRole('button', { name: /Los geht/ }).click();
    await expect(page.locator('.frage')).toBeVisible();

    await page.locator('#tr-aufruf').click();
    await expect(page.locator('#taschenrechner')).toBeVisible();

    /* 12 · 5 = 60 */
    await page.locator('.tr-taste', { hasText: /^1$/ }).click();
    await page.locator('.tr-taste', { hasText: /^2$/ }).click();
    await page.locator('.tr-taste', { hasText: /^·$/ }).click();
    await page.locator('.tr-taste', { hasText: /^5$/ }).click();
    await page.locator('.tr-taste', { hasText: /^=$/ }).click();
    await expect(page.locator('.tr-ergebnis')).toContainText('60');

    await page.locator('#tr-uebernehmen').click();
    await expect(page.locator('#buehne .zahl-feld').first()).toHaveValue('60');
  });

  test('blendet alles außer Aufgabe und Rechner aus, ohne zu scrollen', async ({ page }) => {
    await page.goto('/einheit.html?u=kp-04&p=B');
    await page.getByRole('button', { name: /Los geht/ }).click();
    await expect(page.locator('.frage')).toBeVisible();

    /* Alt + R wirkt immer — auch aus dem Antwortfeld heraus, in dem der
       Cursor nach dem Start steht. Das bloße „r" gehört dort dem Feld. */
    await page.keyboard.press('Alt+r');
    await expect(page.locator('#taschenrechner')).toBeVisible();

    /* Kopf, Fortschrittsstreifen, Pfadwahl, Formelkarte: alle weg. */
    await expect(page.locator('header.kopf')).toBeHidden();
    await expect(page.locator('#formelkarte')).toBeHidden();
    await expect(page.locator('#tr-aufruf')).toBeHidden();

    /* Aufgabe samt Eingabefeld bleibt. */
    await expect(page.locator('[data-rechner-fokus]')).toBeVisible();
    await expect(page.locator('#buehne .zahl-feld').first()).toBeVisible();

    /* Kein Scrollen: Die Seite ist genau so hoch und breit wie das Fenster. */
    const masse = await page.evaluate(() => ({
      scrollH: document.documentElement.scrollHeight,
      clientH: document.documentElement.clientHeight,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth
    }));
    expect(masse.scrollH).toBeLessThanOrEqual(masse.clientH + 1);
    expect(masse.scrollW).toBeLessThanOrEqual(masse.clientW + 1);

    /* Esc bringt alles zurück. */
    await page.keyboard.press('Escape');
    await expect(page.locator('header.kopf')).toBeVisible();
    await expect(page.locator('#taschenrechner')).toBeHidden();
  });

  test('das bloße r öffnet, solange nicht in ein Feld getippt wird', async ({ page }) => {
    await page.goto('/einheit.html?u=kp-04&p=B');
    await page.getByRole('button', { name: /Los geht/ }).click();
    await expect(page.locator('.frage')).toBeVisible();

    /* Der Cursor steht nach dem Start im Antwortfeld — dort gehört das
       „r" dem Feld, und genau so soll es sein. */
    await page.locator('#buehne .zahl-feld').first().focus();
    await page.keyboard.press('r');
    await expect(page.locator('#taschenrechner')).toBeHidden();

    await page.locator('.frage').click();
    await page.keyboard.press('r');
    await expect(page.locator('#taschenrechner')).toBeVisible();
  });

  test('rechnet nach den Regeln des Unterrichts', async ({ page }) => {
    await page.goto('/einheit.html?u=pz-08&p=B');
    await page.getByRole('button', { name: /Los geht/ }).click();
    await page.locator('#tr-aufruf').click();

    const proben = await page.evaluate(() => {
      const r = window.Taschenrechner;
      return {
        punktVorStrich: r.rechne('2 + 3 · 4'),
        klammer: r.rechne('(2 + 3) · 4'),
        prozent: r.rechne('80 · 25%'),
        quadrat: r.rechne('5²'),
        wurzel: r.rechne('√16'),
        potenzRechts: r.rechne('2^3^2'),
        komma: r.rechne('0,5 + 0,25'),
        minus: r.rechne('3 − 8')
      };
    });

    expect(proben.punktVorStrich).toBe(14);
    expect(proben.klammer).toBe(20);
    expect(proben.prozent).toBe(20);
    expect(proben.quadrat).toBe(25);
    expect(proben.wurzel).toBe(4);
    expect(proben.potenzRechts).toBe(512);
    expect(proben.komma).toBe(0.75);
    expect(proben.minus).toBe(-5);
  });
});

test.describe('Entwicklermenü wird nachgeladen', () => {
  /* Seit V34 steht dev-tools.js in keinem HTML mehr; dev-boot.js holt es
     nur bei devMode. Die Aufteilung ist ladereihenfolgenkritisch — deshalb
     wird hier beides einzeln geprüft: die Einstellungen müssen VOR den
     übrigen Skripten gelten, das Menü darf danach kommen. */

  test('Einstellungen gelten sofort, das Menü kommt nach', async ({ page }) => {
    await page.goto('/einheit.html?u=pz-08&p=B');

    /* dev-boot.js läuft synchron: Der Testschüler steht, bevor
       student-login.js, tracker.js und lernmodus.js ihn brauchen. */
    const sofort = await page.evaluate(() => ({
      student: window.MATHE9_STUDENT?.login_name || null,
      helfer: typeof window.Mathe9DevTools?.saveTestStudent === 'function',
      loginUebersprungen: window.MATHE9_SUPABASE?.skipStudentLogin === true
    }));
    expect(sofort.student).toBe('test.schueler1');
    expect(sofort.helfer).toBe(true);
    expect(sofort.loginUebersprungen).toBe(true);

    /* Das Menü selbst wird nachgeladen und baut auf DOMContentLoaded auf. */
    await expect(page.locator('.m9-dev-button')).toBeVisible();

    const geladen = await page.evaluate(() =>
      [...document.querySelectorAll('script[src]')].map(s => s.src));
    expect(geladen.some(s => s.endsWith('dev-boot.js'))).toBe(true);
    expect(geladen.some(s => s.endsWith('dev-tools.js'))).toBe(true);
  });

  test('kein HTML bindet dev-tools.js noch fest ein', async ({ page }) => {
    /* Der eigentliche Gewinn der Umstellung: Auf master, wo devMode aus
       ist, darf die Datei gar nicht erst angefordert werden. Hier wird
       geprüft, dass kein festes Script-Tag sie zurückholt. */
    const angefragt = [];
    page.on('request', r => { if (r.url().endsWith('dev-tools.js')) angefragt.push(r.url()); });

    await page.goto('/einheit.html?u=pz-08&p=B');
    await expect(page.locator('.m9-dev-button')).toBeVisible();

    const festEingebunden = await page.evaluate(() =>
      [...document.querySelectorAll('script[src]')]
        .filter(s => !s.async && s.src.endsWith('dev-tools.js')).length);

    /* Genau einmal angefordert — und zwar nachgeladen, nicht fest verdrahtet. */
    expect(angefragt).toHaveLength(1);
    expect(festEingebunden).toBe(0);
  });
});

test.describe('Beameransicht', () => {
  /* Die Ansicht hängt an einem BroadcastChannel. Für den Test genügt es,
     selbst zu senden, was sonst das Lehrerdashboard schickt. */
  async function senden(page, zeilen, einstellungen = {}) {
    await page.evaluate(([z, e]) => {
      const kanal = new BroadcastChannel('mathe9-beamer');
      kanal.postMessage({
        typ: 'daten',
        ts: Date.now(),
        klasse: '9a',
        reihe: ['lf-01', 'lf-02', 'lf-03', 'lf-04'],
        einstellungen: { maxFehler: 3, maxSekundenOhnePing: 120, frischSekunden: 45, bezug: 'reihe', ...e },
        zeilen: z
      });
      kanal.close();
    }, [zeilen, einstellungen]);
  }

  test('zeigt grün, rot und rot blinkend nach den Grenzwerten', async ({ page }) => {
    await page.goto('/dashboard/beamer.html');

    const jetzt = Date.now();
    await senden(page, [
      { id: 'a', name: 'Anna A.', unit: 'lf-02', path: 'B', percent: 50,
        letzterPing: new Date(jetzt - 5000).toISOString(), pingFehler: 0, pingTaktSekunden: 20 },
      { id: 'b', name: 'Bela B.', unit: 'lf-01', path: 'A', percent: 25,
        letzterPing: new Date(jetzt - 60000).toISOString(), pingFehler: 0, pingTaktSekunden: 20 },
      { id: 'c', name: 'Cem C.', unit: 'lf-03', path: 'C', percent: 10,
        letzterPing: new Date(jetzt - 300000).toISOString(), pingFehler: 0, pingTaktSekunden: 20 },
      { id: 'd', name: 'Dana D.', unit: 'lf-01', path: 'B', percent: 80,
        letzterPing: new Date(jetzt - 3000).toISOString(), pingFehler: 9, pingTaktSekunden: 20 }
    ]);

    await expect(page.locator('.bahn')).toHaveCount(4);

    /* frisch → grün */
    await expect(page.locator('.bahn').filter({ hasText: 'Anna A.' })).toHaveAttribute('data-status', 'gruen');
    /* 60 s: über dem Frischefenster, unter dem Alarm → rot */
    await expect(page.locator('.bahn').filter({ hasText: 'Bela B.' })).toHaveAttribute('data-status', 'rot');
    /* 300 s ohne Ping → Alarm */
    await expect(page.locator('.bahn').filter({ hasText: 'Cem C.' })).toHaveAttribute('data-status', 'alarm');
    /* frischer Ping, aber neun erfolglose Versuche → ebenfalls Alarm */
    await expect(page.locator('.bahn').filter({ hasText: 'Dana D.' })).toHaveAttribute('data-status', 'alarm');

    await expect(page.locator('#zaehlerAlarm')).toHaveText('2');
  });

  test('setzt das Strichmännchen nach dem Fortschritt in der Reihe', async ({ page }) => {
    await page.goto('/dashboard/beamer.html');
    const jetzt = Date.now();

    /* Reihe mit vier Einheiten, Kind steht in lf-03 bei 50 %:
       (2 + 0,5) / 4 = 62,5 % der Gesamtstrecke. */
    await senden(page, [
      { id: 'a', name: 'Anna A.', unit: 'lf-03', path: 'B', percent: 50,
        letzterPing: new Date(jetzt - 2000).toISOString(), pingFehler: 0, pingTaktSekunden: 20 }
    ]);

    await expect(page.locator('.bahn-fuss .prozent')).toHaveText('63 %');
    const links = await page.locator('.laeufer').evaluate(n => n.style.left);
    expect(parseFloat(links)).toBeCloseTo(2 + 0.625 * 96, 1);

    /* Umschalten auf die Einheit: dann zählt nur der Stand in lf-03. */
    await senden(page, [
      { id: 'a', name: 'Anna A.', unit: 'lf-03', path: 'B', percent: 50,
        letzterPing: new Date(jetzt - 2000).toISOString(), pingFehler: 0, pingTaktSekunden: 20 }
    ], { bezug: 'einheit' });

    await expect(page.locator('.bahn-fuss .prozent')).toHaveText('50 %');
  });
});
