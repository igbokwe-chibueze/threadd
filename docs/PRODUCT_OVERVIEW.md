# Xtamaliy Clothing Website — Product Overview

## 1. Document Purpose

This document defines the product to be built for Xtamaliy, a clothing brand that needs a modern, mobile-first website for presenting products, managing inventory, receiving customer enquiries, and optionally processing online payments.

It is written as the primary product reference for Codex and any developer working on the project. Where a requirement is unclear, implementation must follow this document and record assumptions rather than silently inventing business rules.

## 2. Product Vision

Build a fast, visually polished clothing website that allows Xtamaliy to:

- display its clothing collections professionally;
- allow customers to find products quickly;
- manage products, categories, images, prices, and stock from an admin dashboard;
- receive and track customer enquiries;
- support online checkout when the full e-commerce option is enabled;
- send reliable account, enquiry, and order emails;
- operate without requiring technical knowledge from the client.

The experience should feel premium and fashion-focused without being heavy, slow, or difficult to use.

## 3. Delivery Modes

The application must support two commercial modes. The selected mode must be controlled through configuration, not through duplicated codebases.

### Mode A — Catalogue and Contact-to-Order

Customers can:

- browse products;
- search and filter products;
- view product details, price, available variants, and stock status;
- submit an enquiry;
- contact the business through WhatsApp, phone, or email;
- share a product link.

The website does not collect payment in this mode.

Admin users can:

- manage products, variants, stock, categories, and images;
- view and update customer enquiries;
- mark an enquiry as new, contacted, converted, closed, or spam;
- export enquiries where required.

### Mode B — Full E-Commerce

Mode B includes every Mode A feature and adds:

- customer accounts;
- shopping cart;
- secure checkout;
- online payment;
- order records;
- payment status tracking;
- order status tracking;
- customer order history;
- automated transactional emails;
- admin order management.

The application must use one primary Nigerian payment gateway for card and local payment methods. Paystack is the recommended default. Additional providers such as Flutterwave, PayPal, or OPay must only be enabled after merchant eligibility, API availability, settlement terms, and credentials have been confirmed.

## 4. Target Users

### Store Customer

A visitor who wants to browse clothing, inspect product details, enquire about an item, or make a purchase.

### Registered Customer

A customer with an account who can manage profile details, saved addresses, and order history. This role is required only when Mode B is enabled.

### Store Administrator

A trusted Xtamaliy staff member who manages catalogue content, inventory, enquiries, orders, and basic site settings.

### Super Administrator

The initial owner-level account with permission to manage administrators, system settings, integrations, and high-risk actions.

## 5. Product Principles

1. **Mobile first:** Most customer actions must work comfortably on small screens.
2. **Fast by default:** Images, fonts, animations, and data fetching must be optimized.
3. **Simple administration:** Product and order management must not require developer support.
4. **Secure by design:** Authorization, validation, payment verification, and audit logging are mandatory.
5. **Accessible:** Keyboard navigation, readable contrast, form labels, focus states, and semantic HTML are required.
6. **No fake functionality:** Features that depend on unconfirmed third-party access must remain disabled or clearly marked.
7. **Configuration over duplication:** Catalogue and full-commerce modes must share one codebase.

## 6. Proposed Technical Stack

- **Framework:** Next.js App Router with TypeScript
- **Styling:** Tailwind CSS with reusable design tokens and accessible UI components
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Better Auth with database-backed sessions
- **Validation:** Zod
- **Forms:** React Hook Form where complex client-side forms are required
- **Email:** Resend for transactional email, with provider abstraction for future migration
- **Payments:** Paystack as the default provider, behind a payment-provider interface
- **Product media:** Cloudinary or another approved object-storage/image-delivery provider
- **Hosting:** Vercel or another approved Node.js hosting platform
- **Monitoring:** Application error tracking and structured logs
- **Testing:** Vitest or Jest for unit/integration tests and Playwright for end-to-end tests
- **Package manager:** pnpm

Use the latest stable, mutually compatible versions at project initialization and commit the lockfile. Do not upgrade major versions during implementation unless required to fix a confirmed issue.

## 7. Application Architecture

Use a feature-based architecture without a `src` directory.

```text
app/
  (store)/
  (auth)/
  admin/
  api/
components/
  ui/
  layout/
features/
  auth/
  catalogue/
  categories/
  products/
  inventory/
  enquiries/
  cart/
  checkout/
  payments/
  orders/
  customers/
  settings/
lib/
  auth/
  db/
  email/
  payments/
  storage/
  security/
  validation/
prisma/
  schema.prisma
  seed.ts
public/
tests/
```

Business rules must live in feature services or server-side domain functions, not inside page components.

## 8. Core Functional Requirements

### 8.1 Storefront

- Responsive home page.
- Featured collections and products.
- Product catalogue page.
- Category and collection pages.
- Product detail page.
- Search by product name, SKU, category, and relevant tags.
- Filters for category, size, colour, price range, availability, and collection where data exists.
- Sorting by newest, price, name, and featured position.
- Breadcrumbs.
- Empty, loading, and error states.
- Shareable canonical product URLs.
- Clear out-of-stock and low-stock presentation.

### 8.2 Product Model

Each product should support:

- name;
- slug;
- description;
- short description;
- SKU or parent SKU;
- category;
- collection;
- base price;
- optional sale price;
- multiple images;
- colours;
- sizes;
- variants;
- inventory quantity per variant;
- active/draft/archived status;
- featured status;
- SEO title and description;
- creation and update timestamps.

Do not treat colour and size as comma-separated strings. Model sellable variants explicitly.

### 8.3 Inventory

- Stock is tracked per product variant.
- Stock cannot become negative through normal customer checkout.
- Admin adjustments require a reason.
- Inventory adjustments must be recorded in an immutable movement log.
- In Mode B, successful orders reduce stock exactly once.
- Cancelled or refunded orders may restore stock according to an explicit admin action or configured business rule.
- Low-stock threshold should be configurable.

### 8.4 Enquiries — Mode A and Mode B

- Product enquiry form.
- General contact form.
- WhatsApp deep link containing product name and product URL.
- Spam protection and rate limiting.
- Admin enquiry list and detail view.
- Status tracking.
- Internal notes.
- Email notification to the business.
- Optional confirmation email to the customer.

### 8.5 Customer Accounts — Mode B

- Sign up.
- Email verification.
- Sign in and sign out.
- Password reset.
- Profile management.
- Address management.
- Order history.
- Secure session management.

Guest checkout may be supported if approved. If guest checkout is implemented, orders must still store customer contact information without creating an account automatically.

### 8.6 Cart — Mode B

- Add, remove, and update items.
- Persist cart for returning users.
- Validate current price and stock on checkout.
- Never trust price, discount, or totals submitted by the browser.
- Calculate totals on the server.
- Prevent checkout of inactive or unavailable variants.

### 8.7 Checkout and Payments — Mode B

- Collect customer details and delivery address.
- Display item subtotal and total clearly.
- Shipping cost must come from a defined rule or admin configuration; it must not be guessed.
- Create a pending order before redirecting to a payment provider.
- Generate a unique order number and payment reference.
- Verify payment server-to-server using the provider API.
- Verify webhook signatures.
- Treat webhooks as retryable and idempotent.
- Never mark an order paid only because the customer returned to a success page.
- Record raw provider reference IDs and safe event metadata.
- Do not store card numbers, CVV, or other sensitive card data.

### 8.8 Orders — Mode B

Supported order statuses:

- pending_payment;
- paid;
- processing;
- ready_for_dispatch;
- shipped;
- delivered;
- cancelled;
- refund_pending;
- refunded.

Supported payment statuses:

- pending;
- successful;
- failed;
- abandoned;
- refunded;
- partially_refunded, only if supported.

Order status and payment status must be stored separately.

### 8.9 Admin Dashboard

- Secure admin-only route group.
- Dashboard summary cards.
- Product management.
- Variant and inventory management.
- Category and collection management.
- Enquiry management.
- Order management in Mode B.
- Customer lookup in Mode B.
- Site settings.
- Email/integration health indicators.
- Audit log for sensitive actions.
- Pagination, search, filtering, and useful empty states.

### 8.10 Email Notifications

Use templates for:

- account verification;
- password reset;
- enquiry received;
- new enquiry admin alert;
- order confirmation;
- payment confirmation;
- order status update;
- cancellation or refund confirmation.

Email sending must be abstracted behind a service interface. Development and test environments must never send real customer emails unintentionally.

## 9. Content and Pages

Recommended public pages:

- Home
- Shop
- Category/Collection
- Product Details
- About
- Contact
- Delivery Information
- Returns and Refunds
- Privacy Policy
- Terms and Conditions
- Cart and Checkout, Mode B only
- Customer Account and Orders, Mode B only

Recommended admin areas:

- Dashboard
- Products
- Categories
- Collections
- Inventory
- Enquiries
- Orders, Mode B only
- Customers, Mode B only
- Settings
- Audit Log

## 10. SEO and Performance

- Metadata for all public pages.
- Product and organization structured data where valid.
- XML sitemap.
- robots.txt.
- Canonical URLs.
- Open Graph metadata.
- Optimized responsive images.
- Lazy loading below the fold.
- Avoid layout shift.
- Use server rendering or static generation where appropriate.
- Revalidate catalogue pages when product data changes.
- Prevent admin, cart, checkout, and account pages from being indexed.

Performance target for representative mobile pages:

- Lighthouse Performance: 85 or higher where realistically achievable.
- Accessibility: 90 or higher.
- Best Practices: 90 or higher.
- SEO: 90 or higher for public indexable pages.

Scores are diagnostic targets, not contractual guarantees across every device and network.

## 11. Analytics and Search Console

- Connect the production domain to Google Search Console.
- Submit sitemap after production launch.
- Add privacy-conscious analytics only after client approval.
- Do not expose customer PII in analytics events.
- Track useful events such as product view, enquiry start, enquiry submit, add to cart, checkout start, and successful purchase.

## 12. Non-Functional Requirements

- TypeScript strict mode.
- No `any` unless a documented third-party limitation makes it unavoidable.
- Server-side authorization on every protected operation.
- Input validation at trust boundaries.
- Database migrations committed to the repository.
- Environment variables validated at startup.
- Helpful user-facing errors without exposing stack traces or secrets.
- Structured logging with request or correlation IDs where practical.
- Graceful handling of third-party outages.
- All key workflows covered by tests.

## 13. Initial Data Entities

At minimum:

- User
- Session
- Account
- Verification
- Role
- Product
- ProductImage
- Category
- Collection
- ProductVariant
- InventoryMovement
- Enquiry
- EnquiryNote
- Cart
- CartItem
- Address
- Order
- OrderItem
- Payment
- PaymentEvent
- SiteSetting
- AuditLog

Mode A may leave customer, cart, order, and payment features disabled, but the codebase should permit their later activation without rebuilding the catalogue domain.

## 14. Configuration

Required environment/configuration areas:

- application URL;
- database connection;
- authentication secret;
- email provider credentials;
- sender email/domain;
- media storage credentials;
- payment provider credentials;
- webhook secret;
- store mode: `catalogue` or `commerce`;
- admin bootstrap configuration;
- observability credentials;
- optional analytics identifiers.

No secret may be committed to source control.

## 15. Definition of Done

A feature is complete only when:

- acceptance criteria are met;
- server-side validation and authorization are present;
- loading, empty, success, and error states exist;
- tests cover important business rules;
- responsive behaviour is verified;
- accessibility basics are verified;
- documentation is updated;
- no critical or high-severity security finding remains open;
- the feature works against a production-like database and configuration.

## 16. Explicitly Out of Scope Unless Added Later

- product photography;
- product copywriting;
- native mobile applications;
- multi-vendor marketplace functionality;
- complex warehouse management;
- automatic courier dispatch integration;
- loyalty programme;
- gift cards;
- advanced recommendation engine;
- multi-currency settlement;
- multi-language content;
- subscription commerce;
- ERP integration;
- unconfirmed payment providers.
