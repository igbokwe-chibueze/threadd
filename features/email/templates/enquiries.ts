type EnquiryEmailDetails = Readonly<{
  reference: string;
  name: string;
  message: string;
  productName?: string;
  productUrl?: string;
}>;

export function createEnquiryConfirmationEmail(details: EnquiryEmailDetails) {
  const context = details.productName
    ? `\nProduct: ${details.productName}${details.productUrl ? `\n${details.productUrl}` : ""}\n`
    : "";

  return {
    subject: `We received your THREADD enquiry — ${details.reference}`,
    textBody: `Hi ${details.name},

Thanks for contacting THREADD. Your message is safely in our inbox.
${context}
Reference: ${details.reference}

Your message:
${details.message}

This is a demo email preview. In a live store, our team would reply to this email address.`,
  };
}

export function createAdminEnquiryEmail(
  details: EnquiryEmailDetails & { email: string; phone?: string },
) {
  const context = details.productName
    ? `Product: ${details.productName}${details.productUrl ? `\n${details.productUrl}` : ""}\n`
    : "Type: General enquiry\n";

  return {
    subject: `New THREADD enquiry — ${details.reference}`,
    textBody: `A new enquiry needs attention.

Reference: ${details.reference}
Name: ${details.name}
Email: ${details.email}
Phone: ${details.phone ?? "Not supplied"}
${context}
Message:
${details.message}

Open the THREADD Studio enquiry inbox to review and update it.`,
  };
}
