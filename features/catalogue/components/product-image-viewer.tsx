"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type GalleryImage = Readonly<{
  url: string;
  altText: string;
}>;

type ProductImageViewerProps = Readonly<{
  images: readonly GalleryImage[];
}>;

export function ProductImageViewer({ images }: ProductImageViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasMultiple = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function move(direction: number) {
    setActiveIndex(
      (current) => (current + direction + images.length) % images.length,
    );
  }

  function handleKeys(event: React.KeyboardEvent) {
    if (!hasMultiple) return;
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  }

  return (
    <>
      <section
        aria-label="Product photo gallery"
        aria-roledescription="carousel"
        onKeyDown={handleKeys}
        tabIndex={0}
        className="relative min-h-[70svh] overflow-hidden bg-[#d8d2c8] outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset lg:min-h-[calc(100svh-81px)]"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={activeImage.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.altText}
              fill
              priority={activeIndex === 0}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover object-top"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-4">
          {hasMultiple ? (
            <div className="flex max-w-[70%] gap-2 overflow-x-auto bg-black/30 p-2 backdrop-blur-sm">
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show product photo ${index + 1} of ${images.length}`}
                  aria-current={index === activeIndex}
                  className={`relative size-14 shrink-0 overflow-hidden border-2 transition-colors sm:size-16 ${
                    index === activeIndex
                      ? "border-[#d7ff3f]"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="shrink-0 border border-black/20 bg-[#ece8df]/95 px-4 py-3 text-[0.6rem] font-bold tracking-[0.16em] uppercase shadow-sm backdrop-blur-sm transition-colors hover:bg-[#d7ff3f] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            View full image
          </button>
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous product photo"
              className="absolute top-1/2 left-4 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#ece8df]/90 text-xl backdrop-blur-sm hover:bg-[#d7ff3f]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next product photo"
              className="absolute top-1/2 right-4 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#ece8df]/90 text-xl backdrop-blur-sm hover:bg-[#d7ff3f]"
            >
              →
            </button>
            <p className="absolute top-4 right-4 z-10 bg-black/45 px-3 py-2 text-[0.58rem] font-bold tracking-[0.14em] text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </p>
          </>
        ) : null}
      </section>

      <dialog
        ref={dialogRef}
        aria-label="Full product image"
        onCancel={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
        onKeyDown={handleKeys}
        className="m-auto h-dvh max-h-none w-screen max-w-none border-0 bg-[#171713] p-0 text-white backdrop:bg-black"
      >
        <div className="relative h-dvh w-screen">
          <Image
            src={activeImage.url}
            alt={activeImage.altText}
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
          {hasMultiple ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous full-size product photo"
                className="absolute top-1/2 left-5 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-black/45 text-2xl backdrop-blur-sm hover:bg-white hover:text-black"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next full-size product photo"
                className="absolute top-1/2 right-5 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-black/45 text-2xl backdrop-blur-sm hover:bg-white hover:text-black"
              >
                →
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
