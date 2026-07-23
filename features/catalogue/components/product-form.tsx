"use client";

import { useActionState, useState } from "react";

import type { ProductFormState } from "@/features/catalogue/admin-actions";

type Option = { id: string; name: string };
type ProductValue = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  basePrice: string;
  compareAtPrice: string;
  categoryId: string;
  collectionId: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
  imageUrl?: string;
  variants: string;
};

type ProductFormProps = {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  categories: Option[];
  collections: Option[];
  product?: ProductValue;
};

const field =
  "mt-2 min-h-11 w-full border border-white/25 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#d7ff3f]";
const help =
  "mt-2 block text-xs font-normal leading-5 tracking-normal text-white/50 normal-case";

function createSlug(value: string) {
  return value
    .toLocaleLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({
  action,
  categories,
  collections,
  product,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");

  return (
    <form
      action={formAction}
      className="mt-10 grid gap-8"
      encType="multipart/form-data"
    >
      {state.error ? (
        <p
          role="alert"
          className="border border-red-300/40 bg-red-950/30 p-4 text-sm text-red-100"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="text-xs font-bold tracking-[0.14em] uppercase">
          Name
          <input
            name="name"
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              setSlug(createSlug(nextName));
            }}
            required
            className={field}
          />
        </label>
        <label className="text-xs font-bold tracking-[0.14em] uppercase">
          Product URL
          <input
            name="slug"
            value={slug}
            readOnly
            required
            className={`${field} cursor-not-allowed text-white/60`}
          />
          <span className={help}>
            Generated automatically from the product name.
          </span>
        </label>
      </div>
      <Field
        label="Short description"
        name="shortDescription"
        defaultValue={product?.shortDescription}
        maxLength={180}
        required
      />
      <label className="text-xs font-bold tracking-[0.14em] uppercase">
        Full description
        <textarea
          name="description"
          defaultValue={product?.description}
          required
          rows={7}
          className={field}
        />
      </label>

      <div className="grid gap-5 lg:grid-cols-3">
        <Field
          label="Price (NGN)"
          name="basePrice"
          type="number"
          min="1"
          step="0.01"
          defaultValue={product?.basePrice}
          required
        />
        <Field
          label="Compare-at price"
          name="compareAtPrice"
          type="number"
          min="1"
          step="0.01"
          defaultValue={product?.compareAtPrice}
          help="Optional. The old or regular price shown crossed out beside the current selling price. It must be higher than the product price."
        />
        <label className="text-xs font-bold tracking-[0.14em] uppercase">
          Visibility
          <select
            name="status"
            defaultValue={product?.status === "ACTIVE" ? "ACTIVE" : "DRAFT"}
            className={`${field} [&>option]:bg-[#171713] [&>option]:text-white`}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Published</option>
          </select>
          <span className={help}>
            Drafts stay inside Studio. Published products appear in the shop.
          </span>
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="text-xs font-bold tracking-[0.14em] uppercase">
          Category
          <select
            name="categoryId"
            defaultValue={product?.categoryId}
            required
            className={`${field} [&>option]:bg-[#171713] [&>option]:text-white`}
          >
            <option value="">Select category</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold tracking-[0.14em] uppercase">
          Collection
          <select
            name="collectionId"
            defaultValue={product?.collectionId}
            className={`${field} [&>option]:bg-[#171713] [&>option]:text-white`}
          >
            <option value="">No collection</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <span className={help}>
            Optional. Group this product into an editorial collection.
          </span>
        </label>
      </div>

      <label className="flex items-center gap-3 text-xs font-bold tracking-[0.14em] uppercase">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={product?.featured}
        />
        Feature this product
        <span className="font-normal tracking-normal text-white/50 normal-case">
          — gives it priority in the default shop order
        </span>
      </label>

      <section className="border-t border-white/20 pt-8">
        <h2 className="text-3xl font-medium tracking-[-0.04em]">Image</h2>
        {product?.imageUrl ? (
          <p className="mt-2 text-xs text-white/50">
            Current: {product.imageUrl}
          </p>
        ) : null}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <label className="text-xs font-bold tracking-[0.14em] uppercase">
            {product ? "Replace image (optional)" : "Product image"}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              required={!product}
              className={`${field} file:mr-4 file:border-0 file:bg-[#d7ff3f] file:px-3 file:py-1 file:text-black`}
            />
            <span className="mt-2 block font-normal tracking-normal text-white/45 normal-case">
              JPEG, PNG, or WebP. Maximum 4 MB.
            </span>
          </label>
          <Field
            label="Image description"
            name="imageAlt"
            defaultValue={product?.imageAlt}
            required
          />
        </div>
      </section>

      <section className="border-t border-white/20 pt-8">
        <h2 className="text-3xl font-medium tracking-[-0.04em]">Variants</h2>
        <p className="mt-2 text-xs leading-5 text-white/50">
          One per line: SKU | Size | Colour | #Hex | Stock | Price adjustment
        </p>
        <div className="mt-4 border border-white/15 bg-black/20 p-4 text-xs leading-6 text-white/65">
          <p className="font-bold tracking-[0.12em] text-white uppercase">
            Copy this example
          </p>
          <code className="mt-2 block whitespace-pre-wrap text-[#d7ff3f]">
            {"THR-TEE-BLK-M | M | Black | #171713 | 5 | 0\n"}
            {"THR-TEE-BLK-L | L | Black | #171713 | 3 | 0"}
          </code>
          <p className="mt-2">
            This creates two black sizes with 5 and 3 items in stock. The last
            number adds an optional amount to the base price; use 0 when the
            variant costs the same.
          </p>
        </div>
        <textarea
          name="variants"
          defaultValue={product?.variants}
          required
          rows={8}
          className={`${field} font-mono`}
          placeholder="THR-TEE-BLK-M | M | Black | #171713 | 8 | 0"
        />
      </section>

      <section className="border-t border-white/20 pt-8">
        <h2 className="text-3xl font-medium tracking-[-0.04em]">
          Search preview
        </h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Field
            label="SEO title (optional)"
            name="seoTitle"
            maxLength={60}
            defaultValue={product?.seoTitle}
            help="The title shown by search engines. Leave blank to use the product name."
          />
          <Field
            label="SEO description (optional)"
            name="seoDescription"
            maxLength={160}
            defaultValue={product?.seoDescription}
            help="A short search-engine summary. Leave blank to use the product description."
          />
        </div>
      </section>

      <button
        disabled={pending}
        className="min-h-13 bg-[#d7ff3f] px-7 text-xs font-bold tracking-[0.18em] text-black uppercase disabled:opacity-50"
      >
        {pending ? "Saving…" : product ? "Save product" : "Create product"}
      </button>
    </form>
  );
}

function Field({
  label,
  help: helpText,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  help?: string;
}) {
  return (
    <label className="text-xs font-bold tracking-[0.14em] uppercase">
      {label}
      <input {...props} className={field} />
      {helpText ? <span className={help}>{helpText}</span> : null}
    </label>
  );
}
