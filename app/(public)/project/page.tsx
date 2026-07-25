import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Inside the build",
  description:
    "A detailed tour of THREADD's product thinking, architecture, security, commerce workflows, and resettable portfolio deployment.",
  alternates: { canonical: "/project" },
};

const sections = [
  {
    number: "01",
    title: "What THREADD is",
    body: "THREADD is a complete single-store Nigerian fashion ecommerce experience, designed as both a convincing customer product and an inspectable portfolio system. It combines an editorial storefront with real catalogue, account, cart, checkout, order, enquiry, inventory, administration, media, and operational workflows.",
  },
  {
    number: "02",
    title: "Why it exists",
    body: "The project demonstrates more than a polished landing page. Clients can explore the customer journey, enter the administration area, edit temporary catalogue data, inspect inventory and orders, and see how a production-minded commerce application behaves. A protected reset restores the canonical showcase every six hours.",
  },
  {
    number: "03",
    title: "Architecture",
    body: "Next.js App Router composes server-rendered routes and small interactive client islands. Domain code is organized by feature, Prisma provides typed PostgreSQL access, Better Auth owns identity and sessions, Zod validates trust boundaries, and server actions or route handlers expose narrowly scoped mutations.",
  },
  {
    number: "04",
    title: "Commerce integrity",
    body: "Prices, shipping, stock, order totals, and payment status are calculated or verified on the server. Orders preserve item snapshots, inventory changes create movements, checkout is idempotent, and Paystack remains in test mode. Browser redirects alone can never mark an order as paid.",
  },
  {
    number: "05",
    title: "Security and privacy",
    body: "Protected routes perform server-side authorization, public inputs are schema-validated and rate-limited, logs redact sensitive values, uploads are restricted and stored through Cloudinary, private routes are excluded from indexing, and the public demo contains fictional disposable data only.",
  },
  {
    number: "06",
    title: "Operations",
    body: "Vercel hosts the application over HTTPS, Prisma Postgres stores isolated demo data, Cloudinary holds catalogue media, GitHub Actions performs health checks and canonical resets, and Vercel logs capture privacy-safe operational events. Google Search Console and the dynamic sitemap complete the public search setup.",
  },
  {
    number: "07",
    title: "Quality",
    body: "The release gate covers formatting, linting, strict TypeScript, Prisma validation, unit and integration tests, Playwright browser journeys, committed-secret scanning, and a production build. Deployed Lighthouse reviews informed accessibility, landmark, contrast, metadata, and layout-shift improvements.",
  },
  {
    number: "08",
    title: "How to explore",
    body: "Browse the collection, inspect variants, add products to the cart, sign in with either demo identity, complete a test checkout, review the private Demo Outbox, or enter Admin to manage catalogue, inventory, enquiries, shipping, and orders. Every visitor action is temporary.",
  },
] as const;

export default function ProjectPage() {
  return (
    <main className="bg-[#ece8df] text-[#171713]">
      <section className="px-5 pt-20 pb-16 sm:px-10 lg:px-14 lg:pt-28 lg:pb-24">
        <Reveal>
          <p className="text-[0.62rem] font-bold tracking-[0.24em] uppercase">
            Portfolio case study / System tour
          </p>
          <h1 className="mt-5 max-w-6xl text-[clamp(4rem,10vw,9rem)] leading-[0.8] font-medium tracking-[-0.075em]">
            Inside the build.
          </h1>
          <p className="mt-10 max-w-3xl text-xl leading-8 text-black/65">
            The product, engineering, security, and operations behind a
            resettable fashion-commerce experience created by Igbokwe Chibueze.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-black/20 px-5 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div className="grid gap-0">
          {sections.map((section, index) => (
            <Reveal key={section.number} delay={Math.min(index * 0.035, 0.14)}>
              <article className="grid gap-4 border-b border-black/20 py-8 lg:grid-cols-[5rem_1fr_1.6fr] lg:gap-10">
                <p className="text-[0.62rem] font-bold">{section.number}</p>
                <h2 className="text-2xl font-medium tracking-[-0.035em]">
                  {section.title}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-black/65">
                  {section.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#d7ff3f] px-5 py-20 sm:px-10 lg:px-14">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[0.62rem] font-bold tracking-[0.22em] uppercase">
                Explore the working system
              </p>
              <p className="mt-5 max-w-4xl text-4xl leading-[0.95] font-medium tracking-[-0.055em] sm:text-6xl">
                Move from campaign to checkout—or step behind the collection.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bg-[#171713] px-6 py-4 text-xs font-bold tracking-[0.16em] text-white uppercase"
              >
                Visit the shop
              </Link>
              <Link
                href="/sign-in"
                className="border border-black px-6 py-4 text-xs font-bold tracking-[0.16em] uppercase"
              >
                Open demo access
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
