import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  workers: 1,
  reporter: 'list',
  webServer: { command: 'node scripts/serve-site.mjs', url: 'http://127.0.0.1:4180', reuseExistingServer: !process.env.CI },
  projects: [...['site', 'offline'].flatMap(output => [
    { name: output + '-desktop', testIgnore: /account\.spec\.ts/, use: { viewport: { width: 1280, height: 900 } } },
    { name: output + '-phone', testIgnore: /account\.spec\.ts/, use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: output + '-short', testIgnore: /account\.spec\.ts/, use: { viewport: { width: 1280, height: 600 } } },
  ]), ...['account-site','connected'].flatMap(output => [
    { name: output + '-desktop', testMatch: /account\.spec\.ts/, use: { viewport: {width:1280,height:900} } },
    { name: output + '-phone', testMatch: /account\.spec\.ts/, use: { viewport: {width:390,height:844} } },
  ])],
});
