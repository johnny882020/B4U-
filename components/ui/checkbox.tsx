import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border border-input bg-background transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
            checked && "border-primary bg-primary text-primary-foreground",
            className,
          )}
        >
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
