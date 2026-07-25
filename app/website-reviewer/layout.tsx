import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Investor Website Reviewer — B4U Pitch Pro",
  description:
    "Enter your website URL and see it the way an early-stage investor would — value proposition, trust signals, UX, and conversion clarity, scored against objective criteria.",
};

export default function WebsiteReviewerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
