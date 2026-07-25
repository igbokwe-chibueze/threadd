# THREADD — Portfolio Case Study

## The brief

THREADD is a fictional Nigerian unisex fashion store built to demonstrate more
than a static storefront. The goal was an editorial commerce experience that a
visitor can genuinely test: browse a catalogue, select variants, manage a cart
and account, complete a simulated payment, inspect orders, and use a protected
administrator workspace.

The same codebase also needed a credible path to customer production without
allowing a public portfolio demo to behave like a live merchant store.

## Product approach

The application supports two configuration-controlled modes:

- catalogue and product-enquiry mode;
- full commerce mode with accounts, checkout, payments, inventory, orders,
  cancellations, returns, and refunds.

THREADD currently demonstrates full commerce. It remains a single-store system;
multi-tenancy and marketplace abstractions were deliberately excluded.

## Visual system

The interface uses an editorial, motion-led direction:

- an oversized typographic wordmark and restrained acid-lime accent;
- strong image crops, asymmetric spacing, and quiet neutral surfaces;
- mobile-first catalogue and product layouts;
- a drawn-thread loading treatment and an animated mobile navigation curtain;
- lightweight reveals and gallery transitions with reduced-motion
  alternatives.

Primary content remains usable without waiting for animation. Keyboard focus,
skip navigation, labelled dialogs, stable image containers, loading feedback,
and human-readable errors are part of the visual system rather than later
additions.

## Architecture

THREADD uses Next.js App Router, strict TypeScript, PostgreSQL through Prisma,
Better Auth, Tailwind CSS, Zod, Framer Motion, Playwright, and Vitest.

Responsibilities are separated by boundary:

- `app/` composes routes and server-rendered pages;
- `features/` owns catalogue, inventory, enquiries, accounts, cart, checkout,
  payments, orders, shipping, email, and demo-reset rules;
- `lib/` contains database, environment, authentication, logging, security, and
  provider infrastructure;
- Prisma migrations and canonical seed data define reproducible state;
- payment, email, and media providers sit behind explicit interfaces.

Database access and privileged SDKs remain server-only. Server actions own
trusted mutations, while webhooks, health, reset, and download boundaries use
route handlers.

## Major workflows

Customers can:

- browse, search, filter, and inspect products and colour/size variants;
- submit general or product-specific enquiries;
- use a guest cart or merge it after signing in;
- manage profile and address information;
- receive a server-authoritative shipping quote;
- complete Paystack test checkout or the internal deterministic test flow;
- inspect order, cancellation, return, and refund state;
- view messages inside the private Demo Outbox.

Administrators can:

- create, publish, edit, image, and archive products;
- manage variants and transaction-safe inventory adjustments;
- review the inventory movement ledger;
- process enquiries and internal notes;
- inspect and progress orders, cancellations, returns, and refunds;
- configure shipping zones and inspect outbound demo messages.

## Security and data integrity

The browser never supplies trusted prices, roles, ownership, stock, shipping,
or payment status. Server authorization guards every protected query and
mutation.

Commerce controls include:

- integer minor-unit calculations and server-created pending orders;
- Paystack signature validation plus independent transaction verification;
- amount, currency, reference, and order matching;
- idempotent payment, inventory, email, and refund transitions;
- immutable inventory movements and historical order-item snapshots;
- database-backed authentication and abuse throttles;
- validated image bytes, dimensions, generated identities, and folder-scoped
  Cloudinary deletion;
- production CSP, HSTS, clickjacking, MIME, referrer, and permissions controls;
- recursive privacy-safe structured logging;
- environment validation and a production-only hosted build preflight.

The public demo uses Paystack test credentials and a private outbox. It cannot
send arbitrary email or perform live charges.

## A safe, resettable portfolio environment

Visitors are allowed to change demo state, so THREADD treats the portfolio as
disposable infrastructure:

- a dedicated Prisma Postgres database;
- an isolated Cloudinary folder;
- normal seeded customer and administrator accounts;
- no authentication bypasses;
- a secret-protected, transaction-safe canonical reset;
- a least-privilege GitHub Action every six hours;
- separate ephemeral PostgreSQL services for CI quality and E2E jobs.

The free Prisma plan does not provide automated backups. For this portfolio
only, recovery intentionally recreates state from migrations, canonical seed
code, and repository images. Customer deployments fail their preflight unless
managed backup and restore evidence is supplied.

## Verification

The release process includes:

- formatting, ESLint, strict type checking, unit/integration tests, Playwright
  journeys, secret scanning, and a production build;
- deployed health, authentication, authorization, reset, media, payment, and
  security-header checks;
- a hosted Vercel preflight using the real encrypted environment;
- documented recovery, rollback, monitoring, and manual test procedures.

The result is a portfolio piece that behaves like an application rather than a
mock-up, while making the boundary between a disposable demo and a customer
commerce deployment explicit.
