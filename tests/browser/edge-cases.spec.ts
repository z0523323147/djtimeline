import { test, expect } from './fixtures';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const url = (name: string) => name.startsWith('offline') ? pathToFileURL(resolve('dist/party-map.html')).href : 'http://127.0.0.1:4180';
test('small-section alternatives select rapid switches without overlapping', async ({ page, context }, info) => {
  if (info.project.name.startsWith('offline')) await context.setOffline(true);
  await page.goto(url(info.project.name));
  await page.getByText('All sections · easy selection', { exact: true }).click();
  const buttons = page.locator('.section-buttons button');
  await expect(buttons).toHaveCount(26);
  for (const id of [11, 12, 22, 23, 24]) {
    if (info.project.name.includes('phone')) await page.getByRole('button', { name: 'The party', exact: true }).click();
    const button = buttons.nth(id);
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44); expect(box!.width).toBeGreaterThanOrEqual(44);
    await button.click();
    expect(await page.locator('#section-select').inputValue()).toBe(String(id));
    await expect(page.locator('#detail-title')).toBeFocused();
  }
});
test('text-file import renders hostile text safely and handles repeated markers', async ({ page, context }, info) => {
  if (info.project.name.startsWith('offline')) await context.setOffline(true);
  await page.goto(url(info.project.name));
  await page.getByRole('button', { name: 'Import notes', exact: true }).click();
  const title = '</script><img src=x onerror=alert(1)> שלום';
  await page.getByLabel('Or load a .txt file').setInputFiles({ name: 'set.txt', mimeType: 'text/plain', buffer: Buffer.from(`4:00\n(House)\n${title}\n4:00\n(Hip hop)\nВечер`) });
  await expect(page.getByLabel('Set notes', { exact: true })).toHaveValue(new RegExp('Вечер'));
  await page.getByRole('button', { name: 'Use these notes', exact: true }).click();
  await page.locator('#section-select').selectOption('0');
  await expect(page.locator('#tracks .title')).toHaveText(title);
  await expect(page.locator('#tracks img')).toHaveCount(0);
  if (info.project.name.includes('phone')) await page.getByRole('button', { name: 'The party', exact: true }).click();
  await expect(page.locator('.terminal-section')).toHaveCount(2);
  await page.locator('.terminal-section').nth(1).focus();
  await page.locator('.terminal-section').nth(1).press('Space');
  await expect(page.locator('#tracks .title')).toHaveText('Вечер');
});
test('successful clipboard fallback and corrupt saved data', async ({ page, context }, info) => {
  if (info.project.name.startsWith('offline')) await context.setOffline(true);
  await page.addInitScript(() => {
    localStorage.setItem('party-map-imported-notes', '---\n///');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) } });
    document.execCommand = () => {
      const textarea = document.activeElement as HTMLTextAreaElement;
      document.documentElement.dataset.copied = textarea.value;
      return true;
    };
  });
  await page.goto(url(info.project.name));
  await expect(page.locator('header')).toContainText('126 tracks');
  if (info.project.name.includes('phone')) await page.getByRole('button', { name: 'Tracks', exact: true }).click();
  await page.getByRole('button', { name: 'Copy Shakira beautiful life 116 bpm', exact: true }).click();
  await expect(page.locator('#notice')).toHaveText('Track name copied.');
  await expect(page.locator('html')).toHaveAttribute('data-copied', 'Shakira beautiful life 116 bpm');
});

test('source time navigation reveals the first track of that block', async ({ page }, info) => {
  await page.goto(url(info.project.name));
  await page.getByText('All times from your notes', { exact: true }).click();
  await page.locator('.time-jumps').getByRole('button', { name: '3:25', exact: true }).click();
  await expect(page.locator('#detail-title')).toHaveText('Hip hop');
  await expect(page.locator('#tracks .title').filter({ hasText: 'Тимоти - в клубе' })).toBeInViewport();
});
