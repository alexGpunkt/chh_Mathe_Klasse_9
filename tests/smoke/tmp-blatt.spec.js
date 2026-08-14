const { test, expect } = require('@playwright/test');

for (const stufe of ['A', 'B', 'C']) {
  test(`Übungsblatt für Lernweg ${stufe} wird verlinkt und ist erreichbar`, async ({ page, request }) => {
    await page.goto(`/einheit.html?u=pz-01&p=${stufe}`);
    const link = page.locator('#blattkarte-link');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe(`units/pz/pz-01/uebungsblatt-${stufe.toLowerCase()}.pdf`);
    const antwort = await request.get('/' + href);
    expect(antwort.status()).toBe(200);
    expect(Number(antwort.headers()['content-length'])).toBeGreaterThan(1500);
  });
}
