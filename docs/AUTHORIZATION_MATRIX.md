# THREADD Authorization Matrix

Last reviewed: 24 July 2026

This document records the server-side authorization requirement at each current
application boundary. It is an audit aid, not a substitute for code-level
checks. Any new page, route handler, or Server Action must be added here during
review.

## Role model

| Role | Public/storefront | Own account and orders | Existing admin modules | Administrator management |
| --- | --- | --- | --- | --- |
| Guest | Yes | Guest order only through its private cart token | No | No |
| `CUSTOMER` | Yes | Yes, ownership-scoped | No | No |
| `ADMIN` | Yes | Yes | Yes | No |
| `SUPER_ADMIN` | Yes | Yes | Yes | Reserved capability; no management UI exists yet |

Roles are read from the database-backed Better Auth session. Browser-provided
role or user identifiers are never accepted as authority.

## Admin pages

All page routes below `/admin` cross the shared response guard in
`app/admin/layout.tsx`. The guard redirects unauthenticated visitors to
`/sign-in` and authenticated non-admin users to `/account`. Because Next.js can
render layouts and pages in parallel, every page also authorizes before its own
private query; the layout is not treated as a data-access guard.

Existing pages retain a second page-level role check close to their private
queries. This is intentional defence in depth and ensures a fresh session check
when Next.js preserves layouts during client navigation.

| Page boundary | Additional page check | Data exposed after authorization |
| --- | --- | --- |
| `/admin` | `getCurrentSession` + `canAccessAdmin` | Administrator identity and module links |
| `/admin/catalogue` | `requireAdminPageSession` | Full product catalogue |
| `/admin/catalogue/new` | `requireAdminPageSession` | Categories and collections |
| `/admin/catalogue/[id]/edit` | `requireAdminPageSession` | Product, image, category, collection, and variant details |
| `/admin/inventory` | `getCurrentSession` + `canAccessAdmin` | Stock quantities and movement ledger |
| `/admin/enquiries` | `getCurrentSession` + `canAccessAdmin` | Customer enquiries and contact details |
| `/admin/enquiries/[id]` | `getCurrentSession` + `canAccessAdmin` | Enquiry history and internal notes |
| `/admin/orders` | `getCurrentSession` + `canAccessAdmin` | Customer orders and fulfilment state |
| `/admin/orders/[id]` | `getCurrentSession` + `canAccessAdmin` | Order contact, address, payment, return, and refund details |
| `/admin/shipping` | `getCurrentSession` + `canAccessAdmin` | Shipping-zone configuration |
| `/admin/outbox` | `getCurrentSession` + `canAccessAdmin` | Administrator Demo Outbox |

## Privileged Server Actions

Page authorization is never treated as authorization for a mutation. Each
privileged Server Action independently calls `requireRole(["ADMIN",
"SUPER_ADMIN"])` before reading submitted identifiers or changing data.

| Feature | Privileged operations |
| --- | --- |
| Catalogue | Create, edit, publish, and archive products |
| Inventory | Adjust stock and update low-stock thresholds |
| Enquiries | Add internal notes and change enquiry status |
| Orders | Advance fulfilment, review cancellation, process returns, and initiate refunds |
| Shipping | Update shipping-zone fees |

These actions validate their input with Zod and record the authenticated actor
where the domain has an audit or movement record.

## Customer-owned mutations and reads

| Boundary | Authorization rule |
| --- | --- |
| Profile update | `requireSession`; user ID comes only from the session |
| Address create/default/delete | `requireSession`; every existing address query includes the session user ID |
| Customer order view | Order ID must match the session user ID or the private hashed guest-cart token |
| Cancellation and return requests | The shared ownership-scoped order query runs before mutation |
| Cart merge | Requires a session; destination user ID comes only from the session |
| Personal outbox read/download | Message recipient user ID or browser-bound preview token must match |

## Route handlers and third-party boundaries

Layouts do not run as authorization for route handlers. Each handler below has
its own boundary:

| Route | Requirement |
| --- | --- |
| `/admin/outbox/[id]/download` | Admin role; returns `404` rather than revealing inaccessible message existence |
| `/account/outbox/[id]/download` | Recipient session or matching browser-bound preview token |
| `/api/cart/merge` | Authenticated session |
| `/api/outbox/read` | Authenticated session; update is recipient-scoped |
| `/api/demo/reset` | Bearer secret plus explicit demo deployment, exact database target, test payments, local email, and OPay-disabled checks |
| `/api/payments/webhook` | Paystack signature over the raw request body |
| `/api/payments/opay/webhook` | OPay signature verification and event fingerprinting |
| `/api/payments/callback` | Public callback; provider is verified server-to-server before state changes |
| `/api/demo/request-password-reset` | Public, schema-validated, non-enumerating response; rate-limit review remains separate |
| `/api/auth/[...all]` | Better Auth owns authentication and origin/CSRF enforcement |

## Verification

- `tests/unit/permissions.test.ts` verifies the role matrix.
- `tests/e2e/foundation.spec.ts` verifies that a customer is redirected from
  every current top-level admin module and that an administrator can access the
  admin area.
- Feature E2E tests exercise administrator catalogue, inventory, enquiry, and
  order boundaries through normal workflows.

## Maintenance rule

When adding a protected surface:

1. place admin pages under the guarded `/admin` layout;
2. keep a page/data-layer authorization check close to private queries;
3. independently authorize every mutation and route handler;
4. derive actor and owner identifiers from the server session;
5. add horizontal or vertical privilege-escalation coverage;
6. update this matrix with the new boundary and evidence.
