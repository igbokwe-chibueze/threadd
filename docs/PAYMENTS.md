# THREADD payment providers

THREADD payment orchestration is provider-independent. Checkout accepts a
validated provider identifier, resolves it through the server-only registry,
and stores the selected provider with each payment. Callbacks and refunds use
that stored provider rather than trusting a browser-supplied provider name.

## Available providers

### Paystack

Paystack appears when `PAYSTACK_SECRET_KEY` contains a non-placeholder test or
live secret. The browser is redirected to Paystack's hosted checkout. Payment
success is accepted only after server-to-server verification.

Paystack webhooks follow the same rule. THREADD first authenticates the exact
raw request body with Paystack's SHA-512 HMAC, then independently queries
Paystack using the database-owned reference. Only that verification response
can drive the shared reference, amount, currency, stock, and order-state
transition. Stored webhook evidence is limited to correlation fields and does
not retain customer or payment-authorization metadata.

Provider amounts are converted from database decimals to integer kobo using
exact decimal-string arithmetic. JavaScript floating-point multiplication is
not used at this boundary.

### OPay

OPay appears only when all of the following values are present:

```env
OPAY_ENABLED=true
OPAY_ENVIRONMENT=test
OPAY_MERCHANT_ID=...
OPAY_PUBLIC_KEY=...
OPAY_SECRET_KEY=...
```

`OPAY_SECRET_KEY` is OPay's private merchant key. It is used only on the server
for HMAC request and callback signatures. Test mode uses OPay's test Cashier
API; `OPAY_ENVIRONMENT=live` selects the live API.

Keep `OPAY_ENABLED=false` until the credential set has passed a country,
signature, hosted-checkout, callback, and refund test. This prevents a
configured but unusable gateway from being advertised to customers.

Configure the OPay callback URL as:

```text
https://your-domain.example/api/payments/opay/webhook
```

OPay callbacks are signature checked and then cross-verified through OPay's
payment-status API before an order can become paid.

### Demo adapter

The local demo adapter is available only when neither Paystack nor OPay is
configured. It never moves money.

## Refund idempotency

THREADD creates the unique refund claim before contacting a provider. This
ordering prevents two concurrent administrator requests from both issuing a
refund before database uniqueness is evaluated. Ambiguous failed or interrupted
provider requests are retained for manual reconciliation and are never retried
automatically.

## Adding another provider

1. Add its identifier to `PaymentProviderName`.
2. Implement the `PaymentProvider` interface.
3. Register its server-only factory and public label in `provider.ts`.
4. Add a signed webhook route if the provider supports webhooks.
5. Add provider signature, amount, currency, duplicate-event, callback-order,
   and refund tests.

Order creation, inventory deduction, confirmation messages, cancellations, and
returns should not contain provider-specific branching.
