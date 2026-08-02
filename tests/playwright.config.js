// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/* Die Anwendung ist statisch — es genügt ein einfacher Dateiserver.
   Python bringt einen mit und ist auf den Runnern ohnehin vorhanden. */
module.exports = defineConfig({
  testDir: './smoke',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: false,          // Der Service Worker verträgt keine Parallelläufe
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: 'http://127.0.0.1:8123',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {}
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    /* Ein Mobilprofil, weil genau dort die Tastatur, die feste Navigation
       und die Bildhöhe zusammenkommen. */
    { name: 'handy', use: { ...devices['Pixel 5'] } }
  ],

  webServer: {
    command: 'python -m http.server 8123 --directory ..',
    url: 'http://127.0.0.1:8123/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
