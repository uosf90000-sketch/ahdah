import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: { default: "عُهدة | مساحتك توصل خير", template: "%s | عُهدة" },
  description: "منصة تربط المسافرين ذوي الوزن المتاح بمرسلي العُهد والطرود بين المدن.",
  applicationName: "عُهدة",
};

export const viewport: Viewport = { themeColor: "#116b4d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Header />
        <main className="pb-24 md:pb-0">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
