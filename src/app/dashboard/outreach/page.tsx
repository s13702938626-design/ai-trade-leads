"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/types/lead";
import type { OutreachChannel } from "@/types/outreach";
import { getLeads } from "@/lib/lead-storage";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { OutreachChannelBadge } from "@/components/outreach/OutreachChannelBadge";
import { PipelineStatusBadge } from "@/components/followups/PipelineStatusBadge";

function latestDraft(lead: Lead) {
  return [...(lead.outreachDrafts ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function countByChannel(leads: Lead[], channels: OutreachChannel[]): number {
  return leads.reduce(
    (total, lead) => total + (lead.outreachDrafts ?? []).filter((draft) => channels.includes(draft.channel)).length,
    0,
  );
}

function needsDraft(lead: Lead): boolean {
  if ((lead.outreachDrafts ?? []).length > 0) return false;
  return (
    lead.aiAnalysis?.recommendedDecision === "develop_now" ||
    lead.pipelineStatus === "ready_to_contact" ||
    lead.pipelineStatus === "contacted"
  );
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const refresh = () => setLeads(getLeads());
    refresh();
    window.addEventListener("leads:updated", refresh);
    return () => window.removeEventListener("leads:updated", refresh);
  }, []);

  const stats = useMemo(() => {
    const totalDrafts = leads.reduce((total, lead) => total + (lead.outreachDrafts ?? []).length, 0);
    return [
      { label: "有话术草稿客户", value: leads.filter((lead) => (lead.outreachDrafts ?? []).length > 0).length },
      { label: "草稿总数", value: totalDrafts },
      { label: "邮件草稿", value: countByChannel(leads, ["email_first_touch", "email_follow_up", "reply_follow_up"]) },
      { label: "LinkedIn 草稿", value: countByChannel(leads, ["linkedin_message"]) },
      { label: "WhatsApp 草稿", value: countByChannel(leads, ["whatsapp_message"]) },
      { label: "表单草稿", value: countByChannel(leads, ["website_form"]) },
    ];
  }, [leads]);

  const leadsWithDrafts = leads
    .filter((lead) => (lead.outreachDrafts ?? []).length > 0)
    .sort((a, b) => (latestDraft(b)?.createdAt ?? "").localeCompare(latestDraft(a)?.createdAt ?? ""));
  const leadsNeedingDrafts = leads.filter(needsDraft);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">开发话术中心</h2>
          <p className="mt-1 text-sm text-slate-600">集中查看本地保存的开发信、LinkedIn、WhatsApp 和表单草稿。</p>
        </div>
        <LinkButton href="/dashboard/leads" variant="secondary">
          选择客户生成草稿
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {stats.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-base font-semibold text-slate-950">已有开发话术草稿的客户</h3>
        {leadsWithDrafts.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="暂无开发话术草稿" description="进入客户详情页，可用 AI 或基础模板生成草稿。" />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">客户</th>
                  <th className="px-3 py-3">国家</th>
                  <th className="px-3 py-3">状态</th>
                  <th className="px-3 py-3">草稿数</th>
                  <th className="px-3 py-3">最新渠道</th>
                  <th className="px-3 py-3">最新时间</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leadsWithDrafts.map((lead) => {
                  const draft = latestDraft(lead);
                  return (
                    <tr key={lead.id}>
                      <td className="px-3 py-3 font-medium text-slate-950">{lead.companyName}</td>
                      <td className="px-3 py-3 text-slate-600">{lead.country || "未填写"}</td>
                      <td className="px-3 py-3"><PipelineStatusBadge status={lead.pipelineStatus} /></td>
                      <td className="px-3 py-3 text-slate-600">{(lead.outreachDrafts ?? []).length}</td>
                      <td className="px-3 py-3">{draft ? <OutreachChannelBadge channel={draft.channel} /> : "无"}</td>
                      <td className="px-3 py-3 text-slate-600">{draft?.createdAt ?? "无"}</td>
                      <td className="px-3 py-3">
                        <Link className="text-sky-700 hover:underline" href={`/dashboard/leads/${lead.id}`}>
                          查看客户
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-950">待生成话术建议</h3>
        <p className="mt-1 text-sm text-slate-600">来自 AI 建议立即开发、待开发或已联系但还没有草稿的客户。</p>
        {leadsNeedingDrafts.length === 0 ? (
          <p className="mt-4 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">暂无待生成话术建议。</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {leadsNeedingDrafts.map((lead) => (
              <Link
                className="rounded-md border border-slate-200 p-4 transition hover:bg-slate-50"
                href={`/dashboard/leads/${lead.id}`}
                key={lead.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{lead.companyName}</p>
                    <p className="mt-1 text-sm text-slate-600">{lead.productKeyword || "未填写产品关键词"}</p>
                  </div>
                  <PipelineStatusBadge status={lead.pipelineStatus} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
