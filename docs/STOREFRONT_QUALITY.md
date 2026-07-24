# Storefront Quality Review

## Images

- All storefront imagery uses `next/image`; no raw `<img>` elements are used.
- The campaign hero and initial visible catalogue cards are the only priority
  images.
- Responsive `sizes` describe mobile, tablet, catalogue-grid, product-gallery,
  thumbnail, and full-screen display widths.
- Catalogue cards and the gallery use stable aspect ratios or fixed containers,
  preventing cumulative layout shift.
- Original campaign and catalogue PNGs are approximately 1.5–2 MB, but browser
  delivery is resized, compressed, and cached by the Next.js image optimizer.
- Admin uploads are limited to six images, accepted web formats, and 4 MB each.
  A customer deployment should move originals to isolated object storage/CDN
  without changing the image URLs stored by the catalogue service.

## JavaScript and animation

- Catalogue filtering uses client navigation and a transition instead of a
  document reload.
- Framer Motion is limited to reveal and product-gallery components.
- Reveal animations run once when visible.
- Landing reveals and gallery transitions stop when the visitor requests
  reduced motion.
- Loading boundaries preserve the storefront shell and announce progress.

## Metadata and indexing

- Public pages have descriptions and canonical URLs.
- Product metadata is generated from trusted catalogue records and shares the
  first gallery image.
- Organization, WebSite, and Product JSON-LD is safely serialized.
- A generated 1200×630 Open Graph image represents the brand without shipping
  the full campaign source image to link-preview crawlers.
- Sitemap entries are database-backed and include published products,
  collections, and product images.
- Admin, authentication, account, cart, checkout, order, outbox, and API routes
  are excluded through metadata and/or `robots.txt`.

## Accessibility

- The shared navigation exposes a keyboard skip link.
- Store loading and filter transitions provide accessible live status.
- Product galleries support keyboard arrows, dialog dismissal, labelled
  controls, full-image viewing, and reduced motion.
- Focus indicators remain visible on interactive storefront controls.
- Product images use administrator-authored alternative text; decorative
  thumbnails use empty alternative text.

## Release measurements

Run Lighthouse against the deployed production build at mobile and desktop
sizes for `/`, `/shop`, and one representative `/products/[slug]` route.
Record Performance, Accessibility, Best Practices, and SEO results during
Phase 12 because localhost development metrics are not release evidence.
