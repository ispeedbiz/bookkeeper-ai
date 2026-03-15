import type { Metadata } from "next";
import { outfit, libreBaskerville } from "@/styles/fonts";
import TawkTo from "@/components/TawkTo";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookkeeperAI — AI-Powered Bookkeeping That Never Sleeps",
  description:
    "Outsource your bookkeeping to AI + expert accountants. Clean books delivered in 3 business days. Starting at CAD $249/mo. Trusted by 500+ CPAs across North America.",
  keywords: [
    "bookkeeping",
    "AI bookkeeping",
    "offshore accounting",
    "CPA outsourcing",
    "QuickBooks",
    "Xero",
    "payroll",
    "reconciliation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${libreBaskerville.variable}`}>
      <body className="bg-navy-950 text-white grain-overlay">
        {children}
        <TawkTo />
      </body>
    </html>
  );
}
