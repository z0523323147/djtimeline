import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  workers: 1,
  reporter: 'list',
  webServer: { command: 'node scripts/serve-site.mjs', url: 'http://127.0.0.1:4180', reuseExistingServer: !process.env.CI },
  projects: ['site', 'offline'].flatMap(output => [
    { name: output + '-desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: output + '-phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: output + '-short', use: { viewport: { width: 1280, height: 600 } } },
  ]),
});
