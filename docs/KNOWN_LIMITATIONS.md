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
database readiness probe, requires strict production database TLS (with an
exact-host exception for Prisma's provider-issued managed URL), and includes an
executable deployment preflight. Source review cannot select or prove a
hosting monitoring sink, log access/retention, alert delivery, database backup
retention, media recovery, or a successful isolated restore.

The six-hour GitHub Actions reset workflow and encrypted repository secret are
ready, but the workflow must be explicitly published before GitHub schedules
it.

Those items remain release-blocking until the deployment owner records provider
evidence and passes the controlled procedures in `RECOVERY_RUNBOOK.md`.
