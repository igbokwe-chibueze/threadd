# THREADD backup, recovery, and rollback runbook

This runbook applies separately to the portfolio demo and every customer
deployment. Never restore one environment's backup into another environment
unless an approved, documented anonymization process has removed all customer
and credential data.

## Required ownership

Before launch, the deployment owner records these values in the hosting
provider's encrypted environment:

- `MONITORING_OWNER`: the active person or team receiving production alerts;
- `BACKUP_PROVIDER`: the managed PostgreSQL backup service;
- `BACKUP_RETENTION_DAYS`: the configured retention period approved for that
  merchant and environment;
- `LAST_RESTORE_TEST_AT`: ISO timestamp of the latest successful isolated
  restore exercise.

`npm run deployment:check` validates that the operational record exists along
with the application's HTTPS, authentication, database TLS, demo-isolation,
email, and storage configuration. The script does not prove provider settings;
screenshots or provider audit records must accompany release sign-off.

## Backup requirements

- Use provider-managed encrypted PostgreSQL backups with point-in-time recovery
  where available.
- Restrict backup and restore access to the deployment owner and specifically
  authorized operators.
- Keep portfolio-demo and customer backup projects, credentials, and encryption
  boundaries separate.
- Include Prisma Postgres and Cloudinary catalogue media in recovery planning.
  Restoring only one can leave product records pointing at unavailable media.
- Never place production database dumps in this repository, developer shared
  folders, issue trackers, CI artifacts, or the public demo.
- Retention is a merchant/legal decision. Record the approved period rather
  than silently choosing one in application code.

## Controlled restore exercise

1. Create a new isolated recovery database with no public application attached.
2. Restore the selected provider snapshot into that database.
3. Create a temporary least-privilege application credential.
4. Point a temporary, access-restricted deployment at the restored database.
5. Run `npm run db:validate` and `npx prisma migrate status`; do not use
   `prisma db push`.
6. Run the health probe, sign-in, catalogue, order-history, inventory-ledger,
   and payment-reconciliation smoke checks without initiating live payments or
   outbound email.
7. Confirm order totals, payment references, inventory movements, audit logs,
   and media references are internally consistent.
8. Record the snapshot time, restore start/end time, operator, result, and safe
   evidence. Never record credentials or customer record contents.
9. Destroy the temporary deployment, database, credential, and restored media
   after the evidence is approved.
10. Set `LAST_RESTORE_TEST_AT` to the successful exercise timestamp.

## Deployment and rollback order

1. Take or confirm a recoverable snapshot before a migration.
2. Run `npm run deployment:check`.
3. Review migrations, then apply them with `npm run db:deploy`.
4. Deploy the application version built from the same reviewed commit.
5. Check `/api/health`, then exercise authentication, catalogue, checkout in
   the environment's permitted payment mode, webhook reconciliation, and demo
   reset where applicable.
6. If application code fails but the migration remains compatible, roll the
   application back to the previous saved deployment version.
7. Do not automatically reverse a data migration. Restore or apply a reviewed
   forward repair only after assessing orders, payments, inventory, and audit
   records.
8. Disable checkout at the hosting/routing layer during a payment or integrity
   incident while preserving order/account access and webhook evidence.

## Recovery failure and escalation

- Treat an unavailable or unverified backup as a release blocker.
- Escalate suspected data loss or credential compromise to the monitoring owner
  and provider support contacts immediately.
- Preserve audit evidence and rotate affected credentials using
  `SECURITY_OPERATIONS.md`.
- Do not copy production data into development to diagnose an incident.
- Record recovery time and recovery-point results against the merchant's
  approved operational expectations after every exercise or real incident.
