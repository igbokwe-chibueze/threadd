import { describe, expect, it } from "vitest";

import {
  createAdminEnquiryEmail,
  createEnquiryConfirmationEmail,
} from "@/features/email/templates/enquiries";
import { createProductWhatsAppUrl } from "@/features/enquiries/whatsapp";
import { publicEnquirySchema } from "@/features/enquiries/validation";

describe("enquiry validation", () => {
  it("accepts a small valid general enquiry", () => {
    expect(
      publicEnquirySchema.safeParse({
        kind: "GENERAL",
        name: "Ada",
        email: "ADA@example.com",
        phone: "",
        message: "Please tell me about delivery.",
      }).success,
    ).toBe(true);
  });

  it("requires trusted product context for product enquiries", () => {
    const result = publicEnquirySchema.safeParse({
      kind: "PRODUCT",
      name: "Ada",
      email: "ada@example.com",
      phone: "",
      message: "Does this come in another size?",
    });
    expect(result.success).toBe(false);
  });
});

describe("enquiry messaging", () => {
  it("encodes WhatsApp text and its canonical product URL", () => {
    const url = new URL(
      createProductWhatsAppUrl({
        name: "Wide Leg Trouser",
        slug: "wide-leg-trouser",
        appUrl: "https://thread.example/",
        phoneNumber: "+234 801 234 5678",
      }),
    );
    expect(url.pathname).toBe("/2348012345678");
    expect(url.searchParams.get("text")).toContain("Wide Leg Trouser");
    expect(url.searchParams.get("text")).toContain(
      "https://thread.example/products/wide-leg-trouser",
    );
  });

  it("keeps user text as plain template content", () => {
    const input = {
      reference: "ENQ-123",
      name: "<script>Ada</script>",
      email: "ada@example.com",
      message: "<img src=x onerror=alert(1)>",
    };
    expect(createEnquiryConfirmationEmail(input).textBody).toContain(
      "<img src=x onerror=alert(1)>",
    );
    expect(createAdminEnquiryEmail(input).textBody).not.toContain("<html");
  });
});
