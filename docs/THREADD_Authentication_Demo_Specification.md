# THREADD – Authentication & Demo Organization Specification

## Overview

Implement authentication and authorization using **Better Auth** with **Organizations**, **Memberships**, **Roles**, and **Invitations**.

The application must support two distinct modes:

1. **Production Organizations** – Used by real store owners and their staff.
2. **Demo Organization** – A public organization that allows anyone to explore the admin dashboard without affecting real customer data.

The demo organization should behave exactly like a real organization wherever possible, while disabling features that could be abused or require external integrations.

---

# Authentication

Use **Better Auth** as the authentication provider.

Support:

- Email/password authentication
- Organizations
- Organization memberships
- Roles
- Invitation-based member onboarding
- Secure sessions
- Protected routes
- Server-side authorization

Authentication should not contain any special-case logic for demo users. The demo account must authenticate through the exact same authentication flow as every other user.

---

# Organization Model

Every piece of business data must belong to an organization.

Examples include:

- Products
- Categories
- Collections
- Inventory
- Orders
- Customers
- Coupons
- Analytics
- Settings
- Media
- Reviews

Every query must be scoped to the active organization.

Never trust an organization ID sent from the client.

Always resolve the organization from the authenticated session.

Pseudo flow:

```text
Authenticated User
↓
Current Membership
↓
Current Organization
↓
Use organization.id for every database query
```

This is the primary security boundary.

---

# Roles

## OWNER

Permissions:

- Manage organization
- Invite members
- Remove members
- Promote/demote members
- Manage products
- Manage inventory
- Manage categories
- Manage collections
- Manage orders
- View analytics
- Configure store settings
- Configure payment methods
- Configure shipping
- Configure domains
- Configure integrations

## ADMIN

Permissions:

- Manage products
- Manage inventory
- Manage categories
- Manage collections
- Manage orders
- Manage coupons
- Manage customers
- View analytics
- Manage content

Cannot:

- Transfer ownership
- Delete organization
- Configure billing
- Invite members (optional depending on organization settings)

## STAFF

Permissions:

- View products
- Update inventory
- Process orders
- View customers

Cannot:

- Change settings
- Delete products
- Invite members
- View billing

---

# Production Organization Flow

```
Store owner creates an organization
        ↓
Owner becomes OWNER
        ↓
Owner invites administrators
        ↓
Administrator receives invitation
        ↓
Administrator accepts invitation
        ↓
Membership is created
        ↓
Administrator gains access
```

Implement invitation expiration (recommended: **48 hours**).

Validate that:

- Invitation exists
- Invitation is valid
- Invitation has not expired
- Invitation email matches authenticated user
- Invitation has not already been accepted

Use database transactions when accepting invitations.

---

# Demo Organization

Seed a permanent organization.

| Field | Value |
|-------|-------|
| Name | THREADD Demo |
| Slug | demo |
| isDemo | true |

---

# Demo Account

Seed one administrator account.

| Field | Value |
|-------|-------|
| Email | admin@demo.threadd.store |
| Password | DemoAdmin123! |
| Role | ADMIN |
| Organization | THREADD Demo |

Display these credentials directly on the login page with a **Login as Demo Admin** button that automatically signs in.

---

# Demo Experience

Allow visitors to:

- Create, edit, and delete products
- Upload images
- Manage categories and collections
- Manage inventory
- Process sample orders
- Update order status
- Create discount codes
- Browse analytics
- Configure storefront settings
- Search and filter products

The experience should feel like a fully functional SaaS application.

---

# Demo Restrictions

Keep the UI visible for restricted features.

For **Member Invitations**, allow users to open the modal and complete the form, but when they click **Send Invitation**, display:

> **Demo Mode**
>
> Member invitations are disabled in the public demo to prevent abuse.

Disable:

- Organization deletion
- Ownership transfer
- Billing
- Subscription management
- Domain management
- SMTP configuration
- Payment provider configuration
- API key management
- Webhook configuration
- Email sending
- Data export
- External integrations

---

# Feature Gate System

Use centralized authorization.

```
Authentication
      ↓
Membership
      ↓
Role
      ↓
Permission Check
      ↓
Feature Gate
      ↓
Business Logic
```

Avoid scattering `if (organization.isDemo)` checks throughout the codebase.

---

# Demo Banner

Show a persistent banner:

> **Demo Mode**
>
> Changes made here are temporary. Some features such as member invitations and billing are disabled.

---

# Login Page

Provide two entry points:

## Explore Demo

- Display demo credentials
- Login as Demo Admin button

## Store Owners

- Email
- Password
- Forgot Password
- Sign In
- Create Account

---

# Data Isolation

Every query must be filtered by the authenticated organization.

Never expose another organization's data.

---

# Demo Data

Seed:

- 25–40 Products
- 6–10 Categories
- 5 Collections
- 20+ Customers
- 30+ Orders
- 5 Coupons
- 20+ Reviews
- Sample analytics
- Realistic inventory

---

# Demo Reset

Reset every **6 hours**.

Reset only the demo organization by:

- Removing visitor-created products
- Removing demo orders
- Removing demo coupons
- Cleaning uploaded demo assets (if applicable)
- Restoring the original seed dataset

Never affect production organizations.

---

# Security

The demo account is **not** a privileged bypass.

Authorization always follows:

```
Session
↓
Membership
↓
Role
↓
Permissions
↓
Feature Gates
```

---

# Design Goals

- Production-ready authentication
- Multi-tenant architecture
- Invitation-based onboarding
- Organization-level isolation
- Safe public demo
- Minimal maintenance
- Portfolio-quality implementation
- Professional SaaS architecture
