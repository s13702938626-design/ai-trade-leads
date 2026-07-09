import type { LeadPipelineStatus } from "@/types/lead";
import { Badge } from "@/components/ui/Badge";

export const PIPELINE_STATUS_LABELS: Record<LeadPipelineStatus, string> = {
  new: "新客户",
  research_more: "继续调研",
  ready_to_contact: "待开发",
  contacted: "已联系",
  follow_up: "待跟进",
  replied: "已回复",
  qualified: "合格客户",
  hold: "暂缓",
  rejected: "已放弃",
};

export function PipelineStatusBadge({ status }: { status?: LeadPipelineStatus }) {
  const value = status ?? "new";
  const tone = value === "qualified" || value === "replied" ? "green" : value === "rejected" ? "neutral" : value === "follow_up" ? "amber" : "blue";
  return <Badge tone={tone}>{PIPELINE_STATUS_LABELS[value]}</Badge>;
}
