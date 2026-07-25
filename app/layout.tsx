import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "B4U Pitch Pro — AI Investor Feedback for Founders",
  description:
    "Get structured, investor-perspective feedback on your pitch deck and your website — built by Base4u Solutions for solo founders who want to know how investors really see them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
