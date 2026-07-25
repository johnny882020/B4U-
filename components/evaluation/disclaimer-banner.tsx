import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function DisclaimerBanner({ title, text }: { title: string; text: string }) {
  return (
    <Alert variant="info">
      <div className="flex gap-2">
        <Info className="h-4 w-4 shrink-0 translate-y-0.5 text-accent" />
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{text}</AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
