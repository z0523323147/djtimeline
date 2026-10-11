import { test as base, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export { expect };
export const test = base.extend<{ networkAudit: void }>({
  networkAudit: [async ({ page, context }, use, info) => {
    const errors: string[] = [], requests: string[] = [];
    const offline = info.project.name.startsWith('offline');
    const artifact = pathToFileURL(resolve('dist/party-map.html')).href;
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => requests.push(r.url()));
    if (offline) {
      await context.setOffline(true);
      await page.route('**/*', route => route.request().url() === artifact ? route.continue() : route.abort());
    }
    await use();
    expect(errors, 'No uncaught app errors').toEqual([]);
    if (offline) expect(requests.filter(r => r !== artifact), 'No sibling assets or network requests during offline workflows').toEqual([]);
  }, { auto: true }],
});
