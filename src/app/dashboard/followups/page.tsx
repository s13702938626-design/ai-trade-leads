"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead, LeadPipelineStatus } from "@/types/lead";
import { getFollowUpStats, getLeads } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { FollowUpStatsCards } from "@/components/followups/FollowUpStatsCards";
import { FollowUpWorkbenchTable } from "@/components/followups/FollowUpWorkbenchTable";
import { TodayFollowUpList } from "@/components/followups/TodayFollowUpList";

const PIPELINE_FILTERS: Array<"all" | LeadPipelineStatus> = [
  "all",
  "new",
  "research_more",
  "ready_to_contact",
  "contacted",
  "follow_up",
  "replied",
  "qualified",
  "hold",
  "rejected",
];

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | LeadPipelineStatus>("all");

  function refresh() {
    setLeads(getLeads());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("leads:updated", refresh);
    return () => window.removeEventListener("leads:updated", refresh);
  }, []);

  const stats = getFollowUpStats();
  const today = new Date().toISOString().slice(0, 10);
  const dueTasks = useMemo(
    () =>
      leads.flatMap((lead) =>
        (lead.followUpTasks ?? [])
          .filter((task) => task.status === "pending" && task.dueDate <= today)
          .map((task) => ({ lead, task })),
      ),
    [leads, today],
  );
  const readyLeads = leads.filter(
    (lead) =>
      lead.aiAnalysis?.recommendedDecision === "develop_now" ||
      lead.pipelineStatus === "ready_to_contact" ||
      (lead.aiAnalysis?.fitScore ?? 0) >= 80,
  );
  const filteredLeads = statusFilter === "all" ? leads : leads.filter((lead) => (lead.pipelineStatus ?? "new") === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">客户开发动作台</h2>
        <p className="mt-1 text-sm text-slate-600">本地 CRM 式跟进流程，不自动发邮件，不自动联系客户。</p>
      </div>

      <FollowUpStatsCards stats={stats} />
      <TodayFollowUpList items={dueTasks} onChanged={refresh} />

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">待开发客户</h3>
            <p className="mt-1 text-sm text-slate-600">来自 AI 建议立即开发、AI 高分或用户已标记待开发的客户。这里只展示，不自动改状态。</p>
          </div>
          <Button type="button" variant="secondary" onClick={refresh}>刷新</Button>
        </div>
        <div className="mt-4">
          {readyLeads.length === 0 ? <EmptyState title="暂无待开发客户" /> : <FollowUpWorkbenchTable leads={readyLeads} onChanged={refresh} />}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">全部开发流程列表</h3>
          </div>
          <Select className="md:max-w-64" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | LeadPipelineStatus)}>
            {PIPELINE_FILTERS.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
        <div className="mt-4">
          {filteredLeads.length === 0 ? <EmptyState title="暂无客户" /> : <FollowUpWorkbenchTable leads={filteredLeads} onChanged={refresh} />}
        </div>
      </Card>
    </div>
  );
}
