"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/types/evaluation";

const PRIORITY_VARIANT = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const;

export function Checklist({
  title,
  description,
  helperText,
  items,
}: {
  title: string;
  description: string;
  helperText: string;
  items: ChecklistItem[];
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string, value: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <li key={item.id} className="flex items-start gap-3">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(value) => toggle(item.id, value)}
                  className="mt-0.5"
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    isChecked && "text-muted-foreground line-through",
                  )}
                >
                  {item.item}
                </span>
                {item.priority && (
                  <Badge variant={PRIORITY_VARIANT[item.priority]} className="capitalize shrink-0">
                    {item.priority}
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">{helperText}</p>
      </CardContent>
    </Card>
  );
}
