import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { DemoBanner } from "@/components/layout/demo-banner";
import { NavigationFeedback } from "@/components/layout/navigation-feedback";
import { isDemoDeployment } from "@/features/demo/policy";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "THREADD — Clothes without categories",
    template: "%s — THREADD",
  },
  description:
    "A modern Nigerian unisex fashion store for clothes without categories.",
  applicationName: "THREADD",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "THREADD",
    title: "THREADD — Clothes without categories",
    description:
      "A modern Nigerian unisex fashion store for clothes without categories.",
    url: "/",
    locale: "en_NG",
    images: [
      {
        url: "/images/social/threadd-og.png",
        width: 1731,
        height: 909,
        alt: "THREADD — Clothes without categories",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THREADD — Clothes without categories",
    description:
      "A modern Nigerian unisex fashion store for clothes without categories.",
    images: [
      {
        url: "/images/social/threadd-og.png",
        width: 1731,
        height: 909,
        alt: "THREADD — Clothes without categories",
      },
    ],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showDemoBanner = isDemoDeployment();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={
          showDemoBanner
            ? "demo-deployment flex min-h-full flex-col"
            : "flex min-h-full flex-col"
        }
      >
        <Suspense fallback={null}>
          <NavigationFeedback />
        </Suspense>
        {children}
        {showDemoBanner ? <DemoBanner placement="bottom" /> : null}
      </body>
    </html>
  );
}
