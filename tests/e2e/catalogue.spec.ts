import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const draftSlug = "playwright-draft-piece";

test.beforeAll(async () => {
  const category = await pool.query<{ id: string }>(
    `SELECT id FROM "Category" ORDER BY position ASC LIMIT 1`,
  );
  await pool.query(
    `INSERT INTO "Product" (
      id, name, slug, "shortDescription", description, status, "basePrice",
      featured, "categoryId", "createdAt", "updatedAt"
    ) VALUES (
      'playwright-draft-product', 'Invisible Draft', $1, 'A private draft product.',
      'This draft must never appear in the public catalogue.', 'DRAFT', 10000,
      false, $2, NOW(), NOW()
    ) ON CONFLICT (slug) DO NOTHING`,
    [draftSlug, category.rows[0].id],
  );
});

test.afterAll(async () => {
  await pool.query(`DELETE FROM "Product" WHERE slug = $1`, [draftSlug]);
  await pool.end();
});

test("customers can browse, filter, and inspect catalogue products", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "full study",
  );
  await expect(
    page.getByRole("link", { name: /utility overshirt 01/i }),
  ).toBeVisible();

  await page.getByLabel("Category").selectOption("outerwear");
  await page.getByRole("button", { name: /apply filters/i }).click();
  await expect(page).toHaveURL(/category=outerwear/);
  await expect(
    page.getByRole("link", { name: /utility overshirt 01/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: /utility overshirt 01/i }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Utility Overshirt 01",
  );
});

test("draft products and invalid slugs are not publicly visible", async ({
  page,
}) => {
  await page.goto(`/products/${draftSlug}`);
  await expect(page.getByText("This thread ends here.")).toBeVisible();
  await page.goto("/products/not-a-real-thread");
  await expect(page.getByText("This thread ends here.")).toBeVisible();
});
