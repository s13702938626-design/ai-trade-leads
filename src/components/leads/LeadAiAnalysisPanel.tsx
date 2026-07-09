"use client";

import { useState } from "react";
import type { Lead, LeadAiAnalysis } from "@/types/lead";
import { updateLeadAiAnalysis } from "@/lib/lead-storage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AnalyzeLeadResponse = {
  analysis?: LeadAiAnalysis;
  model?: string;
  analyzedAt?: string;
  error?: string;
};

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">未填写</p>
      )}
    </div>
  );
}

function decisionLabel(value: string): string {
  const labels: Record<string, string> = {
    develop_now: "立即开发",
    research_more: "继续调研",
    hold: "暂缓",
    reject: "不建议开发",
    unknown: "未知",
  };
  return labels[value] ?? value;
}

export function LeadAiAnalysisPanel({
  lead,
  onUpdated,
}: {
  lead: Lead;
  onUpdated?: (lead: Lead) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const analysis = lead.aiAnalysis;

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lead }),
      });
      const data = (await response.json()) as AnalyzeLeadResponse;
      if (!response.ok || !data.analysis || !data.model || !data.analyzedAt) {
        setError(data.error || "AI 分析失败");
        return;
      }

      const updated = updateLeadAiAnalysis(lead.id, data.analysis, data.model, data.analyzedAt);
      onUpdated?.(updated);
    } catch {
      setError("AI 分析请求失败，请检查服务端配置或网络。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">AI 客户深度分析</h2>
          <p className="mt-1 text-sm text-slate-600">AI 只基于当前 Lead 已有真实字段给出建议，不会自动修改状态或发送邮件。</p>
        </div>
        <Button disabled={loading} type="button" onClick={analyze}>
          {loading ? "分析中..." : analysis ? "重新分析" : "AI 分析客户"}
        </Button>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {!analysis ? (
        <p className="mt-5 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-600">尚未进行 AI 分析</p>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">fitScore</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{analysis.fitScore}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">fitLevel</p>
              <div className="mt-2"><Badge>{analysis.fitLevel}</Badge></div>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">recommendedDecision</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{decisionLabel(analysis.recommendedDecision)}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">confidence</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{analysis.confidence}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.summary}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">openingAngle</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.openingAngle}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">customerReality</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.customerReality}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">targetRelevance</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.targetRelevance}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock title="reasons" items={analysis.reasons} />
            <ListBlock title="possibleNeeds" items={analysis.possibleNeeds} />
            <ListBlock title="recommendedProducts" items={analysis.recommendedProducts} />
            <ListBlock title="risks" items={analysis.risks} />
            <ListBlock title="missingInfo" items={analysis.missingInfo} />
            <ListBlock title="evidenceUsed" items={analysis.evidenceUsed} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-500">nextAction</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.nextAction}</p>
          </div>

          <p className="text-xs text-slate-500">
            aiModel: {lead.aiModel || "unknown"} · aiAnalyzedAt: {lead.aiAnalyzedAt || "unknown"}
          </p>
        </div>
      )}
    </Card>
  );
}
