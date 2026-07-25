# THREADD Project Handoff

Last updated: 25 July 2026

## Start Here

THREADD is a single-store, unisex Nigerian fashion ecommerce portfolio demo.
It is not multi-tenant. The code should remain realistic enough to adapt for a
real customer without rewriting its core commerce architecture.

The canonical plan is [`ROADMAP.md`](./ROADMAP.md). Phases 0–10 are complete.
The active phase is **Phase 11 — Harden Security**. Phase 12 is the final
release, deployment, and documentation phase.

Before changing code, also read:

1. the root [`AGENTS.md`](../AGENTS.md);
2. [`PRODUCT_OVERVIEW.md`](./PRODUCT_OVERVIEW.md);
3. [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md);
4. the relevant framework guide in `node_modules/next/dist/docs/`.

## Product Decisions That Must Be Preserved

- Brand name: **THREADD**. `Xtamaliy` is obsolete.
- Audience: unisex, with female models favoured when new campaign imagery is
  genuinely required.
- Market: delivery anywhere in Nigeria; shipping is calculated by the
  documented configurable zone rules.
- Package manager: npm.
- Database: PostgreSQL through Prisma.
- Authentication: Better Auth with customer, admin, and super-admin roles.
- Payments: provider abstraction with Paystack working in test mode. OPay is
  present behind the same abstraction but remains limited by the provider
  integration/merchant environment; do not make it a release blocker without
  new provider capability.
- Email: provider abstraction with a private downloadable Demo Outbox. Live
  Resend delivery is deliberately deferred and should be addable without
  changing commerce workflows.
- Demo safety: public demo accounts can exercise customer and administrative
  workflows, while scheduled reset restores canonical demo state every six
  hours. Demo and future production resources must remain isolated.
- Orders: payment, fulfilment, cancellation, return, and refund states remain
  separate and visible to both customers and administrators.
- UX: modern, highly visual editorial storefront with restrained Framer Motion.
  Every asynchronous action and navigation needs immediate accessible feedback.
  All interactive controls need hover and keyboard-focus feedback.
- Accessibility: preserve reduced-motion support, keyboard navigation, clear
  focus indicators, responsive layouts, and human-readable errors.

## What Is Already Working

- Responsive visual storefront, collections, catalogue filters, product pages,
  multiple product images, carousel, and full-screen image viewing.
- Admin catalogue creation/editing, automatic slugs, multiple categories and
  collections, image selection/removal, variants, archive flow, and
  human-readable field errors that preserve form data.
- Variant inventory controls, search/filtering, low/out-of-stock filters,
  movement ledger, and pending UI.
- Customer enquiries and administrator enquiry workflow.
- Customer accounts, saved addresses, cart merging after sign-in, cart count,
  cart editing, and return-to-checkout redirects.
- Checkout with Nigerian shipping calculation, Paystack test checkout, payment
  verification/webhooks, provider abstraction, and order creation.
- Customer/admin order views, cancellation requests, returns, received-return
  states, refunds, and clear shipping/total breakdowns.
- Downloadable Demo Outbox, unread message count, customer/admin notifications,
  and future email-provider seam.
- Demo reset endpoint, secret protection, reset scheduler hook, demo banner,
  canonical seed data, and safety documentation.
- SEO and storefront-quality work: metadata, canonicals, robots, sitemap,
  manifest, Open Graph image, structured data, Search Console configuration,
  optimized responsive images, loading states, skip link, reduced motion, and
  PII-safe analytics boundary with analytics currently disabled.
- Phase 10 loading treatment: THREADD wordmark, animated drawn thread/needle,
  rotating captions, and a static reduced-motion alternative.

## Current Work — Phase 11

Work through every applicable item in
[`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md), recording evidence rather than only
checking boxes. The phase includes:

- dependency and secret audits;
- server-side authorization review;
- payment initialization, verification, webhook, idempotency, and refund review;
- catalogue upload validation and storage review;
- rate-limit review;
- Better Auth session and cookie review;
- security headers;
- logging, PII, and error-message review;
- backup/recovery and environment configuration;
- demo reset authorization, target isolation, and credential review.

The first Phase 11 slice is implemented in the current working tree:

- browser security headers now include a static-compatible CSP and
  production-only HSTS/upgrade enforcement;
- Better Auth now has explicit trusted origins, session expiry/refresh,
  `HttpOnly`/`SameSite`/production `Secure` cookie attributes;
- production environment validation requires HTTPS, matching app/auth origins,
  and an authentication secret;
- `/admin/*` now has a shared server-side role boundary while page, action, and
  route-handler checks remain independently enforced; the current inventory is
  recorded in [`AUTHORIZATION_MATRIX.md`](./AUTHORIZATION_MATRIX.md);
- catalogue uploads now parse the binary structure of JPEG, PNG, and WebP
  images, enforce byte and pixel limits before storage, discard original
  filenames, and refuse the local demo adapter in customer configuration;
- Paystack webhooks now authenticate the raw body and independently re-verify
  charge success server-to-server; stored event data is minimized, decimal
  amounts convert to integer kobo without floating point, delayed success
  events cannot replay refunded payments, and refund claims are persisted
  before provider calls to prevent concurrent double refunds;
- authentication throttles now use explicit endpoint rules and shared atomic
  PostgreSQL counters; enquiry count-and-create is serializable, and repeated
  pending-payment initialization has a shared cooldown;
- dependency tooling is separated from the runtime tree, install scripts are
  version-approved, registry signatures are verified, CI actions are
  SHA-pinned, Dependabot is configured, and the path-only committed-history
  secret scanner is part of CI;
- logging now uses recursive privacy-safe structured events; Next.js server
  errors and authorization denials use that boundary, while request contents,
  concrete URLs, contact details, messages, and stacks are excluded;
- `/api/health` supplies a no-store database readiness probe. Ordinary
  production database URLs require `sslmode=verify-full`; the exact managed
  Prisma's exact direct/pooled managed hosts may retain their provider-issued
  `sslmode=require`.
  `npm run deployment:check` requires monitoring ownership and applies a
  mode-specific recovery policy: the disposable portfolio demo may use
  canonical migration-and-reseed recovery, while customer mode fails closed
  without managed retention and completed restore evidence;
- Cloudinary is the selected Vercel-compatible catalogue provider. The
  server-only adapter validates images, strips profiles, stores provider IDs,
  limits deletion to the configured folder, cleans failed/replaced uploads,
  and participates in demo reset. Encrypted credentials are configured in
  Vercel. Both the reversible provider probe and deployed admin
  append/replace/reset lifecycle passed;
- the workspace is linked to Vercel project
  `chibueze-igbokwes-projects/threadd`, with GitHub connected and safe
  production variables plus generated reset/authentication secrets configured.
  Production is live at `https://threadd-smoky.vercel.app`; health, home, shop,
  and sign-in returned 200, unauthenticated reset returned 403, and the
  expected CSP/HSTS/referrer/MIME headers were observed;
- the existing Prisma Postgres project is confirmed as the isolated,
  disposable public-demo database. Local migration tooling uses its direct
  host; Vercel uses the provider's pooled serverless host with a one-connection
  function pool. Both address the same database and retain the canonical seed;
- reset now clears database-backed rate limits, has an explicit 180-second
  function allowance, and passed deployed database/media restoration;
- the least-privilege six-hour GitHub Actions reset workflow is published on
  `main`, its encrypted repository secret is configured, and manual run
  `30152744808` succeeded in 24 seconds on 25 July 2026;
- Prisma Free provides no automated backups. The portfolio owner explicitly
  selected a zero-cost policy: disposable demo state is recreated from
  migrations, canonical seed code, and repository images. This exception does
  not apply to customer deployments;
- zero-cost portfolio monitoring uses the six-hour GitHub health/reset job and
  its failure notifications, with Vercel runtime logs for diagnosis.
  `igbokwe-chibueze` is the recorded monitoring owner. Customer deployments
  still require merchant-approved alerting and retention;
- GitHub Quality and E2E jobs provision separate ephemeral PostgreSQL 16
  service databases, apply committed migrations, and seed canonical test data.
  CI never receives or mutates the public portfolio database URL;
- [`RECOVERY_RUNBOOK.md`](./RECOVERY_RUNBOOK.md) defines isolated restore,
  migration, rollback, media consistency, and incident escalation procedures;
- [`SECURITY_EVIDENCE.md`](./SECURITY_EVIDENCE.md) records the evidence and the
  remaining deployed CSP, managed-media, monitoring, and recovery evidence.

Exit requirements:

- zero open critical findings;
- zero open high findings;
- every medium finding is fixed or explicitly accepted with an owner and target
  date;
- audit evidence is committed to approved project documentation.

Known dependency advisories and their current treatment are recorded in
[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md). Never run
`npm audit fix --force`.

## Remaining Phase — Phase 12

Phase 12 releases and documents THREADD:

- deploy an isolated public demo and database;
- configure HTTPS, monitoring, backups, reset scheduling, environment variables,
  Paystack test webhook, and canonical demo seed/accounts;
- run production smoke tests and controlled monitoring tests;
- record deployed Lighthouse results for `/`, `/shop`, and one product page;
- verify Search Console, sitemap, and robots in the deployed environment;
- finish the README/local setup, deployment guide, customer-adaptation guide,
  and portfolio case study.

Do not report Lighthouse or Search Console as verified from localhost.

## Useful Documents

- [`MANUAL_TESTING.md`](./MANUAL_TESTING.md) — established manual journeys.
- [`PAYMENTS.md`](./PAYMENTS.md) — payment architecture and provider behaviour.
- [`DEMO_DEPLOYMENT.md`](./DEMO_DEPLOYMENT.md) — demo environment and reset
  setup.
- [`STOREFRONT_QUALITY.md`](./STOREFRONT_QUALITY.md) — Phase 10 review and
  deferred production measurements.
- [`ANALYTICS_AND_SEARCH.md`](./ANALYTICS_AND_SEARCH.md) — approved analytics
  boundary and search setup.
- [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) — accepted current
  limitations and dependency advisories.

## Working and Handoff Discipline

- Update the Project Status table in `ROADMAP.md` whenever phase state changes.
- Tell the user explicitly when a phase is complete so they can commit.
- End every implementation handoff with manual tests the user can perform.
- Preserve unrelated user changes in the working tree.
- Never include secrets from `.env.local` in output, tests, logs, or commits.
- Use the required npm quality commands in `AGENTS.md`; state anything that was
  not run.
