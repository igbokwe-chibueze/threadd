import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "THREADD delivery zones and initial shipping fees across Nigeria.",
};

export default function DeliveryPage() {
  return (
    <EditorialPage
      eyebrow="Delivery / Across Nigeria"
      title="From Lagos to everywhere."
      introduction="THREADD will deliver throughout Nigeria using simple, server-calculated state zones that can later be updated by the store administrator."
      sections={[
        {
          title: "Lagos",
          body: "The initial delivery fee is ₦3,000. A final delivery estimate will be shown before payment.",
        },
        {
          title: "South-West zone",
          body: "Ogun, Oyo, Osun, Ondo, and Ekiti use an initial delivery fee of ₦4,500.",
        },
        {
          title: "All other states and FCT",
          body: "Every other Nigerian state and the Federal Capital Territory use an initial delivery fee of ₦6,000.",
        },
        {
          title: "How fees are confirmed",
          body: "The server will calculate delivery from the selected state. Browser-submitted prices will never be trusted, and the confirmed fee will be recorded with the order.",
        },
      ]}
      note="These are launch assumptions for the portfolio demo. They will become editable shipping configuration during checkout implementation."
    />
  );
}
