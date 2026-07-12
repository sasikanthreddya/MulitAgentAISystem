import { test, expect } from "@playwright/test";

test.describe("Dynamic Loading Ex1 (element hidden, present in DOM)", () => {
  test("TC10 [Positive] Dynamic Loading Ex1 - Loading bar shown then Hello World becomes visible", { tag: "@sanity" }, async ({ page }) => {
    await page.goto("/dynamic_loading/1");
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.locator("#loading")).toBeVisible();
    // Web-first assertion auto-retries until the element becomes visible — no
    // arbitrary sleep needed, which is what keeps this stable under parallel load.
    await expect(page.getByText("Hello World!")).toBeVisible({ timeout: 15000 });
  });

  test("TC11 [Negative] Dynamic Loading Ex1 - Hello World hidden before Start is clicked", async ({ page }) => {
    await page.goto("/dynamic_loading/1");
    await expect(page.getByText("Hello World!")).toBeHidden();
  });
});

test.describe("Dynamic Loading Ex2 (element added to DOM only after loading)", () => {
  test("TC12 [Positive] Dynamic Loading Ex2 - Loading bar shown then Hello World rendered into DOM", async ({ page }) => {
    await page.goto("/dynamic_loading/2");
    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.locator("#loading")).toBeVisible();
    await expect(page.getByText("Hello World!")).toBeVisible({ timeout: 15000 });
  });

  test("TC13 [Negative] Dynamic Loading Ex2 - Hello World absent from DOM before Start is clicked", async ({ page }) => {
    await page.goto("/dynamic_loading/2");
    await expect(page.getByText("Hello World!")).toHaveCount(0);
  });

  test("TC14 [Positive] Async Loading - Test correctly waits for element instead of failing prematurely", async ({ page }) => {
    await page.goto("/dynamic_loading/2");
    await page.getByRole("button", { name: "Start" }).click();
    // Deliberately no manual wait/sleep before this assertion: Playwright's
    // auto-retrying expect() polls until the ~5s loading bar finishes, proving
    // the test waits correctly rather than racing the async render.
    await expect(page.getByText("Hello World!")).toBeVisible({ timeout: 15000 });
  });
});
