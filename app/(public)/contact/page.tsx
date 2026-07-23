import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to contact THREADD for product and order support.",
};

export default function ContactPage() {
  return (
    <EditorialPage
      eyebrow="Contact / Start a conversation"
      title="Talk to THREADD."
      introduction="Questions about a piece, an order, delivery, or the project itself will have a clear place to land."
      sections={[
        {
          title: "Product questions",
          body: "Product-specific enquiries and WhatsApp sharing will be available with the catalogue. Each conversation will retain the relevant product context.",
        },
        {
          title: "Order support",
          body: "Registered customers will be able to reference an order from their account. Guest-order support will use the verified contact details supplied at checkout.",
        },
        {
          title: "Demo project",
          body: "THREADD is currently a portfolio demonstration. The working contact inbox arrives with the enquiry phase; no message form is presented before it can safely store submissions.",
        },
      ]}
      note="No fake contact form is shown during this phase. The functional enquiry workflow is scheduled for PHASE 6A."
    />
  );
}
