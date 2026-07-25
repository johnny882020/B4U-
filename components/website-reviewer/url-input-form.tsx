"use client";

import { useState } from "react";
import { z } from "zod";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const urlSchema = z.string().url();

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function UrlInputForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      setError("Website URL required");
      return;
    }

    const normalized = normalizeUrl(value);
    const parsed = urlSchema.safeParse(normalized);
    if (!parsed.success) {
      setError("Please enter a valid URL, e.g. yourcompany.com");
      return;
    }

    setError(null);
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="website-url">Your website URL</Label>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="website-url"
            placeholder="yourcompany.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pl-9"
          />
        </div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" size="lg">
        Review Your Website
      </Button>
    </form>
  );
}
