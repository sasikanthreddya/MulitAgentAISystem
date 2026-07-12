import { test, expect } from "@playwright/test";

test.describe("Dropdown", () => {
  test("TC1 [Positive] Dropdown - Select Option 1 reflects correct selection", { tag: "@sanity" }, async ({ page }) => {
    await page.goto("/dropdown");
    const dropdown = page.getByRole("combobox");
    await dropdown.selectOption({ label: "Option 1" });
    await expect(dropdown).toHaveValue("1");
  });

  test("TC2 [Positive] Dropdown - Select Option 2 reflects correct selection", async ({ page }) => {
    await page.goto("/dropdown");
    const dropdown = page.getByRole("combobox");
    await dropdown.selectOption({ label: "Option 2" });
    await expect(dropdown).toHaveValue("2");
  });

  test("TC3 [Negative] Dropdown - Default state has no option selected", async ({ page }) => {
    await page.goto("/dropdown");
    const dropdown = page.getByRole("combobox");
    await expect(dropdown).toHaveValue("");
  });
});
