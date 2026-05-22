import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
const OG_IMAGE_PATH = "/og-dashboard.jpg";

function resolveMetadataBase(): URL {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined);

  if (!fromEnv) {
    return new URL(PRODUCTION_ORIGIN);
  }

  try {
    return new URL(fromEnv);
  } catch {
    return new URL(PRODUCTION_ORIGIN);
  }
}

const metadataBase = resolveMetadataBase();

export const metadata: Metadata = {
  metadataBase,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: "/",
    images: [
      {
        url: OG_IMAGE_PATH,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_PATH],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
