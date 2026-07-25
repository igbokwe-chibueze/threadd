# THREADD

THREADD is a modern, highly visual unisex fashion ecommerce portfolio project. It is designed as a realistic single-store application with a safe public demo, test payments, customer and administrator workflows, and architecture that can be adapted for a real merchant.

## Current status

The canonical phase status and delivery scope live in [`docs/ROADMAP.md`](docs/ROADMAP.md).
Current browser checks are listed in
[`docs/MANUAL_TESTING.md`](docs/MANUAL_TESTING.md).

Public portfolio demo: [threadd-smoky.vercel.app](https://threadd-smoky.vercel.app)

The demo is an isolated, disposable environment. Visitors may exercise the
customer and administrator workflows; a protected six-hour reset restores the
canonical catalogue and sample records.

## Local development

Requirements:

- Node.js 22
- npm
- PostgreSQL

```bash
npm install
npm run db:generate
npm run db:migrate
npm exec prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and replace its placeholders before running
database-backed routes. Local development should keep
`DEPLOYMENT_MODE=local`; never reuse portfolio-demo or customer-production
credentials. Never commit `.env.local` or any real credential.

## Quality commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Playwright requires its browser once per development machine:

```bash
npx playwright install chromium
```

## Database and authentication

Apply migrations, generate the Prisma Client, and seed the two normal demo
accounts with:

```bash
npm run db:migrate
npm run db:generate
npx prisma db seed
```

The portfolio demo intentionally has no super-administrator account. For a
real, non-demo deployment, provision the first owner from a trusted server
terminal only:

```bash
npm run db:bootstrap-super-admin
```

That command refuses to run unless `DEMO_MODE=false` and
`ALLOW_SUPER_ADMIN_BOOTSTRAP=true`. It also requires the
`SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and `SUPER_ADMIN_PASSWORD`
environment variables. Disable the bootstrap flag immediately after use.

Password-reset and verification messages use the private Demo Outbox. The
email service is provider-neutral so a future Resend adapter can replace the
demo provider without changing authentication or commerce workflows.

## Architecture

- `app/` — Next.js routes and route composition
- `components/` — shared brand, layout, and UI components
- `features/` — domain-specific services, schemas, actions, and UI
- `lib/` — cross-cutting infrastructure
- `prisma/` — schema, migrations, and seed data
- `tests/` — unit, integration, and end-to-end tests

The public portfolio demo will use isolated infrastructure and Paystack test mode. It must never share production data or credentials.

## Deployment and adaptation

- [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md) — current Vercel
  deployment, build gate, and migration order.
- [`docs/DEMO_DEPLOYMENT.md`](docs/DEMO_DEPLOYMENT.md) — isolated demo/reset
  configuration.
- [`docs/CUSTOMER_ADAPTATION.md`](docs/CUSTOMER_ADAPTATION.md) — safely replace
  branding, content, providers, shipping, and demo infrastructure for a client.
- [`docs/PORTFOLIO_CASE_STUDY.md`](docs/PORTFOLIO_CASE_STUDY.md) — product,
  architecture, workflow, security, and visual-design case study.
- [`docs/RECOVERY_RUNBOOK.md`](docs/RECOVERY_RUNBOOK.md) — migration, recovery,
  rollback, and incident procedures.

## Demo boundaries

- Payment credentials are Paystack test credentials; no live charge capability
  belongs in the public demo.
- Email remains inside the private Demo Outbox and cannot reach arbitrary
  recipients.
- Catalogue uploads use an isolated Cloudinary folder.
- Prisma Postgres and Cloudinary state are disposable and separate from any
  future customer deployment.
- Demo credentials are convenience accounts, not authentication bypasses.
