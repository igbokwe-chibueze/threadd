# THREADD — Manual Testing Guide

Use this guide after starting the project with:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test the current storefront

1. Confirm the landing page loads and the campaign image fills the screen.
2. Resize the browser to a mobile width and confirm there is no horizontal
   scrolling.
3. Select **Sign in** and confirm the authentication page opens.

## Test the customer account

1. On `/sign-in`, select **Enter as customer**.
2. Confirm you arrive at `/account`.
3. Confirm **Demo outbox** is available.
4. Visit `/admin` manually and confirm you are redirected back to `/account`.
5. Select **Sign out**, then revisit `/account` and confirm you return to the
   sign-in page.

Demo customer credentials:

```text
customer@demo.threadd.store
DemoShopper123!
```

## Test the administrator account

1. On `/sign-in`, select **Enter the studio**.
2. Confirm you arrive at `/admin`.
3. Confirm the dark THREADD Studio screen shows Catalogue, Inventory, Orders,
   and Customers.
4. Select **Sign out**, then revisit `/admin` and confirm access is denied.

Demo administrator credentials:

```text
admin@demo.threadd.store
DemoAdmin123!
```

## Test password reset and the Demo Outbox

1. Sign out.
2. Select **Forgot password?**
3. Enter `customer@demo.threadd.store`.
4. Select **Create reset message**.
5. Confirm the private Demo Outbox shows **Reset your THREADD password**.
6. Confirm **Download text** downloads a `.txt` message.
7. Avoid completing the reset with the shared demo customer unless you intend
   to change its seeded password.

## Expected limitations

Catalogue, cart, checkout, Paystack, order history, and admin management tools
are not available yet. They belong to upcoming roadmap phases and should not be
treated as defects during the current visual-system phase.
