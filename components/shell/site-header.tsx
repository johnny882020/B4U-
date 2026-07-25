"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { B4uLogo } from "@/components/shell/b4u-logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/deck-evaluator", label: "Deck Evaluator" },
  { href: "/website-reviewer", label: "Website Reviewer" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <B4uLogo />
          <span className="text-base font-semibold tracking-tight">B4U Pitch Pro</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
