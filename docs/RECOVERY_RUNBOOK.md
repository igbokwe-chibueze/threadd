# THREADD backup, recovery, and rollback runbook

This runbook applies separately to the portfolio demo and every customer
deployment. Never restore one environment's backup into another environment
unless an approved, documented anonymization process has removed all customer
and credential data.

## Required ownership

Before launch, the deployment owner records these values in the hosting
provider's encrypted environment:

- `MONITORING_OWNER`: the active person or team receiving production alerts;
- `RECOVERY_STRATEGY`: `canonical_reseed` for the disposable portfolio demo or
  `managed_backup` for a customer deployment.

Managed-backup deployments also record:

- `BACKUP_PROVIDER`: the managed PostgreSQL backup service;
- `BACKUP_RETENTION_DAYS`: the approved retention period;
- `LAST_RESTORE_TEST_AT`: ISO timestamp of the latest successful restore test.

`npm run deployment:check` validates that the operational record exists along
with the application's HTTPS, authentication, database TLS, demo-isolation,
email, and storage configuration. The script does not prove provider settings;
screenshots or provider audit records must accompany release sign-off.

## Free portfolio-demo recovery

The Prisma Free plan does not provide automated snapshots. THREADD explicitly
accepts this limitation only for the public portfolio demo because visitor
accounts, orders, catalogue changes, and uploads are disclosed as disposable
and reset every six hours.

The recoverable source of truth is:

- committed Prisma migrations;
- the idempotent canonical seed;
- repository-owned seed images;
- encrypted deployment configuration recorded outside the repository.

If the demo database is lost, create another isolated free database, apply
`npm run db:deploy`, run `npm exec prisma db seed`, update Vercel's identical
`DATABASE_URL` and `DEMO_DATABASE_URL`, redeploy, and run health, sign-in,
catalogue, checkout, media, and reset checks. Visitor-created data and
Cloudinary uploads are intentionally not recovered.

This is disaster recreation, not a database backup. It must never be selected
for a customer deployment.

## Backup requirements

These requirements apply to `managed_backup` customer deployments:

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

This exercise applies to `managed_backup` deployments:

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

- Treat an unavailable or unverified backup as a customer-release blocker.
- For the portfolio demo, treat missing migrations, seed assets, or a failed
  recreation check as the equivalent release blocker.
- Escalate suspected data loss or credential compromise to the monitoring owner
  and provider support contacts immediately.
- Preserve audit evidence and rotate affected credentials using
  `SECURITY_OPERATIONS.md`.
- Do not copy production data into development to diagnose an incident.
- Record recovery time and recovery-point results against the merchant's
  approved operational expectations after every exercise or real incident.
