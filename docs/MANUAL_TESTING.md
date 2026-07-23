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
4. At a mobile width, select the circular menu button and confirm the bright
   navigation panel opens.
5. Press `Escape` and confirm the mobile navigation closes.
6. Scroll through **The foundation**, **Manifesto**, and the footer; confirm
   each section reveals smoothly without delaying links or scrolling.
7. Open each footer page: **About**, **Contact**, **Delivery**, **Returns**,
   **Privacy**, and **Terms**.
8. Confirm the interior-page header remains readable and each page returns to
   the homepage through the THREADD wordmark.

## Test the Phase 4 catalogue

1. Open `/shop` and confirm six seeded pieces appear with imagery, prices,
   colour counts, and available size information.
2. Search for `utility`, then apply the search and confirm the Utility
   Overshirt remains.
3. Clear the filters. Filter by **Outerwear**, a size, and a colour; confirm
   every result matches the selected options.
4. Try each sort option and confirm the order changes.
5. Open **Study 001** from the footer and confirm the collection has its own
   editorial heading and filtered catalogue.
6. Open a product and confirm its image, description, category, collections,
   colours, sizes, stock messaging, price, and page title are present.
7. Open `/products/not-a-real-thread` and confirm the styled 404 page appears.
8. Open `/sitemap.xml` and `/robots.txt`; confirm public products are listed
   and private account/admin routes are excluded from crawling.

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
4. Select **Catalogue**, then **New product**.
5. Create a draft with a JPEG, PNG, or WebP image under 4 MB and at least one
   variant in this format:

   ```text
   TEST-TEE-BLK-M | M | Black | #171713 | 5 | 0
   ```

6. Confirm the product appears in Studio but not on `/shop`.
7. Edit it, change **Visibility** to **Published**, save, and confirm it appears
   on `/shop` and opens at its product URL.
8. Edit it again and archive it. Confirm it disappears from the public shop
   but remains visible as `ARCHIVED` in Studio.
9. Try a negative stock number or duplicate size/colour combination and
   confirm the server refuses to save it.
10. Try uploading a text file or an image larger than 4 MB and confirm it is
    rejected.
11. Select **Sign out**, then revisit `/admin` and confirm access is denied.

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

Cart, checkout, Paystack, order history, advanced inventory movement history,
and order management are not available yet. Product images use the demo's
local media-storage adapter; production deployment will replace that adapter
with managed object storage without changing catalogue workflows.
