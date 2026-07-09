"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AiProfilePromptBox } from "@/components/prompts/AiProfilePromptBox";
import { ColdEmailPromptBox } from "@/components/prompts/ColdEmailPromptBox";
import { LeadAiAnalysisPanel } from "@/components/leads/LeadAiAnalysisPanel";
import { completeFollowUpTask, cancelFollowUpTask, getLeads } from "@/lib/lead-storage";
import { LeadActivityTimeline } from "@/components/followups/LeadActivityTimeline";
import { LeadPipelineActions } from "@/components/followups/LeadPipelineActions";
import { PipelineStatusBadge } from "@/components/followups/PipelineStatusBadge";
import { Button } from "@/components/ui/Button";
import { OutreachDraftGenerator } from "@/components/outreach/OutreachDraftGenerator";
import { OutreachDraftList } from "@/components/outreach/OutreachDraftList";
import { OutreachQuickTemplates } from "@/components/outreach/OutreachQuickTemplates";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{value || "未填写"}</div>
    </div>
  );
}

export function LeadDetail({ lead }: { lead: Lead }) {
  const [currentLead, setCurrentLead] = useState(lead);

  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);

  function refreshCurrentLead() {
    const latestLead = getLeads().find((item) => item.id === currentLead.id);
    if (latestLead) setCurrentLead(latestLead);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{currentLead.companyName}</h2>
            <p className="mt-1 text-sm text-slate-500">{currentLead.domain || currentLead.website || "未填写官网"}</p>
          </div>
          <div className="flex gap-2">
            <Badge>{currentLead.matchLevel}</Badge>
            <Badge tone={currentLead.status === "replied" ? "green" : "blue"}>{currentLead.status}</Badge>
            <PipelineStatusBadge status={currentLead.pipelineStatus} />
          </div>
        </div>
        <div className="mt-5 grid gap-x-8 md:grid-cols-2">
          <DetailRow label="国家" value={currentLead.country} />
          <DetailRow label="客户类型" value={currentLead.customerType} />
          <DetailRow label="产品关键词" value={currentLead.productKeyword} />
          <DetailRow label="官网" value={currentLead.website ? <a className="text-sky-700 hover:underline" href={currentLead.website} rel="noreferrer" target="_blank">{currentLead.website}</a> : ""} />
          <DetailRow label="来源链接" value={<a className="text-sky-700 hover:underline" href={currentLead.sourceUrl} rel="noreferrer" target="_blank">{currentLead.sourceUrl}</a>} />
          <DetailRow label="来源标题" value={currentLead.sourceTitle} />
          <DetailRow label="来源类型" value={currentLead.sourceType} />
          <DetailRow label="fetchedAt" value={currentLead.fetchedAt} />
          <DetailRow label="searchRunId" value={currentLead.searchRunId} />
        </div>
      </Card>

      <LeadAiAnalysisPanel lead={currentLead} onUpdated={setCurrentLead} />
      <OutreachDraftGenerator lead={currentLead} onUpdated={setCurrentLead} />
      <OutreachQuickTemplates lead={currentLead} onUpdated={setCurrentLead} />

      <Card>
        <h2 className="text-base font-semibold text-slate-950">历史开发话术草稿</h2>
        <p className="mt-1 text-sm text-slate-600">草稿只保存到本地，不会自动发送，也不会自动修改客户状态。</p>
        <div className="mt-4">
          <OutreachDraftList drafts={currentLead.outreachDrafts ?? []} onChanged={refreshCurrentLead} />
        </div>
      </Card>

      <LeadPipelineActions lead={currentLead} onUpdated={setCurrentLead} />

      <Card>
        <h2 className="text-base font-semibold text-slate-950">Pending follow-up tasks</h2>
        {(currentLead.followUpTasks ?? []).filter((task) => task.status === "pending").length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">暂无待跟进任务</p>
        ) : (
          <div className="mt-4 space-y-3">
            {(currentLead.followUpTasks ?? []).filter((task) => task.status === "pending").map((task) => (
              <div className="rounded-md bg-slate-50 p-3" key={task.id}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.dueDate} · {task.channel}</p>
                    {task.note ? <p className="mt-2 text-sm text-slate-700">{task.note}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setCurrentLead(completeFollowUpTask(currentLead.id, task.id, "详情页完成跟进"))}>完成</Button>
                    <Button type="button" variant="secondary" onClick={() => setCurrentLead(cancelFollowUpTask(currentLead.id, task.id, "详情页取消跟进"))}>取消</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <LeadActivityTimeline activities={currentLead.activities ?? []} />

      <Card>
        <h2 className="text-base font-semibold text-slate-950">证据文本</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {currentLead.evidenceText || currentLead.sourceSnippet || "未填写"}
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-950">联系方式</h2>
        <div className="mt-2 grid gap-x-8 md:grid-cols-2">
          <DetailRow label="邮箱" value={currentLead.email} />
          <DetailRow label="电话" value={currentLead.phone} />
          <DetailRow label="LinkedIn" value={currentLead.linkedinUrl ? <a className="text-sky-700 hover:underline" href={currentLead.linkedinUrl} rel="noreferrer" target="_blank">{currentLead.linkedinUrl}</a> : ""} />
          <DetailRow label="地址" value={currentLead.address} />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-950">备注</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{currentLead.notes || "未填写"}</p>
      </Card>

      <AiProfilePromptBox lead={currentLead} />
      <ColdEmailPromptBox lead={currentLead} />
    </div>
  );
}
