import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicInformationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#ece8df]">
      <SiteHeader appearance="solid" />
      {children}
      <SiteFooter />
    </div>
  );
}
