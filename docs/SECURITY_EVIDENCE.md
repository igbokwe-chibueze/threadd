# THREADD Phase 11 Security Evidence

Last updated: 25 July 2026

This record contains evidence gathered during Phase 11. A control is not treated
as verified merely because its checklist item exists. Deployment-only checks
remain open until they are exercised against the isolated HTTPS deployment.

## Audit scope and environment

- Environment reviewed: local source and automated test environment.
- Application state: Phase 11 in progress; no deployment identifier yet.
- Reviewer: Codex-assisted repository review; release sign-off remains the
  project owner's responsibility.
- Source revision: working tree for the 24 July 2026 Phase 11 browser/session
  hardening slice.

## Browser and transport controls

| Control | Evidence | Result |
| --- | --- | --- |
| Content Security Policy | `lib/security/headers.ts`; `tests/unit/security-headers.test.ts` | Configured for every route. The policy limits content to the same origin, disallows objects and framing, and restricts base and form targets. |
| Clickjacking | CSP `frame-ancestors 'none'` plus `X-Frame-Options: DENY` | Verified by unit test. |
| MIME sniffing | `X-Content-Type-Options: nosniff` | Verified by unit test. |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin` | Verified by unit test. |
| Browser capabilities | Permissions Policy disables camera, microphone, geolocation, and browsing topics | Verified by unit test. |
| Cross-window isolation | `Cross-Origin-Opener-Policy: same-origin` | Verified by unit test. |
| HTTPS transport | Production-only HSTS and CSP `upgrade-insecure-requests`; production environment URLs must use HTTPS | Configuration verified by unit test. Deployed response verification remains open for Phase 12. |

The CSP uses Next.js's documented static-rendering-compatible policy. It retains
`'unsafe-inline'` for scripts and styles because Next.js emits inline bootstrap
scripts and THREADD emits escaped JSON-LD. A nonce-based policy would force all
pages into dynamic rendering and remove static optimization. This residual risk
is tracked below rather than being represented as a strict CSP.

## Authentication and session controls

| Control | Evidence | Result |
| --- | --- | --- |
| Trusted origins | `lib/auth/server.ts` derives an exact origin from `BETTER_AUTH_URL` | Explicit allowlist configured; Better Auth's origin and CSRF checks remain enabled. |
| Session lifetime | `lib/auth/server.ts` sets seven-day expiry and one-day refresh age | Explicitly configured; database-backed session cache remains disabled. |
| Cookie attributes | `lib/auth/server.ts` sets `HttpOnly`, `SameSite=Lax`, root path, and production-only `Secure` | Explicitly configured. |
| Production secret | `lib/env/schema.ts` requires a 32-character Better Auth secret when `APP_ENV=production` | Verified by `tests/unit/environment.test.ts`. Runtime fallback remains development/build-only in `lib/auth/config.ts`. |
| Production origin | `lib/env/schema.ts` requires HTTPS and matching application/auth origins in production | Verified by `tests/unit/environment.test.ts`. |
| Reset token lifetime and session revocation | One-hour reset expiry and `revokeSessionsOnPasswordReset` in `lib/auth/server.ts` | Existing E2E coverage in `tests/e2e/foundation.spec.ts` verifies single use and session revocation. |
| Expired/revoked session access | Database-backed session lookup | Existing E2E coverage verifies expired sessions and sign-out revocation. |

## Authorization controls

The complete current boundary inventory is recorded in
[`AUTHORIZATION_MATRIX.md`](./AUTHORIZATION_MATRIX.md).

| Control | Evidence | Result |
| --- | --- | --- |
| Shared admin response boundary | `app/admin/layout.tsx` | Every `/admin/*` response requires a database-backed session with `ADMIN` or `SUPER_ADMIN`; parallel child rendering still requires local page checks. |
| Page/data checks | Individual admin pages | Existing checks remain close to private queries as defence in depth. |
| Privileged mutations | Catalogue, inventory, enquiry, order, and shipping Server Actions | Every privileged action independently calls `requireRole`; layout authorization is not reused as mutation authority. |
| Customer ownership | Account actions and `getAccessibleOrder` | User IDs come from the session; address and order queries include ownership conditions. |
| Custom route handlers | Matrix route-handler inventory | Each private handler has an independent session, role, token, secret, or provider-signature boundary. |
| Vertical escalation test | `tests/e2e/foundation.spec.ts` | Customer direct requests to every top-level admin module redirect to `/account`. |

## Catalogue upload and media controls

| Control | Evidence | Result |
| --- | --- | --- |
| Mutation authorization | `features/catalogue/admin-actions.ts` | Create and update actions independently require `ADMIN` or `SUPER_ADMIN` before reading or storing files. |
| Type allowlist | `features/catalogue/image-validation.ts` | Only JPEG, PNG, and WebP MIME types are accepted; SVG, HTML, and executable types are rejected. |
| Binary format validation | Format-specific header and dimension parsers; `tests/unit/catalogue-image-validation.test.ts` | A browser filename or MIME declaration is not sufficient. The declared type must match the parsed binary structure. |
| Resource limits | Four MB per file, six files per product, 6000 pixels per axis, and 36 million pixels total | Byte and decompression-risk limits are enforced before storage. The Server Action request limit is 25 MB, sufficient for six files at the individual maximum plus form fields. |
| Object naming | `features/catalogue/media-storage.ts` | Original filenames are discarded; a server-generated UUID and allowlisted extension form the stored name. Exclusive creation prevents overwriting an existing object. |
| Local adapter isolation | `lib/env/schema.ts`; `features/demo/reset.ts` | Local writes are confined to `public/uploads/catalogue`; customer environment validation requires the managed-provider selection, while demo reset removes only database-recorded paths inside that resolved prefix. |
| Upload credentials | Vercel encrypted environment; `features/catalogue/media-storage.ts` | Cloudinary credentials remain server-only. Direct and deployed protected upload/delete checks passed without exposing credential values. |

The local adapter is retained for development and the disposable portfolio
demo. It is not durable customer storage. A managed provider has deliberately
not been selected during this review because provider selection and credentials
require deployment-owner approval. The provider integration, metadata removal,
signed-upload expiry (if direct uploads are selected), and deletion lifecycle
remain deployment work tracked in SEC-011-006.

## Payment, webhook, and refund controls

| Control | Evidence | Result |
| --- | --- | --- |
| Server-owned totals | `features/checkout/actions.ts`; cart and shipping services | Order items, shipping, and totals are rebuilt from database catalogue/cart state. No browser-submitted price or total is trusted. |
| Exact provider amounts | `features/payments/money.ts`; `tests/unit/payment-security.test.ts` | Decimal amounts are converted to integer kobo with string/BigInt arithmetic rather than floating point. |
| Initialization correlation | `features/checkout/actions.ts` | Provider initialization must echo the database-owned, cryptographically random payment reference before redirect. |
| Callback verification | `app/api/payments/callback/route.ts` | The database selects the provider; verification is server-to-server; shared processing compares reference, amount, and currency. Redirects use configured `APP_URL`, not the request Host header. |
| Paystack webhook authentication | `features/payments/paystack-webhook.ts`; `app/api/payments/webhook/route.ts` | Exact raw-body SHA-512 HMAC is checked in constant time. Malformed signatures and payloads are rejected. Both valid test and live secret formats are supported; demo policy still requires a test key. |
| Independent webhook verification | `app/api/payments/webhook/route.ts` | A signed charge event triggers a separate Paystack verification; event-supplied amount/status is not used to settle the order. |
| Webhook data minimization | `parsePaystackWebhook`; payment security unit test | Only event type, reference, and provider event ID are retained. Customer and authorization/card metadata are discarded. |
| Payment idempotency | Unique payment reference, serializable transition, conditional inventory updates, terminal-state policy | Replayed success events do not deduct stock twice, including after partial/full refund states. |
| Event idempotency | Unique SHA-256 raw-event fingerprint and `processedAt` | Exact event replays are recognized and acknowledged without repeating completed work. |
| Refund idempotency | `features/orders/refunds.ts`; unique `(orderId, paymentId)` index | The application claims the refund record before calling the provider, preventing concurrent administrator submissions from issuing two refund requests. |
| Refund authorization | `features/orders/admin-actions.ts` | Only `ADMIN` and `SUPER_ADMIN` can approve cancellation/return refunds, after server-side state checks. |

## Findings

### SEC-011-001 — Browser and session controls were partly implicit

- Date found: 24 July 2026
- Environment: source/local
- Component: Next.js headers and Better Auth configuration
- Severity: Medium
- Description: CSP and production transport enforcement were absent, while
  cookie attributes and session duration depended partly on library defaults.
- Impact: A deployment mistake or future dependency default change could weaken
  browser isolation or session handling.
- Likelihood: Moderate without explicit configuration.
- Remediation: Add tested security headers, production HTTPS/origin/secret
  validation, exact trusted origins, explicit cookie attributes, and explicit
  session lifetime.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `tests/unit/security-headers.test.ts`,
  `tests/unit/environment.test.ts`, type checking, and production build evidence
  recorded in the task handoff.
- Date closed: 24 July 2026

### SEC-011-002 — Static-compatible CSP permits inline scripts and styles

- Date found: 24 July 2026
- Environment: source/local
- Component: Next.js rendering and CSP
- Severity: Low
- Description: CSP includes `'unsafe-inline'` for scripts and styles to retain
  static rendering with the current Next.js output.
- Impact: CSP provides less XSS containment than a per-request nonce policy.
- Likelihood: Low while React escaping is preserved, user HTML is not rendered,
  and JSON-LD escapes `<`.
- Remediation: Reassess nonce-based dynamic rendering or stable hash-based CSP
  after measuring the deployment performance/cost tradeoff.
- Owner: THREADD project
- Status: Open; planned review during Phase 12 deployment hardening
- Verification evidence: `components/seo/structured-data.tsx` escapes JSON-LD;
  repository search found no other `dangerouslySetInnerHTML` use.

### SEC-011-003 — PostgreSQL SSL alias behavior changes on the next major driver

- Date found: 24 July 2026
- Environment: build and E2E database connection
- Component: PostgreSQL connection string / `pg`
- Severity: Low
- Description: `pg` reports that `sslmode=require` currently aliases to
  certificate-verifying behavior but will adopt weaker libpq semantics in its
  next major release.
- Impact: A future unreviewed major upgrade could weaken database TLS
  verification.
- Likelihood: Low while the current locked major version remains installed.
- Remediation: Use `sslmode=verify-full` for ordinary deployments. Prisma's
  managed direct/pooled endpoints currently reject that rewrite, so retain
  their provider-issued mode only while the current driver treats it as a
  strict alias; re-evaluate provider compatibility before upgrading to `pg` 9.
- Owner: THREADD project
- Status: Accepted low-risk compatibility exception; dependency upgrade gate
  remains open
- Verification evidence: `lib/env/schema.ts` limits `sslmode=require` to the
  exact `db.prisma.io`/`pooled.db.prisma.io` hostnames and requires
  `verify-full` elsewhere;
  `tests/unit/environment.test.ts` covers the managed exception, accepted
  strict mode, and lookalike-host rejection. Vercel build connected
  successfully with the provider-issued URL on 25 July 2026.

### SEC-011-004 — Admin authorization depended on per-page repetition

- Date found: 24 July 2026
- Environment: source/local
- Component: `/admin` page routes
- Severity: Low
- Description: Every existing admin page had a role check, but there was no
  shared default-deny page boundary. A future page could be added without
  copying the established guard.
- Impact: A newly introduced page could expose administrator data if its author
  also omitted a local check.
- Likelihood: Low because all reviewed current pages were independently guarded.
- Remediation: Add a shared response guard to `app/admin/layout.tsx`, retain
  local page and mutation checks, use redirect-based page authorization before
  private catalogue queries, inventory every current authorization boundary,
  and test direct nested-route access as a customer.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `AUTHORIZATION_MATRIX.md`,
  `tests/unit/permissions.test.ts`, and the nested-route customer E2E test.
- Date closed: 24 July 2026

### SEC-011-005 — Catalogue uploads lacked pixel-dimension enforcement

- Date found: 24 July 2026
- Environment: source/local
- Component: catalogue image validation
- Severity: Medium
- Description: Uploads had a four MB byte limit and basic signatures, but did
  not parse dimensions or constrain decoded pixel area.
- Impact: A highly compressed image could consume excessive resources when
  decoded by the application or an image optimizer.
- Likelihood: Moderate because catalogue uploads are restricted to
  administrators, but the file remains untrusted input.
- Remediation: Parse the allowlisted JPEG, PNG, and WebP structures before
  storage; enforce 6000 pixels per axis and 36 million pixels in total; retain
  byte, count, role, generated-name, and exclusive-write controls.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `tests/unit/catalogue-image-validation.test.ts`,
  TypeScript checking, lint, and production build evidence recorded in the task
  handoff.
- Date closed: 24 July 2026

### SEC-011-006 — Managed production media adapter required

- Date found: 24 July 2026
- Environment: source/local
- Component: catalogue media storage
- Severity: Medium
- Description: Development and portfolio-demo uploads use an isolated local
  directory. Application filesystems are not suitable durable customer media
  storage, and the current adapter does not transform images to remove metadata.
- Impact: Using the local adapter for a customer deployment could lose media
  across releases; retained camera metadata could disclose unnecessary details
  supplied by an administrator.
- Likelihood: Low after environment validation was changed to reject
  `local_demo` for customer deployments.
- Remediation: Cloudinary was selected and documented; implement a server-only
  adapter with metadata-stripping transformation, stored provider identity,
  safe deletion, failed-operation cleanup, and demo-reset cleanup. Add isolated
  Cloudinary credentials to Vercel and exercise the live provider boundary.
- Owner: THREADD deployment owner
- Target date: Before the first customer production deployment
- Status: Closed
- Verification evidence: `features/catalogue/media-storage.ts`,
  `features/demo/reset.ts`, migration
  `20260725014000_add_product_image_storage_identity`,
  `tests/unit/catalogue-media-storage.test.ts`, and
  `tests/unit/environment.test.ts`, and
  `scripts/operations/check-cloudinary.ts` plus
  `scripts/operations/verify-deployed-media.ts`. Vercel credentials are
  encrypted; direct and protected-browser upload/replacement/reset deletion
  passed on 25 July 2026.
- Date closed: 25 July 2026

### SEC-011-007 — Paystack webhook settlement trusted signed event fields

- Date found: 25 July 2026
- Environment: source/local
- Component: Paystack webhook
- Severity: High
- Description: A valid Paystack HMAC authenticated the event, but the order
  transition consumed the event's status, amount, and currency directly rather
  than independently querying Paystack.
- Impact: Provider delivery mistakes or compromised event-generation systems
  could settle an order without the required second source of verification.
- Likelihood: Low, but payment settlement requires defence in depth.
- Remediation: Retain HMAC authentication, then query Paystack server-to-server
  using the database-owned provider/reference and pass only that verification
  through the shared amount/currency/reference checks.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `app/api/payments/webhook/route.ts`,
  `tests/unit/payment-security.test.ts`, full checkout E2E, and production build.
- Date closed: 25 July 2026

### SEC-011-008 — Refund provider calls preceded the idempotency claim

- Date found: 25 July 2026
- Environment: source/local
- Component: cancellation and return refund actions
- Severity: High
- Description: Concurrent administrator submissions could both call the
  external refund API before one database insert lost the existing unique-key
  race.
- Impact: A customer could receive the same full refund twice.
- Likelihood: Low in normal UI use, but materially higher during retries,
  double submission, or parallel requests.
- Remediation: Insert the unique refund claim before any provider call; refuse
  duplicate claims; retain ambiguous/failed records for manual reconciliation
  instead of retrying automatically.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `features/orders/refunds.ts`, database unique index
  `Refund_orderId_paymentId_key`, type checking, and full E2E regression suite.
- Date closed: 25 July 2026

### SEC-011-009 — Delayed success events could revisit refunded payments

- Date found: 25 July 2026
- Environment: source/local
- Component: successful-payment state transition
- Severity: High
- Description: Only `SUCCESS` was treated as already applied. A delayed charge
  success arriving after `PARTIALLY_REFUNDED` or `REFUNDED` could enter the
  stock-deduction path again.
- Impact: Inventory could be deducted twice and an order could move back toward
  a paid state after refund.
- Likelihood: Low, but asynchronous providers can legitimately deliver delayed
  and out-of-order events.
- Remediation: Treat success and both refund payment states as terminal for the
  original payment side effects.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `features/payments/payment-state.ts` and adversarial
  coverage in `tests/unit/payment-security.test.ts`.
- Date closed: 25 July 2026

### SEC-011-010 — Payment events retained unnecessary provider payload data

- Date found: 25 July 2026
- Environment: source/local
- Component: Paystack event persistence
- Severity: Medium
- Description: The complete parsed webhook payload was stored even though
  Paystack events can contain customer and payment-authorization metadata.
- Impact: Database access or exports could reveal unnecessary personal or card
  descriptor data.
- Likelihood: Moderate during normal webhook processing.
- Remediation: Validate and project the event to event type, reference, and
  provider event ID before persistence.
- Owner: THREADD project
- Status: Closed
- Verification evidence: data-minimization unit test in
  `tests/unit/payment-security.test.ts`.
- Date closed: 25 July 2026

## Payment residual risks and deployment evidence

- A provider call and database transaction cannot be atomic. A PENDING or
  FAILED refund claim after a network/process interruption must be reconciled
  against the provider dashboard before an operator attempts another refund.
- Paystack live webhook delivery, signature verification, retries, and refund
  events must be exercised against the isolated HTTPS deployment in Phase 12.
- OPay remains disabled pending confirmed merchant capability. Its existing
  callback signature and verification boundary remain covered by unit tests,
  but live provider behavior is not represented as verified.

## Rate-limit and abuse controls

| Boundary | Evidence | Result |
| --- | --- | --- |
| Authentication baseline | `features/auth/rate-limit-policy.ts`; `lib/auth/server.ts` | Explicit production-facing throttling uses Better Auth's atomic database consumer rather than per-instance memory. |
| Sign-in | `/sign-in/email`: 10 attempts per IP/path per minute | Configured and unit tested. Distributed per-account attempts remain a deployment defence-in-depth item. |
| Sign-up | `/sign-up/email`: 5 attempts per IP/path per hour | Configured and unit tested. |
| Password recovery and verification resend | 5 attempts per IP/path per 15 minutes | Configured for both recovery and verification delivery routes. Generic cleanup retains buckets for the full strictest window. |
| Password/email changes | 5 attempts per IP/path per 15 minutes | Configured in the shared authentication policy. Authenticated authorization and current-session controls still apply. |
| Shared storage | `RateLimit` Prisma model and `20260725002000_add_auth_rate_limits` | Migration applied to the development database; unique keys and conditional updates coordinate multiple application instances. |
| Public enquiries | `features/enquiries/public-actions.ts` | Eight requests per IP hash and four per normalized email per hour. Count and creation now share a serializable transaction with conflict retry, preventing concurrent burst bypass. |
| Checkout initialization | `features/checkout/actions.ts` | A pending database payment has a shared one-minute provider-initialization cooldown. Initial provider failures remain immediately retryable. |
| Payment webhooks | Provider HMAC/signature verification and unguessable event correlation | Authentication is the primary boundary. Invalid events cannot invoke settlement; provider retry behavior is preserved rather than IP-throttled. |
| Demo reset | 32+ character bearer secret, deployment/database safety policy, advisory lock | Strong authentication and single-flight locking protect the expensive operation. Deployment edge throttling remains recommended for repeated invalid requests. |

Automated E2E runs set the validated `APP_ENV=test`; only that environment
disables Better Auth throttling so deterministic repeated demo-account sign-in
does not consume production-style buckets. There is no general runtime switch
that can disable production throttles.

### SEC-011-011 — Authentication throttling used per-process memory

- Date found: 25 July 2026
- Environment: source/local
- Component: Better Auth rate limiting
- Severity: Medium
- Description: Better Auth implicitly enabled throttling in production, but
  default in-memory counters were independent per application instance and were
  lost on restart.
- Impact: An attacker could multiply password/sign-in attempts across
  serverless instances or resets.
- Likelihood: Moderate on horizontally scaled hosting.
- Remediation: Configure explicit endpoint policies and Better Auth's atomic
  database storage; add the documented rate-limit schema and migration; disable
  only under validated `APP_ENV=test`.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `tests/unit/auth-rate-limit.test.ts`, Prisma schema
  validation, applied development migration, type checking, and E2E regression.
- Date closed: 25 July 2026

### SEC-011-012 — Distributed per-account authentication attacks need an edge control

- Date found: 25 July 2026
- Environment: source/local
- Component: authentication abuse prevention
- Severity: Medium
- Description: Application throttles are keyed by trusted client address and
  endpoint. A distributed attacker could rotate addresses while targeting one
  account.
- Impact: Increased credential-stuffing volume against a known account.
- Likelihood: Low for the isolated portfolio demo; deployment-dependent for a
  customer launch.
- Remediation: Enable hosting/WAF bot and credential-stuffing protection, alert
  on repeated failed-account patterns without logging passwords, and verify
  trusted-proxy address handling.
- Owner: THREADD deployment owner
- Target date: Before customer production launch
- Status: Open; accepted for the isolated portfolio demo, release-blocking for
  customer deployment
- Verification evidence: deployed edge-control test remains Phase 12 work.

## Dependency, supply-chain, and secret controls

| Control | Evidence | Result |
| --- | --- | --- |
| Reproducible install | Committed `package-lock.json`; CI uses `npm ci` | Verified. Lockfile integrity hashes constrain registry artifacts. |
| Package provenance | `npm audit signatures` on 25 July 2026 | All 608 installed packages had verified registry signatures; 177 also had attestations. |
| Runtime dependency scope | `package.json`; `npm ls --omit=dev --depth=0` | Prisma CLI and `@next/env` moved to development dependencies; unused direct `dotenv` removed. Runtime list contains only application libraries. |
| Install scripts | Pinned `allowScripts` entries in `package.json` | Reviewed exact versions for Prisma engines/CLI, esbuild, Sharp, and unrs-resolver. `npm approve-scripts --allow-scripts-pending` reports none unreviewed. |
| Automated updates | `.github/dependabot.yml` | Weekly review-controlled npm and GitHub Actions update pull requests configured; major upgrades remain separate. |
| CI action integrity | `.github/workflows/quality.yml` | Checkout and Node setup actions are pinned to full commit SHAs. |
| Secret history scan | `scripts/security/scan-committed-secrets.mjs` | High-confidence path-only scan passed across all 16 reachable revisions; CI fetches full history and runs the same scanner. |
| Tracked secret files | `.gitignore`; `git ls-files` | `.env*` is ignored except placeholder-only `.env.example`; no private-key or credential file is tracked. |
| Browser secret exposure | Built `.next/static` comparison against configured sensitive values | No configured database, auth, reset, Paystack, OPay, or bootstrap secret value was found. A dependency includes the variable name `BETTER_AUTH_SECRET`, not its value. |
| Rotation and revocation | `docs/SECURITY_OPERATIONS.md` | Provider-specific rotation, session revocation, former-staff removal, and incident recording procedures documented. |

Current advisories and compensating controls are recorded in
[`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md). No forced downgrade or
automatic breaking remediation was applied.

### SEC-011-013 — Build-only tooling was classified as runtime dependencies

- Date found: 25 July 2026
- Environment: source/lockfile
- Component: npm dependency manifest
- Severity: Low
- Description: Prisma CLI and `@next/env` were direct production dependencies,
  while the directly listed `dotenv` package was unused.
- Impact: Production installation could include unnecessary executable tooling
  and its transitive advisory surface.
- Likelihood: Moderate when a host installs production dependencies directly.
- Remediation: Move Prisma and environment-loading tools to development,
  remove unused `dotenv`, and verify the `--omit=dev` top-level tree.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `package.json`, `package-lock.json`, and
  `npm ls --omit=dev --depth=0`.
- Date closed: 25 July 2026

### SEC-011-014 — CI supply-chain references were mutable

- Date found: 25 July 2026
- Environment: source/CI
- Component: GitHub Actions workflows
- Severity: Medium
- Description: Official actions used mutable major-version tags and automated
  dependency review was not configured.
- Impact: A moved or compromised tag could change CI-executed code without a
  repository change; security fixes could also remain unnoticed.
- Likelihood: Low for official actions, but CI has privileged repository access.
- Remediation: Pin actions to verified full commit SHAs and configure weekly
  review-controlled Dependabot updates for npm and Actions.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `.github/workflows/quality.yml` and
  `.github/dependabot.yml`.
- Date closed: 25 July 2026

### SEC-011-015 — Next.js runtime image/CSS advisory chain has no compatible fix

- Date found: 23 July 2026; reassessed 25 July 2026
- Environment: npm registry audit
- Component: Next.js transitive PostCSS and Sharp/libvips dependencies
- Severity: High advisory rating; application exploitability assessed Low
- Description: Current Next.js pulls vulnerable PostCSS and Sharp versions.
  npm proposes an incompatible Next.js 9 downgrade rather than a patched
  current release.
- Impact: PostCSS issues require attacker-controlled build CSS/source maps.
  Sharp issues require malicious image decoding.
- Likelihood: Low because CSS is repository-controlled, catalogue upload is
  administrator-only with structural/resource validation, and customer launch
  is blocked on managed media transformation. Residual demo image-decoder risk
  remains.
- Remediation: Upgrade to the first compatible stable Next.js release carrying
  patched transitive versions; retain upload constraints and managed-media
  release gate; never use `npm audit fix --force`.
- Owner: THREADD project
- Target date: Reassess before Phase 12 release and on every Next.js update
- Status: Open; explicitly accepted for the isolated portfolio demo, blocking
  for customer production unless patched or separately risk-approved
- Verification evidence: `npm audit`, `npm outdated`,
  `docs/KNOWN_LIMITATIONS.md`, and catalogue validation tests.

## Logging, privacy, deployment, and recovery controls

| Control | Evidence | Result |
| --- | --- | --- |
| Structured logging | `lib/logging/logger.ts`; `tests/unit/logging.test.ts` | JSON events have trusted top-level fields and recursively redact credentials, contact details, addresses, and nested secrets. Errors retain only their class, not message or stack. Circular and non-JSON values cannot break serialization. |
| Server error capture | `instrumentation.ts` | Next.js `onRequestError` records method, route template/type, router kind, digest, and error class. Concrete URLs, headers, request bodies, messages, and stacks are excluded. Hosting logs provide the provider-neutral sink. |
| Authorization monitoring | `features/auth/authorization.ts` | Anonymous and wrong-role mutation/API boundary failures create warning events without user identity, cookie, email, or credential data. Page redirects remain expected navigation and avoid noisy error capture. |
| Safe operator correlation | `/api/health`; structured logger | Database readiness failures return a random request ID and a generic 503 response; the same ID appears in the protected server log. |
| Privacy disclosure | `/privacy` | The implementation-stage policy now describes operational logging exclusions and identifies merchant/legal approval of retention and privacy-request handling as a launch requirement. |
| Production database TLS and pooling | `lib/env/schema.ts`; `lib/db/client.ts` | Production requires `verify-full` generally, permits Prisma's issued mode only on its exact direct/pooled hosts, uses `pooled.db.prisma.io` on Vercel, and caps each function pool at one connection. |
| Deployment preflight | `scripts/operations/check-deployment-readiness.ts`; `scripts/operations/check-hosted-build-readiness.ts`; Vercel deployment for commit `35ab347` | Production Vercel builds validate the real encrypted environment before Next.js builds. The closing deployment passed portfolio-demo mode, HTTPS/auth/database isolation, monitoring ownership, and canonical-reseed recovery controls. |
| Automated demo reset | `.github/workflows/demo-reset.yml`; GitHub Actions run `30152744808` | Least-privilege six-hour workflow is published on `main`; encrypted bearer authentication, health preflight, canonical-response validation, and the first manual run succeeded. |
| CI database isolation | `.github/workflows/quality.yml` | Quality and browser jobs use separate ephemeral PostgreSQL services with job-local credentials, committed migrations, and canonical seed data. Neither job consumes the portfolio or customer datasource. |
| Closing deployment verification | Vercel deployment for commit `35ab347`; GitHub Actions run `30155086768` | Hosted preflight and production build passed; `/`, `/shop`, `/sign-in`, and `/api/health` returned 200; CSP, HSTS, MIME, referrer, and permissions headers were present; unauthenticated demo reset returned 403; Quality and E2E passed. |
| Migration/rollback procedure | `package.json`; `docs/RECOVERY_RUNBOOK.md` | Production migration uses `prisma migrate deploy`; restore testing, media consistency, rollback limits, and incident escalation are documented. |

No external monitoring or backup product was added: provider selection changes
data handling and operational access, and therefore requires deployment-owner
configuration and verification in Phase 12.

### SEC-011-016 — Logging redaction was shallow and error paths bypassed it

- Date found: 25 July 2026
- Environment: source/local
- Component: application logging and error handling
- Severity: Medium
- Description: The original logger redacted top-level keys only, retained
  nested sensitive values and error messages/stacks, and several server error
  paths used raw `console.error`.
- Impact: Provider errors or unexpected nested context could place customer
  contact details, tokens, request data, or internal stack information in
  hosting logs.
- Likelihood: Moderate during exceptional application/provider failures.
- Remediation: Make recursive safe serialization the sole server logging
  boundary, reduce Errors to their class, route uncaught Next.js errors through
  instrumentation, replace raw server consoles, and unit test redaction.
- Owner: THREADD project
- Status: Closed
- Verification evidence: `tests/unit/logging.test.ts`, repository console
  search, type checking, production build, and E2E regression.
- Date closed: 25 July 2026

### SEC-011-017 — Monitoring retention, access, and alert delivery are not hosted

- Date found: 25 July 2026
- Environment: deployment operations
- Component: hosting log/monitoring platform
- Severity: Medium
- Description: The application now emits privacy-safe structured error and
  authorization events, but no hosted sink, retention policy, access policy,
  alert recipient, or controlled production test event can be verified locally.
- Impact: Operators could miss authentication abuse, payment failures, or
  availability incidents, or retain logs under inappropriate access.
- Likelihood: Deployment-dependent.
- Remediation: Select the hosting/monitoring sink, restrict access, configure
  approved retention and alerts, set `MONITORING_OWNER`, and send one controlled
  error event in the isolated HTTPS environment.
- Owner: THREADD deployment owner
- Target date: Before Phase 12 release sign-off
- Status: Portfolio-demo risk accepted; remains release-blocking for customer
  deployment
- Verification evidence: `npm run deployment:check` provides the configuration
  gate; provider dashboard evidence and alert receipt remain required.

Portfolio-demo disposition (25 July 2026): risk accepted for the free,
disposable showcase. `igbokwe-chibueze` is the monitoring owner; GitHub run
`30152744808` proves the six-hour health/reset workflow can execute, workflow
failure notifications provide the zero-cost alert, and Vercel runtime logs are
available for diagnosis. The finding remains release-blocking for customer
mode, which requires approved retention, access, and alert-delivery evidence.

### SEC-011-018 — Backup retention and restoration are not provider-verified

- Date found: 25 July 2026
- Environment: deployment operations
- Component: PostgreSQL and managed media recovery
- Severity: Medium
- Description: Source code cannot confirm that encrypted backups, retention,
  point-in-time recovery, restore permissions, and corresponding catalogue
  media recovery are configured.
- Impact: Data corruption, operator error, or provider failure could cause
  unrecoverable orders, payment evidence, inventory history, or media.
- Likelihood: Deployment-dependent.
- Remediation: Configure managed backups, perform the isolated exercise in
  `RECOVERY_RUNBOOK.md`, record protected evidence, and set the backup and
  restore preflight variables.
- Owner: THREADD deployment owner
- Target date: Before Phase 12 release sign-off
- Status: Portfolio-demo risk accepted; remains release-blocking for customer
  deployment
- Verification evidence: Prisma Free dashboard evidence confirms automated
  backups are unavailable. `lib/env/deployment-readiness.ts` and
  `tests/unit/deployment-readiness.test.ts` confine canonical reseeding to the
  disposable portfolio mode and retain managed-backup/restore requirements for
  customer mode. The runbook records recreation steps and intentional loss of
  visitor-created state.

## Remaining evidence for this audit area

- Exercise authentication origin rejection and cookie flags in the deployed
  browser.
- Decide whether the nonce/dynamic-rendering tradeoff is justified after
  deployed performance measurement.
- Configure protected monitoring retention/access and verify an alert reaches
  the active owner.
- Confirm managed backup settings and complete an isolated database/media
  restore exercise.
