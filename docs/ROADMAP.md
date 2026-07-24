# THREADD — Development Roadmap

## Project Status

| Field            | Current value                                               |
| ---------------- | ----------------------------------------------------------- |
| Product          | THREADD, a single-store unisex fashion ecommerce experience |
| Delivery mode    | Full commerce, including catalogue and enquiry features     |
| Immediate target | Two-day portfolio MVP                                       |
| Current phase    | Phase 6B — Customer Accounts and Cart                       |
| Phase status     | Ready                                                         |
| Previous phase   | Phase 6A — Completed on 24 July 2026                        |
| Next phase       | Phase 7 — Checkout, Payments, and Orders                     |
| Last reviewed    | 24 July 2026                                                |

### Status Rules

- This section is the canonical project-status record and must be updated whenever a phase starts, becomes blocked, or is completed.
- Every implementation task must identify its roadmap phase before work begins.
- Only one phase may be marked as the primary active phase. Later-phase discovery may happen early, but implementation must not bypass an unmet quality gate.
- A phase is complete only when its deliverables, tests, documentation, and exit criteria are satisfied.
- Each phase is an expandable `<details>` section. Completed phases should default to collapsed; the active phase should remain open.
- At the end of every task, report the current phase, completed work, remaining exit criteria, and next intended task.
- `Xtamaliy` is a legacy project name. All new product copy, code, configuration, and documentation must use `THREADD`.

## 1. Roadmap Purpose

This roadmap breaks THREADD into implementation phases that Codex can execute incrementally. Each phase must end with working, reviewable software. Do not begin a later phase while critical defects from the current phase remain unresolved.

THREADD will launch as a full ecommerce store. The application must still preserve a configuration-controlled catalogue mode so checkout can be safely disabled without duplicating the codebase:

- **Mode A:** catalogue and contact-to-order;
- **Mode B:** full e-commerce.

Mode A is the storefront foundation. Mode B is the selected THREADD delivery mode and builds on it without replacing or duplicating the catalogue implementation.

THREADD is one store, not a multi-tenant SaaS product. The public portfolio demo is a separately configured deployment of the same application, with isolated data and integrations.

<details open>
<summary><strong>Two-Day Portfolio MVP</strong> · Immediate delivery target</summary>

The immediate release is a polished, functional vertical slice rather than completion of every production-hardening item in the long-term phases.

### Day 1 — Visual Storefront and Foundation

- Complete the essential Phase 1 foundation.
- Establish the original THREADD identity and motion system.
- Build the responsive homepage, navigation, shop, collection, and product-detail experiences.
- Seed a representative unisex catalogue with explicit variants.
- Implement search, filters, sorting, cart interactions, and essential feedback states.

### Day 2 — Functional Demo

- Implement normal customer and administrator authentication with seeded demo accounts.
- Add customer account and order-history experiences.
- Add the essential admin dashboard, product, inventory, and order workflows.
- Implement guest and registered checkout.
- Integrate Paystack test mode when credentials are available; otherwise preserve the provider boundary and use a clearly labelled test adapter.
- Add the private Demo Outbox and manual text downloads.
- Add demo restrictions and a safe reset path.
- Verify responsive layouts, linting, type checking, critical tests, and the production-mode build.
- Deploy when the selected hosting and required credentials are available.

### MVP Boundary

The MVP may defer exhaustive test coverage, live email, advanced refund automation, courier integration, reviews, coupons, advanced analytics, and the full production-security sign-off. Deferred work remains in the long-term phases and must not be represented as complete.

</details>

## 2. Working Method

For every phase:

1. Review `PRODUCT_OVERVIEW.md`, `AGENTS.md`, and `SECURITY_AUDIT.md`.
2. Create or update a short implementation plan.
3. Work in small, testable changes.
4. Run formatting, linting, type checking, tests, and production build.
5. Update documentation and `.env.example` where needed.
6. Record known limitations rather than hiding them.
7. Stop and request a decision only when a business rule cannot safely be inferred.
8. Update the Project Status table and phase checklist as progress changes.

<details>
<summary><strong>PHASE 0 — DEFINE THE PRODUCT</strong> · Completed</summary>

**Status:** Completed on 23 July 2026. Remaining provider selections and visual approvals are tracked below at the phase where they become necessary; they do not block Phase 1.

### Objectives

Resolve decisions that affect the data model or third-party integrations.

### Confirmed Decisions

- [x] Product name is THREADD.
- [x] THREADD is a single unisex fashion store, not a multi-tenant platform.
- [x] Full commerce is the selected delivery mode.
- [x] Guest checkout and registered-customer checkout are supported.
- [x] Products support explicit size and colour variants.
- [x] Inventory is tracked per sellable variant with immutable movement records.
- [x] Paystack is the payment provider, behind a provider abstraction.
- [x] Delivery is available throughout Nigeria.
- [x] Shipping uses configurable state-based zones, calculated on the server:
  - Lagos: ₦3,000;
  - Ogun, Oyo, Osun, Ondo, and Ekiti: ₦4,500;
  - all other states and the FCT: ₦6,000.
- [x] Free shipping is disabled initially but may later be enabled with an admin-configured threshold.
- [x] Eligible unworn items with original tags and packaging have a seven-day return window from delivery.
- [x] Paid cancellations require staff approval.
- [x] Dispatched orders use a return workflow rather than cancellation.
- [x] Refund and inventory-restoration transitions remain separate.
- [x] Returned stock is restored only after receipt and inspection confirms it is sellable.
- [x] The package manager is npm.
- [x] The visual direction is modern, editorial, highly visual, and motion-led rather than a generic ecommerce template.
- [x] The public portfolio demo uses isolated demo infrastructure and resets every six hours.
- [x] Demo email uses a private outbox with user-initiated text downloads; no live email provider is required for the portfolio MVP.
- [x] Email templates and calling features remain provider-independent so Resend can be added later without rewriting domain workflows.

### Open Decisions

- [ ] Approve the generated THREADD identity, colours, typography, and logo after the first visual direction is presented.
- [ ] Confirm the initial product category, size, colour, collection, and sample-content taxonomy after a proposed seed catalogue is presented.
- [ ] Select demo hosting, database, media storage, and email-sandbox providers before their integration phases.

### Exit Criteria

- [x] Decisions are documented.
- [x] No payment method is advertised without confirmed provider support.
- [x] Required accounts and credentials are available or placeholders are clearly identified.

</details>

<details>
<summary><strong>PHASE 1 — BUILD THE ENGINEERING FOUNDATION</strong> · Completed</summary>

**Status:** Completed on 23 July 2026.

### Deliverables

- Initialize Next.js App Router project with TypeScript.
- Standardize on npm and commit `package-lock.json`.
- Configure Tailwind CSS and shared design tokens.
- Enable TypeScript strict mode.
- Configure ESLint and formatting.
- Create feature-based folder structure.
- Add environment-variable schema validation.
- Add `.env.example` with no real secrets.
- Configure unit/integration test runner.
- Configure Playwright.
- Add CI workflow for lint, type check, tests, and build.
- Add security headers baseline.
- Add error boundary, not-found page, and global loading behaviour.
- Add structured logging abstraction.

### Quality Gate

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

All must pass.

</details>

<details>
<summary><strong>PHASE 2 — CONNECT DATA AND SECURE ACCESS</strong> · Completed</summary>

**Status:** Completed on 23 July 2026.

### Current Progress

- [x] Claimed Prisma Postgres database connected.
- [x] Initial authentication and audit schema migrated.
- [x] Better Auth configured with the Prisma adapter.
- [x] Customer, administrator, and super-administrator roles defined.
- [x] Server-owned role fields and server-side authorization guards implemented.
- [x] Demo customer and administrator credential accounts seeded.
- [x] Sign-in, customer account, and administrator studio shells implemented.
- [x] Customer-to-admin authorization boundary verified by an end-to-end test.
- [x] Add password reset and email verification through the Demo Outbox.
- [x] Add the secure super-administrator bootstrap flow.
- [x] Add focused integration tests for session expiry and revoked access.

### Deliverables

- Configure PostgreSQL and Prisma.
- Define initial schema.
- Create migrations.
- Configure Better Auth.
- Implement secure session handling.
- Implement email verification and password reset through the provider-independent email service.
- Define application roles: customer, admin, and super_admin.
- Keep the role model single-store; do not add organizations, memberships, or tenant-scoped business data.
- Add server-side role guards.
- Create secure initial super-admin bootstrap process.
- Add audit-log foundation.
- Add seed data for local development.
- Seed separate demo admin and customer accounts without implementing authentication bypasses.

### Required Tests

- Customer cannot access admin routes.
- Admin cannot perform super-admin-only actions.
- Logged-out user cannot access protected account pages.
- Password-reset tokens expire and cannot be reused.
- Disabled or removed admin access takes effect immediately or within the documented session policy.

### Exit Criteria

- Authentication works end to end.
- Protected server operations enforce authorization independently of the UI.
- No role is accepted from browser-submitted input.

</details>

<details>
<summary><strong>PHASE 3 — CREATE THE VISUAL SYSTEM</strong> · Completed</summary>

**Status:** Completed on 23 July 2026.

### Current Progress

- [x] Establish the first editorial THREADD homepage direction.
- [x] Add the original campaign image and typographic wordmark.
- [x] Extract the shared responsive public header and footer.
- [x] Establish reusable UI and motion primitives.
- [x] Complete the core public information-page shells.
- [x] Verify responsive, reduced-motion, and keyboard behaviour.

### Deliverables

- Responsive header and navigation.
- Footer.
- Announcement area where approved.
- Mobile navigation.
- Reusable buttons, inputs, cards, dialogs, badges, tables, and feedback states.
- Home-page shell.
- Establish THREADD's unisex editorial art direction, typographic wordmark, colour system, and code-native brand mark.
- About, Contact, Delivery, Returns, Privacy, and Terms page shells.
- Accessible focus states and keyboard navigation.
- Motion-reduction support.
- Add Framer Motion and define shared motion primitives for page reveals, image transitions, navigation, product interactions, and feedback.
- Use strong art direction, layered imagery, editorial spacing, and intentional asymmetry where appropriate.
- Keep primary content and actions usable before animations complete.
- Avoid generic marketplace layouts, excessive dashboard-card styling, and repeated animation without narrative purpose.

### Exit Criteria

- Layout works at representative mobile, tablet, and desktop sizes.
- No horizontal overflow.
- Animations do not block interaction.
- Reduced-motion users receive an equivalent experience without non-essential movement.
- Representative pages remain performant after image and animation work.
- Basic accessibility review passes.

</details>

<details>
<summary><strong>PHASE 4 — BUILD THE PRODUCT CATALOGUE</strong> · Completed</summary>

**Status:** Completed on 23 July 2026.

### Current Progress

- [x] Define catalogue, category, collection, product, variant, and image data.
- [x] Migrate and seed the representative unisex catalogue.
- [x] Build the public shop, collection, and product-detail routes.
- [x] Add search, filters, sorting, and pagination.
- [x] Build administrator catalogue management.
- [x] Verify visibility, variant, metadata, and invalid-route rules.

### Deliverables

- Product, category, collection, variant, and image data models.
- Admin product CRUD.
- Draft, active, and archived product states.
- Variant management for size and colour.
- Inventory quantity per variant.
- Product image upload and ordering.
- Public shop page.
- Category and collection pages.
- Product detail page.
- Search, filter, sort, and pagination.
- Featured product controls.
- SEO fields and metadata generation.
- Sitemap and robots configuration.

### Required Tests

- Draft and archived products are not publicly visible.
- Invalid slugs return not found.
- Variant and inventory rules are enforced server-side.
- Product updates invalidate or refresh affected public pages.
- Admin image operations enforce file type and size limits.

### Exit Criteria

- An administrator can create and publish a product without developer assistance.
- Customers can reliably find and inspect products.

</details>

<details>
<summary><strong>PHASE 5 — CONTROL INVENTORY</strong> · Completed</summary>

**Status:** Completed on 24 July 2026.

### Current Progress

- [x] Add immutable inventory movement records.
- [x] Build transaction-safe stock adjustments with mandatory reasons.
- [x] Add low-stock threshold controls and indicators.
- [x] Build inventory history and administrator workflows.
- [x] Verify negative-stock, audit, and catalogue-isolation rules.

### Deliverables

- Inventory movement model.
- Admin stock adjustments with mandatory reason.
- Low-stock configuration and indicators.
- Inventory history view.
- Protection against negative stock.
- Safe transaction boundaries for stock-changing operations.

### Required Tests

- Concurrent stock updates do not oversell beyond the accepted policy.
- Each adjustment creates one audit record.
- Editing product content does not silently alter stock.

</details>

<details>
<summary><strong>PHASE 6A — HANDLE PRODUCT ENQUIRIES</strong> · Completed</summary>

**Status:** Completed on 24 July 2026.

### Current Progress

- [x] Add enquiry, status-history, and internal-note records.
- [x] Build general and product-specific public enquiry forms.
- [x] Add safe WhatsApp product links and abuse controls.
- [x] Build the protected administrator enquiry inbox.
- [x] Deliver customer and administrator messages through Demo Outbox.
- [x] Verify validation, throttling, rendering, and delivery-failure rules.

This phase completes Mode A.

### Deliverables

- Product enquiry form.
- General contact form.
- WhatsApp product link.
- Server-side validation.
- Rate limiting and spam protection.
- Admin enquiry inbox.
- Enquiry status transitions.
- Internal notes.
- Business notification email.
- Optional customer confirmation email.
- CSV export if approved.

### Required Tests

- Invalid and automated submissions are rejected or throttled.
- Customer-controlled content is safely rendered in admin.
- Enquiry email failure does not lose the enquiry record.
- WhatsApp links include a safe, encoded message and canonical product URL.

### Storefront Completion Gate

- Catalogue workflows pass end-to-end tests.
- Representative seed data is available.
- Security audit has no open critical or high-severity findings.

</details>

<details open>
<summary><strong>PHASE 6B — BUILD CUSTOMER ACCOUNTS AND CART</strong> · Ready</summary>

**Status:** Ready to begin.

This phase is required only for Mode B.

### Deliverables

- Customer profile and address management.
- Persistent cart.
- Guest cart and guest checkout support.
- Optional cart merge after sign-in.
- Server-authoritative price and stock checks.
- Cart summary.
- Checkout entry page.

### Required Tests

- Browser-modified prices are ignored.
- Cart cannot reference inactive or deleted variants at checkout.
- Stock changes are reflected before payment initialization.
- Customer can access only their own addresses and cart.

</details>

<details>
<summary><strong>PHASE 7 — CHECKOUT, PAYMENTS, AND ORDERS</strong> · Upcoming</summary>

Required only for Mode B.

### Deliverables

- Shipping-rule configuration.
- Initial Nigeria shipping zones and fees are stored as editable configuration rather than hard-coded into checkout components.
- Checkout validation.
- Pending order creation.
- Payment-provider abstraction.
- Primary provider integration.
- Secure callback/return page.
- Signed webhook endpoint.
- Server-to-server payment verification.
- Idempotent payment-event processing.
- Order and payment status separation.
- Inventory deduction exactly once.
- Order confirmation emails.
- Customer order history.
- Admin order management.
- Manual status updates with audit logs.
- Customer cancellation requests before dispatch.
- Staff-controlled cancellation approval and Paystack refund initiation.
- Seven-day return-request workflow for eligible delivered items.
- Refund lifecycle handling from pending through processed or failed.
- Stock restoration only after a qualifying cancellation or inspected sellable return.

### Required Tests

- Forged success-return URL cannot mark an order paid.
- Invalid webhook signature is rejected.
- Duplicate webhook does not duplicate payment, stock deduction, email, or order transition.
- Amount and currency must match the server-created order.
- Payment reference must belong to the correct order.
- Payment callback and webhook arriving in either order produce the same final state.
- Failed email does not roll back a successful payment.
- Refund completion does not automatically restore inventory.
- Duplicate refund events do not duplicate financial records or stock movements.
- A dispatched order cannot use the pre-dispatch cancellation path.
- Ineligible or late return requests are rejected with a recorded reason.

### Exit Criteria

- Payment flow passes provider test-mode end-to-end testing.
- Reconciliation data is available in admin.
- No payment secret is exposed to the browser.

</details>

<details>
<summary><strong>PHASE 8 — DELIVER NOTIFICATIONS RELIABLY</strong> · Upcoming</summary>

### Deliverables

- Define a typed email-provider interface that is independent of Resend and the demo implementation.
- Reusable email templates.
- Implement a demo provider that writes private preview records to the Demo Outbox.
- Allow users to view and deliberately download their own generated messages as text files.
- Allow administrators to view only administrator-directed demo notifications.
- Protect guest-order message downloads with short-lived, unguessable references.
- Keep a clear adapter seam for a future Resend provider selected through validated environment configuration.
- Log only the delivery metadata needed for the demo and avoid retaining unnecessary sensitive message content.
- Retry strategy for transient failures.
- Development and automated-test email suppression.
- Admin notification recipients configurable.

### Required Tests

- No external email is sent by the demo or automated tests.
- A customer cannot read or download another customer's messages.
- A guest cannot enumerate or reuse expired message-download references.
- Administrator notifications are not exposed to customers.
- User-controlled HTML cannot be injected into templates.
- Reset and verification links use the correct environment URL.
- Duplicate payment events do not send duplicate confirmation emails.
- Swapping the demo provider for a test provider does not require changes to authentication, enquiry, payment, or order services.

</details>

<details>
<summary><strong>PHASE 9 — PROTECT AND RESET THE PUBLIC DEMO</strong> · Upcoming</summary>

### Architecture

The demo is not a tenant inside the production database. It is a separate deployment of the same application with:

- an isolated demo PostgreSQL database;
- separate demo media storage or an isolated storage prefix;
- Paystack test credentials only;
- outbound customer email suppressed or redirected to an approved sink;
- demo-specific environment configuration;
- no access to production secrets or data.

### Deliverables

- Seed a demo administrator and demo customer using the normal authentication flow.
- Display demo credentials and one-click sign-in options on the login page.
- Seed a realistic unisex catalogue, customers, enquiries, inventory history, orders, payments, and analytics.
- Permit safe product, category, collection, inventory, customer, order, and storefront-setting workflows.
- Display a persistent demo banner explaining that changes are temporary.
- Centrally gate email delivery, live payment activity, data exports, secret configuration, and destructive system operations.
- Reset only the isolated demo database and demo media every six hours.
- Make the reset atomic or maintenance-aware so visitors never see partially seeded data.
- Document how to create a customer deployment from the same codebase with fresh infrastructure.

### Required Tests

- Demo users authenticate normally and receive only their assigned permissions.
- Demo restrictions are enforced on the server, not only hidden in the UI.
- Demo checkout uses Paystack test mode.
- Reset restores the canonical seed state and cannot target production infrastructure.
- Reset is idempotent and safe when invoked more than once.
- Demo email cannot reach arbitrary recipients.
- Production configuration cannot accidentally enable demo credentials.

### Exit Criteria

- All advertised demo workflows are functional.
- Demo changes are reliably removed every six hours.
- No demo operation can alter production data, media, payments, or email.

</details>

<details>
<summary><strong>PHASE 10 — OPTIMIZE THE STOREFRONT</strong> · Upcoming</summary>

### Deliverables

- Full metadata review.
- Structured data review.
- Canonical URL review.
- Image sizing and compression review.
- Bundle and route performance review.
- Framer Motion bundle, animation cost, and reduced-motion review.
- Accessibility audit of key pages.
- Search Console integration.
- Sitemap submission.
- Approved analytics events.
- Cookie/consent handling if required by selected analytics or jurisdiction.

### Exit Criteria

- Key public pages meet agreed quality targets.
- Private/admin pages are excluded from indexing.
- Analytics contains no passwords, tokens, full addresses, or other unnecessary PII.

</details>

<details>
<summary><strong>PHASE 11 — HARDEN SECURITY</strong> · Upcoming</summary>

### Deliverables

- Complete every applicable check in `SECURITY_AUDIT.md`.
- Dependency audit.
- Secret scan.
- Authorization review.
- Payment and webhook review.
- Upload security review.
- Rate-limit review.
- Session and cookie review.
- Security-header review.
- Logging and privacy review.
- Backup and recovery review.
- Production configuration review.
- Demo-to-production isolation review.
- Demo reset-target and credential review.

### Exit Criteria

- Zero open critical findings.
- Zero open high findings.
- Medium findings have fixes or explicitly accepted risks with owner and target date.
- Audit evidence is stored in the repository or approved project records.

</details>

<details>
<summary><strong>PHASE 12 — RELEASE AND DOCUMENT THREADD</strong> · Upcoming</summary>

### Deliverables

- Hosted demo database.
- Isolated demo environment configuration.
- Public portfolio URL and DNS configuration where applicable.
- HTTPS verification.
- Paystack test-mode webhook registration.
- Database backup confirmation.
- Monitoring and alerting.
- Seed the canonical THREADD demo catalogue.
- Create demo admin and customer accounts securely.
- Add a concise portfolio case study covering the problem, architecture, major workflows, security decisions, and visual system.
- Document local setup, environment variables, demo reset, test commands, and deployment.
- Add a customer-adaptation guide explaining how to replace branding, seed data, providers, shipping rules, and demo infrastructure.

### Release Checklist

- Production-mode build passes.
- Migrations applied safely.
- Smoke tests pass.
- Forms are safely captured while arbitrary outbound demo email remains disabled.
- Paystack test transactions, failures, refunds, and webhook retries are verified.
- Sitemap and robots are correct.
- Error monitoring receives a controlled test event.
- Demo credentials and the demo banner are present only in the demo environment.
- The public demo contains no live secrets, real customer data, or live payment capability.

</details>

## 17. Development Checkpoints

### Checkpoint 1 — Working Vertical Slice

- application foundation;
- initial THREADD visual direction;
- responsive storefront shell;
- working database;
- secure admin sign-in;
- admin can create a product;
- product appears on the public catalogue;
- representative product detail page;
- preview deployment.

The vertical slice must use real application flows, not static mock screens.

### Checkpoint 2 — Feature Complete

- All selected-mode features implemented.
- Integrations working in test mode.
- Required tests passing.
- Content and policy pages added.

### Checkpoint 3 — Portfolio Ready

- Security audit complete.
- Public demo deployed.
- Demo reset and isolation verified.
- Project and customer-adaptation documentation complete.
- Portfolio case study published.

## 18. Deferred Enhancements

Keep these out of the initial build unless separately approved:

- wishlists;
- product reviews;
- discount-code engine;
- abandoned-cart automation;
- courier API integration;
- advanced reporting;
- gift cards;
- loyalty points;
- multilingual content;
- multi-currency checkout;
- native mobile apps.
- live transactional email delivery through Resend or another approved provider.
