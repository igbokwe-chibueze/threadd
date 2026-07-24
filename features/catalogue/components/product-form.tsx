"use client";

import { useActionState, useRef, useState } from "react";

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
  imageUrls?: string[];
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function updateSelectedFiles(files: File[]) {
    const nextFiles = files.slice(0, 6);
    const transfer = new DataTransfer();
    nextFiles.forEach((file) => transfer.items.add(file));

    if (imageInputRef.current) {
      imageInputRef.current.files = transfer.files;
    }
    setSelectedFiles(nextFiles);
  }

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
        <h2 className="text-3xl font-medium tracking-[-0.04em]">
          Product gallery
        </h2>
        {product?.imageUrls?.length ? (
          <div className="mt-3 text-xs leading-5 text-white/50">
            <p>
              {product.imageUrls.length} current{" "}
              {product.imageUrls.length === 1 ? "photo" : "photos"}:
            </p>
            <ul className="mt-1 list-inside list-decimal">
              {product.imageUrls.map((url) => (
                <li key={url} className="truncate">
                  {url}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <label className="text-xs font-bold tracking-[0.14em] uppercase">
            {product ? "Add gallery photos (optional)" : "Product photos"}
            <input
              ref={imageInputRef}
              type="file"
              name="images"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required={!product}
              onChange={(event) =>
                updateSelectedFiles(Array.from(event.currentTarget.files ?? []))
              }
              className={`${field} file:mr-4 file:border-0 file:bg-[#d7ff3f] file:px-3 file:py-1 file:text-black`}
            />
            <span className="mt-2 block font-normal tracking-normal text-white/45 normal-case">
              Select up to 6 JPEG, PNG, or WebP photos. Maximum 4 MB each. The
              first photo becomes the catalogue cover.
            </span>
          </label>
          <Field
            label="Gallery description"
            name="imageAlt"
            defaultValue={product?.imageAlt}
            required
            help="Describe the product and model briefly for visitors using screen readers."
          />
        </div>
        {selectedFiles.length ? (
          <div
            aria-live="polite"
            className="mt-5 border border-white/15 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold tracking-[0.14em] uppercase">
                {selectedFiles.length} selected{" "}
                {selectedFiles.length === 1 ? "photo" : "photos"}
              </p>
              <button
                type="button"
                onClick={() => updateSelectedFiles([])}
                className="text-[0.62rem] font-bold tracking-[0.12em] text-white/60 uppercase hover:text-white"
              >
                Clear all
              </button>
            </div>
            <ul className="mt-3 grid gap-2">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center justify-between gap-4 border-t border-white/10 pt-2 text-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-white">
                      {index + 1}. {file.name}
                    </span>
                    <span className="mt-1 block text-white/40">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {index === 0 ? " · Catalogue cover" : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedFiles(
                        selectedFiles.filter(
                          (_selectedFile, selectedIndex) =>
                            selectedIndex !== index,
                        ),
                      )
                    }
                    className="shrink-0 border border-white/20 px-3 py-2 text-[0.6rem] font-bold tracking-[0.12em] uppercase hover:border-red-200 hover:text-red-200"
                    aria-label={`Remove ${file.name}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {product?.imageUrls?.length ? (
          <label className="mt-5 flex items-center gap-3 text-xs font-bold tracking-[0.14em] uppercase">
            <input type="checkbox" name="replaceImages" />
            Replace the current gallery with the newly selected photos
          </label>
        ) : null}
      </section>

      <section className="border-t border-white/20 pt-8">
        <h2 className="text-3xl font-medium tracking-[-0.04em]">Variants</h2>
        <p className="mt-2 text-xs leading-5 text-white/50">
          One per line: SKU | Size | Colour | #Hex | Stock | Price adjustment
        </p>
        {product ? (
          <p className="mt-3 border-l-2 border-[#d7ff3f] pl-3 text-xs leading-5 text-white/65">
            Existing stock numbers are shown for reference but cannot be changed
            here. Use Studio → Inventory for every stock adjustment so the
            movement history remains complete. Stock is used here only when you
            add a brand-new SKU.
          </p>
        ) : null}
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
