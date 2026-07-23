import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "Returns",
  description: "THREADD cancellation, return, and refund principles.",
};

export default function ReturnsPage() {
  return (
    <EditorialPage
      eyebrow="Returns / Clear by design"
      title="A considered way back."
      introduction="Returns and refunds will follow explicit order states so customer service, payment records, and inventory remain accurate."
      sections={[
        {
          title: "Seven-day window",
          body: "Eligible items may be requested for return within seven days of confirmed delivery. Items must be unworn and retain their original tags and packaging.",
        },
        {
          title: "Before dispatch",
          body: "Customers may request cancellation before dispatch. Paid cancellations require staff approval before the refund process begins.",
        },
        {
          title: "After dispatch",
          body: "Dispatched orders use the return workflow rather than cancellation. This preserves an accurate fulfilment and delivery history.",
        },
        {
          title: "Refunds and stock",
          body: "Refund completion and inventory restoration are separate actions. Returned stock is restored only after receipt and inspection confirm that it is sellable.",
        },
      ]}
      note="Final eligibility details will be confirmed in checkout and displayed before an order is placed."
    />
  );
}
