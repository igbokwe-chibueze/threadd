"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/images/campaign/threadd-hero-01.png",
    alt: "Two models wearing THREADD's neutral unisex tailoring",
    position: "object-[66%_center]",
  },
  {
    src: "/images/campaign/threadd-hero-02.png",
    alt: "Two models in ivory and charcoal THREADD tailoring",
    position: "object-[68%_center]",
  },
] as const;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={slides[activeIndex].src}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.1 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[activeIndex].src}
            alt={slides[activeIndex].alt}
            fill
            priority={activeIndex === 0}
            sizes="100vw"
            className={`object-cover ${slides[activeIndex].position}`}
          />
        </motion.div>
      </AnimatePresence>
      <div
        className="absolute right-0 bottom-4 left-0 z-20 flex justify-center gap-2 sm:bottom-6"
        aria-label="Campaign image selection"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show campaign image ${index + 1}`}
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-[width,background-color] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff3f] ${
              activeIndex === index ? "w-10 bg-[#d7ff3f]" : "w-5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </>
  );
}
