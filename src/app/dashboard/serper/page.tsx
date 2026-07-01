"use client";

import { useMemo, useState } from "react";
import type { SerperSearchCandidate } from "@/types/search";
import { Card } from "@/components/ui/Card";
import { SerperCandidateTable } from "@/components/search/SerperCandidateTable";
import {
  SerperSearchForm,
  type SerperSearchFormValues,
} from "@/components/search/SerperSearchForm";
import { ConfirmCandidateLeadForm } from "@/components/search/ConfirmCandidateLeadForm";

type SerperSearchResponse = {
  query: string;
  fetchedAt: string;
  rawOrganicCount: number;
  candidateCount: number;
  filteredOutCount: number;
  candidates: SerperSearchCandidate[];
  error?: string;
};

type SearchDebugInfo = {
  rawOrganicCount: number;
  candidateCount: number;
  filteredOutCount: number;
};

export default function SerperSearchPage() {
  const [values, setValues] = useState<SerperSearchFormValues | null>(null);
  const [candidates, setCandidates] = useState<SerperSearchCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [debugInfo, setDebugInfo] = useState<SearchDebugInfo | null>(null);

  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => pendingIds.includes(candidate.id)),
    [candidates, pendingIds],
  );

  async function search(nextValues: SerperSearchFormValues) {
    setLoading(true);
    setError("");
    setValues(nextValues);
    setCandidates([]);
    setSelectedIds([]);
    setPendingIds([]);
    setLastQuery(nextValues.query);
    setDebugInfo(null);

    try {
      const response = await fetch("/api/serper-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: nextValues.query,
          country: nextValues.country,
          limit: nextValues.limit,
        }),
      });
      const data = (await response.json()) as SerperSearchResponse;

      if (!response.ok) {
        setError(data.error || "Serper 搜索失败");
        return;
      }

      setCandidates(data.candidates);
      setDebugInfo({
        rawOrganicCount: data.rawOrganicCount,
        candidateCount: data.candidateCount,
        filteredOutCount: data.filteredOutCount,
      });
    } catch {
      setError("Serper 搜索请求失败，请检查网络或服务端配置。");
    } finally {
      setLoading(false);
    }
  }

  function toggleCandidate(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function stageSelected() {
    setPendingIds((current) => Array.from(new Set([...current, ...selectedIds])));
    setSelectedIds([]);
  }

  function removePending(id: string) {
    setPendingIds((current) => current.filter((item) => item !== id));
  }

  function removeAfterSaved(id: string) {
    setPendingIds((current) => current.filter((item) => item !== id));
    setCandidates((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">实时搜索候选客户</h2>
        <p className="mt-1 text-sm text-slate-600">
          调用 Serper Google Search API 获取候选结果。候选结果不会自动保存，必须人工确认后才能进入客户列表。
        </p>
      </div>

      <SerperSearchForm loading={loading} onSearch={search} />

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {lastQuery ? (
        <Card>
          <p className="text-xs font-medium uppercase text-slate-500">本次实际搜索词</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{lastQuery}</p>
          {debugInfo ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">Serper organic 原始数量</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{debugInfo.rawOrganicCount}</p>
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">过滤后候选数量</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{debugInfo.candidateCount}</p>
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">被过滤数量</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{debugInfo.filteredOutCount}</p>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {candidates.length > 0 ? (
        <SerperCandidateTable
          candidates={candidates}
          onStageSelected={stageSelected}
          onToggle={toggleCandidate}
          selectedIds={selectedIds}
        />
      ) : lastQuery && !loading && !error ? (
        <Card>
          <h3 className="text-base font-semibold text-slate-950">本次搜索没有可展示候选</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            可能原因：搜索词太窄、结果多为平台页面、或该国家/客户类型组合不佳。请尝试更宽泛搜索词，例如
            plastic distributor United States。
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">Serper organic 原始数量</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{debugInfo?.rawOrganicCount ?? 0}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">过滤后候选数量</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{debugInfo?.candidateCount ?? 0}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-3">
              <p className="text-xs text-slate-500">被过滤数量</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{debugInfo?.filteredOutCount ?? 0}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {pendingCandidates.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-950">待确认录入</h3>
            <p className="mt-1 text-sm text-slate-600">这里仍不是客户列表。只有点击确认保存，才会写入 localStorage。</p>
          </div>
          {pendingCandidates.map((candidate) => (
            <ConfirmCandidateLeadForm
              candidate={candidate}
              country={values?.country ?? ""}
              customerType={values?.customerType ?? ""}
              key={candidate.id}
              onCancel={removePending}
              onSaved={removeAfterSaved}
              productKeyword={values?.industry ?? ""}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
