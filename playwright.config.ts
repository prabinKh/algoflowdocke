import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    hosts: {
      'neo-store.local': '127.0.0.1',
      'quantum-electronics.local': '127.0.0.1',
      'apex-tech.local': '127.0.0.1',
      'summit-gadgets.local': '127.0.0.1',
      'horizon-devices.local': '127.0.0.1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
