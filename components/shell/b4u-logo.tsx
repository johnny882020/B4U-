import { cn } from "@/lib/utils";

export function B4uLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary",
        className,
      )}
      aria-hidden="true"
    >
      <span className="text-sm font-bold tracking-tight text-primary-foreground">B4u</span>
    </div>
  );
}
