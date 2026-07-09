"use client";

import Link from "next/link";
import type { Lead, LeadPipelineStatus } from "@/types/lead";
import { recordContactAttempt, updateLeadPipelineStatus } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { PipelineStatusBadge } from "@/components/followups/PipelineStatusBadge";

export function FollowUpWorkbenchTable({
  leads,
  onChanged,
}: {
  leads: Lead[];
  onChanged: () => void;
}) {
  function markReady(leadId: string) {
    updateLeadPipelineStatus(leadId, "ready_to_contact", "动作台标记为待开发");
    onChanged();
  }

  function quickContact(lead: Lead) {
    recordContactAttempt(lead.id, "email", "动作台记录一次联系");
    onChanged();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">公司</th>
              <th className="px-4 py-3">国家</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">AI 分数</th>
              <th className="px-4 py-3">AI 建议</th>
              <th className="px-4 py-3">pipelineStatus</th>
              <th className="px-4 py-3">lastContactedAt</th>
              <th className="px-4 py-3">nextFollowUpAt</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium text-slate-950 hover:underline" href={`/dashboard/leads/${lead.id}`}>{lead.companyName}</Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.country || "未填写"}</td>
                <td className="px-4 py-3 text-slate-700">{lead.customerType || "未填写"}</td>
                <td className="px-4 py-3 text-slate-700">{lead.aiAnalysis?.fitScore ?? ""}</td>
                <td className="px-4 py-3 text-slate-700">{lead.aiAnalysis?.recommendedDecision ?? ""}</td>
                <td className="px-4 py-3"><PipelineStatusBadge status={lead.pipelineStatus as LeadPipelineStatus | undefined} /></td>
                <td className="px-4 py-3 text-slate-700">{lead.lastContactedAt ?? ""}</td>
                <td className="px-4 py-3 text-slate-700">{lead.nextFollowUpAt ?? ""}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => markReady(lead.id)}>标记为待开发</Button>
                    <Button type="button" variant="secondary" onClick={() => quickContact(lead)}>记录一次联系</Button>
                    <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href={`/dashboard/leads/${lead.id}`}>打开详情</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
