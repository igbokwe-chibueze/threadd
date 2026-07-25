# THREADD Portfolio Release Checklist

Last reviewed: 25 July 2026

This is the Phase 12 evidence record for the isolated public portfolio demo.
Customer release requirements are intentionally stricter and are documented in
`CUSTOMER_ADAPTATION.md`.

## Infrastructure and operations

| Check | Status | Evidence or remaining action |
| --- | --- | --- |
| Public HTTPS deployment | Passed | `https://threadd-smoky.vercel.app`; deployed home, shop, sign-in, product, and health routes returned 200. |
| Isolated demo database | Passed | Dedicated Prisma Postgres datasource; runtime and reset URLs are equality-guarded. |
| Isolated media | Passed | Dedicated Cloudinary folder; upload, replacement, deletion, and reset cleanup were verified in Phase 11. |
| Hosted environment preflight | Passed | Vercel production build for commit `74bcf2d` validated HTTPS/auth/database isolation, monitoring ownership, and portfolio recovery policy. The prebuild gate remains active for every production build. |
| Database migrations | Passed | Committed migrations use `prisma migrate deploy`; the current release adds no schema migration. |
| Canonical seed and demo accounts | Passed | Protected manual reset restored the canonical state; Serein Knot Gown and its Black, Ivory, and Sage variants are live. |
| Six-hour reset | Passed | GitHub Actions run `30152744808`; least-privilege scheduled workflow and encrypted reset secret. |
| Backup/recovery | Portfolio risk accepted | Prisma Free has no automated backups. This disposable demo is recreated from migrations, canonical seed code, and repository images. The exception cannot be used for customer data. |
| Monitoring owner and alert path | Passed for portfolio | `igbokwe-chibueze`; GitHub workflow failure notifications plus Vercel runtime logs. |
| Controlled monitoring event | Passed | The manually dispatched reset emitted one fixed `portfolio_monitoring_test` event at `2026-07-25T16:52:37.808Z`; Vercel runtime logs contained no visitor data or credentials. |

## Application release

| Check | Status | Evidence or remaining action |
| --- | --- | --- |
| Production build | Passed | Vercel reports success for final contrast revision `45f7a31`; deployed shop, sitemap, and health routes return 200. |
| Quality and browser journeys | Passed for latest published revision | GitHub Quality/E2E and local suite: formatting, lint, strict types, 72 unit tests, 21 Playwright tests, secret scan, and production build. Re-run after the current release fixes are published. |
| Public smoke tests | Passed | Home, shop, Serein product, sitemap, robots, and health returned 200. |
| Demo banner and credentials | Passed | Demo banner is present in portfolio mode; seeded convenience accounts use normal Better Auth credentials and server authorization. |
| Outbound email safety | Passed | Demo mode is locked to the private Demo Outbox; arbitrary outbound delivery is disabled. |
| Live payment prevention | Passed | Portfolio policy requires Paystack test keys and disables OPay. |
| Payment behaviour | Passed in automated/test flows | Successful and failed test payments, amount/reference checks, duplicate/delayed events, inventory idempotency, and refund rules are covered by tests and prior hosted Paystack test checkout. |
| Paystack webhook registration/retry receipt | Pending provider evidence | Confirm `/api/payments/webhook` in the Paystack test dashboard and retain a successful signed delivery/retry record. |
| Security headers and reset authorization | Passed | CSP, HSTS, MIME, referrer, and permissions headers observed; unauthenticated reset returned 403. |
| No real customer data | Passed | Canonical state contains fictional demo records only and resets visitor changes. |

## Search, accessibility, and performance

| Check | Status | Evidence or remaining action |
| --- | --- | --- |
| Robots | Passed | Deployed `robots.txt` returns 200, references the canonical sitemap, and blocks private/admin areas. |
| Dynamic sitemap | Passed | The deployed sitemap is dynamic, uses HTTPS, and contains `/products/serein-knot-gown` after canonical reset. |
| Search Console | Pending owner setup | Add the free Google verification token to Vercel, verify the final origin, and submit `/sitemap.xml`. |
| Lighthouse baseline | Passed | Six post-deployment measurements are recorded in `STOREFRONT_QUALITY.md`; layout shift and landmark issues are resolved. Final focused `/shop` accessibility scored 100 on mobile and desktop after the contrast revision. |

## Documentation

| Check | Status | Evidence |
| --- | --- | --- |
| Local setup and commands | Passed | `README.md` and `.env.example`. |
| Deployment and reset | Passed | `VERCEL_DEPLOYMENT.md` and `DEMO_DEPLOYMENT.md`. |
| Recovery and security operations | Passed | `RECOVERY_RUNBOOK.md`, `SECURITY_OPERATIONS.md`, and `SECURITY_EVIDENCE.md`. |
| Customer adaptation | Passed | `CUSTOMER_ADAPTATION.md`. |
| Portfolio case study | Passed | `PORTFOLIO_CASE_STUDY.md`. |

## Final owner-dependent actions

Phase 12 cannot be signed off until:

1. Google Search Console verification and sitemap submission are completed;
2. Paystack test webhook registration/delivery evidence is confirmed.
