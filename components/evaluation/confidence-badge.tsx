import { Badge } from "@/components/ui/badge";
import type { ConfidenceLevel } from "@/types/evaluation";

const VARIANT_BY_LEVEL: Record<ConfidenceLevel, "success" | "warning" | "destructive"> = {
  high: "success",
  medium: "warning",
  low: "destructive",
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <Badge variant={VARIANT_BY_LEVEL[level]} className="capitalize">
      {level} confidence
    </Badge>
  );
}
