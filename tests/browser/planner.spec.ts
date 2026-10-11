import { test, expect } from './fixtures';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const url = (name: string) => name.startsWith('offline') ? pathToFileURL(resolve('dist/party-map.html')).href : 'http://127.0.0.1:4180';
test('map, final section, keyboard selection and large controls', async ({ page }, info) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
  await page.goto(url(info.project.name));
  await expect(page.getByText('126 tracks', { exact: false }).first()).toBeVisible();
  await expect(page.getByLabel('Choose a time & genre section')).toHaveCount(0);
  await expect(page.locator('.selected-card')).toHaveCount(0);
  await expect(page.locator('.mobile-tabs')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Genre details/ })).toHaveCount(0);
  const layout = await page.locator('main').evaluate(el => {
    const overview = el.querySelector('.overview')!.getBoundingClientRect(), tracks = el.querySelector('.workspace')!.getBoundingClientRect();
    return tracks.top > overview.bottom;
  });
  expect(layout).toBeTruthy();
  await expect(page.locator('.tick').first()).toHaveText('12:30');
  await expect(page.locator('.tick').last()).toHaveText('4:00');
  await expect(page.locator('.hint, .timeline-note, .timeline-scroll, .selection-mark, .genre-captions')).toHaveCount(0);
  const sections = page.locator('.section-buttons button');
  await expect(sections).toHaveCount(26);
  await expect(page.locator('.hip-change')).toHaveCount(11);
  await expect(page.locator('.uncertain-range')).toHaveCount(2);
  await expect(page.locator('.switch-label').filter({ hasText: 'In ~2:07–2:15' })).toHaveCount(1);
  await expect(page.locator('.switch-label').filter({ hasText: 'In ~2:40–2:50' })).toHaveCount(1);
  await expect(page.locator('.switch-label').filter({ hasText: 'Out 3:31' })).toHaveCount(1);
  const geometry = await page.locator('.overview').evaluate(el => {
    const buttons = Array.from(el.querySelectorAll('.section-buttons button')).map(b => ({ id: Number((b as HTMLElement).dataset.section), box: b.getBoundingClientRect() }));
    const labels = Array.from(el.querySelectorAll('.switch-label')).map(b => b.getBoundingClientRect());
    const title = el.querySelector('h2')!.getBoundingClientRect(), legend = el.querySelector('.legend')!.getBoundingClientRect();
    return {
      ids: buttons.map(b => b.id),
      controls: buttons.every(b => b.box.height >= 44 && b.box.width >= 44),
      collisions: labels.some((a,i) => labels.slice(i+1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)),
      full: el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1,
      inline: Math.abs(title.top - legend.top) < 8,
      rows: new Set(buttons.map(b => Math.round(b.box.top))).size,
    };
  });
  expect(geometry.ids).toEqual(Array.from({length:26}, (_,i) => i));
  expect(geometry.controls).toBeTruthy(); expect(geometry.full).toBeTruthy();
  expect(geometry.collisions).toBeFalsy(); expect(geometry.inline).toBeTruthy();
  expect(geometry.rows).toBeLessThanOrEqual(info.project.name.includes('phone') ? 8 : 3);
  const final = page.getByRole('button', { name: 'Hip hop, 4:00, open 1 tracks', exact: true });
  await expect(page.locator('button.terminal-section')).toHaveCount(1);
  await final.scrollIntoViewIfNeeded(); await final.focus(); await final.press('Enter');
  await expect(page.locator('#detail-title')).toHaveText('Hip hop');
  await expect(page.locator('.overview-selection')).toHaveAttribute('data-selected', '25');
  await expect(page.locator('.terminal-section')).toHaveClass(/lit/);
  await expect(page.locator('#detail-title')).toBeFocused();
  await expect(page.locator('#tracks .title')).toHaveText('Me pregunto');
  const copy = page.getByRole('button', { name: 'Copy Me pregunto', exact: true });
  const box = await copy.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(copy).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
  if (info.project.name.startsWith('offline')) expect(requests.filter(r => !r.startsWith('file:'))).toEqual([]);
  await page.screenshot({ path: `test-results/${info.project.name}.png` });
});
test('import, cancel, correction, encoded search, combined filters and reload', async ({ page }, info) => {
  await page.goto(url(info.project.name));
  await page.getByRole('button', { name: 'Import notes', exact: true }).click();
  await page.getByLabel('Set notes', { exact: true }).fill('1:00\n(House) הפגזות\nשלום & Café --- ///\n1:30\n(Hip hop)\nВечер\n2:00\n(House)\nLast');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('header')).toContainText('126 tracks');
  await page.getByRole('button', { name: 'Import notes', exact: true }).click();
  await page.getByRole('button', { name: 'Use these notes', exact: true }).click();
  await expect(page.locator('header')).toContainText('3 tracks');
  await page.getByRole('button', { name: 'Edit שלום & Café', exact: true }).click();
  await page.getByLabel('Correct track name').fill('מתוק & Вечер (mix)');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#tracks .title')).toHaveText('מתוק & Вечер (mix)');
  expect(await page.locator('#tracks .title').evaluate(el => ({ align: getComputedStyle(el).textAlign, dir: getComputedStyle(el).direction }))).toEqual({ align: 'left', dir: 'rtl' });
  const search = page.getByRole('link', { name: 'Search Google for מתוק & Вечер (mix) download', exact: true });
  expect(new URL((await search.getAttribute('href'))!).searchParams.get('q')).toBe('מתוק & Вечер (mix) download');
  await page.getByRole('button', { name: 'Copy מתוק & Вечер (mix)', exact: true }).click();
  await expect(page.locator('#notice')).toContainText(/copied|Copy unavailable/);
  await page.getByRole('searchbox').fill('ВЕЧЕР');
  await page.getByRole('button', { name: '🔥 Peaks', exact: true }).click();
  await page.getByRole('button', { name: '💾 Downloads', exact: true }).click();
  await page.getByRole('button', { name: '💡 Ideas', exact: true }).click();
  await expect(page.locator('#tracks .title')).toHaveText('מתוק & Вечер (mix)');
  await page.reload();
  await expect(page.locator('header')).toContainText('3 tracks');
  await expect(page.locator('#tracks .title')).toHaveText('מתוק & Вечер (mix)');
});
test('storage and clipboard denial stay usable, invalid import leaves set intact', async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) } });
    document.execCommand = () => false;
  });
  await page.goto(url(info.project.name));
  await page.getByRole('button', { name: 'Edit Shakira beautiful life 116 bpm', exact: true }).click();
  await page.getByLabel('Correct track name').fill('Session correction');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('this session');
  await page.getByRole('button', { name: 'Copy Session correction', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('Copy unavailable');
  await page.getByRole('button', { name: 'Import notes', exact: true }).click();
  await page.getByLabel('Set notes', { exact: true }).fill('1:00\n---\n///');
  await page.getByRole('button', { name: 'Use these notes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('at least one');
  await page.getByLabel('Set notes', { exact: true }).press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('header')).toContainText('126 tracks');
  await expect(page.locator('#tracks .title').first()).toHaveText('Session correction');
});

test('enlarged text and long imported genres preserve full controls', async ({ page }, info) => {
  await page.goto(url(info.project.name));
  const viewport = page.viewportSize()!;
  // Browser zoom halves the CSS layout viewport. Verify the equivalent reflow at 200%.
  await page.setViewportSize({ width: Math.floor(viewport.width / 2), height: Math.floor(viewport.height / 2) });
  const controls = page.locator('.section-buttons button');
  await expect(controls).toHaveCount(26);
  const fits = await controls.evaluateAll(buttons => buttons.every(button => {
    const name = button.querySelector('.genre-name')!, b = button.getBoundingClientRect(), n = name.getBoundingClientRect();
    return n.left >= b.left && n.right <= b.right + 1 && n.bottom <= b.bottom + 1 && button.scrollWidth <= button.clientWidth + 1;
  }));
  expect(fits).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await controls.last().press('Space');
  await expect(page.locator('#detail-title')).toHaveText('Hip hop');
  await expect(page.locator('#tracks .title')).toHaveText('Me pregunto');
  await page.getByRole('button', { name: 'Import notes', exact: true }).click();
  const long = 'Melodic progressive house with very long multilingual genre שלום';
  await page.getByLabel('Set notes', { exact: true }).fill(`1:00\n(${long})\nFirst\n1:30\n(Hip hop)\nSecond`);
  await page.getByRole('button', { name: 'Use these notes', exact: true }).click();
  await expect(page.locator('.genre-name').first()).toHaveText(long);
  expect(await page.locator('.section-buttons').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
});

test('all tracks keeps source order, filters, corrections and section return', async ({ page }, info) => {
  await page.goto(url(info.project.name));
  await page.getByRole('button', { name: 'All tracks', exact: true }).click();
  await expect(page.locator('#detail-title')).toHaveText('All tracks');
  await expect(page.locator('#tracks .track')).toHaveCount(126);
  await expect(page.locator('#tracks .title').first()).toHaveText('Shakira beautiful life 116 bpm');
  await expect(page.locator('#tracks .title').last()).toHaveText('Me pregunto');
  await expect(page.locator('.overview-selection, .section-buttons .lit')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next section', exact: true })).toBeDisabled();
  await page.getByRole('searchbox').fill('Me pregunto');
  await expect(page.locator('#tracks .track')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit Me pregunto', exact: true }).click();
  await page.getByLabel('Correct track name').fill('Me pregunto corrected');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Search Google for Me pregunto corrected download', exact: true })).toHaveAttribute('href', /Me%20pregunto%20corrected/);
  await page.getByRole('button', { name: 'Copy Me pregunto corrected', exact: true }).click();
  await expect(page.locator('#notice')).toContainText(/copied|Copy unavailable/);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('#detail-title')).toHaveText('All tracks');
  await expect(page.locator('#tracks .track')).toHaveCount(126);
  await page.getByRole('button', { name: 'Hip hop, 4:00, open 1 tracks', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All tracks', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#tracks .title')).toHaveText('Me pregunto corrected');
  await page.getByText('Jump to a section or recorded time', { exact: true }).click();
  await expect(page.locator('.timing-key')).toContainText('The notes do not give an exact minute.');
  await page.getByRole('button', { name: 'All tracks', exact: true }).click();
  await page.getByRole('button', { name: 'Import notes', exact: true }).click();
  await page.getByLabel('Set notes', { exact: true }).fill('1:00\n(House)\nA\n1:30\n(Hip hop)\nB');
  await page.getByRole('button', { name: 'Use these notes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All tracks', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#tracks .track')).toHaveCount(1);
});
