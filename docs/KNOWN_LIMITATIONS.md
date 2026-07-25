# Known Limitations

## Open dependency advisories

Reviewed: 25 July 2026

The current audit reports Next.js runtime advisory chains through version
16.2.11:

- three high-severity PostCSS CSS-stringification/source-map advisories;
- four high-severity Sharp/libvips image-processing advisories.

Next.js 16.2.11 remains the current compatible stable release reported by npm.
The forced remediation proposes an incompatible downgrade to Next.js 9.3.3 and
must not be used.

Current treatment:

- CSS inputs are repository-controlled build assets, never request input;
- catalogue uploads are administrator-only and now enforce binary format, byte,
  dimension, and pixel limits before the Next.js image pipeline sees them;
- Cloudinary now provides the managed transformation/storage adapter; encrypted
  credentials, direct provider probing, protected browser replacement, and
  full demo-reset media cleanup are verified;
- review the advisories when a newer stable Next.js release is published;
- do not run `npm audit fix --force`.

The audit also lists Prisma CLI (`find-my-way` high and `valibot` moderate)
through optional peer lockfile resolution. Prisma and its chain are marked
`devOptional`, are absent from `npm ls --omit=dev`, and are not part of the
runtime deployment dependency list. A separate high `brace-expansion` advisory
is development-only through ESLint. These toolchain advisories remain monitored
and must be reassessed before release.

Registry signatures verified for all 608 installed packages. Exact reviewed
install-script versions are recorded in `package.json`; version changes require
renewed approval.

## Deployment-dependent security evidence

The application now emits privacy-safe structured events, exposes a minimal
database readiness probe, requires strict production database TLS (with exact
host exceptions for Prisma's provider-issued managed URLs), and includes an
executable deployment preflight.

The Prisma Free plan provides no automated database backups. This is explicitly
accepted only for the disposable portfolio demo: recovery recreates canonical
state from migrations, seed code, and repository assets, while visitor-created
data is intentionally lost. Customer mode still fails preflight without managed
backup retention and successful restore evidence.

Source review still cannot prove hosting log access/retention, alert delivery,
or customer-deployment backup and media recovery controls.

For the free portfolio demo, the owner accepts GitHub's six-hour workflow
failure notification as the availability/reset alert and Vercel's included
runtime logs as the diagnostic record. There is no paid continuous monitoring,
guaranteed log retention, or recovery of visitor-created data. Those
limitations remain unacceptable for customer mode.

The six-hour GitHub Actions reset workflow and encrypted repository secret are
active. Manual run `30152744808` succeeded on 25 July 2026; subsequent
scheduled-run history should remain part of routine operational review.

Those items remain release-blocking until the deployment owner records provider
evidence and passes the controlled procedures in `RECOVERY_RUNBOOK.md`.
