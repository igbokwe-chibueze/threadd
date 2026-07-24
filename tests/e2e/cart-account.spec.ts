import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { createHash } from "node:crypto";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const addressLabel = `Test Home ${Date.now()}`;
let cartId = "";

test.afterAll(async () => {
  await pool.query(
    `DELETE FROM "Address"
     WHERE label = $1
     AND "userId" = (SELECT id FROM "User" WHERE email = 'customer@demo.threadd.store')`,
    [addressLabel],
  );
  if (cartId) {
    await pool.query(`DELETE FROM "Cart" WHERE id = $1`, [cartId]);
  }
  await pool.end();
});

test("guest cart and customer address workflows are functional", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/products/utility-overshirt-01");
  await expect(page.locator('header a[href="/cart"]')).toContainText("0");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/was added to your cart/i)).toBeVisible({
    timeout: 20_000,
  });
  const cartCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "threadd_cart",
  );
  const tokenHash = createHash("sha256")
    .update(cartCookie?.value ?? "")
    .digest("hex");
  const storedCart = await pool.query<{ id: string }>(
    `SELECT id FROM "Cart" WHERE "guestTokenHash" = $1`,
    [tokenHash],
  );
  cartId = storedCart.rows[0]?.id ?? "";
  await expect(page.locator('header a[href="/cart"]')).toContainText("1");
  await page.getByRole("link", { name: "View cart" }).click();
  await expect(page.getByRole("heading", { name: "Your edit." })).toBeVisible();
  await expect(page.getByText("Utility Overshirt 01")).toBeVisible();
  await page.getByLabel("Qty").selectOption("2");
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.getByLabel("Qty")).toHaveValue("2");
  await expect(page.getByText("2 pieces")).toBeVisible();
  await expect(page.locator('header a[href="/cart"]')).toContainText("2");

  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(
    page.getByText(/prices and availability have been re-read/i),
  ).toBeVisible();
  await expect(page.getByText(/currently available/i)).toBeVisible();

  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter as customer/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20_000 });
  await page.getByText("Add an address").click();
  await page.getByLabel("Label").fill(addressLabel);
  await page.getByLabel("Recipient").fill("Cart Test Customer");
  await page.getByLabel("Phone").fill("+234 801 234 5678");
  await page.getByLabel("Street address").fill("12 Test Avenue");
  await page.getByLabel("City or town").fill("Enugu");
  await page.getByLabel("State").selectOption("Enugu");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("Delivery address saved.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("heading", { name: addressLabel })).toBeVisible();
});
