import type { Metadata } from "next";
import { Geist_Mono, Hanken_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Humanist-grotesque body/UI — warmer than Inter, still crisp at small sizes.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Soft display serif for headings — editorial warmth + trust.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal"],
});

export const metadata: Metadata = {
  title: "Clarion — Hear the proof, not the pedigree.",
  description:
    "Clarion gives every candidate the same AI-run voice interview, scores them consistently against your rubric, and shows you the exact words behind every judgment. You make the final call.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${hanken.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
