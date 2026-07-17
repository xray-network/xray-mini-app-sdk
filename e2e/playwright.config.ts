import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "yarn dev",
      cwd: "../playground/host-app",
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "yarn dev",
      cwd: "../playground/demo-mini-app",
      port: 5174,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
