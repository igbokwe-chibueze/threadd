import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const reason = "Playwright inventory verification";
let variantId = "";
let startingQuantity = 0;
let movementId = "";

test.beforeAll(async () => {
  const result = await pool.query<{
    id: string;
    inventoryQuantity: number;
  }>(
    `SELECT id, "inventoryQuantity"
     FROM "ProductVariant"
     WHERE sku = 'TH-ET02-1-M'
     LIMIT 1`,
  );
  variantId = result.rows[0].id;
  startingQuantity = result.rows[0].inventoryQuantity;
});

test.afterAll(async () => {
  await pool.query(
    `DELETE FROM "AuditLog"
     WHERE action = 'inventory.variant.adjust'
     AND "resourceId" = $1
     AND metadata->>'reason' = $2`,
    [variantId, reason],
  );
  await pool.query(
    `DELETE FROM "InventoryMovement"
     WHERE "variantId" = $1 AND reason = $2`,
    [variantId, reason],
  );
  await pool.query(
    `UPDATE "ProductVariant" SET "inventoryQuantity" = $1 WHERE id = $2`,
    [startingQuantity, variantId],
  );
  await pool.end();
});

test("admin adjustments are guarded, recorded, and audited", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter the studio/i }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
  await page.goto("/admin/inventory");
  await page.evaluate(() => {
    (
      window as Window & { inventoryNavigationMarker?: string }
    ).inventoryNavigationMarker = "preserved";
  });
  await page.getByLabel("Search inventory").fill("TH-ET02-1-M");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=TH-ET02-1-M/);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { inventoryNavigationMarker?: string })
          .inventoryNavigationMarker,
    ),
  ).toBe("preserved");

  const variant = page.getByRole("article").filter({ hasText: "TH-ET02-1-M" });
  await expect(variant).toBeVisible({ timeout: 20_000 });
  await variant.getByText("Adjust stock").click();

  await variant.getByLabel("Adjustment direction").selectOption("REMOVE");
  await variant.getByLabel("Adjustment quantity").fill("10000");
  await variant.getByLabel("Adjustment reason").fill(reason);
  await variant.getByRole("button", { name: "Record adjustment" }).click();
  await expect(
    variant.getByText("This adjustment would make stock negative."),
  ).toBeVisible();

  await variant.getByLabel("Adjustment direction").selectOption("ADD");
  await variant.getByLabel("Adjustment quantity").fill("1");
  await variant.getByLabel("Adjustment reason").fill(reason);
  await variant.getByRole("button", { name: "Record adjustment" }).click();
  await expect(
    variant.getByText(`Stock updated to ${startingQuantity + 1}.`),
  ).toBeVisible({ timeout: 20_000 });

  const movements = await pool.query<{ id: string; quantityAfter: number }>(
    `SELECT id, "quantityAfter"
     FROM "InventoryMovement"
     WHERE "variantId" = $1 AND reason = $2
     ORDER BY "createdAt" DESC`,
    [variantId, reason],
  );
  expect(movements.rows).toHaveLength(1);
  expect(movements.rows[0].quantityAfter).toBe(startingQuantity + 1);
  movementId = movements.rows[0].id;

  const audits = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM "AuditLog"
     WHERE action = 'inventory.variant.adjust'
     AND metadata->>'movementId' = $1`,
    [movementId],
  );
  expect(audits.rows[0].count).toBe("1");
});
