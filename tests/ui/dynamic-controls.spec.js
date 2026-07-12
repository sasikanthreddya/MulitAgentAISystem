import { test, expect } from "@playwright/test";

test.describe("Dynamic Controls", () => {
  test("TC6 [Positive] Dynamic Controls - Enable button enables the checkbox", { tag: "@sanity" }, async ({ page }) => {
    await page.goto("/dynamic_controls");
    const input = page.locator("#input-example input");
    await expect(input).toBeDisabled();
    await page.getByRole("button", { name: "Enable" }).click();
    await expect(page.locator("#input-example")).toContainText("It's enabled!", { timeout: 10000 });
    await expect(input).toBeEnabled();
  });

  test("TC7 [Negative] Dynamic Controls - Checkbox is disabled before Enable is clicked", async ({ page }) => {
    await page.goto("/dynamic_controls");
    await expect(page.locator("#input-example input")).toBeDisabled();
  });

  test("TC8 [Positive] Dynamic Controls - Remove button removes input field from DOM", async ({ page }) => {
    await page.goto("/dynamic_controls");
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.locator("#checkbox-example")).toContainText("It's gone!", { timeout: 10000 });
    await expect(page.locator("#checkbox-example input")).toHaveCount(0);
  });

  test("TC9 [Positive] Dynamic Controls - Add button re-adds input field to DOM", async ({ page }) => {
    await page.goto("/dynamic_controls");
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.locator("#checkbox-example")).toContainText("It's gone!", { timeout: 10000 });
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.locator("#checkbox-example")).toContainText("It's back!", { timeout: 10000 });
    await expect(page.locator("#checkbox-example input")).toHaveCount(1);
  });
});
