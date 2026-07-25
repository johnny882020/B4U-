import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("group relative inline-flex items-center", className)}>
      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-md border border-border bg-popover p-2 text-xs font-normal text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
