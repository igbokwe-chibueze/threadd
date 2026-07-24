import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { createHash } from "node:crypto";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const addressLabel = `Test Home ${Date.now()}`;
let cartId = "";
let variantId = "";
let customerQuantityBefore = 0;

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
  if (variantId) {
    if (customerQuantityBefore) {
      await pool.query(
        `UPDATE "CartItem" SET quantity = $1
         WHERE "variantId" = $2
         AND "cartId" = (
           SELECT id FROM "Cart"
           WHERE "userId" = (
             SELECT id FROM "User"
             WHERE email = 'customer@demo.threadd.store'
           )
           AND status = 'ACTIVE'
           ORDER BY "updatedAt" DESC LIMIT 1
         )`,
        [customerQuantityBefore, variantId],
      );
    } else {
      await pool.query(
        `DELETE FROM "CartItem"
         WHERE "variantId" = $1
         AND "cartId" IN (
           SELECT id FROM "Cart"
           WHERE "userId" = (
             SELECT id FROM "User"
             WHERE email = 'customer@demo.threadd.store'
           )
           AND status = 'ACTIVE'
         )`,
        [variantId],
      );
    }
  }
  await pool.end();
});

test("guest cart and customer address workflows are functional", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const customerItem = await pool.query<{
    variantId: string;
    quantity: number | null;
  }>(
    `SELECT v.id AS "variantId", ci.quantity
     FROM "ProductVariant" v
     JOIN "Product" p ON p.id = v."productId"
     LEFT JOIN "CartItem" ci ON ci."variantId" = v.id
       AND ci."cartId" = (
         SELECT id FROM "Cart"
         WHERE "userId" = (
           SELECT id FROM "User"
           WHERE email = 'customer@demo.threadd.store'
         )
         AND status = 'ACTIVE'
         ORDER BY "updatedAt" DESC LIMIT 1
       )
     WHERE p.slug = 'utility-overshirt-01'
     AND v.active = true
     ORDER BY v."createdAt" ASC LIMIT 1`,
  );
  variantId = customerItem.rows[0]?.variantId ?? "";
  customerQuantityBefore = customerItem.rows[0]?.quantity ?? 0;

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

  await page.locator('a[href="/sign-in?returnTo=/checkout"]').click();
  await page.getByRole("button", { name: /enter as customer/i }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "One last look." }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Utility Overshirt 01")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('header a[href="/cart"]')).not.toContainText(
    "Cart0",
  );
  const mergedItem = await pool.query<{ quantity: number }>(
    `SELECT ci.quantity
     FROM "CartItem" ci
     JOIN "Cart" c ON c.id = ci."cartId"
     WHERE ci."variantId" = $1
     AND c."userId" = (
       SELECT id FROM "User"
       WHERE email = 'customer@demo.threadd.store'
     )
     AND c.status = 'ACTIVE'
     ORDER BY c."updatedAt" DESC LIMIT 1`,
    [variantId],
  );
  expect(mergedItem.rows[0]?.quantity).toBe(customerQuantityBefore + 2);
  await page.goto("/account");
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
