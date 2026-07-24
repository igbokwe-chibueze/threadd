# THREADD Phase 11 Security Evidence

Last updated: 24 July 2026

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
- Remediation: Use `sslmode=verify-full` in deployment connection strings before
  upgrading to `pg` 9, and verify provider compatibility.
- Owner: THREADD project
- Status: Open; dependency-upgrade watch item
- Verification evidence: warning reproduced during production build and E2E.

## Remaining evidence for this audit area

- Inspect real production response headers over HTTPS.
- Confirm the hosting platform does not overwrite or duplicate CSP/HSTS.
- Exercise authentication origin rejection and cookie flags in the deployed
  browser.
- Decide whether the nonce/dynamic-rendering tradeoff is justified after
  deployed performance measurement.
