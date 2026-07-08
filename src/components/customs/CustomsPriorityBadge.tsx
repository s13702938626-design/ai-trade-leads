import type { CustomsLeadPriority } from "@/types/customs";
import { Badge } from "@/components/ui/Badge";

export function CustomsPriorityBadge({ priority }: { priority: CustomsLeadPriority }) {
  const tone = priority === "P0" ? "green" : priority === "P1" ? "blue" : priority === "P2" ? "amber" : "neutral";
  return <Badge tone={tone}>{priority}</Badge>;
}
