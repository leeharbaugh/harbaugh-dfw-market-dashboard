import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "Harbaugh DFW Market Dashboard";
const SITE_DESCRIPTION =
  "Live housing and economic market intelligence for DFW, Arlington, and Mansfield, including mortgage rates, Case-Shiller data, CPI, inventory, and local housing activity.";
const PRODUCTION_ORIGIN = "https://dashboard.harbaughrealestate.com";
const OG_IMAGE_URL = `${PRODUCTION_ORIGIN}/og-dashboard.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: PRODUCTION_ORIGIN,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: PRODUCTION_ORIGIN,
    images: [
      {
        url: OG_IMAGE_URL,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
