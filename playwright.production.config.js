import { defineConfig } from '@playwright/test';
import dev from './playwright.config.js';
export default defineConfig({
  ...dev,
  testMatch: 'deployment.spec.js',
  testIgnore: [],
  use: { ...dev.use, baseURL: 'http://127.0.0.1:4174/secha-jourimanzky-wardrobe/' },
  webServer: { command: 'node scripts/serve-build.js', url: 'http://127.0.0.1:4174/secha-jourimanzky-wardrobe/', reuseExistingServer: false },
});
