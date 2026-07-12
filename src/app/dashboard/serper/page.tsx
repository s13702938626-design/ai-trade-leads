"use client";

import { useEffect, useMemo, useState } from "react";
import type { CandidateReviewDecision, SearchRunRecord, SerperSearchCandidate } from "@/types/search";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SerperCandidateTable } from "@/components/search/SerperCandidateTable";
import {
  SerperSearchForm,
  type SerperSearchFormValues,
} from "@/components/search/SerperSearchForm";
import { ConfirmCandidateLeadForm } from "@/components/search/ConfirmCandidateLeadForm";
import { buildRelaxedQueries } from "@/lib/search-relaxation";
import {
  clearSearchRuns,
  listSearchRuns,
  saveSearchRun,
  updateSearchRunSavedLeadCount,
} from "@/lib/search-run-storage";

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

type ReviewFilter = "all" | CandidateReviewDecision;

const REVIEW_FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "全部候选" },
  { value: "save", label: "只看建议保存" },
  { value: "research_more", label: "只看继续研究" },
  { value: "reject", label: "只看不建议保存" },
  { value: "unknown", label: "只看证据不足" },
];

export default function SerperSearchPage() {
  const [values, setValues] = useState<SerperSearchFormValues | null>(null);
  const [candidates, setCandidates] = useState<SerperSearchCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [debugInfo, setDebugInfo] = useState<SearchDebugInfo | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [searchRunId, setSearchRunId] = useState<string | null>(null);
  const [searchRuns, setSearchRuns] = useState<SearchRunRecord[]>([]);
  const [queryOverride, setQueryOverride] = useState("");
  const [showHiddenResults, setShowHiddenResults] = useState(false);

  useEffect(() => {
    const refresh = () => setSearchRuns(listSearchRuns());
    refresh();
    window.addEventListener("search-runs:updated", refresh);
    return () => window.removeEventListener("search-runs:updated", refresh);
  }, []);

  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => pendingIds.includes(candidate.id)),
    [candidates, pendingIds],
  );
  const reviewStats = useMemo(() => {
    return {
      total: candidates.length,
      save: candidates.filter((candidate) => candidate.review?.decision === "save").length,
      research_more: candidates.filter((candidate) => candidate.review?.decision === "research_more").length,
      reject: candidates.filter((candidate) => candidate.review?.decision === "reject").length,
      unknown: candidates.filter((candidate) => candidate.review?.decision === "unknown" || !candidate.review).length,
      targetEndUser: candidates.filter((candidate) => candidate.businessRole === "target_end_user").length,
      targetDistributor: candidates.filter((candidate) => candidate.businessRole === "target_distributor" || candidate.businessRole === "target_trader").length,
      peerSupplier: candidates.filter((candidate) => candidate.businessRole === "peer_supplier").length,
      hidden: candidates.filter((candidate) => candidate.shouldHideByDefault).length,
      highValue: candidates.filter((candidate) => (candidate.buyerFitScore ?? 0) >= 70 && (candidate.peerRiskScore ?? 0) < 40).length,
    };
  }, [candidates]);
  const visibleCandidates = useMemo(() => {
    const filtered = reviewFilter === "all"
      ? candidates
      : candidates.filter((candidate) => (candidate.review?.decision ?? "unknown") === reviewFilter);

    if (values?.hidePeerSuppliers && !showHiddenResults) {
      return filtered.filter((candidate) => !candidate.shouldHideByDefault);
    }

    return filtered;
  }, [candidates, reviewFilter, showHiddenResults, values?.hidePeerSuppliers]);
  const relaxedQueries = useMemo(() => {
    if (!values || (debugInfo?.candidateCount ?? 1) > 0) {
      return [];
    }

      return buildRelaxedQueries({
        productKeyword: values.industry,
        country: values.country,
        customerType: values.customerType,
        productLineId: values.productLineId,
      });
  }, [debugInfo?.candidateCount, values]);

  function createRunId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

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
          productKeyword: nextValues.industry,
          customerType: nextValues.customerType,
          productLineId: nextValues.productLineId,
          searchPlan: nextValues.searchPlan,
          limit: nextValues.limit,
        }),
      });
      const data = (await response.json()) as SerperSearchResponse;

      if (!response.ok) {
        setError(data.error || "Serper 搜索失败");
        return;
      }

      const runId = createRunId();
      const candidatesWithRunId = data.candidates.map((candidate) => ({
        ...candidate,
        searchRunId: runId,
      }));
      setSearchRunId(runId);
      setCandidates(candidatesWithRunId);
      setReviewFilter("all");
      setDebugInfo({
        rawOrganicCount: data.rawOrganicCount,
        candidateCount: data.candidateCount,
        filteredOutCount: data.filteredOutCount,
      });
      saveSearchRun({
        id: runId,
        query: data.query,
        mode: nextValues.mode,
        productKeyword: nextValues.industry,
        country: nextValues.country,
        customerType: nextValues.customerType,
        rawOrganicCount: data.rawOrganicCount,
        candidateCount: data.candidateCount,
        filteredOutCount: data.filteredOutCount,
        reviewedSaveCount: candidatesWithRunId.filter((candidate) => candidate.review?.decision === "save").length,
        reviewedResearchMoreCount: candidatesWithRunId.filter((candidate) => candidate.review?.decision === "research_more").length,
        reviewedRejectCount: candidatesWithRunId.filter((candidate) => candidate.review?.decision === "reject").length,
        reviewedUnknownCount: candidatesWithRunId.filter((candidate) => candidate.review?.decision === "unknown" || !candidate.review).length,
        savedLeadCount: 0,
        targetEndUserCount: candidatesWithRunId.filter((candidate) => candidate.businessRole === "target_end_user").length,
        targetDistributorCount: candidatesWithRunId.filter((candidate) => candidate.businessRole === "target_distributor" || candidate.businessRole === "target_trader").length,
        peerSupplierCount: candidatesWithRunId.filter((candidate) => candidate.businessRole === "peer_supplier").length,
        hiddenPeerCount: candidatesWithRunId.filter((candidate) => candidate.shouldHideByDefault).length,
        averageBuyerFitScore: candidatesWithRunId.length > 0
          ? Math.round(candidatesWithRunId.reduce((sum, candidate) => sum + (candidate.buyerFitScore ?? 0), 0) / candidatesWithRunId.length)
          : 0,
        highValueCandidateCount: candidatesWithRunId.filter((candidate) => (candidate.buyerFitScore ?? 0) >= 70 && (candidate.peerRiskScore ?? 0) < 40).length,
        fetchedAt: data.fetchedAt,
      });
    } catch {
      setError("Serper 搜索请求失败，请检查网络或服务端配置。");
    } finally {
      setLoading(false);
    }
  }

  function toggleCandidate(id: string) {
    const candidate = candidates.find((item) => item.id === id);
    const willSelect = !selectedIds.includes(id);
    const decision = candidate?.review?.decision ?? "unknown";

    if (willSelect && candidate?.businessRole === "peer_supplier") {
      const confirmed = window.confirm("该结果可能是同行/供应商，不是目标客户。确定仍要保存吗？");
      if (!confirmed) {
        return;
      }
    } else if (willSelect && decision === "reject") {
      const confirmed = window.confirm("该候选结果被系统标记为不建议保存，是否仍要加入待确认录入？");
      if (!confirmed) {
        return;
      }
    }

    if (willSelect && decision === "research_more") {
      window.alert("该候选结果建议先打开来源链接确认官网内容，再加入待确认录入。");
    }

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
    if (searchRunId) {
      updateSearchRunSavedLeadCount(searchRunId, 1);
    }
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

      <SerperSearchForm loading={loading} onSearch={search} queryOverride={queryOverride} />

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
        <div className="space-y-4">
          <Card>
            <div className="grid gap-3 md:grid-cols-6">
              <div className="rounded-md bg-slate-50 px-3 py-3">
                <p className="text-xs text-slate-500">候选总数</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">{reviewStats.total}</p>
              </div>
              <div className="rounded-md bg-emerald-50 px-3 py-3">
                <p className="text-xs text-emerald-700">建议保存</p>
                <p className="mt-1 text-xl font-semibold text-emerald-900">{reviewStats.save}</p>
              </div>
              <div className="rounded-md bg-sky-50 px-3 py-3">
                <p className="text-xs text-sky-700">继续研究</p>
                <p className="mt-1 text-xl font-semibold text-sky-900">{reviewStats.research_more}</p>
              </div>
              <div className="rounded-md bg-slate-100 px-3 py-3">
                <p className="text-xs text-slate-600">不建议保存</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{reviewStats.reject}</p>
              </div>
              <div className="rounded-md bg-slate-100 px-3 py-3">
                <p className="text-xs text-slate-600">证据不足</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{reviewStats.unknown}</p>
              </div>
              <div className="rounded-md bg-red-50 px-3 py-3">
                <p className="text-xs text-red-700">隐藏结果</p>
                <p className="mt-1 text-xl font-semibold text-red-900">{reviewStats.hidden}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-5">
              <div className="rounded-md bg-emerald-50 px-3 py-3">
                <p className="text-xs text-emerald-700">目标使用商</p>
                <p className="mt-1 text-xl font-semibold text-emerald-900">{reviewStats.targetEndUser}</p>
              </div>
              <div className="rounded-md bg-sky-50 px-3 py-3">
                <p className="text-xs text-sky-700">贸易商/分销商</p>
                <p className="mt-1 text-xl font-semibold text-sky-900">{reviewStats.targetDistributor}</p>
              </div>
              <div className="rounded-md bg-slate-100 px-3 py-3">
                <p className="text-xs text-slate-600">同行/供应商</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{reviewStats.peerSupplier}</p>
              </div>
              <div className="rounded-md bg-emerald-50 px-3 py-3">
                <p className="text-xs text-emerald-700">高价值候选</p>
                <p className="mt-1 text-xl font-semibold text-emerald-900">{reviewStats.highValue}</p>
              </div>
              <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <input
                  checked={showHiddenResults}
                  onChange={(event) => setShowHiddenResults(event.target.checked)}
                  type="checkbox"
                />
                查看被隐藏的同行/无关结果
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {REVIEW_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  variant={reviewFilter === filter.value ? "primary" : "secondary"}
                  onClick={() => setReviewFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </Card>
          <SerperCandidateTable
            candidates={visibleCandidates}
            onStageSelected={stageSelected}
            onToggle={toggleCandidate}
            selectedIds={selectedIds}
          />
        </div>
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

      {relaxedQueries.length > 0 ? (
        <Card>
          <h3 className="text-base font-semibold text-slate-950">搜索收缩建议</h3>
          <p className="mt-1 text-sm text-slate-600">当前搜索没有候选结果，可以尝试更宽泛的搜索词。</p>
          <div className="mt-4 space-y-3">
            {relaxedQueries.map((strategy) => (
              <div
                className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between"
                key={strategy.id}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{strategy.label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{strategy.query}</p>
                  <p className="mt-1 text-xs text-slate-500">{strategy.purpose}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setQueryOverride(strategy.query)}
                  >
                    使用此收缩词
                  </Button>
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      search({
                        industry: values?.industry ?? "",
                        country: values?.country ?? "",
                        customerType: values?.customerType ?? "",
                        limit: values?.limit ?? 10,
                        query: strategy.query,
                        mode: "buyer_search",
                        productLineId: strategy.productLineId,
                        targetBuyerMode: values?.targetBuyerMode ?? "end_users",
                        strictness: strategy.strictness,
                        searchPlan: strategy,
                        hidePeerSuppliers: values?.hidePeerSuppliers ?? true,
                      })
                    }
                  >
                    直接搜索
                  </Button>
                </div>
              </div>
            ))}
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
              searchRunId={candidate.searchRunId ?? searchRunId}
            />
          ))}
        </div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">最近搜索效果</h3>
            <p className="mt-1 text-sm text-slate-600">只记录 query 和统计数量，不保存 API Key 或 Serper 原始响应。</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              clearSearchRuns();
              setSearchRuns([]);
            }}
          >
            清空搜索记录
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">时间</th>
                <th className="px-3 py-2">模式</th>
                <th className="px-3 py-2">query</th>
                <th className="px-3 py-2">raw</th>
                <th className="px-3 py-2">候选</th>
                <th className="px-3 py-2">建议保存</th>
                <th className="px-3 py-2">继续研究</th>
                <th className="px-3 py-2">不建议</th>
                <th className="px-3 py-2">使用商</th>
                <th className="px-3 py-2">分销商</th>
                <th className="px-3 py-2">同行</th>
                <th className="px-3 py-2">高价值</th>
                <th className="px-3 py-2">已保存</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {searchRuns.slice(0, 10).map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-2 text-slate-700">{record.fetchedAt}</td>
                  <td className="px-3 py-2 text-slate-700">{record.mode}</td>
                  <td className="max-w-md px-3 py-2 text-slate-950">{record.query}</td>
                  <td className="px-3 py-2 text-slate-700">{record.rawOrganicCount}</td>
                  <td className="px-3 py-2 text-slate-700">{record.candidateCount}</td>
                  <td className="px-3 py-2 text-slate-700">{record.reviewedSaveCount}</td>
                  <td className="px-3 py-2 text-slate-700">{record.reviewedResearchMoreCount}</td>
                  <td className="px-3 py-2 text-slate-700">{record.reviewedRejectCount}</td>
                  <td className="px-3 py-2 text-slate-700">{record.targetEndUserCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-700">{record.targetDistributorCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-700">{record.peerSupplierCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-700">{record.highValueCandidateCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-700">{record.savedLeadCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {searchRuns.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">暂无真实搜索记录</p> : null}
        </div>
      </Card>
    </div>
  );
}
