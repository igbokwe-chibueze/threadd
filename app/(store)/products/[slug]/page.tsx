import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatNaira } from "@/features/catalogue/format";
import { ProductImageViewer } from "@/features/catalogue/components/product-image-viewer";
import {
  getPublicProduct,
  getPublicProductSlugs,
} from "@/features/catalogue/queries";

type ProductPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export async function generateStaticParams() {
  return getPublicProductSlugs();
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);

  if (!product) {
    return {};
  }

  const image = product.images[0];

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription,
    openGraph: image
      ? {
          images: [{ url: image.url, alt: image.altText }],
        }
      : undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getPublicProduct((await params).slug);

  if (!product) {
    notFound();
  }

  const image = product.images[0];
  const sizes = [...new Set(product.variants.map((variant) => variant.size))];
  const colours = [
    ...new Map(
      product.variants.map((variant) => [
        variant.colour,
        { name: variant.colour, hex: variant.colourHex },
      ]),
    ).values(),
  ];
  const available = product.variants.filter(
    (variant) => variant.inventoryQuantity > 0,
  );

  return (
    <div className="grid lg:grid-cols-[1.45fr_1fr]">
      {image ? (
        <ProductImageViewer images={product.images} />
      ) : (
        <section className="min-h-[70svh] bg-[#d8d2c8] lg:min-h-[calc(100svh-81px)]" />
      )}

      <section className="flex flex-col px-5 py-10 sm:px-10 lg:min-h-[calc(100svh-81px)] lg:px-12 lg:py-14">
        <div className="flex items-center justify-between text-[0.6rem] font-bold tracking-[0.18em] uppercase">
          <Link href="/shop">← Shop</Link>
          <span>{product.category.name}</span>
        </div>

        <div className="my-auto py-16">
          <p className="text-[0.62rem] font-bold tracking-[0.2em] uppercase">
            {product.collections[0]?.collection.name ?? "THREADD"}
          </p>
          <h1 className="mt-5 text-5xl leading-[0.88] font-medium tracking-[-0.065em] sm:text-7xl">
            {product.name}
          </h1>
          <div className="mt-7 flex items-center gap-3 text-lg">
            <span>{formatNaira(product.basePrice.toString())}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-black/40 line-through">
                {formatNaira(product.compareAtPrice.toString())}
              </span>
            ) : null}
          </div>
          <p className="mt-8 max-w-xl text-sm leading-6 text-black/60">
            {product.description}
          </p>

          <div className="mt-10 grid gap-8 border-t border-black/20 pt-7 sm:grid-cols-2">
            <div>
              <p className="text-[0.58rem] font-bold tracking-[0.16em] uppercase">
                Sizes
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="grid min-w-10 place-items-center border border-black/25 px-3 py-2 text-xs"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[0.58rem] font-bold tracking-[0.16em] uppercase">
                Colours
              </p>
              <div className="mt-3 grid gap-2">
                {colours.map((colour) => (
                  <span
                    key={colour.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="size-3 rounded-full border border-black/20"
                      style={{ backgroundColor: colour.hex ?? "#777" }}
                    />
                    {colour.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 bg-[#171713] px-5 py-4 text-sm text-white">
            {available.length
              ? `${available.length} variants ready. Cart and checkout arrive in PHASE 6B.`
              : "This piece is currently sold out."}
          </div>
        </div>

        <p className="border-t border-black/20 pt-5 text-xs leading-5 text-black/45">
          Delivery available throughout Nigeria. Final fees are calculated from
          the destination state at checkout.
        </p>
      </section>
    </div>
  );
}
