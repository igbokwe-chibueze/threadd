const DEFAULT_APP_URL = "http://localhost:3000";

export function createProductWhatsAppUrl(input: {
  name: string;
  slug: string;
  appUrl?: string;
  phoneNumber?: string;
}): string {
  const appUrl = (input.appUrl ?? DEFAULT_APP_URL).replace(/\/$/, "");
  const text = `Hi THREADD, I have a question about ${input.name}: ${appUrl}/products/${input.slug}`;
  const phoneNumber = input.phoneNumber?.replace(/\D/g, "");
  const recipient = phoneNumber ? `/${phoneNumber}` : "";

  return `https://wa.me${recipient}?text=${encodeURIComponent(text)}`;
}
