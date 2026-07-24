# THREADD Demo Deployment

THREADD uses the same application code for portfolio and customer deployments,
but they must never share infrastructure.

## Portfolio demo

Create a dedicated PostgreSQL database and a dedicated media location. Configure:

```dotenv
DEPLOYMENT_MODE=portfolio_demo
DEMO_MODE=true
DATABASE_URL=postgresql://.../threadd_demo
DEMO_DATABASE_URL=postgresql://.../threadd_demo
DEMO_RESET_SECRET=<at-least-32-random-characters>
EMAIL_PROVIDER=demo_outbox
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
OPAY_ENABLED=false
```

`DEMO_DATABASE_URL` must exactly match `DATABASE_URL`. This deliberate
duplication prevents a reset from following an accidentally changed database
connection. The reset is also refused unless the deployment is explicitly a
portfolio demo, email stays inside the Demo Outbox, Paystack uses a test secret,
OPay is disabled, and the bearer secret is valid.

Configure the hosting scheduler to send a `POST` request every six hours to:

```text
/api/demo/reset
```

with:

```text
Authorization: Bearer <DEMO_RESET_SECRET>
```

Suggested cron expression: `0 */6 * * *`.

The reset takes a PostgreSQL transaction-scoped advisory lock, truncates and
reseeds in one serializable transaction, and then removes files recorded under
the isolated `public/uploads/catalogue` demo prefix. Concurrent resets are
refused. Visitors see either the previous committed dataset or the completed
canonical dataset, never the transaction halfway through.

## Customer deployment

Provision a fresh database, media store, authentication secret, email account,
and live payment credentials. Never copy the portfolio database or its secrets.

```dotenv
DEPLOYMENT_MODE=customer
DEMO_MODE=false
DEMO_DATABASE_URL=
EMAIL_PROVIDER=resend
```

Do not configure the demo reset schedule or `DEMO_RESET_SECRET`. Bootstrap the
customer's first super-administrator using the documented one-time CLI workflow,
then disable bootstrap access again.

## Canonical demo state

`npm exec prisma db seed` is idempotent and restores:

- the published demo administrator and customer accounts;
- a default customer address;
- the unisex catalogue, images, collections, variants, and stock ledger;
- Nigeria-wide shipping zones;
- sample customer records and enquiries;
- a completed Paystack test-mode order with its payment and status history.

The public reset endpoint performs a full replacement and is the mechanism that
removes visitor-created records.
