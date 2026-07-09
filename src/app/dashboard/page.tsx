"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import { getFollowUpStats, getLeads } from "@/lib/lead-storage";
import { getSearchRunStats } from "@/lib/search-run-storage";
import { getCustomsLeadStats } from "@/lib/customs-storage";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchStats, setSearchStats] = useState({
    searchCount: 0,
    candidateCount: 0,
    reviewedSaveCount: 0,
    savedLeadCount: 0,
    saveRate: 0,
  });
  const [customsStats, setCustomsStats] = useState({
    total: 0,
    highPriority: 0,
    converted: 0,
  });

  useEffect(() => {
    const refresh = () => {
      setLeads(getLeads());
      setSearchStats(getSearchRunStats());
      setCustomsStats(getCustomsLeadStats());
    };
    refresh();
    window.addEventListener("leads:updated", refresh);
    window.addEventListener("search-runs:updated", refresh);
    window.addEventListener("customs-leads:updated", refresh);
    return () => {
      window.removeEventListener("leads:updated", refresh);
      window.removeEventListener("search-runs:updated", refresh);
      window.removeEventListener("customs-leads:updated", refresh);
    };
  }, []);

  const stats = [
    { label: "客户总数", value: leads.length },
    { label: "高匹配客户数", value: leads.filter((lead) => lead.matchLevel === "high").length },
    { label: "已发送客户数", value: leads.filter((lead) => lead.status === "emailed").length },
    { label: "已回复客户数", value: leads.filter((lead) => lead.status === "replied").length },
  ];
  const aiStats = [
    { label: "已 AI 分析客户数量", value: leads.filter((lead) => lead.aiAnalysis).length },
    { label: "AI 建议立即开发数量", value: leads.filter((lead) => lead.aiAnalysis?.recommendedDecision === "develop_now").length },
    { label: "AI 建议继续调研数量", value: leads.filter((lead) => lead.aiAnalysis?.recommendedDecision === "research_more").length },
    {
      label: "AI 高匹配客户数量",
      value: leads.filter((lead) => lead.aiAnalysis?.fitLevel === "high" || (lead.aiAnalysis?.fitScore ?? 0) >= 80).length,
    },
  ];
  const followUpStats = getFollowUpStats();
  const outreachStats = [
    { label: "有开发话术客户", value: leads.filter((lead) => (lead.outreachDrafts ?? []).length > 0).length },
    { label: "开发话术草稿总数", value: leads.reduce((total, lead) => total + (lead.outreachDrafts ?? []).length, 0) },
    {
      label: "待生成话术客户",
      value: leads.filter((lead) => {
        if ((lead.outreachDrafts ?? []).length > 0) return false;
        return (
          lead.aiAnalysis?.recommendedDecision === "develop_now" ||
          lead.pipelineStatus === "ready_to_contact" ||
          lead.pipelineStatus === "contacted"
        );
      }).length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">真实客户统计</h2>
          <p className="mt-1 text-sm text-slate-600">统计只来自 localStorage 中手动录入或 CSV 导入的数据。</p>
        </div>
        <LinkButton href="/dashboard/search" variant="secondary">
          生成搜索词
        </LinkButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-950">Serper 实时搜索</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            调用实时搜索 API 返回候选客户。搜索结果不会自动保存，必须人工确认 companyName、productKeyword 和 sourceUrl 后才能入库。
          </p>
          <LinkButton className="mt-4" href="/dashboard/serper" variant="secondary">
            进入 Serper 实时搜索
          </LinkButton>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-slate-950">开发话术中心</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            为已保存客户生成邮件、LinkedIn、WhatsApp 和网站表单草稿。草稿只保存到本地，不会自动发送。
          </p>
          <LinkButton className="mt-4" href="/dashboard/outreach" variant="secondary">
            进入开发话术中心
          </LinkButton>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <p className="text-sm text-slate-500">最近搜索次数</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{searchStats.searchCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">最近候选客户数量</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{searchStats.candidateCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">最近建议保存数量</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{searchStats.reviewedSaveCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">最近实际保存数量</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{searchStats.savedLeadCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">保存率</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {`${Math.round(searchStats.saveRate * 100)}%`}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">海关线索数量</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{customsStats.total}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">P0/P1 高优先级海关线索</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{customsStats.highPriority}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已转客户数量</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{customsStats.converted}</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {aiStats.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        {[
          { label: "待开发客户数量", value: followUpStats.readyToContactCount },
          { label: "今日待跟进数量", value: followUpStats.todayFollowUpCount },
          { label: "逾期待跟进数量", value: followUpStats.overdueFollowUpCount },
          { label: "已联系数量", value: followUpStats.contactedCount },
          { label: "已回复数量", value: followUpStats.repliedCount },
          { label: "合格客户数量", value: followUpStats.qualifiedCount },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {outreachStats.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
          </Card>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState title="暂无真实客户数据" description="请先通过搜索页找到公开来源，再手动录入客户或导入 CSV。" />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label}>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
