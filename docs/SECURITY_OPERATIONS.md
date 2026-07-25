# THREADD security operations

This runbook covers controls that require an operator rather than application
code. It applies separately to the portfolio demo and each future customer
deployment. Those environments must never share credentials or data.

## Secret storage

- Store deployment secrets only in the hosting provider's encrypted environment
  configuration.
- Keep `.env.local` on the developer machine and never commit it.
- Scope preview, demo, and customer-production credentials separately.
- Grant deployment access only to people who actively maintain that
  environment.
- Never paste credentials into issues, pull requests, screenshots, chat, test
  output, or application logs.
- Only the Paystack public key may use a `NEXT_PUBLIC_` prefix. Database,
  authentication, reset, email, storage, OPay, and Paystack secret keys remain
  server-only.

## Rotation procedure

For any suspected exposure, rotate first and investigate second:

1. Identify the affected environment and provider without copying the secret
   into the incident record.
2. Generate a replacement in the provider dashboard or secret manager.
3. Update the affected deployment's encrypted environment configuration.
4. Redeploy and run the authentication, checkout, webhook, email, and reset
   smoke tests relevant to that credential.
5. Revoke the former credential only after the replacement deployment is
   healthy, unless active abuse requires immediate revocation.
6. Revoke sessions when the Better Auth secret or administrative access may
   have been exposed.
7. Record the time, owner, affected system, and verification result—never the
   old or new secret value.

Credential-specific notes:

- `BETTER_AUTH_SECRET`: replace it and revoke existing database sessions. All
  users must sign in again.
- `DATABASE_URL`: create/rotate the least-privilege application database
  credential, update the deployment, verify migrations/connectivity, then
  revoke the previous database role/password.
- `PAYSTACK_SECRET_KEY`: rotate in Paystack, update the webhook/deployment, and
  verify a test transaction and signed webhook before revocation.
- `OPAY_SECRET_KEY` and related merchant keys: keep OPay disabled until the
  replacement credentials pass signature, checkout, callback, and refund tests.
- `DEMO_RESET_SECRET`: rotate the deployment value and scheduler bearer header
  together, then invoke one controlled reset.
- Email and managed-storage credentials: rotate in their provider, retain
  least-privilege permissions, and verify delivery/upload without exposing
  customer data.

## Staff access removal

When an administrator leaves:

1. Change their role to `CUSTOMER` or disable/remove the account through an
   owner-controlled administrative procedure.
2. Delete all sessions belonging to that user so access ends immediately.
3. Remove hosting, database, payment, email, storage, source-control, monitoring,
   and domain access separately; application role removal does not revoke those
   systems.
4. Rotate any shared credential the person could access.
5. Retain the audit record of the removal without retaining unnecessary personal
   information.

## Dependency review

- Dependabot opens weekly, review-controlled npm and GitHub Actions updates.
- GitHub Actions remain pinned to immutable commit SHAs.
- Run `npm audit`, `npm audit --omit=dev`, and `npm audit signatures` before
  release.
- Never use `npm audit fix --force` without a deliberate framework migration.
- Review every package with an install script. Exact approved package versions
  are recorded under `allowScripts` in `package.json`; version changes require
  renewed review.
- Re-run formatting, lint, type checking, tests, E2E, and production build after
  dependency changes.

## Incident and recovery ownership

The deployment owner must configure an active monitoring recipient, database
backup retention, restoration access, and provider support contacts before
launch. Phase 12 must record those provider-specific details and perform a
controlled restore test; local source review cannot verify them.
