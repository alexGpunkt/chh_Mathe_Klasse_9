// @ts-check
const { test, expect } = require('@playwright/test');

/* ============================================================
   Die Aufteilung von animationen.js absichern

   Seit V34 liegt je Lernbereich eine eigene Datei vor. Ein Syntaxcheck
   findet dabei genau das NICHT, was hier schiefgehen kann: einen
   Bezeichner, der vor der Aufteilung im selben Gültigkeitsbereich lag
   und jetzt in einer anderen Datei steht. Das fällt erst auf, wenn eine
   Animation tatsächlich gebaut wird.

   Deshalb wird hier jede der 42 Animationen wirklich gerendert — auf
   jeder Niveaustufe — und jede Konsolenmeldung mitgelesen.
   ============================================================ */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mathe9.dev.skipLogin', 'true');
    localStorage.setItem('mathe9.dev.supabaseDisabled', 'true');
    localStorage.setItem('mathe9.dev.trackerDisabled', 'true');
    localStorage.setItem('mathe9.dev.student', 'test1');
  });
});

/* Sammelt echte Fehler — Warnungen des Trackers ohne Server zählen nicht. */
function fehlerSammler(page) {
  const fehler = [];
  page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (/tracker|progress|Supabase|Failed to load resource/i.test(text)) return;
    fehler.push('console: ' + text);
  });
  return fehler;
}

test('alle 42 Animationen bauen auf jeder Stufe', async ({ page }) => {
  const fehler = fehlerSammler(page);
  await page.goto('/animationen.html');

  const bekannt = await page.evaluate(() => window.ANIM.liste.map(d => d.id));
  expect(bekannt).toHaveLength(42);
  expect(new Set(bekannt).size).toBe(42);          // keine doppelten IDs

  /* Jede Animation auf A, B und C bauen. baueIn wirft nicht, sondern
     hängt bei einem Fehler einen Hinweis ein — beides wird geprüft. */
  const ergebnis = await page.evaluate(async (ids) => {
    const probleme = [];
    const host = document.createElement('div');
    document.body.appendChild(host);
    for (const id of ids) {
      for (const stufe of ['A', 'B', 'C']) {
        host.replaceChildren();
        try {
          const ctrl = window.ANIM.einbetten(id, host, { stufe, breite: 320 });
          if (!ctrl) probleme.push(`${id}/${stufe}: kein Steuerobjekt`);
          /* Nicht jede Animation ist ein SVG: dreisatz, antiproportional
             und signalwoerter zeichnen Schemata aus <div>-Elementen.
             Und nicht jede hat auf jeder Stufe eine Bedienleiste — einige
             Stufen sind bewusst ein Standbild (etwa pythpyr und kegel).
             Geprüft wird deshalb nur, dass überhaupt ein Bild entsteht. */
          if (!host.querySelector('svg, .anim-schema, .anim-signal')) {
            probleme.push(`${id}/${stufe}: kein Bild aufgebaut`);
          }
          if (host.querySelector('.anim-fehlt')) probleme.push(`${id}/${stufe}: nicht gefunden`);
        } catch (e) {
          probleme.push(`${id}/${stufe}: ${e.message}`);
        }
        window.ANIM.aufraeumen(host);
      }
    }
    host.remove();
    return probleme;
  }, bekannt);

  expect(ergebnis).toEqual([]);
  expect(fehler).toEqual([]);
});

/* Jeder Lernbereich einzeln: Auf der Einheitenseite wird nur EIN Block
   nachgeladen. Wenn dabei etwas fehlt, das vorher aus einem anderen
   Bereich kam, zeigt sich das genau hier. */
for (const [einheit, bereich] of [
  ['lf-04', 'lf'], ['pz-06', 'pz'], ['kp-04', 'kp'], ['sk-03', 'sk']
]) {
  test(`${einheit}: lädt nur den Block ${bereich} und zeigt sein Bild`, async ({ page }) => {
    const fehler = fehlerSammler(page);
    const geladen = [];
    page.on('request', r => {
      const m = r.url().match(/animationen-(\w+)\.js$/);
      if (m) geladen.push(m[1]);
    });

    await page.goto(`/einheit.html?u=${einheit}&p=B`);
    await expect(page.locator('.lernkarte')).toBeVisible();

    /* Genau Kern, Lader und der eigene Bereich — kein fremder Block. */
    expect(geladen.sort()).toEqual(['kern', 'laden', bereich].sort());

    /* Der Block ist da, bevor die Karte gebaut wurde. */
    const zustand = await page.evaluate(async () => ({
      bereit: await window.ANIM.bereit,
      bereich: window.ANIM.bereich,
      anzahl: window.ANIM.liste.length
    }));
    expect(zustand.bereit).toBe(true);
    expect(zustand.bereich).toBe(bereich);
    /* Kern (1 Signalwort-Animation) + der Bereich (10 bzw. 11). */
    expect(zustand.anzahl).toBeGreaterThanOrEqual(11);

    await expect(page.locator('.anim-fehlt')).toHaveCount(0);
    await expect(page.locator('.lernkarte svg').first()).toBeVisible();
    expect(fehler).toEqual([]);
  });
}

test('Prüfungseinheit findet die Signalwort-Animation im Kern', async ({ page }) => {
  /* Die vier Prüfungseinheiten sind die einzigen, die eine Animation
     außerhalb ihres Lernbereichs nutzen. Sie liegt deshalb im Kern. */
  const fehler = fehlerSammler(page);
  await page.goto('/einheit.html?u=sk-12&p=B');
  await expect(page.locator('.lernkarte')).toBeVisible();
  await expect(page.locator('.anim-fehlt')).toHaveCount(0);

  const hatSignalwort = await page.evaluate(() =>
    window.ANIM.liste.some(d => d.id === 'signalwoerter'));
  expect(hatSignalwort).toBe(true);
  expect(fehler).toEqual([]);
});
