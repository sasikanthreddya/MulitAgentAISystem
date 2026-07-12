import { test, expect } from "@playwright/test";
import { loadEnvFile } from "../../scripts/load-env.mjs";

const env = loadEnvFile(".env");
const EMAIL = env.RAHUL_SHETTY_EMAIL;
const PASSWORD = env.RAHUL_SHETTY_PASSWORD;

// Login-form and product-listing selectors below were confirmed live against
// the real page (including the exact accessible names Playwright reports —
// e.g. the search box's name is "search", not "Search Product"; the add-to-cart
// button's text is "Add To Cart", not "ADD TO CART"). Cart/checkout/order-
// confirmation steps past this point are still unverified — fix those from
// whatever the next failure's page snapshot shows, same as this one was fixed.
test("MCPTES-34 [Positive] Checkout flow: search ADIDAS ORIGINAL, add to cart, place order, verify order ID shown", { tag: "@sanity" }, async ({ page }) => {
  test.skip(!PASSWORD, "Set RAHUL_SHETTY_PASSWORD in .env before running this test.");

  await page.goto("https://rahulshettyacademy.com/client/#/auth/login");
  await page.locator("#userEmail").fill(EMAIL);
  await page.locator("#userPassword").fill(PASSWORD);
  await page.locator("#login").click();

  await page.getByRole("textbox", { name: "search" }).fill("ADIDAS ORIGINAL");
  const product = page.locator("div").filter({ has: page.getByRole("heading", { name: "ADIDAS ORIGINAL" }) }).last();
  await expect(product).toBeVisible();
  await product.getByRole("button", { name: "Add To Cart" }).click();

  await page.locator('[routerlink="/dashboard/cart"]').click();
  await page.getByRole("button", { name: "Checkout" }).click();

  // .fill() sets the value directly and never triggers the typeahead dropdown
  // to render — pressSequentially() fires real keystroke events, which this
  // Angular typeahead needs to actually show its suggestion list.
  await page.getByPlaceholder("Select Country").pressSequentially("Ind", { delay: 150 });
  await page.locator(".ta-results button", { hasText: "India" }).first().click();
  await page.getByText("Place Order").click();

  const orderId = page.locator(".hero-primary");
  await expect(orderId).toBeVisible();
  await expect(orderId).not.toBeEmpty();
});
