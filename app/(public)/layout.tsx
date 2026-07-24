import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentSession } from "@/features/auth/authorization";
import { getCurrentCartQuantity } from "@/features/cart/service";
import { getUnreadEmailMessageCount } from "@/features/email/queries";

export default async function PublicInformationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartQuantity, session] = await Promise.all([
    getCurrentCartQuantity(),
    getCurrentSession(),
  ]);
  const unreadMessageCount = await getUnreadEmailMessageCount(session?.user.id);

  return (
    <div className="min-h-screen bg-[#ece8df]">
      <SiteHeader
        appearance="solid"
        cartQuantity={cartQuantity}
        isSignedIn={Boolean(session)}
        unreadMessageCount={unreadMessageCount}
      />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
