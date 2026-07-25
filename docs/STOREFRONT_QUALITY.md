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

### Initial deployed baseline — 25 July 2026

Measured against `https://threadd-smoky.vercel.app` before the Phase 12
landmark, layout-reservation, contrast, and dynamic-sitemap fixes:

| Route | Profile | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Mobile | 93 | 96 | 100 | 100 | 3.0 s | 0 | 90 ms |
| `/shop` | Mobile | 69 | 95 | 100 | 100 | 1.5 s | 0.351 | 490 ms |
| `/products/serein-knot-gown` | Mobile | 63 | 95 | 100 | 92 | 3.1 s | 0.351 | 460 ms |
| `/` | Desktop | 99 | 96 | 100 | 100 | 0.9 s | 0 | 0 ms |
| `/shop` | Desktop | 81 | 95 | 100 | 100 | 0.8 s | 0.371 | 0 ms |
| `/products/serein-knot-gown` | Desktop | 79 | 95 | 100 | 92 | 0.8 s | 0.344 | 0 ms |

The audit attributed the large shop/product CLS to the footer moving while
streamed route content resolved. It also reported the store wrapper as lacking
a `main` landmark and identified low-contrast secondary labels. The prepared
fix gives the store content a semantic main landmark with a viewport-based
minimum height and raises the affected text contrast. The product description
is present in the deployed HTML; its isolated SEO miss will be checked again
after the corrected deployment rather than assumed fixed.

Lighthouse generated all six JSON reports successfully. On Windows, five runs
returned an `EPERM` warning only while Lighthouse attempted to delete its
temporary Chrome profile after writing the report. The scores above were parsed
from the completed report files. Final release evidence requires a clean
post-deployment rerun.
