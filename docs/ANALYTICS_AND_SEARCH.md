# Analytics and Search

## Search Console

Set `APP_URL` to the final HTTPS origin and add the token supplied by Google:

```dotenv
GOOGLE_SITE_VERIFICATION=your-verification-token
```

THREADD emits the verification metadata, canonical URLs, `robots.txt`, a
database-backed `sitemap.xml`, and Organization, WebSite, and Product JSON-LD.
After deployment, verify the property and submit:

```text
https://your-domain.example/sitemap.xml
```

Search Console activation and sitemap submission require the final deployed
domain and are completed during release.

## Approved analytics boundary

No analytics provider is installed in the portfolio demo. Therefore THREADD
does not currently set analytics cookies and does not need an analytics-consent
banner. The permanent demo-status bar is unrelated to cookie consent.

If privacy-friendly analytics is added later, only these events are approved:

- `page_view`: route pattern and referrer domain;
- `product_view`: product ID and category ID;
- `catalogue_filter`: filter names, never free-text search contents;
- `add_to_cart`: product/variant ID, quantity, and currency value;
- `begin_checkout`: item count and currency value;
- `purchase`: internal order ID, currency value, and payment provider name.

Never send names, email addresses, phone numbers, passwords, tokens, complete
search queries, street addresses, enquiry text, payment references, card/bank
details, or Demo Outbox contents. Analytics failures must never block checkout.

Any future provider that uses non-essential cookies requires consent controls
before its browser script loads. Provider selection and the applicable Nigerian
and customer-market privacy requirements must be reviewed before activation.
