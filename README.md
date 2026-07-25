# THREADD

THREADD is a production-minded, single-store Nigerian fashion ecommerce
portfolio application created by
[Igbokwe Chibueze](https://www.linkedin.com/in/chibueze-o-igbokwe/). It pairs
an editorial, mobile-first storefront with working customer, commerce,
administration, media, security, and operational workflows.

**Live demo:** [threadd-smoky.vercel.app](https://threadd-smoky.vercel.app)

**In-site system tour:**
[threadd-smoky.vercel.app/project](https://threadd-smoky.vercel.app/project)

**Delivery roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)

**Portfolio case study:**
[docs/PORTFOLIO_CASE_STUDY.md](docs/PORTFOLIO_CASE_STUDY.md)

## Why this project exists

THREADD was built to demonstrate what sits behind a convincing modern commerce
experience. It is not a static concept page: visitors can browse products and
variants, maintain a guest cart, sign in, manage addresses, complete a Paystack
test checkout, review orders and private demo messages, or enter a protected
administration area.

The public deployment is deliberately safe for portfolio visitors. It uses
isolated test infrastructure, fictional records, test-only payments, a private
email outbox, and a protected six-hour reset that restores the canonical
showcase after visitors experiment with its data.

## Product experience

### Storefront and customer journey

- editorial campaign homepage and responsive navigation;
- searchable, filterable, sortable, and paginated catalogue;
- product galleries, color and size variants, stock state, and structured data;
- guest cart with authenticated cart merging;
- account profile, address book, order history, and secure sign-out;
- server-priced checkout with shipping selection and stock revalidation;
- Paystack test payment initialization, callback verification, and safe failure
  handling;
- private Demo Outbox for password-reset, verification, enquiry, and order
  messages;
- enquiry, delivery, returns, privacy, terms, about, and project-story pages.

### Administration

- role-protected dashboard and direct return to the storefront;
- catalogue creation, editing, publishing, archiving, and Cloudinary media;
- per-variant inventory and append-only inventory movements;
- order review and constrained status processing;
- enquiry triage and internal notes;
- shipping configuration;
- protected email-outbox inspection;
- server-side authorization on pages, queries, mutations, and file endpoints.

### Resettable portfolio environment

- canonical fictional catalogue, customer, administrator, inventory, and
  operational records;
- protected reset endpoint with exact environment and database isolation checks;
- least-privilege GitHub Actions schedule every six hours;
- manual reset support and privacy-safe monitoring probe;
- Cloudinary cleanup followed by canonical media restoration;
- disposable visitor changes with no claim of long-term persistence.

## Technical architecture

THREADD uses the Next.js App Router and defaults to React Server Components.
Interactive behavior—menus, galleries, filters, forms, dialogs, and
transitions—is isolated in focused Client Components so the browser receives
only the JavaScript it needs.

| Layer       | Technology and responsibility                         |
| ----------- | ----------------------------------------------------- |
| Application | Next.js App Router, React, TypeScript strict mode     |
| Styling     | Tailwind CSS with a custom editorial design system    |
| Motion      | Framer Motion with reduced-motion support             |
| Data        | PostgreSQL through Prisma ORM                         |
| Identity    | Better Auth sessions and credential flows             |
| Validation  | Zod at browser/server and provider trust boundaries   |
| Payments    | Paystack provider abstraction in test mode            |
| Media       | Cloudinary adapter with authorized, validated uploads |
| Email       | Provider abstraction locked to a private Demo Outbox  |
| Testing     | Vitest and Playwright                                 |
| Hosting     | Vercel, Prisma Postgres, Cloudinary, GitHub Actions   |

### Repository organization

```text
app/                 route composition, layouts, metadata, handlers
components/          shared brand, layout, motion, SEO, and UI primitives
features/            domain services, schemas, actions, queries, and UI
lib/                 database, authentication, logging, environment, security
prisma/              schema, migrations, seed, and bootstrap tooling
public/              repository-controlled campaign/catalogue assets
scripts/             documented operational and security checks
tests/e2e/           complete browser journeys
tests/unit/          domain, security, provider, and mapping tests
docs/                product, release, adaptation, audit, and runbooks
```

Business rules live in feature services rather than page components. Provider
code sits behind interfaces, secrets and database clients remain server-only,
and browser input is never trusted for identity, price, ownership, inventory,
or payment state.

## Commerce and data integrity

- monetary values use decimal-safe server calculations;
- the server calculates prices, shipping, and totals;
- a pending order exists before payment initialization;
- payment references are unique and provider verification is server-to-server;
- amount, currency, reference, status, and expected order are compared;
- browser redirects are never treated as proof of payment;
- webhook signatures use the raw body and constant-time comparison;
- duplicate, delayed, forged, and out-of-order payment events are idempotent;
- inventory cannot pass below zero through normal flows;
- every stock change produces an inventory movement;
- order items preserve product, variant, and price snapshots;
- product edits cannot rewrite historical order information.

The portfolio Paystack integration uses test keys only. Because the owner's
shared test integration has one webhook assigned to another demo application,
THREADD relies on independently verified callbacks in the hosted showcase while
retaining automated webhook-security coverage. A client deployment must use an
isolated Paystack integration and verify real signed webhook delivery.

## Security and privacy model

- Better Auth owns password hashing, sessions, cookies, and recovery tokens;
- authentication and authorization are checked independently on the server;
- protected resources enforce ownership or role at every boundary;
- Zod schemas normalize and constrain untrusted inputs;
- login, recovery, enquiry, and payment boundaries are rate-limited;
- security headers cover CSP, HSTS, framing, MIME sniffing, referrers, and
  browser capabilities;
- structured logs recursively redact credentials and unnecessary personal data;
- catalogue uploads require administrator authorization and validate file
  signature, MIME type, size, dimensions, and generated storage identifiers;
- private, admin, account, cart, checkout, and API routes are excluded from
  search indexing;
- committed-secret scanning is part of the release gate;
- the public demo contains fictional data and cannot send arbitrary real email
  or accept live money.

See [docs/SECURITY_EVIDENCE.md](docs/SECURITY_EVIDENCE.md),
[docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md), and
[docs/AUTHORIZATION_MATRIX.md](docs/AUTHORIZATION_MATRIX.md).

## Local setup

### Requirements

- Node.js 22 or the repository-supported newer runtime;
- npm;
- PostgreSQL;
- Chromium for Playwright;
- optional Cloudinary and Paystack test credentials for provider exercises.

### Install and configure

```bash
git clone <your-fork-or-repository-url>
cd threadd
npm install
```

Copy `.env.example` to `.env.local`, then replace placeholders. Keep
`DEPLOYMENT_MODE=local` during local development. Never commit `.env.local`,
database URLs, authentication secrets, payment keys, Cloudinary secrets, or
production identifiers.

Prepare the database:

```bash
npm run db:generate
npm run db:migrate
npx prisma db seed
```

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo identities

The sign-in screen exposes the current customer and administrator demo
credentials inside an accessible copyable dialog. They are normal Better Auth
accounts—not an authentication bypass—and their changes are temporary in the
hosted portfolio environment.

### Super-administrator bootstrap

The portfolio demo intentionally has no super-administrator. For a real,
non-demo deployment, provision the first owner only from a trusted server
terminal:

```bash
npm run db:bootstrap-super-admin
```

The command refuses to run unless `DEMO_MODE=false` and
`ALLOW_SUPER_ADMIN_BOOTSTRAP=true`; it also requires the documented
`SUPER_ADMIN_*` environment variables. Disable the bootstrap flag immediately
after use.

## Commands

| Command                    | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `npm run dev`              | Start local development                                    |
| `npm run build`            | Run hosted preflight where applicable and build production |
| `npm run start`            | Serve the production build                                 |
| `npm run format:check`     | Verify Prettier formatting                                 |
| `npm run lint`             | Run ESLint with zero warnings                              |
| `npm run typecheck`        | Run strict TypeScript checking                             |
| `npm test`                 | Run Vitest unit/integration coverage                       |
| `npm run test:e2e`         | Run Playwright browser journeys                            |
| `npm run security:secrets` | Scan reachable history for committed secrets               |
| `npm run db:validate`      | Validate Prisma configuration and schema                   |
| `npm run db:migrate`       | Create/apply local development migrations                  |
| `npm run db:deploy`        | Apply committed migrations in deployment                   |
| `npm run deployment:check` | Validate deployment safety policy                          |
| `npm run cloudinary:check` | Verify configured media connectivity                       |

Install the Playwright browser once per development machine:

```bash
npx playwright install chromium
```

## Testing and release evidence

The completion gate requires:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run db:validate
npm test
npm run test:e2e
npm run security:secrets
npm run build
```

Coverage includes catalogue browsing, authentication, cart merging, checkout,
payment integrity, inventory, enquiries, account boundaries, administrator
workflows, password recovery, session invalidation, and responsive navigation.
Production smoke checks, Lighthouse measurements, monitoring evidence, sitemap,
robots, Search Console, recovery limits, and accepted portfolio risks are
recorded in [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

## Deployment

The hosted portfolio uses:

- Vercel for HTTPS application hosting and runtime logs;
- Prisma Postgres for the isolated disposable database;
- Cloudinary for isolated catalogue media;
- GitHub Actions for quality checks and the six-hour canonical reset;
- Paystack test mode for simulated payment processing;
- Google Search Console with a dynamic database-backed sitemap.

Deployment validates environment mode, HTTPS origins, authentication alignment,
database isolation, monitoring ownership, payment mode, and recovery policy
before the production build proceeds.

Read:

- [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)
- [docs/DEMO_DEPLOYMENT.md](docs/DEMO_DEPLOYMENT.md)
- [docs/RECOVERY_RUNBOOK.md](docs/RECOVERY_RUNBOOK.md)
- [docs/SECURITY_OPERATIONS.md](docs/SECURITY_OPERATIONS.md)

## Adapting THREADD for a client

Do not point a client at the portfolio database, Cloudinary folder, payment
keys, auth secret, or reset workflow. A client deployment requires new isolated
infrastructure, approved branding/content, real shipping/refund rules, verified
email, isolated payment credentials and webhooks, managed backups, monitoring,
privacy/legal approval, and a fresh security/release review.

The step-by-step transition is documented in
[docs/CUSTOMER_ADAPTATION.md](docs/CUSTOMER_ADAPTATION.md).

## Demo boundaries and known limitations

- all payments are test transactions;
- arbitrary outbound email is disabled;
- visitor data is temporary and reset every six hours;
- Prisma Free does not provide managed backups for this disposable database;
- free-tier monitoring and log retention are not customer-grade;
- the shared Paystack test integration does not point its single webhook at
  THREADD;
- generated campaign imagery is project-controlled and delivered through
  Next.js image optimization;
- accepted dependency and deployment limitations are tracked in
  [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Documentation index

- [Product overview](docs/PRODUCT_OVERVIEW.md)
- [Roadmap](docs/ROADMAP.md)
- [Project handoff](docs/PROJECT_HANDOFF.md)
- [Manual testing](docs/MANUAL_TESTING.md)
- [Payments](docs/PAYMENTS.md)
- [Storefront quality](docs/STOREFRONT_QUALITY.md)
- [Portfolio case study](docs/PORTFOLIO_CASE_STUDY.md)
- [Customer adaptation](docs/CUSTOMER_ADAPTATION.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Security evidence](docs/SECURITY_EVIDENCE.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)

## Author

Designed and engineered by
[Igbokwe Chibueze](https://www.linkedin.com/in/chibueze-o-igbokwe/).
