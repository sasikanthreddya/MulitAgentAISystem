import { test, expect } from "@playwright/test";

test.describe("Dynamic Content", () => {
  test("TC4 [Positive] Dynamic Content - Content changes between page loads", async ({ page }) => {
    await page.goto("/dynamic_content");
    const firstText = await page.locator("#content .large-10.columns:not([id])").first().textContent();
    await page.reload();
    const secondText = await page.locator("#content .large-10.columns:not([id])").first().textContent();
    expect(firstText).not.toEqual(secondText);
  });

  test("TC5 [Negative] Dynamic Content - Page renders content on initial load (not blank)", async ({ page }) => {
    await page.goto("/dynamic_content");
    const paragraphs = page.locator("#content .large-10.columns:not([id])");
    await expect(paragraphs.first()).not.toBeEmpty();
    await expect(paragraphs).toHaveCount(3);
  });
});
