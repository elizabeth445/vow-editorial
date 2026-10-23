import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export default defineConfig({
  testDir: './tests', timeout: 30000, fullyParallel: false, workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    launchOptions: { executablePath: existsSync(chrome) ? chrome : undefined },
    viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: { command: 'pnpm run dev --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
