"use client";

import { motion, useReducedMotion } from "framer-motion";

type RevealProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}>;

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 28,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: distance, filter: "blur(8px)" }
      }
      whileInView={
        prefersReducedMotion
          ? undefined
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
