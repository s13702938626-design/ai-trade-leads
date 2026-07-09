"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AiProfilePromptBox } from "@/components/prompts/AiProfilePromptBox";
import { ColdEmailPromptBox } from "@/components/prompts/ColdEmailPromptBox";
import { LeadAiAnalysisPanel } from "@/components/leads/LeadAiAnalysisPanel";

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
