import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "AuraFinance | Personal Finance Management & AI Intelligence",
  description: "AuraFinance is an advanced personal finance platform using AI OCR receipt parsing, automated spend categorization, and machine learning spending forecasts.",
  keywords: ["personal finance", "finance dashboard", "AI OCR", "receipt parsing", "spend forecasting", "expense tracker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full bg-[#0b0f19] text-[#f8fafc] antialiased">
        {children}
      </body>
    </html>
  );
}
