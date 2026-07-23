# Xtamaliy Clothing Website — Development Roadmap

## 1. Roadmap Purpose

This roadmap breaks the project into implementation phases that Codex can execute incrementally. Each phase must end with working, reviewable software. Do not begin a later phase while critical defects from the current phase remain unresolved.

The roadmap supports both delivery modes:

- **Mode A:** catalogue and contact-to-order;
- **Mode B:** full e-commerce.

Mode A is the foundation. Mode B builds on top of it without replacing or duplicating the catalogue implementation.

## 2. Working Method

For every phase:

1. Review `PRODUCT_OVERVIEW.md`, `AGENTS.md`, and `SECURITY_AUDIT.md`.
2. Create or update a short implementation plan.
3. Work in small, testable changes.
4. Run formatting, linting, type checking, tests, and production build.
5. Update documentation and `.env.example` where needed.
6. Record known limitations rather than hiding them.
7. Stop and request a decision only when a business rule cannot safely be inferred.

## 3. Phase 0 — Product and Provider Decisions

### Objectives

Resolve decisions that affect the data model or third-party integrations.

### Required Decisions

- Confirm Mode A or Mode B for initial launch.
- Confirm brand assets, colours, typography, and logo files.
- Confirm required sizes, colours, categories, and collections.
- Confirm whether products may have multiple variants.
- Confirm stock-management expectations.
- Confirm primary payment provider for Mode B.
- Confirm shipping rules and delivery regions for Mode B.
- Confirm return/refund policy.
- Confirm transactional email sender domain.
- Confirm media storage provider.
- Confirm domain and hosting provider.

### Exit Criteria

- Decisions are documented.
- No payment method is advertised without confirmed provider support.
- Required accounts and credentials are available or placeholders are clearly identified.

## 4. Phase 1 — Repository and Engineering Foundation

### Deliverables

- Initialize Next.js App Router project with TypeScript.
- Configure pnpm and commit lockfile.
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
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All must pass.

## 5. Phase 2 — Database, Authentication, and Authorization

### Deliverables

- Configure PostgreSQL and Prisma.
- Define initial schema.
- Create migrations.
- Configure Better Auth.
- Implement secure session handling.
- Implement email verification and password reset.
- Define roles: customer, admin, super_admin.
- Add server-side role guards.
- Create secure initial super-admin bootstrap process.
- Add audit-log foundation.
- Add seed data for local development.

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

## 6. Phase 3 — Design System and Public Layout

### Deliverables

- Responsive header and navigation.
- Footer.
- Announcement area where approved.
- Mobile navigation.
- Reusable buttons, inputs, cards, dialogs, badges, tables, and feedback states.
- Home-page shell.
- About, Contact, Delivery, Returns, Privacy, and Terms page shells.
- Accessible focus states and keyboard navigation.
- Motion-reduction support.

### Exit Criteria

- Layout works at representative mobile, tablet, and desktop sizes.
- No horizontal overflow.
- Animations do not block interaction.
- Basic accessibility review passes.

## 7. Phase 4 — Catalogue and Product Management

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

- Client can create and publish a product without developer assistance.
- Customers can reliably find and inspect products.

## 8. Phase 5 — Inventory Controls

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

## 9. Phase 6A — Enquiries and Contact-to-Order

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

### Mode A Launch Gate

- Catalogue workflows pass end-to-end tests.
- Admin training data is available.
- Production domain, email sender, analytics decision, and Search Console setup are ready.
- Security audit has no open critical or high-severity findings.

## 10. Phase 6B — Customer Account and Cart

This phase is required only for Mode B.

### Deliverables

- Customer profile and address management.
- Persistent cart.
- Guest cart support.
- Optional cart merge after sign-in.
- Server-authoritative price and stock checks.
- Cart summary.
- Checkout entry page.

### Required Tests

- Browser-modified prices are ignored.
- Cart cannot reference inactive or deleted variants at checkout.
- Stock changes are reflected before payment initialization.
- Customer can access only their own addresses and cart.

## 11. Phase 7 — Checkout, Payments, and Orders

Required only for Mode B.

### Deliverables

- Shipping-rule configuration.
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

### Required Tests

- Forged success-return URL cannot mark an order paid.
- Invalid webhook signature is rejected.
- Duplicate webhook does not duplicate payment, stock deduction, email, or order transition.
- Amount and currency must match the server-created order.
- Payment reference must belong to the correct order.
- Payment callback and webhook arriving in either order produce the same final state.
- Failed email does not roll back a successful payment.

### Exit Criteria

- Payment flow passes provider test-mode end-to-end testing.
- Reconciliation data is available in admin.
- No payment secret is exposed to the browser.

## 12. Phase 8 — Email, Notifications, and Operational Resilience

### Deliverables

- Resend provider integration.
- Reusable email templates.
- Provider abstraction.
- Email event logging without storing unnecessary message content.
- Retry strategy for transient failures.
- Development email suppression/sandbox behaviour.
- Admin notification recipients configurable.
- Bounce and complaint handling plan.

### Required Tests

- No production email is sent during automated tests.
- User-controlled HTML cannot be injected into templates.
- Reset and verification links use the correct environment URL.
- Duplicate payment events do not send duplicate confirmation emails.

## 13. Phase 9 — SEO, Performance, Accessibility, and Analytics

### Deliverables

- Full metadata review.
- Structured data review.
- Canonical URL review.
- Image sizing and compression review.
- Bundle and route performance review.
- Accessibility audit of key pages.
- Search Console integration.
- Sitemap submission.
- Approved analytics events.
- Cookie/consent handling if required by selected analytics or jurisdiction.

### Exit Criteria

- Key public pages meet agreed quality targets.
- Private/admin pages are excluded from indexing.
- Analytics contains no passwords, tokens, full addresses, or other unnecessary PII.

## 14. Phase 10 — Security Hardening and Pre-Launch Audit

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

### Exit Criteria

- Zero open critical findings.
- Zero open high findings.
- Medium findings have fixes or explicitly accepted risks with owner and target date.
- Audit evidence is stored in the repository or approved project records.

## 15. Phase 11 — Deployment, Handover, and Training

### Deliverables

- Production database.
- Production environment configuration.
- Domain and DNS setup.
- HTTPS verification.
- Production email-domain verification.
- Payment webhook registration.
- Database backup confirmation.
- Monitoring and alerting.
- Seed or import approved live catalogue content.
- Admin accounts created securely.
- Written admin guide.
- One training session.
- Handover checklist.

### Launch Checklist

- Production build passes.
- Migrations applied safely.
- Smoke tests pass.
- Forms send to correct recipients.
- Mode B test payment and real low-value transaction are verified if permitted.
- Sitemap and robots are correct.
- Error monitoring receives a controlled test event.
- No test credentials, sample orders, or test banners remain.

## 16. Phase 12 — Complimentary Maintenance Window

Duration: 30 days after full payment and handover.

### Included

- Fixing reproducible defects in delivered functionality.
- Resolving deployment/configuration issues caused by the delivered implementation.
- Minor corrections to existing content or settings where reasonable.

### Excluded

- New features.
- Redesigns.
- New payment providers.
- Major catalogue uploads.
- Third-party fees.
- Changes caused by unsupported client modifications.

### Maintenance Practice

- Record every issue.
- Classify severity.
- Reproduce before changing code.
- Add a regression test for material defects.
- Deploy through the normal review and verification process.

## 17. Suggested Milestones

### Milestone 1 — Working Proof of Concept

Suitable for the 60% payment checkpoint:

- application foundation;
- approved visual direction;
- responsive storefront shell;
- working database;
- secure admin sign-in;
- admin can create a product;
- product appears on the public catalogue;
- representative product detail page;
- initial deployment to a review environment.

The proof of concept must use real application flows, not static mock screens.

### Milestone 2 — Feature Complete

- All selected-mode features implemented.
- Integrations working in test mode.
- Required tests passing.
- Content and policy pages added.

### Milestone 3 — Production Handover

- Security audit complete.
- Production deployment complete.
- Training and documentation delivered.
- Final acceptance completed.

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
