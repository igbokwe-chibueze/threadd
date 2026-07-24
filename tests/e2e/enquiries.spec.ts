import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const email = `enquiry-${Date.now()}@example.com`;
const note = "Playwright internal follow-up note";
let enquiryId = "";

test.afterAll(async () => {
  if (enquiryId) {
    await pool.query(`DELETE FROM "AuditLog" WHERE "resourceId" = $1`, [
      enquiryId,
    ]);
    await pool.query(`DELETE FROM "Enquiry" WHERE id = $1`, [enquiryId]);
  }
  await pool.query(`DELETE FROM "EmailMessage" WHERE "recipientEmail" = $1`, [
    email,
  ]);
  await pool.end();
});

test("guest enquiry reaches the protected admin workflow", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Enquiry Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Message").fill("Can you deliver this order to Enugu?");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(
    page.getByText(/message is now in the THREADD inbox/i),
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByRole("link", { name: /view confirmation in demo outbox/i }),
  ).toBeVisible();

  const result = await pool.query<{ id: string }>(
    `SELECT id FROM "Enquiry" WHERE email = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [email],
  );
  enquiryId = result.rows[0].id;

  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter the studio/i }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
  await page.goto("/admin/enquiries");
  await page.getByPlaceholder(/search name, email/i).fill(email);
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("link", { name: new RegExp(email, "i") }).click();

  await page.getByPlaceholder(/add context/i).fill(note);
  await page.getByRole("button", { name: "Add internal note" }).click();
  await expect(page.getByText("Internal note added.")).toBeVisible();
  await expect(page.getByText(note)).toBeVisible();

  await page.getByRole("combobox").selectOption("CONTACTED");
  await page.getByPlaceholder("Reason (optional)").fill("Customer contacted");
  await page.getByRole("button", { name: "Update status" }).click();
  await expect(page.getByText("Status changed to contacted.")).toBeVisible();
  await expect(page.getByText("NEW → CONTACTED")).toBeVisible();
});
