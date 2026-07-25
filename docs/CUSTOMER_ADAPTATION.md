# Adapting THREADD for a Customer

THREADD is a single-store commerce application, not a multi-tenant platform.
Adapt a customer deployment by configuring a new instance of the same
application. Never repurpose the public portfolio database, media folder,
credentials, reset secret, or demo accounts.

## 1. Confirm the customer decisions

Record approval for:

- store name, visual identity, copy, catalogue taxonomy, and imagery;
- currency, prices, taxes, shipping zones, and free-shipping rules;
- payment provider and merchant account;
- cancellation, return, refund, and stock-restoration policies;
- email sender, recipients, templates, and retention;
- staff roles and the first super-administrator;
- monitoring owner, log retention, backups, and restore testing;
- privacy, terms, accessibility, and jurisdiction-specific obligations.

Do not infer financial, inventory, refund, shipping, or legal rules from the
portfolio demo.

## 2. Replace the brand and content

The main brand surfaces are:

- `components/brand/wordmark.tsx`;
- shared colours and typography in `app/globals.css`;
- page metadata and structured data in `app/layout.tsx`, `app/manifest.ts`, and
  `components/seo/structured-data.tsx`;
- public policy and story routes under `app/(public)/`;
- campaign and catalogue assets under `public/images/`.

Keep images optimized, dimensioned, appropriately licensed, and supplied with
meaningful alternative text. Do not copy portfolio-generated imagery into a
customer project unless its usage rights explicitly allow that deployment.

## 3. Create a fresh database

Provision a new PostgreSQL database owned by the customer environment. Configure
`DATABASE_URL` with strict TLS, then apply committed migrations:

```bash
npm install
npm run db:generate
npm run db:deploy
```

Never run `prisma db push` in production. Do not seed demo users, sample orders,
or enquiries into customer production. Replace `prisma/seed.ts` with an
approved import or onboarding seed that contains only customer-owned catalogue
and configuration data.

Historical order item snapshots, payment evidence, audit records, and inventory
movements must remain immutable. Do not solve content cleanup by deleting
financial history.

## 4. Configure catalogue and media

Use a dedicated Cloudinary account or folder:

```dotenv
MEDIA_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<customer-cloud>
CLOUDINARY_API_KEY=<server-only-key>
CLOUDINARY_API_SECRET=<server-only-secret>
CLOUDINARY_FOLDER=threadd/<customer-production-folder>
```

Keep credentials server-only. Verify upload, replacement, folder-scoped
deletion, and failed-upload cleanup before launch. The local adapter is not an
acceptable customer-production store.

## 5. Configure commerce providers

Keep provider code behind the existing payment and email interfaces.

For Paystack:

- use the customer's merchant account and production-approved currency;
- keep the secret key server-only;
- register the HTTPS webhook endpoint at `/api/payments/webhook`;
- verify a signed webhook, server-to-server transaction lookup, duplicate event,
  delayed event, failed payment, and refund;
- confirm amount, currency, reference, order, inventory, and email idempotency.

Replace the Demo Outbox with an approved email adapter such as Resend only after
sender-domain verification, recipient rules, templates, retry behaviour, and
privacy requirements are approved. Automated tests must continue using a fake
or outbox provider.

## 6. Replace shipping and policy configuration

THREADD's Nigerian demo zones are seed data, not universal business rules.
Enter customer-approved zones and fees through the protected shipping
configuration. Confirm:

- service areas and exact minor-unit fees;
- tax treatment;
- free-shipping threshold, if any;
- dispatch estimates and courier responsibilities;
- cancellation, return, refund, and stock-restoration transitions.

The server remains authoritative for price, shipping, discounts, totals,
inventory, and payment status.

## 7. Remove demo infrastructure

Customer production must use:

```dotenv
APP_ENV=production
DEPLOYMENT_MODE=customer
DEMO_MODE=false
DEMO_DATABASE_URL=
EMAIL_PROVIDER=<approved-live-provider>
RECOVERY_STRATEGY=managed_backup
```

Do not configure `DEMO_RESET_SECRET`, `CRON_SECRET`, the GitHub reset workflow,
demo convenience buttons, demo credentials, or a portfolio banner. Provision
the first super-administrator once from a trusted server terminal with
`npm run db:bootstrap-super-admin`, then disable and remove the bootstrap
variables.

## 8. Complete the customer release gate

Before launch:

1. Set the final HTTPS `APP_URL` and matching `BETTER_AUTH_URL`.
2. Record an active `MONITORING_OWNER`.
3. Configure managed backup provider, retention, and a successful isolated
   restore timestamp.
4. Run `npm run deployment:check`.
5. Apply migrations with `npm run db:deploy`.
6. Run formatting, lint, type checking, unit/integration tests, E2E tests, and
   the production build.
7. Verify authentication, authorization, checkout, webhooks, refunds, email,
   media, health, security headers, sitemap, robots, and error monitoring in the
   deployed environment.

Use `SECURITY_AUDIT.md`, `SECURITY_EVIDENCE.md`, `MANUAL_TESTING.md`, and
`RECOVERY_RUNBOOK.md` as the sign-off records. Any portfolio risk acceptance,
especially canonical reseeding instead of backups, does not transfer to a
customer deployment.
