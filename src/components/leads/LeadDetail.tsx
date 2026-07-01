"use client";

import type { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AiProfilePromptBox } from "@/components/prompts/AiProfilePromptBox";
import { ColdEmailPromptBox } from "@/components/prompts/ColdEmailPromptBox";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{value || "未填写"}</div>
    </div>
  );
}

export function LeadDetail({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{lead.companyName}</h2>
            <p className="mt-1 text-sm text-slate-500">{lead.domain || lead.website || "未填写官网"}</p>
          </div>
          <div className="flex gap-2">
            <Badge>{lead.matchLevel}</Badge>
            <Badge tone={lead.status === "replied" ? "green" : "blue"}>{lead.status}</Badge>
          </div>
        </div>
        <div className="mt-5 grid gap-x-8 md:grid-cols-2">
          <DetailRow label="国家" value={lead.country} />
          <DetailRow label="客户类型" value={lead.customerType} />
          <DetailRow label="产品关键词" value={lead.productKeyword} />
          <DetailRow label="官网" value={lead.website ? <a className="text-sky-700 hover:underline" href={lead.website} rel="noreferrer" target="_blank">{lead.website}</a> : ""} />
          <DetailRow label="来源链接" value={<a className="text-sky-700 hover:underline" href={lead.sourceUrl} rel="noreferrer" target="_blank">{lead.sourceUrl}</a>} />
          <DetailRow label="来源标题" value={lead.sourceTitle} />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-950">证据文本</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {lead.evidenceText || lead.sourceSnippet || "未填写"}
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-950">联系方式</h2>
        <div className="mt-2 grid gap-x-8 md:grid-cols-2">
          <DetailRow label="邮箱" value={lead.email} />
          <DetailRow label="电话" value={lead.phone} />
          <DetailRow label="LinkedIn" value={lead.linkedinUrl ? <a className="text-sky-700 hover:underline" href={lead.linkedinUrl} rel="noreferrer" target="_blank">{lead.linkedinUrl}</a> : ""} />
          <DetailRow label="地址" value={lead.address} />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-950">备注</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{lead.notes || "未填写"}</p>
      </Card>

      <AiProfilePromptBox lead={lead} />
      <ColdEmailPromptBox lead={lead} />
    </div>
  );
}
