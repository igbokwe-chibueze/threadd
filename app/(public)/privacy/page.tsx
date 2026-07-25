import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How the THREADD demonstration handles personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <EditorialPage
      eyebrow="Privacy / Plain language"
      title="Only what the store needs."
      introduction="THREADD is designed to collect the minimum information required to operate accounts, orders, support, and secure payments."
      sections={[
        {
          title: "Account information",
          body: "Names, email addresses, saved delivery details, and authentication records are used to provide customer accounts and protect access.",
        },
        {
          title: "Order information",
          body: "Delivery details, order contents, payment references, and status history are retained to fulfil orders, provide support, and reconcile transactions.",
        },
        {
          title: "Payments",
          body: "Card details will be handled by Paystack and are not stored by THREADD. The store retains provider references and verified payment outcomes.",
        },
        {
          title: "Operational logs",
          body: "Security and reliability logs use route templates, internal references, status values, and error categories. Passwords, tokens, payment-card data, customer contact details, request bodies, and full provider responses are deliberately excluded or redacted.",
        },
        {
          title: "Retention and requests",
          body: "Order and payment records may need to be retained for fulfilment, support, reconciliation, and legal obligations. A real merchant must publish its approved retention periods and a verified process for access, correction, deletion, or other privacy requests before launch.",
        },
        {
          title: "Public demo",
          body: "The portfolio deployment uses isolated demonstration data. Visitors should not enter real private information because demo changes are designed to be reset.",
        },
      ]}
      note="This page is an implementation-stage summary and must receive legal review before a real merchant launch."
    />
  );
}
