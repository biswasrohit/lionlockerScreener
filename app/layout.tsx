import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Familjen_Grotesk, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const heading = Familjen_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Atkinson_Hyperlegible({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "LionLocker concept test",
  description: "A 5 minute class study about finding storage on campus.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c121c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="page">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
