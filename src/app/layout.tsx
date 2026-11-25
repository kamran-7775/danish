import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { League_Gothic, Archivo, Oswald, Rye } from "next/font/google";
import { portfolio } from "@/data/portfolio";
import "./globals.css";

/* Root layout: fonts + base styles only. The public site's chrome (intro, grain, cursor,
   smooth scroll, HUD) lives in app/(site)/layout.tsx; the admin has its own layout. */

/* Fonts (self-hosted by next/font, with size-matched fallbacks)
   - League Gothic: tall condensed (PORTFOLIO hero)
   - Archivo (wide axis): heavy wide headings (HELLO, SKILLS, ABOUT ME band)
   - Oswald: condensed body and label text
   - Rye: decorative western display (EDITOR / SHOWREEL bands) */
const gothic = League_Gothic({ subsets: ["latin"], variable: "--font-gothic", display: "swap" });
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["wdth"],
});
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", display: "swap" });
const rye = Rye({ subsets: ["latin"], weight: "400", variable: "--font-western", display: "swap" });

export const metadata: Metadata = {
  title: portfolio.meta.title,
  description: portfolio.meta.description,
  metadataBase: new URL(portfolio.meta.url),
  openGraph: { title: portfolio.meta.title, description: portfolio.meta.description, type: "website" },
};

export const viewport: Viewport = { themeColor: "#E8E8E6" };

export default function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = portfolio;
  return (
    <html
      lang="en"
      className={`${gothic.variable} ${archivo.variable} ${oswald.variable} ${rye.variable}`}
      style={
        {
          "--accent": theme.accent,
          "--highlight": theme.highlight,
          "--orange": theme.showreel,
        } as CSSProperties
      }
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
