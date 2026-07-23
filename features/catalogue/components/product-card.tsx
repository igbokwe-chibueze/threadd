import Image from "next/image";
import Link from "next/link";

import { formatNaira } from "@/features/catalogue/format";

type ProductCardProps = Readonly<{
  product: {
    name: string;
    slug: string;
    shortDescription: string;
    basePrice: { toString(): string };
    compareAtPrice: { toString(): string } | null;
    category: { name: string };
    images: readonly { url: string; altText: string }[];
    variants: readonly { inventoryQuantity: number }[];
  };
  priority?: boolean;
}>;

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const image = product.images[0];
  const inStock = product.variants.some(
    (variant) => variant.inventoryQuantity > 0,
  );

  return (
    <article className="group">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#d8d2c8]">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs tracking-[0.2em] uppercase">
              Image pending
            </div>
          )}
          <span className="absolute top-3 left-3 bg-[#ece8df] px-3 py-1.5 text-[0.56rem] font-bold tracking-[0.14em] uppercase">
            {inStock ? product.category.name : "Sold out"}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/20 py-4">
          <div>
            <h2 className="text-lg font-medium tracking-[-0.025em]">
              {product.name}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs text-black/50">
              {product.shortDescription}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>{formatNaira(product.basePrice.toString())}</p>
            {product.compareAtPrice ? (
              <p className="mt-1 text-xs text-black/40 line-through">
                {formatNaira(product.compareAtPrice.toString())}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
