import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Start my company – start selskap i 9 land med AI",
  description: "Finn riktig land og selskapsform, se kostnader og skatt, og få ferdige stiftelsesdokumenter. Norge, Sverige, Danmark, Estland, Polen, Sveits, UAE, Filippinene og Storbritannia.",
  openGraph: { title: "Start my company", description: "Start selskap i 9 land med hjelp fra AI.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#2747D0", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
