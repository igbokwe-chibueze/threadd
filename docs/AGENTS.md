# AGENTS.md — Xtamaliy Clothing Website

## 1. Purpose

This file contains mandatory instructions for Codex and any coding agent working in this repository.

Read these files before making changes:

1. `PRODUCT_OVERVIEW.md`
2. `ROADMAP.md`
3. `SECURITY_AUDIT.md`
4. this file

Where instructions conflict, security and explicit product requirements take priority over convenience.

## 2. Core Behaviour

- Do not invent business rules that affect money, stock, customer data, shipping, refunds, or legal obligations.
- Make the smallest complete change that satisfies the task.
- Preserve existing working behaviour unless the task explicitly changes it.
- Do not silently weaken validation, authorization, tests, or security controls.
- Do not add a third-party service without documenting why it is needed, what data it receives, and how it is configured.
- Never claim a feature is complete unless linting, type checking, relevant tests, and production build pass.

## 3. Project Stack

Use:

- Next.js App Router;
- TypeScript in strict mode;
- pnpm;
- PostgreSQL;
- Prisma;
- Better Auth;
- Tailwind CSS;
- Zod;
- Resend behind an email-provider abstraction;
- Paystack behind a payment-provider abstraction when commerce mode is enabled;
- Playwright for end-to-end tests;
- Vitest or Jest for unit and integration tests.

Do not replace a selected core library without explicit approval.

## 4. Repository Structure

Do not create a `src` directory.

```text
app/
components/
features/
lib/
prisma/
public/
tests/
```

### Placement Rules

- Route composition belongs in `app/`.
- Shared visual primitives belong in `components/ui/`.
- Shared page-layout elements belong in `components/layout/`.
- Domain-specific UI, actions, services, schemas, and queries belong in `features/<feature>/`.
- Cross-cutting infrastructure belongs in `lib/`.
- Prisma schema, migrations, and seed scripts belong in `prisma/`.
- End-to-end tests belong in `tests/e2e/`.

Avoid dumping unrelated helpers into a generic `utils.ts` file.

## 5. Architecture Rules

- Prefer Server Components by default.
- Use Client Components only where browser interactivity requires them.
- Keep database access server-only.
- Keep secrets and privileged SDKs server-only.
- Use Server Actions for trusted application mutations where appropriate.
- Use route handlers for third-party callbacks, webhooks, file endpoints, or public API boundaries.
- Put business rules in services/domain functions, not page components.
- Keep provider-specific code behind interfaces.
- Avoid circular dependencies.
- Do not import feature internals across unrelated features; expose intentional public modules.

## 6. TypeScript Standards

- Keep `strict: true`.
- Do not use `any`.
- Prefer `unknown` plus narrowing for untrusted data.
- Validate external inputs with Zod.
- Use exhaustive checks for status unions.
- Prefer explicit return types on exported server functions and services.
- Do not use non-null assertions to hide missing-state bugs.
- Do not duplicate Prisma-generated types when the generated type is appropriate.
- Do not expose raw database models directly to the browser when they include private fields.

## 7. Naming Standards

- Components: `PascalCase`.
- Functions and variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- Files: use consistent kebab-case except conventional framework files.
- Database models: singular PascalCase.
- Database enum values: use a consistent lower-case or upper-case convention and do not mix styles.
- Boolean names should read as questions: `isActive`, `hasStock`, `canManageOrders`.

## 8. Data and Prisma Rules

- Every schema change requires a migration.
- Never use `prisma db push` against production.
- Add indexes for common filters, foreign keys, unique identifiers, order numbers, payment references, slugs, and timestamps where justified.
- Use database transactions for operations that must succeed atomically.
- Use decimal-safe money representation. Store currency amounts as integer minor units where supported and document the currency.
- Never use JavaScript floating-point arithmetic for payment totals.
- Do not cascade-delete financial or audit records.
- Use soft deletion or archive statuses for products referenced by historical orders.
- Store order-item snapshots so historical orders do not change when a product is edited.
- Record inventory movements rather than relying only on the current quantity.

## 9. Authentication and Authorization

- Authentication answers who the user is; authorization answers what they may do. Implement both.
- Check permissions on the server for every protected query and mutation.
- UI hiding is not authorization.
- Never accept role, user ID, ownership, price, or payment status from the browser as trusted truth.
- Super-admin-only operations require explicit guards.
- Apply secure cookie settings in production.
- Use verified email flows where required.
- Rate-limit login, password reset, verification resend, contact, and payment-related endpoints.
- Do not reveal whether an email address exists during password-reset initiation.

## 10. Validation and Forms

- Validate at every trust boundary.
- Use shared Zod schemas where client and server validation overlap.
- Server validation remains authoritative.
- Return field-level errors where useful.
- Trim and normalize text carefully.
- Apply explicit length limits.
- Do not render user-controlled HTML.
- Use CSRF-safe framework patterns and origin checks for sensitive public endpoints where applicable.

## 11. Payments

These rules are mandatory in commerce mode.

- The server calculates prices, discounts, shipping, and totals.
- Create a pending order before payment initialization.
- Use a unique idempotency/reference key.
- Verify provider webhook signatures.
- Verify the transaction directly with the provider.
- Compare provider amount, currency, reference, and expected order before marking payment successful.
- Do not trust the browser redirect or query string as proof of payment.
- Process webhooks idempotently.
- Deduct inventory exactly once.
- Send confirmation email exactly once per successful transition.
- Keep order status separate from payment status.
- Store safe provider metadata, not card data.
- Log suspicious mismatches without leaking secrets.
- Add tests for duplicate, delayed, forged, and out-of-order payment events.

## 12. Inventory

- Track stock per sellable variant.
- Never permit negative stock through normal flows.
- Use transactions or safe conditional updates for checkout stock changes.
- Every manual adjustment requires a reason and actor.
- Every stock-changing event creates an inventory movement record.
- Do not silently restore inventory on every cancellation; use the documented business rule.
- Product edits must not rewrite historical order item data.

## 13. Email

- Send through a provider abstraction.
- Keep templates typed and reusable.
- Escape user-controlled values.
- Do not include secrets or sensitive operational details in emails.
- Use environment-specific sender configuration.
- Automated tests must not send real emails.
- Store only the delivery metadata needed for support and troubleshooting.
- Email failure must not invalidate a completed payment or lose a submitted enquiry.
- Retriable delivery should be safe and idempotent.

## 14. File and Image Uploads

- Prefer direct-to-approved-storage uploads using signed parameters where suitable.
- Allowlist MIME types and file extensions.
- Enforce maximum file size and image dimensions.
- Generate server-controlled filenames or public IDs.
- Do not trust the original filename.
- Do not store uploads in the application repository.
- Do not permit executable formats.
- Strip unnecessary metadata where supported.
- Require admin authorization for catalogue uploads.

## 15. UI and UX Standards

- Mobile first.
- All interactive elements need visible focus states.
- Forms need labels, instructions, and useful errors.
- Do not use colour as the only status indicator.
- Support reduced-motion preferences.
- Use skeletons or clear loading states where delay is expected.
- Use empty states that tell the user what to do next.
- Confirm destructive actions.
- Use toasts for action feedback, but do not rely on toasts for critical information.
- Keep animations tasteful and lightweight.
- Do not block content behind unnecessary animation.

## 16. SEO and Performance

- Use semantic HTML.
- Generate metadata on the server.
- Use canonical URLs.
- Optimize images and specify dimensions.
- Avoid unnecessary client-side JavaScript.
- Paginate large admin and catalogue lists.
- Prevent admin, account, cart, and checkout pages from indexing.
- Revalidate affected catalogue pages after content changes.
- Avoid expensive database queries inside loops.

## 17. Errors and Logging

- Show safe, useful user messages.
- Never expose stack traces, SQL, secrets, or provider responses to customers.
- Log errors with context and correlation identifiers where practical.
- Redact tokens, passwords, full payment payloads, and unnecessary PII.
- Use dedicated error types for expected domain failures.
- Unexpected errors should be captured by monitoring.
- Do not swallow errors silently.

## 18. Testing Requirements

For every meaningful feature, add the appropriate level of testing.

### Unit Tests

Use for:

- price calculations;
- status transitions;
- permission checks;
- inventory rules;
- schema validation;
- formatting and mapping functions.

### Integration Tests

Use for:

- database services;
- authentication flows;
- server actions;
- payment event processing;
- inventory transactions;
- enquiry submission.

### End-to-End Tests

Cover at least:

- browse catalogue and product;
- admin creates and publishes a product;
- submit enquiry;
- sign up/sign in/reset password in Mode B;
- add to cart and checkout in Mode B;
- successful and failed payment simulations;
- admin processes an order in Mode B;
- authorization boundaries.

Do not make tests depend on production services.

## 19. Required Commands Before Completion

Run the repository equivalents of:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

If an end-to-end dependency is unavailable, state exactly what was not run and why. Do not report success without evidence.

## 20. Environment Variables

- Validate environment variables at startup.
- Keep `.env.example` current.
- Never commit `.env`, secrets, tokens, private keys, or production identifiers.
- Prefix only genuinely public browser variables with `NEXT_PUBLIC_`.
- Payment secret keys, database URLs, auth secrets, email API keys, and storage secrets must remain server-only.

## 21. Git and Change Discipline

- Keep commits focused.
- Do not commit generated build output.
- Do not rewrite unrelated files.
- Do not perform broad refactors while implementing a small feature unless required.
- Document schema and environment changes.
- Never disable a failing test merely to make CI green.
- Never commit credentials, production exports, or customer data.

## 22. Task Execution Format

Before coding, provide or record:

- task summary;
- affected features/files;
- assumptions;
- security implications;
- test plan.

After coding, report:

- what changed;
- migrations or environment changes;
- tests run and outcomes;
- known limitations;
- manual verification steps.

## 23. Stop Conditions

Stop and request clarification when:

- a shipping charge or tax rule is missing;
- a refund or stock-restoration policy is unclear;
- a payment provider is not confirmed;
- a requested change would expose private data;
- a request conflicts with security requirements;
- destructive production data work is requested without backup and approval;
- credentials or merchant access are required but unavailable.

Do not stop for minor implementation choices that can be solved safely within these standards.

## 24. Completion Standard

A task is not complete until:

- the behaviour matches product requirements;
- security controls are present;
- code is typed and maintainable;
- relevant tests pass;
- loading/error/empty states are handled;
- documentation is updated;
- no secrets or sensitive data were introduced;
- production build succeeds.
