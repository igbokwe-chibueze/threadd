import type { Metadata } from "next";

import { EditorialPage } from "@/components/layout/editorial-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How the THREADD demonstration handles personal information.",
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
          title: "Public demo",
          body: "The portfolio deployment uses isolated demonstration data. Visitors should not enter real private information because demo changes are designed to be reset.",
        },
      ]}
      note="This page is an implementation-stage summary and must receive legal review before a real merchant launch."
    />
  );
}
