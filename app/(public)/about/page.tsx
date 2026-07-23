import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "About",
  description: "The thinking, place, and point of view behind THREADD.",
};

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="About / Lagos, Nigeria"
      title="Clothes without categories."
      introduction="THREADD is a unisex wardrobe shaped around people, movement, and the freedom to dress without inherited labels."
      sections={[
        {
          title: "Our point of view",
          body: "We start with proportion, texture, usefulness, and feeling—not a gendered department. Every piece is considered as part of a wardrobe that can be interpreted personally.",
        },
        {
          title: "Designed from Lagos",
          body: "The energy, pace, contrasts, and confidence of Lagos inform THREADD. The collection is intended for daily life in Nigeria and for wardrobes far beyond it.",
        },
        {
          title: "Built to be worn",
          body: "We favour pieces with a reason to return: adaptable shapes, useful layers, considered details, and enough character to remain memorable.",
        },
      ]}
    />
  );
}
