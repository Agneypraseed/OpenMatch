import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const localPython = ['.venv', 'venv']
  .map((folder) =>
    path.resolve(
      '../backend',
      folder,
      process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
    ),
  )
  .find(existsSync);
const python = process.env.OPENMATCH_PYTHON || localPython || 'python';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `"${python}" -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: '../backend',
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
