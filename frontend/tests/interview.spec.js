import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';

async function openStudio(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Interview studio', exact: true }).click();
  await page.getByLabel('What role are you preparing for?').fill('Backend engineer');
  await page.getByLabel('Anything you want to focus on?').fill('Python');
  await page.getByRole('button', { name: '3 questions', exact: true }).click();
  await page.getByRole('button', { name: 'Start interview', exact: true }).click();
  await expect(page.getByLabel('Your answer', { exact: true })).toBeVisible();
}

test('complete interview with a follow-up, navigation, feedback and export', async ({ page }) => {
  await openStudio(page);
  const answer =
    'I has a project at work. I built a Python service to process invoices. I tested it against our existing workflow and reduced processing time by 20 percent. I learned to profile before optimizing.';
  await page.getByLabel('Your answer', { exact: true }).fill(answer);
  await page.getByRole('button', { name: 'Application', exact: true }).click();
  await page.getByRole('button', { name: 'Interview studio', exact: true }).click();
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(answer);
  await page.screenshot({ path: 'test-results/interview-answer.png', fullPage: true });
  await page.getByRole('button', { name: 'Get feedback' }).click();
  await expect(page.getByText('I have', { exact: true })).toBeVisible();
  await expect(page.getByText('pace not measured')).toBeVisible();
  await page.screenshot({ path: 'test-results/interview-feedback.png', fullPage: true });
  await page.getByRole('button', { name: 'Go deeper' }).click();
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('I considered rewriting everything, but chose profiling to find the bottleneck first.');
  await page.getByRole('button', { name: 'Get feedback' }).click();
  await expect(page.getByRole('button', { name: 'Go deeper' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: 'Skip question' }).click();
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('I led a design review. We discussed two options and chose the simpler implementation.');
  await page.getByRole('button', { name: 'Get feedback' }).click();
  await page.getByRole('button', { name: 'Finish & review' }).click();
  await expect(page.getByRole('heading', { name: 'Good practice adds up.' })).toBeVisible();
  await expect(page.getByText('You worked through 3 answers', { exact: false })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download notes' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('openmatch-interview-notes.md');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const notes = Buffer.concat(chunks).toString('utf8');
  expect(notes).toContain(answer);
  expect(notes).toContain('I has → I have');
  expect(notes).not.toContain('api_key');
  await page.getByRole('button', { name: 'Practice again' }).click();
  await expect(page.getByRole('button', { name: 'Start interview', exact: true })).toBeVisible();
});

test('provider errors keep the answer and allow retry', async ({ page }) => {
  await openStudio(page);
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('I built an API and measured response times.');
  await page.route('**/api/interview/answer', (route) =>
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'The coach is unavailable. Try again.' }),
    }),
  );
  await page.getByRole('button', { name: 'Get feedback' }).click();
  await expect(page.getByRole('alert')).toContainText('coach is unavailable');
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(
    'I built an API and measured response times.',
  );
  await page.unroute('**/api/interview/answer');
  await page.getByRole('button', { name: 'Get feedback' }).click();
  await expect(page.getByRole('heading', { name: 'A little sharper, next time.' })).toBeVisible();
});

test('unsupported voice offers typed input', async ({ page }) => {
  await page.addInitScript(() => {
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
  });
  await openStudio(page);
  await expect(page.getByRole('button', { name: 'Use microphone' })).toBeDisabled();
  await expect(page.getByText('Voice input is unavailable', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Your answer', { exact: true })).toBeEnabled();
});

test('speech results are editable, stopping is required, and edited transcripts have no pace', async ({
  page,
}) => {
  await page.addInitScript(() => {
    class Recognition {
      start() {
        window.testRecognition = this;
        this.onaudiostart?.();
        this.onresult?.({
          results: [
            Object.assign([{ transcript: 'I built an API and tested it.' }], { isFinal: true }),
          ],
        });
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    window.SpeechRecognition = Recognition;
  });
  await openStudio(page);
  await page.getByRole('button', { name: 'Use microphone' }).click();
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue(
    'I built an API and tested it.',
  );
  await expect(page.getByRole('button', { name: 'Get feedback' })).toBeDisabled();
  await page.getByRole('button', { name: 'Stop listening' }).click();
  await page
    .getByLabel('Your answer', { exact: true })
    .fill('I built an API and tested the latency.');
  await page.getByRole('button', { name: 'Get feedback' }).click();
  await expect(page.getByText('pace not measured')).toBeVisible();
});

test('microphone denial recovers and leaving the workspace stops capture', async ({ page }) => {
  await page.addInitScript(() => {
    class Recognition {
      start() {
        window.testRecognition = this;
        this.onaudiostart?.();
      }
      stop() {
        window.testStopped = true;
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    window.SpeechRecognition = Recognition;
  });
  await openStudio(page);
  await page.getByRole('button', { name: 'Use microphone' }).click();
  await page.evaluate(() => {
    window.testRecognition.onerror({ error: 'not-allowed' });
    window.testRecognition.onend();
  });
  await expect(page.getByRole('alert')).toContainText('Microphone access was denied');
  await expect(page.getByLabel('Your answer', { exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Use microphone' }).click();
  await page.getByRole('button', { name: 'Application', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.testStopped)).toBe(true);
});

test('sample report, STAR coach and mobile layouts remain usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore sample' }).click();
  await page.screenshot({ path: 'test-results/report-desktop.png', fullPage: true });
  for (const tab of ['Skill gaps', 'Resume', 'Question bank']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.getByRole('tab', { name: tab, exact: true })).toHaveAttribute('aria-selected', 'true');
  }
  await page.getByRole('tab', { name: 'STAR coach' }).click();
  await expect(page.locator('.star-coach')).toBeVisible();
  await page.getByRole('button', { name: 'Practice this role' }).click();
  await expect(page.getByLabel('What role are you preparing for?')).toHaveValue(
    'Senior Backend Engineer',
  );
  await page.getByLabel('What role are you preparing for?').fill('');
  await expect(page.getByRole('button', { name: 'Start interview', exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/studio-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'For recruiters', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add candidate resumes' })).toBeVisible();
  await page.screenshot({ path: 'test-results/recruiter-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('capture application and studio in both themes', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'test-results/application-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Interview studio', exact: true }).click();
  await page.screenshot({ path: 'test-results/studio-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.screenshot({
    path: 'test-results/studio-dark.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('ending early preserves an unsubmitted draft in the recap', async ({ page }) => {
  await openStudio(page);
  await page.getByLabel('Your answer', { exact: true }).fill('I am still working on this example.');
  await page.getByRole('button', { name: 'End session & review' }).click();
  await expect(page.getByText('Draft · not reviewed')).toBeVisible();
  await page.locator('.recap-turn summary').click();
  await expect(
    page.getByText('I am still working on this example.', { exact: true }),
  ).toBeVisible();
});

test('custom coach model and key are passed to API but never persisted', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Interview studio', exact: true }).click();
  await page.getByLabel('What role are you preparing for?').fill('Product manager');
  await page.locator('.studio-form .engine-control summary').click();
  await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption('openai');
  await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveValue(
    'gpt-6-astra',
  );
  await page.getByRole('combobox', { name: 'Model', exact: true }).fill('gpt-4.1-mini');
  await page.getByLabel(/OpenAI API key/).fill('sk-test-never-persist');
  await page.route('**/api/interview/start', async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.provider).toBe('openai');
    expect(payload.model).toBe('gpt-4.1-mini');
    expect(payload.api_key).toBe('sk-test-never-persist');
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'openai',
        questions: Array.from({ length: 5 }, (_, i) => ({
          question: `Describe a product decision you made, example ${i + 1}.`,
          category: 'behavioral',
        })),
      }),
    });
  });
  await page.getByRole('button', { name: 'Start interview', exact: true }).click();
  await expect(page.getByLabel('Your answer', { exact: true })).toBeVisible();
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(storage).not.toContain('sk-test-never-persist');
});

test('unedited speech reports actual capture duration and works on mobile', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    class Recognition {
      start() {
        this.onaudiostart?.();
        this.onresult?.({ results: [Object.assign([{ transcript: 'I built a service that improved response times.' }], { isFinal: true })] });
      }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    window.SpeechRecognition = Recognition;
  });
  await openStudio(page);
  await page.getByRole('button', { name: 'Use microphone' }).click();
  await page.clock.fastForward(30000);
  await page.getByRole('button', { name: 'Stop listening' }).click();
  const outgoing = page.waitForRequest('**/api/interview/answer');
  await page.getByRole('button', { name: 'Get feedback' }).click();
  const payload = (await outgoing).postDataJSON();
  expect(payload.input_mode).toBe('spoken');
  expect(payload.spoken_seconds).toBeGreaterThanOrEqual(30);
  expect(payload.spoken_seconds).toBeLessThan(35);
  await expect(page.getByText('words/min · slow')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/feedback-mobile.png', fullPage: true });
});
