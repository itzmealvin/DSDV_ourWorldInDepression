import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  use: {
    baseURL: "http://127.0.0.1:8080",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: "python3 -m http.server 8080 --bind 127.0.0.1 --directory public",
    cwd: new URL("../..", import.meta.url).pathname,
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env.CI,
  },
});
