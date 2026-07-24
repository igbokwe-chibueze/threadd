import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentCartQuantity } from "@/features/cart/service";

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cartQuantity = await getCurrentCartQuantity();

  return (
    <div className="min-h-screen bg-[#ece8df] text-[#171713]">
      <SiteHeader appearance="solid" cartQuantity={cartQuantity} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
