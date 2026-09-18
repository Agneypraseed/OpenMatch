import { chromium } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(here, '../../docs/launch');
const appUrl = process.env.OPENMATCH_URL || 'http://127.0.0.1:5173';

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
});
const context = await browser.newContext({
  colorScheme: 'light',
  viewport: { width: 1270, height: 760 },
});
const page = await context.newPage();

const capture = (name) =>
  page.screenshot({
    path: path.join(outputDir, name),
    animations: 'disabled',
  });

await page.goto(appUrl);
await page.evaluate(() => localStorage.clear());
await page.reload();

await page.locator('.workspace-card__header .engine-control summary').click();
await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption('openai');
await capture('01-application-astra.png');

await page.getByRole('button', { name: 'Explore sample' }).click();
await page.locator('#results-section').scrollIntoViewIfNeeded();
await capture('02-evidence-report.png');

await page.getByRole('button', { name: 'Interview studio', exact: true }).click();
await page.locator('.studio-form .engine-control summary').click();
await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption('openai');
await capture('03-interview-studio-astra.png');

await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption('local');
await page.getByLabel('What role are you preparing for?').fill('Senior Backend Engineer');
await page.getByLabel('Anything you want to focus on?').fill('System design and technical leadership');
await page.getByRole('button', { name: '3 questions', exact: true }).click();
await page.getByRole('button', { name: 'Start interview', exact: true }).click();
await page
  .getByLabel('Your answer', { exact: true })
  .fill(
    'I led the redesign of a high-volume document pipeline. I profiled the existing service, split the work into bounded stages, and introduced idempotent retries. The change reduced processing time by 32 percent and gave the team clearer failure signals.',
  );
await page.getByRole('button', { name: 'Get feedback' }).click();
await page.getByRole('heading', { name: 'A little sharper, next time.' }).waitFor();
await capture('04-interview-feedback.png');

await page.getByRole('button', { name: 'For recruiters', exact: true }).click();
await capture('05-recruiter-workspace.png');

const logoPage = await context.newPage();
const brandSvg = await readFile(path.resolve(here, '../brand.svg'), 'utf8');
const brandUrl = `data:image/svg+xml;base64,${Buffer.from(brandSvg).toString('base64')}`;
await logoPage.setViewportSize({ width: 512, height: 512 });
await logoPage.setContent(`
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; width: 512px; height: 512px; display: grid; place-items: center; background: #f6f5f0; }
    img { width: 420px; height: 420px; }
  </style>
  <img src="${brandUrl}" alt="OpenMatch" />
`);
await logoPage.locator('img').waitFor();
await logoPage.screenshot({ path: path.join(outputDir, 'openmatch-icon.png') });

await browser.close();
console.log(`Launch assets saved to ${outputDir}`);
