import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms governing use of the THREADD portfolio demonstration.",
};

export default function TermsPage() {
  return (
    <EditorialPage
      eyebrow="Terms / Portfolio demonstration"
      title="The useful boundaries."
      introduction="This deployment demonstrates a realistic commerce experience, but it is not currently accepting live commercial orders."
      sections={[
        {
          title: "Demonstration use",
          body: "Visitors may explore customer and administrator workflows using the published demo accounts. Changes are temporary and may be removed during a scheduled reset.",
        },
        {
          title: "No live purchase",
          body: "Any eventual payment interface in the portfolio deployment will use Paystack test mode. No displayed test transaction creates a real sale or fulfilment obligation.",
        },
        {
          title: "Responsible access",
          body: "Visitors must not attempt to bypass permissions, access another visitor's data, disrupt the service, or upload unlawful or sensitive content.",
        },
        {
          title: "Production adaptation",
          body: "A real customer deployment will use separate infrastructure, merchant information, policies, integrations, and legally reviewed terms.",
        },
      ]}
      note="These demonstration terms are not a substitute for merchant-specific legal advice."
    />
  );
}
