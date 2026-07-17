import { test, expect, type Page, type FrameLocator } from "@playwright/test"

const miniApp = (page: Page): FrameLocator => page.frameLocator('[data-testid="mini-app"]')

test.describe("host <-> mini app messaging", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("handshake succeeds and wallet context loads", async ({ page }) => {
    const app = miniApp(page)
    await expect(app.getByTestId("handshake")).toHaveText("connected")
    await expect(app.getByTestId("network")).toHaveText("preprod")
    await expect(app.getByTestId("theme")).toHaveText("light")
    await expect(app.getByTestId("tip")).toContainText("#10450000")
    await expect(app.getByTestId("balance")).toHaveText("1234000000")
  })

  test("client requests appear in the host log", async ({ page }) => {
    await expect(miniApp(page).getByTestId("handshake")).toHaveText("connected")
    const log = page.getByTestId("host-log")
    await expect(log).toContainText("xray.client.handshake")
    await expect(log).toContainText("xray.client.getTip")
    await expect(log).toContainText("xray.client.routeChanged")
  })

  test("host-pushed theme change reaches the mini app", async ({ page }) => {
    const app = miniApp(page)
    await expect(app.getByTestId("theme")).toHaveText("light")
    await page.getByTestId("theme-toggle").click()
    await expect(app.getByTestId("theme")).toHaveText("dark")
    await page.getByTestId("theme-toggle").click()
    await expect(app.getByTestId("theme")).toHaveText("light")
  })

  test("host-pushed network change reaches the mini app", async ({ page }) => {
    const app = miniApp(page)
    await expect(app.getByTestId("network")).toHaveText("preprod")
    await page.getByTestId("network-select").selectOption("mainnet")
    await expect(app.getByTestId("network")).toHaveText("mainnet")
  })

  test("signTx round-trip resolves with a hash", async ({ page }) => {
    const app = miniApp(page)
    await expect(app.getByTestId("handshake")).toHaveText("connected")
    await app.getByTestId("sign-tx").click()
    await expect(app.getByTestId("action-result")).toHaveText(`signed: ${"f".repeat(64)}`)
    await expect(page.getByTestId("host-log")).toContainText("xray.client.signTx")
  })

  test("signData round-trip resolves with signed data", async ({ page }) => {
    const app = miniApp(page)
    await expect(app.getByTestId("handshake")).toHaveText("connected")
    await app.getByTestId("sign-data").click()
    await expect(app.getByTestId("action-result")).toHaveText("signed data: deadbeef")
    await expect(page.getByTestId("host-log")).toContainText("xray.client.signData")
  })
})
