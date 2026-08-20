import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: { default: "عُهدة | سفر موثوق وتسليم مؤكّد", template: "%s | عُهدة" },
  description: "منصة تربط المسافرين ذوي الوزن المتاح بمرسلي العُهد والطرود بين المدن.",
  applicationName: "عُهدة",
};

export const viewport: Viewport = { themeColor: "#0b1f33", width: "device-width", initialScale: 1 };

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-arabic",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={plexArabic.variable}>
        <a href="#main-content" className="skip-link">تخطَّ إلى المحتوى</a>
        <Header />
        <main id="main-content" className="pb-28 md:pb-0">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
