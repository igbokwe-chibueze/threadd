import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for the authentication tests.");
}

const pool = new Pool({ connectionString });

test.afterAll(async () => {
  await pool.end();
});

test("renders the THREADD foundation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /threadd/i }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/THREADD/);
});

test("mobile navigation opens, navigates, and closes accessibly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: /open navigation/i }).click();
  const navigation = page.getByRole("dialog", { name: /THREADD navigation/i });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: /about/i })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(navigation).not.toBeVisible();
});

test("public information pages are reachable from the storefront", async ({
  page,
}) => {
  const pages = [
    ["/about", /clothes without categories/i],
    ["/contact", /talk to THREADD/i],
    ["/delivery", /from Lagos to everywhere/i],
    ["/returns", /a considered way back/i],
    ["/privacy", /only what the store needs/i],
    ["/terms", /the useful boundaries/i],
  ] as const;

  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
});

test("public layouts avoid horizontal overflow at representative sizes", async ({
  page,
}) => {
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const path of ["/", "/about", "/delivery"]) {
      await page.goto(path);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasOverflow).toBe(false);
    }
  }
});

test("reduced-motion visitors receive complete landing-page content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByText(/dress the person\. ignore the box\./i),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("demo customer signs in without admin access", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter as customer/i }).click();

  await expect(
    page.getByRole("heading", { name: /good to see you/i }),
  ).toBeVisible({ timeout: 20_000 });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account$/);
});

test("demo administrator enters the studio", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter the studio/i }).click();

  await expect(
    page.getByRole("heading", { name: /the collection starts here/i }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin$/);
});

test("password reset is delivered only to the private Demo Outbox", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel(/email address/i).fill("customer@demo.threadd.store");
  await page.getByRole("button", { name: /create reset message/i }).click();

  await expect(page).toHaveURL(/\/demo-outbox$/);
  await expect(
    page.getByRole("heading", { name: /reset your THREADD password/i }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("link", { name: /open secure link/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /download text/i }),
  ).toBeVisible();
});

test("logged-out visitors cannot open customer account pages", async ({
  page,
}) => {
  await page.goto("/account");

  await expect(page).toHaveURL(/\/sign-in$/);
});

test("an expired database session loses access immediately", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter as customer/i }).click();
  await expect(page).toHaveURL(/\/account$/, { timeout: 20_000 });

  const expiredSessions = await pool.query(
    `UPDATE "Session"
     SET "expiresAt" = NOW() - INTERVAL '1 minute'
     WHERE "userId" = (
       SELECT "id" FROM "User" WHERE "email" = $1
     )
     AND "expiresAt" > NOW()
     RETURNING "id"`,
    ["customer@demo.threadd.store"],
  );
  expect(expiredSessions.rowCount).toBeGreaterThan(0);

  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("signing out revokes access to the authenticated session", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /enter the studio/i }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });

  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("password-reset tokens are single-use and revoke existing sessions", async ({
  page,
}) => {
  test.setTimeout(60_000);

  const email = `phase2-${Date.now()}@demo.threadd.store`;
  const originalPassword = "TemporaryDemo123!";
  const replacementPassword = "ReplacementDemo123!";

  try {
    const signUpResponse = await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: "Phase Two Test Customer",
        email,
        password: originalPassword,
      },
    });
    expect(signUpResponse.ok()).toBe(true);

    await page.goto("/forgot-password");
    await page.getByLabel(/email address/i).fill(email);
    await page.getByRole("button", { name: /create reset message/i }).click();

    const resetLink = page
      .locator("article")
      .filter({ hasText: "Reset your THREADD password" })
      .getByRole("link", { name: /open secure link/i });
    const resetUrl = await resetLink.getAttribute("href");
    expect(resetUrl).toBeTruthy();
    await page.goto(resetUrl!, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/reset-password\?token=/, {
      timeout: 20_000,
    });
    await expect(
      page.getByRole("heading", { name: /choose something only you know/i }),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByLabel(/^new password$/i).fill(replacementPassword);
    await page.getByLabel(/^confirm password$/i).fill(replacementPassword);
    await page.getByRole("button", { name: /set new password/i }).click();
    await expect(page).toHaveURL(/\/sign-in\?reset=complete$/, {
      timeout: 20_000,
    });

    await page.goto("/account");
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.goto(resetUrl!);
    await expect(
      page.getByText(/reset link is missing, invalid, or expired/i),
    ).toBeVisible();
  } finally {
    await pool.query(`DELETE FROM "User" WHERE "email" = $1`, [email]);
  }
});
