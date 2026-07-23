import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#ece8df] text-[#171713]">
      <SiteHeader appearance="solid" />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
