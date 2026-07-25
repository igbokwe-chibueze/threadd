# THREADD Vercel deployment

The workspace is linked to:

- Vercel scope: `chibueze-igbokwes-projects`
- Vercel project: `threadd`
- Git repository: `https://github.com/igbokwe-chibueze/threadd`

The portfolio demo is deployed at:

- Production origin: `https://threadd-smoky.vercel.app`
- Deployment verified: 25 July 2026

The repository-local `.vercel/project.json` link is ignored by Git and contains
project identifiers, not application secrets.

## Configuration already applied

The Vercel Production environment contains these non-secret settings:

```text
APP_ENV
DEPLOYMENT_MODE
DEMO_MODE
STORE_MODE
EMAIL_PROVIDER
MEDIA_STORAGE_PROVIDER
CLOUDINARY_FOLDER
OPAY_ENABLED
```

It also contains the final `APP_URL`/`BETTER_AUTH_URL`, existing isolated
Prisma Postgres demo datasource, Cloudinary credentials, Paystack test keys,
administrator notification address, and newly generated
`BETTER_AUTH_SECRET`, `DEMO_RESET_SECRET`, and `CRON_SECRET` values. Reset and
cron received the same generated value. Sensitive Vercel variables are
intentionally non-readable after storage.

## Configuration still required

The configured Prisma Postgres project is intentionally the public,
resettable portfolio database. `DATABASE_URL` and `DEMO_DATABASE_URL` contain
the same provider-issued connection string so the reset safety guard cannot
target a different datasource. The canonical seeded records are retained.

Local migration/admin tooling retains Prisma's direct `db.prisma.io` endpoint.
Vercel application and reset traffic use the provider-recommended
`pooled.db.prisma.io` endpoint with one local `pg` connection per function.
Both provider hosts specify `sslmode=require` and failed when rewritten to
`verify-full`; THREADD permits that mode only for those exact managed
hostnames. All other production PostgreSQL hosts still require `verify-full`.

Monitoring ownership, backup provider/retention, and successful restore
evidence remain required before Phase 11/12 release sign-off.

## Build and migration order

`npm install` regenerates the Prisma client through the repository's
`postinstall` command. Vercel builds with `next build`; schema migrations remain
an explicit operator step:

```text
npm run deployment:check
npm run db:deploy
npm run build
```

Never add `prisma db push` to Vercel's build command. A failed build must not
silently mutate the production database.

## Cron scheduling

The reset handler supports:

- authenticated `POST` for an external scheduler;
- authenticated `GET` for Vercel Cron.

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`. THREADD uses
the identical `DEMO_RESET_SECRET`, so both methods pass the same application
safety policy.

The required six-hour expression is `0 */6 * * *`. Vercel Hobby currently
permits daily cron only, so the repository does not activate an invalid
schedule in `vercel.json`. After confirming a Pro plan, add:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/demo/reset",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

The current Hobby-compatible implementation is
`.github/workflows/demo-reset.yml`, scheduled at minute 17 every six hours.
GitHub contains the matching encrypted `THREADD_DEMO_RESET_SECRET`, but
scheduled execution begins only after the workflow is explicitly published to
the default branch.

Official references:

- [Vercel CLI deployment workflow](https://vercel.com/docs/projects/deploy-from-cli)
- [Vercel environment variables](https://vercel.com/docs/cli/env)
- [Vercel Cron authentication and plan limits](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
