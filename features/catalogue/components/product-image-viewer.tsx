"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ProductImageViewerProps = Readonly<{
  src: string;
  alt: string;
}>;

export function ProductImageViewer({ src, alt }: ProductImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <>
      <div className="relative min-h-[70svh] bg-[#d8d2c8] lg:min-h-[calc(100svh-81px)]">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover object-top"
        />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute right-4 bottom-4 border border-black/20 bg-[#ece8df]/95 px-4 py-3 text-[0.6rem] font-bold tracking-[0.16em] uppercase shadow-sm backdrop-blur-sm transition-colors hover:bg-[#d7ff3f] focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          View full image
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Full product image"
        onCancel={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
        className="m-auto h-dvh max-h-none w-screen max-w-none border-0 bg-[#171713] p-0 text-white backdrop:bg-black"
      >
        <div className="relative h-dvh w-screen">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 z-10 grid size-12 place-items-center rounded-full border border-white/35 bg-black/45 text-2xl backdrop-blur-sm transition-colors hover:bg-[#d7ff3f] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f]"
            aria-label="Close full image"
          >
            ×
          </button>
        </div>
      </dialog>
    </>
  );
}
