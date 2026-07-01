"use client";

import type { SerperSearchCandidate } from "@/types/search";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDomainFromSearchLink } from "@/lib/search-result-filters";

type SerperCandidateTableProps = {
  candidates: SerperSearchCandidate[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onStageSelected: () => void;
};

export function SerperCandidateTable({
  candidates,
  selectedIds,
  onToggle,
  onStageSelected,
}: SerperCandidateTableProps) {
function displayDomain(candidate: SerperSearchCandidate): string {
    return candidate.domain || getDomainFromSearchLink(candidate.link) || "";
  }

  function decisionLabel(candidate: SerperSearchCandidate): string {
    const decision = candidate.review?.decision ?? "unknown";
    const labels = {
      save: "建议保存",
      research_more: "继续研究",
      reject: "不建议保存",
      unknown: "证据不足",
    };

    return labels[decision];
  }

  function decisionTone(candidate: SerperSearchCandidate): "neutral" | "green" | "amber" | "red" | "blue" {
    const decision = candidate.review?.decision ?? "unknown";
    if (decision === "save") return "green";
    if (decision === "research_more") return "blue";
    if (decision === "reject") return "neutral";
    return "neutral";
  }

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">候选客户</h3>
          <p className="mt-1 text-sm text-slate-600">Serper 搜索结果只是候选，勾选后仍需人工确认才能保存。</p>
        </div>
        <Button disabled={selectedIds.length === 0} onClick={onStageSelected} type="button">
          把选中结果加入待确认录入
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">选择</th>
              <th className="px-4 py-3">title</th>
              <th className="px-4 py-3">domain</th>
              <th className="px-4 py-3">snippet</th>
              <th className="px-4 py-3">source link</th>
              <th className="px-4 py-3">预审分数</th>
              <th className="px-4 py-3">匹配度</th>
              <th className="px-4 py-3">建议动作</th>
              <th className="px-4 py-3">主要理由</th>
              <th className="px-4 py-3">position</th>
              <th className="px-4 py-3">fetchedAt</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {candidates.map((candidate) => (
              <tr className="align-top hover:bg-slate-50" key={candidate.id}>
                <td className="px-4 py-3">
                  <input
                    checked={selectedIds.includes(candidate.id)}
                    onChange={() => onToggle(candidate.id)}
                    type="checkbox"
                  />
                </td>
                <td className="max-w-xs px-4 py-3 font-medium text-slate-950">{candidate.title || ""}</td>
                <td className="px-4 py-3 text-slate-700">{displayDomain(candidate)}</td>
                <td className="max-w-md px-4 py-3 text-slate-700">{candidate.snippet || ""}</td>
                <td className="max-w-xs px-4 py-3">
                  {candidate.link ? (
                    <a className="break-all text-sky-700 hover:underline" href={candidate.link} rel="noreferrer" target="_blank">
                      {candidate.link}
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate-700">{candidate.review?.score ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge>{candidate.review?.fitLevel ?? "unknown"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={decisionTone(candidate)}>{decisionLabel(candidate)}</Badge>
                </td>
                <td className="max-w-sm px-4 py-3 text-slate-700">
                  {(candidate.review?.reasons ?? []).slice(0, 2).join("；")}
                </td>
                <td className="px-4 py-3 text-slate-700">{candidate.position}</td>
                <td className="px-4 py-3 text-slate-700">{candidate.fetchedAt}</td>
                <td className="px-4 py-3">
                  {candidate.link ? (
                    <a
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      href={candidate.link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      打开来源链接
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
