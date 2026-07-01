"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/types/lead";
import { getLeads } from "@/lib/lead-storage";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const refresh = () => setLeads(getLeads());
    refresh();
    window.addEventListener("leads:updated", refresh);
    return () => window.removeEventListener("leads:updated", refresh);
  }, []);

  const stats = [
    { label: "客户总数", value: leads.length },
    { label: "高匹配客户数", value: leads.filter((lead) => lead.matchLevel === "high").length },
    { label: "已发送客户数", value: leads.filter((lead) => lead.status === "emailed").length },
    { label: "已回复客户数", value: leads.filter((lead) => lead.status === "replied").length },
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
