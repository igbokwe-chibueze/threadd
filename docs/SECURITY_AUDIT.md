# Xtamaliy Clothing Website — Security Audit Standard

## 1. Purpose

This document defines the security controls, review checklist, and evidence required before production launch and after material changes.

It is not a one-time form. Update it throughout development and repeat applicable checks after changes to authentication, authorization, payments, uploads, customer data, deployment, or third-party integrations.

## 2. Severity Definitions

### Critical

A realistic issue that can directly cause account takeover, unauthorized payment/order manipulation, large-scale data exposure, remote code execution, secret compromise, or complete administrative compromise.

**Launch rule:** no open critical findings.

### High

A serious issue that can cause privilege escalation, unauthorized access to sensitive records, payment-integrity failure, stored cross-site scripting, major authentication bypass, or significant operational compromise.

**Launch rule:** no open high findings.

### Medium

A weakness requiring specific conditions or with limited impact, such as incomplete rate limiting, excess data exposure, insufficient logging, weak recovery controls, or unsafe configuration that is not immediately exploitable.

**Launch rule:** fix or formally accept with owner and target date.

### Low

A defence-in-depth improvement, minor information disclosure, or best-practice gap with limited direct impact.

## 3. Audit Record Template

For every finding record:

- ID;
- date found;
- environment;
- feature/component;
- description;
- evidence;
- severity;
- impact;
- likelihood;
- remediation;
- owner;
- status;
- verification evidence;
- date closed or accepted.

## 4. Threat Model

### Protected Assets

- administrator accounts;
- customer accounts;
- customer names, emails, phone numbers, and addresses;
- product and inventory data;
- enquiries and internal notes;
- orders and payment status;
- payment-provider keys and webhook secrets;
- authentication secrets and sessions;
- database credentials;
- email-provider credentials;
- uploaded media-management credentials;
- audit and operational logs.

### Main Threat Actors

- unauthenticated attackers;
- automated bots and spammers;
- malicious customers;
- compromised customer accounts;
- compromised admin accounts;
- disgruntled or careless staff;
- attackers abusing third-party callbacks or webhooks;
- supply-chain attackers through dependencies;
- accidental developer or deployment misconfiguration.

### Main Abuse Cases

- access admin pages without permission;
- change a role or ownership identifier in a request;
- manipulate product price or cart total;
- mark an unpaid order as paid;
- replay a payment webhook;
- oversell inventory through concurrency;
- upload executable or harmful files;
- inject scripts into product or enquiry content;
- enumerate customer accounts;
- brute-force login or reset flows;
- spam contact and enquiry forms;
- expose secrets in logs, bundles, errors, or source control;
- access another customer's address or order;
- delete historical financial records;
- abuse admin exports to obtain unnecessary PII.

## 5. Authentication Audit

- [ ] Better Auth is configured using a strong production secret.
- [ ] Production cookies use `Secure`.
- [ ] Session cookies use `HttpOnly` where applicable.
- [ ] SameSite policy is explicitly reviewed.
- [ ] Session expiry is appropriate.
- [ ] Session invalidation works after password change or account disablement according to policy.
- [ ] Email-verification tokens expire.
- [ ] Password-reset tokens expire and are single-use.
- [ ] Password-reset initiation does not reveal whether an account exists.
- [ ] Login and reset endpoints are rate-limited.
- [ ] Email-verification resend is rate-limited.
- [ ] Authentication errors do not expose internal details.
- [ ] Default or sample administrator credentials do not exist.
- [ ] Initial super-admin provisioning is controlled and documented.
- [ ] Admin accounts use verified email addresses.
- [ ] Multi-factor authentication is considered for admin accounts and documented.

### Evidence

Record test names, screenshots where appropriate, configuration references, and code locations.

## 6. Authorization Audit

- [ ] Every admin page has a server-side role check.
- [ ] Every admin mutation has an independent server-side permission check.
- [ ] Customer resources enforce ownership server-side.
- [ ] IDs supplied by the browser are treated as untrusted.
- [ ] Role values cannot be changed through profile updates.
- [ ] Customer cannot read another customer's order.
- [ ] Customer cannot read another customer's address.
- [ ] Admin-only exports are protected.
- [ ] Super-admin-only operations are explicitly separated.
- [ ] Disabled administrators lose access according to the documented session policy.
- [ ] Direct route-handler calls cannot bypass page-level guards.
- [ ] Tests cover horizontal and vertical privilege escalation.

## 7. Input Validation and Injection Audit

- [ ] All public and authenticated mutations use server-side schemas.
- [ ] Text fields have length limits.
- [ ] Numeric fields have sensible ranges.
- [ ] Enum-like values use allowlists.
- [ ] URLs are validated.
- [ ] Slugs are normalized and constrained.
- [ ] User-controlled HTML is not rendered.
- [ ] Rich-text support, if introduced, uses strict sanitization.
- [ ] Database queries use Prisma or parameterized statements.
- [ ] No raw SQL interpolates user input.
- [ ] Redirect destinations are allowlisted or local.
- [ ] Error messages do not include SQL or stack traces.
- [ ] Formula-injection protection is applied to CSV exports.

## 8. Cross-Site Scripting and Browser Security

- [ ] React escaping is not bypassed for untrusted content.
- [ ] `dangerouslySetInnerHTML` is absent or formally reviewed.
- [ ] Content Security Policy is configured and tested.
- [ ] Clickjacking protection is enabled through CSP `frame-ancestors` or equivalent.
- [ ] `X-Content-Type-Options: nosniff` is enabled.
- [ ] Referrer Policy is configured.
- [ ] Permissions Policy is configured where useful.
- [ ] Strict Transport Security is enabled after HTTPS is stable.
- [ ] External links using a new tab use safe rel attributes.
- [ ] Third-party scripts are minimized and approved.

## 9. CSRF and Request-Origin Audit

- [ ] State-changing operations use framework-safe server actions or protected route handlers.
- [ ] Sensitive public route handlers validate origin where appropriate.
- [ ] Cookie-authenticated custom APIs have explicit CSRF protection.
- [ ] GET requests do not perform state changes.
- [ ] Logout and destructive actions cannot be triggered unintentionally by cross-site requests.
- [ ] Payment webhooks use signature verification rather than browser-session CSRF mechanisms.

## 10. Rate Limiting and Abuse Prevention

- [ ] Login attempts are rate-limited.
- [ ] Signup is rate-limited.
- [ ] Password-reset requests are rate-limited.
- [ ] Verification resend is rate-limited.
- [ ] General contact submissions are rate-limited.
- [ ] Product enquiries are rate-limited.
- [ ] Payment initialization is rate-limited.
- [ ] Expensive catalogue search endpoints are protected from abuse.
- [ ] Limits use a production-compatible shared store, not process memory only.
- [ ] Abuse responses do not reveal excessive detail.
- [ ] Spam protection does not create an accessibility barrier.

## 11. Payment Security Audit — Mode B

- [ ] Secret payment keys are server-only.
- [ ] Only approved public keys appear in browser code.
- [ ] Order total is calculated on the server.
- [ ] Product price from the browser is ignored.
- [ ] Shipping cost from the browser is ignored.
- [ ] Currency is fixed or validated against server configuration.
- [ ] Pending order exists before provider initialization.
- [ ] Payment reference is unique.
- [ ] Webhook signature is validated using the raw request body when required.
- [ ] Provider transaction is verified server-to-server.
- [ ] Amount, currency, reference, and recipient/account are checked.
- [ ] A browser redirect alone cannot mark payment successful.
- [ ] Duplicate webhook processing is idempotent.
- [ ] Callback and webhook race conditions are handled.
- [ ] Inventory is deducted exactly once.
- [ ] Confirmation email is sent exactly once per successful transition.
- [ ] Failed/abandoned payments cannot create paid orders.
- [ ] Refund operations require an authorized actor and audit log.
- [ ] Card number, CVV, and sensitive authentication data are never stored.
- [ ] Provider payload logging is minimized and redacted.
- [ ] Test and live credentials cannot be mixed silently.
- [ ] Production webhook URL uses HTTPS.

### Mandatory Adversarial Tests

- [ ] Modify displayed price before payment initialization.
- [ ] Submit another product variant ID with an old price.
- [ ] Call the success page with a fake reference.
- [ ] Replay a valid webhook.
- [ ] Send a webhook with invalid signature.
- [ ] Send valid event for wrong amount.
- [ ] Send valid event for wrong currency.
- [ ] Deliver callback before webhook and webhook before callback.
- [ ] Submit concurrent purchases for the last unit.

## 12. Inventory Integrity Audit

- [ ] Stock is tracked per sellable variant.
- [ ] Quantity cannot become negative under normal operation.
- [ ] Stock-changing operations use transactions or safe conditional updates.
- [ ] Concurrent checkout behaviour is tested.
- [ ] Manual adjustment requires reason and actor.
- [ ] Inventory movements are append-only or otherwise tamper-evident to normal admins.
- [ ] Order cancellation stock restoration follows an explicit rule.
- [ ] Historical order items retain product/variant snapshots.
- [ ] Archived products remain available to historical orders.

## 13. File Upload and Media Audit

- [ ] Upload routes require appropriate authorization.
- [ ] Accepted file types are allowlisted.
- [ ] File signatures/MIME types are validated where practical.
- [ ] Maximum file size is enforced.
- [ ] Maximum image dimensions are enforced or transformed safely.
- [ ] Original filenames are not trusted.
- [ ] Storage public IDs are generated safely.
- [ ] Executable, SVG, and HTML uploads are rejected unless specifically and safely supported.
- [ ] Upload credentials remain server-only.
- [ ] Signed upload parameters expire.
- [ ] Deleted product media does not permit arbitrary-object deletion.
- [ ] Image metadata stripping is considered.
- [ ] Storage account permissions follow least privilege.

## 14. Email Security and Privacy Audit

- [ ] Email API key is server-only.
- [ ] Sender domain is verified.
- [ ] SPF, DKIM, and DMARC are configured or planned.
- [ ] Template variables are escaped.
- [ ] Reset and verification URLs use the production host.
- [ ] Tokens are not logged.
- [ ] Email failure does not corrupt order/payment state.
- [ ] Development and test environments cannot send to arbitrary real customers.
- [ ] Admin notification recipients are not user-controlled.
- [ ] Bounce and complaint handling is documented.
- [ ] Email logs avoid storing full sensitive message bodies.

## 15. API, Server Action, and Webhook Audit

- [ ] Every endpoint has a documented authentication requirement.
- [ ] Every state-changing endpoint validates input.
- [ ] Every privileged endpoint performs authorization.
- [ ] HTTP methods match the operation.
- [ ] Sensitive responses use no-store caching.
- [ ] Private data is not accidentally returned by Server Components or serialized props.
- [ ] Webhook endpoints verify authenticity.
- [ ] Webhook processing is idempotent.
- [ ] Error responses are safe and consistent.
- [ ] CORS is not broadly enabled without need.
- [ ] No internal debug endpoint is exposed in production.

## 16. Data Protection and Privacy Audit

- [ ] Only necessary personal data is collected.
- [ ] Privacy policy accurately reflects collected data and providers.
- [ ] Terms, returns, and delivery policies are published before commerce launch.
- [ ] Customer PII is not included in URLs.
- [ ] PII is not exposed to analytics.
- [ ] Logs redact unnecessary PII.
- [ ] Admin lists show only needed fields.
- [ ] Exports require authorization and are not permanently public.
- [ ] Data retention expectations are documented.
- [ ] Account deletion or privacy-request handling is documented.
- [ ] Production data is not copied into development without approved anonymization.
- [ ] Backups are encrypted by the provider or equivalent controls.

## 17. Secrets and Configuration Audit

- [ ] `.env` files are ignored.
- [ ] `.env.example` contains placeholders only.
- [ ] Repository history is scanned for secrets.
- [ ] CI logs do not print secrets.
- [ ] Browser bundles contain no server secrets.
- [ ] Only intended values use `NEXT_PUBLIC_`.
- [ ] Production and test keys are separated.
- [ ] Database credentials use least privilege where available.
- [ ] Payment webhook secret is distinct from API keys where supported.
- [ ] Secret rotation procedure is documented.
- [ ] Former staff access can be revoked.

## 18. Dependency and Supply-Chain Audit

- [ ] Lockfile is committed.
- [ ] Dependency audit is run before launch.
- [ ] Critical/high known vulnerabilities are resolved or assessed.
- [ ] Unused dependencies are removed.
- [ ] Packages come from trusted sources.
- [ ] Install scripts are reviewed when adding high-risk packages.
- [ ] Automated dependency updates are configured with review controls.
- [ ] CI uses pinned action versions or trusted versioning practices.
- [ ] Build output is reproducible from the committed lockfile.

Suggested checks:

```bash
pnpm audit
pnpm outdated
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use additional secret and static-analysis tools in CI where available.

## 19. Database Security and Integrity Audit

- [ ] Production database is not publicly exposed unnecessarily.
- [ ] TLS is used for database connections where supported.
- [ ] Application database role has appropriate permissions.
- [ ] Migrations are reviewed before production.
- [ ] Production uses migrations, not `prisma db push`.
- [ ] Unique constraints protect order numbers, payment references, and slugs.
- [ ] Foreign keys protect relationships.
- [ ] Financial records cannot be accidentally cascade-deleted.
- [ ] Backups are enabled.
- [ ] Restore process has been tested or provider restoration capability verified.
- [ ] Database errors are not shown to users.
- [ ] Sensitive data is excluded from seed files.

## 20. Logging, Monitoring, and Incident Readiness

- [ ] Application errors are captured in production.
- [ ] Authentication failures are monitored without logging passwords.
- [ ] Payment verification failures are visible to administrators/developers.
- [ ] Webhook failures can be retried or reconciled.
- [ ] Suspicious authorization failures are logged.
- [ ] Logs have retention and access controls.
- [ ] Secrets, tokens, card data, and unnecessary PII are redacted.
- [ ] Monitoring alerts reach an active owner.
- [ ] Incident contacts and escalation path are documented.
- [ ] A process exists to rotate secrets after suspected compromise.
- [ ] A process exists to disable checkout safely during provider incidents.

## 21. Deployment and Hosting Audit

- [ ] Production uses HTTPS only.
- [ ] Custom domain is verified.
- [ ] Preview deployments do not expose production data or secrets unnecessarily.
- [ ] Production environment variables are scoped correctly.
- [ ] Debug mode is disabled.
- [ ] Source maps and error reporting are configured intentionally.
- [ ] Admin and sensitive pages are noindex.
- [ ] Security headers are verified on deployed responses.
- [ ] Build and deployment logs contain no secrets.
- [ ] Rollback procedure exists.
- [ ] Database migration and deployment order is safe.
- [ ] Health checks and smoke tests are documented.

## 22. Business Logic Audit

- [ ] Draft products cannot be purchased or publicly accessed.
- [ ] Archived products cannot be newly purchased.
- [ ] Sale prices obey start/end rules if scheduling exists.
- [ ] Cart is revalidated at checkout.
- [ ] Order totals are immutable after successful payment except through authorized adjustments.
- [ ] Status transitions are constrained.
- [ ] Delivered orders cannot silently return to pending.
- [ ] Refund status cannot be set without a corresponding authorized process.
- [ ] Enquiry status changes are audited where needed.
- [ ] Admin actions cannot erase required historical evidence.

## 23. Accessibility as a Security and Abuse Control

- [ ] CAPTCHA or bot protection has an accessible alternative.
- [ ] Authentication does not depend solely on visual cues.
- [ ] Error messages are programmatically associated with fields.
- [ ] Focus is managed in dialogs and error states.
- [ ] Keyboard-only users can complete core flows.
- [ ] Reduced-motion preference is respected.

## 24. Pre-Launch Verification

### Automated

- [ ] Formatting check passes.
- [ ] Lint passes.
- [ ] Type check passes.
- [ ] Unit/integration tests pass.
- [ ] End-to-end tests pass.
- [ ] Production build passes.
- [ ] Dependency audit reviewed.
- [ ] Secret scan reviewed.

### Manual

- [ ] Test customer cannot access admin.
- [ ] Test admin cannot access super-admin-only controls.
- [ ] Direct URL access is tested.
- [ ] Form abuse and rate limits are tested.
- [ ] Error pages expose no internals.
- [ ] Security headers are checked on production.
- [ ] Upload restrictions are tested.
- [ ] Payment adversarial tests pass in Mode B.
- [ ] Backup status is confirmed.
- [ ] Production monitoring receives a controlled test error.

## 25. Recurring Audit Schedule

Repeat the relevant audit:

- before initial launch;
- after authentication or authorization changes;
- after payment-provider changes;
- after upload/storage changes;
- after major dependency upgrades;
- after a security incident;
- at least quarterly during active maintenance;
- before major promotional campaigns expected to increase traffic.

## 26. Launch Sign-Off

Record:

- selected launch mode;
- audit date;
- auditor/reviewer;
- application commit SHA;
- deployment identifier;
- open medium/low findings;
- accepted risks and owners;
- backup confirmation;
- monitoring confirmation;
- final approval.

No person should sign off based only on the checklist being ticked. Evidence and actual testing are required.
