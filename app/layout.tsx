import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { clinicJsonLd, serializeJsonLd } from "@/lib/shared/clinic";
import { DEFAULT_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/shared/site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0067FF",
};

const siteJsonLd = () => {
  const { "@context": context, ...organization } = clinicJsonLd();
  return {
    "@context": context,
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}/#website`,
        name: SITE_NAME,
        url: siteUrl(),
        inLanguage: "en",
        publisher: { "@id": `${siteUrl()}/#organization` },
      },
    ],
  };
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd()) }}
        />
        <AppProviders>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100vh",
              margin: 0,
              padding: 0,
            }}
          >
            <div>
              <div className="flex flex-col min-h-screen w-full ">
                <Header />
                <main className="flex-1 w-full overflow-x-auto">
                  <div>{children}</div>
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
