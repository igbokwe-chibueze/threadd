import { createHash } from "node:crypto";

import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

import { formatNaira } from "@/features/catalogue/format";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const email = `checkout-${Date.now()}@example.com`;
let cartId = "";
let orderId = "";

test.afterAll(async () => {
  if (orderId) {
    const items = await pool.query<{ variantId: string; quantity: number }>(
      `SELECT "variantId", quantity FROM "OrderItem" WHERE "orderId" = $1`,
      [orderId],
    );
    for (const item of items.rows) {
      if (item.variantId) {
        await pool.query(
          `UPDATE "ProductVariant"
           SET "inventoryQuantity" = "inventoryQuantity" + $1
           WHERE id = $2`,
          [item.quantity, item.variantId],
        );
      }
    }
    await pool.query(
      `DELETE FROM "InventoryMovement"
       WHERE "referenceType" = 'Order' AND "referenceId" = $1`,
      [orderId],
    );
    await pool.query(`DELETE FROM "Order" WHERE id = $1`, [orderId]);
  }
  if (cartId) await pool.query(`DELETE FROM "Cart" WHERE id = $1`, [cartId]);
  await pool.query(`DELETE FROM "EmailMessage" WHERE "recipientEmail" = $1`, [
    email,
  ]);
  await pool.end();
});

test("test checkout verifies payment and deducts stock exactly once", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/products/utility-overshirt-01");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/was added to your cart/i)).toBeVisible();
  const cartCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "threadd_cart",
  );
  const tokenHash = createHash("sha256")
    .update(cartCookie?.value ?? "")
    .digest("hex");
  const cart = await pool.query<{ id: string }>(
    `SELECT id FROM "Cart" WHERE "guestTokenHash" = $1`,
    [tokenHash],
  );
  cartId = cart.rows[0].id;

  await page.goto("/checkout");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Recipient").fill("Checkout Tester");
  await page.getByLabel("Phone").fill("+234 801 234 5678");
  await page.getByLabel("Street address").fill("12 Test Avenue");
  await page.getByLabel("City or town").fill("Enugu");
  await page.getByLabel("State").selectOption("Enugu");
  const zone = await pool.query<{ fee: string }>(
    `SELECT fee::text FROM "ShippingZone"
     WHERE active = true AND states @> '["Enugu"]'::jsonb
     ORDER BY position ASC LIMIT 1`,
  );
  const deliveryFee = formatNaira(zone.rows[0].fee);
  await expect(page.getByText("Delivery / Nigeria")).toBeVisible();
  await expect(page.getByText(deliveryFee)).toBeVisible();
  await page
    .getByRole("button", { name: "Continue with Demo payment" })
    .click();
  await expect(page.getByText("Simulate Paystack.")).toBeVisible();
  await expect(page.getByText("Products subtotal")).toBeVisible();
  await expect(page.getByText("Delivery / Nigeria")).toBeVisible();
  await expect(page.getByText(deliveryFee)).toBeVisible();
  const testPaymentUrl = page.url();
  const reference = new URL(testPaymentUrl).searchParams.get("reference");
  const stored = await pool.query<{ id: string; status: string }>(
    `SELECT o.id, p.status
     FROM "Order" o JOIN "Payment" p ON p."orderId" = o.id
     WHERE p.reference = $1`,
    [reference],
  );
  orderId = stored.rows[0].id;
  expect(stored.rows[0].status).toBe("PENDING");

  await page.request.get(`/api/payments/callback?reference=${reference}`);
  const afterForgedCallback = await pool.query<{ status: string }>(
    `SELECT status FROM "Payment" WHERE reference = $1`,
    [reference],
  );
  expect(afterForgedCallback.rows[0].status).toBe("PENDING");

  await page.goto(testPaymentUrl);
  await page
    .getByRole("button", { name: "Complete successful test payment" })
    .click();
  await expect(page.getByText("The thread is yours.")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('header a[href="/cart"]:visible')).toContainText(
    "0",
  );

  await page.goto(testPaymentUrl);
  await page
    .getByRole("button", { name: "Complete successful test payment" })
    .click();
  await expect(page.getByText("The thread is yours.")).toBeVisible({
    timeout: 20_000,
  });

  const result = await pool.query<{
    paymentStatus: string;
    orderStatus: string;
    movements: string;
    messages: string;
  }>(
    `SELECT
       p.status AS "paymentStatus",
       o.status AS "orderStatus",
       (SELECT COUNT(*)::text FROM "InventoryMovement"
        WHERE "referenceType" = 'Order' AND "referenceId" = o.id) AS movements,
       (SELECT COUNT(*)::text FROM "EmailMessage"
        WHERE "recipientEmail" = $2 AND kind = 'ORDER_CONFIRMATION') AS messages
     FROM "Order" o JOIN "Payment" p ON p."orderId" = o.id
     WHERE o.id = $1`,
    [orderId, email],
  );
  expect(result.rows[0]).toMatchObject({
    paymentStatus: "SUCCESS",
    orderStatus: "PAID",
    movements: "1",
    messages: "1",
  });
});
