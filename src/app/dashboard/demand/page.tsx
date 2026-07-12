"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DemandFreshnessWindow,
  DemandIntentType,
  DemandSearchPlan,
  DemandSignalStrength,
  DemandSourceChannel,
  RfqIntelMission,
  RfqIntelMissionCheck,
  RfqIntelMissionCheckResult,
} from "@/types/demand-intelligence";
import type { ProductLineId, SearchStrictness } from "@/types/search-intelligence";
import type { BuyerPlatformCategory, BuyerPlatformMission, BuyerPlatformUseCase } from "@/types/buyer-platform";
import type { SerperSearchCandidate } from "@/types/search";
import { PRODUCT_LINE_OPTIONS } from "@/lib/product-lines";
import { TARGET_MARKET_PRESET_OPTIONS, TARGET_MARKET_PRESETS, type TargetMarketPresetId } from "@/lib/target-market-presets";
import { TARGET_COUNTRIES } from "@/lib/constants";
import { generateDemandSearchPlans } from "@/lib/demand-search-query-builder";
import { generateRfqIntelMissions } from "@/lib/rfq-intel-mission-builder";
import { generateBuyerPlatformMissions } from "@/lib/buyer-platform-mission-builder";
import { addMissionCheck, deleteMissionCheck, listMissionChecks } from "@/lib/rfq-intel-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { ConfirmCandidateLeadForm } from "@/components/search/ConfirmCandidateLeadForm";

type DemandSearchResponse = {
  query: string;
  fetchedAt: string;
  rawOrganicCount: number;
  candidateCount: number;
  filteredOutCount: number;
  candidates: SerperSearchCandidate[];
  error?: string;
};

const DEMAND_INTENT_OPTIONS: { value: DemandIntentType; label: string }[] = [
  { value: "rfq", label: "询价 / RFQ" },
  { value: "looking_for_supplier", label: "寻找供应商" },
  { value: "procurement", label: "采购 / sourcing" },
  { value: "tender", label: "招标 / tender" },
  { value: "distributor_wanted", label: "寻找分销商 / 代理" },
  { value: "substitution", label: "替代供应商 / 材料替代" },
  { value: "forum_request", label: "论坛/社区求助" },
  { value: "all", label: "全部" },
];

const STRICTNESS_OPTIONS: { value: SearchStrictness; label: string }[] = [
  { value: "strict", label: "strict" },
  { value: "balanced", label: "balanced" },
  { value: "broad", label: "broad" },
];

const SOURCE_CHANNEL_OPTIONS: { value: DemandSourceChannel; label: string }[] = [
  { value: "all_sources", label: "全部来源" },
  { value: "general_web", label: "普通需求搜索" },
  { value: "b2b_rfq_platforms", label: "贸易网站/RFQ求购搜索" },
  { value: "trade_leads_platforms", label: "Trade leads 平台" },
  { value: "tender_procurement", label: "招标/采购网站搜索" },
  { value: "forums_communities", label: "论坛/社区求购搜索" },
  { value: "classifieds", label: "分类信息网站" },
  { value: "social_public_posts", label: "公开社交帖子" },
  { value: "regional_local_sites", label: "本地区域网站" },
];

const FRESHNESS_OPTIONS: { value: DemandFreshnessWindow; label: string }[] = [
  { value: "past_month", label: "近 1 个月" },
  { value: "past_3_months", label: "近 3 个月" },
  { value: "past_6_months", label: "近 6 个月" },
  { value: "past_year", label: "近 1 年" },
  { value: "anytime", label: "不限时间" },
];

const PLATFORM_CATEGORY_OPTIONS: { value: BuyerPlatformCategory | "all"; label: string }[] = [
  { value: "all", label: "全部平台" },
  { value: "global_b2b_rfq", label: "全球B2B/RFQ" },
  { value: "regional_b2b", label: "区域B2B" },
  { value: "marketplace_ecommerce", label: "电商/市场平台" },
  { value: "business_procurement", label: "企业采购" },
  { value: "tender_procurement", label: "招标/采购" },
  { value: "forum_community", label: "论坛/社区" },
  { value: "industry_directory", label: "行业目录" },
];

const PLATFORM_USE_CASE_OPTIONS: { value: BuyerPlatformUseCase | "all"; label: string }[] = [
  { value: "all", label: "全部用途" },
  { value: "submit_rfq", label: "提交RFQ" },
  { value: "find_buying_leads", label: "找buying leads" },
  { value: "find_suppliers", label: "找供应商" },
  { value: "compare_prices", label: "比价" },
  { value: "find_distributors", label: "找分销商" },
  { value: "find_tenders", label: "找招标" },
  { value: "ask_for_supplier_recommendation", label: "社区求推荐" },
  { value: "market_validation", label: "市场验证" },
  { value: "competitor_check", label: "竞品检查" },
];

type PlanFilter = "all" | DemandSignalStrength | "platform";
type DemandWorkbenchMode = "rfq_intel" | "buyer_platform";

const PLAN_FILTERS: { value: PlanFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "strong", label: "强需求" },
  { value: "medium", label: "中需求" },
  { value: "broad", label: "广泛线索" },
  { value: "platform", label: "平台线索" },
];

function createRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function productKeyword(productLineId: ProductLineId, customProductKeyword: string): string {
  if (productLineId === "filament") return "3D printer filament";
  if (productLineId === "masterbatch") return "color masterbatch";
  return customProductKeyword.trim() || "plastic materials";
}

function recommendedLabel(value?: string): string {
  const labels: Record<string, string> = {
    save_candidate: "值得人工保存",
    research_more: "继续核实",
    ignore: "忽略",
    peer_supplier: "疑似同行",
    directory_only: "只是目录/平台",
  };
  return labels[value ?? ""] ?? "未知";
}

function recommendedTone(value?: string): "neutral" | "green" | "amber" | "red" | "blue" {
  if (value === "save_candidate") return "green";
  if (value === "research_more") return "blue";
  if (value === "peer_supplier" || value === "ignore") return "red";
  if (value === "directory_only") return "amber";
  return "neutral";
}

function strengthLabel(value: DemandSignalStrength): string {
  if (value === "strong") return "强需求";
  if (value === "medium") return "中需求";
  return "广泛线索";
}

function recallLabel(value: DemandSearchPlan["estimatedRecall"]): string {
  const labels = { low: "召回低", medium: "召回中", high: "召回高" };
  return labels[value];
}

function precisionLabel(value: DemandSearchPlan["estimatedPrecision"]): string {
  const labels = { low: "精准低", medium: "精准中", high: "精准高" };
  return labels[value];
}

function priorityTone(priority: RfqIntelMission["priority"]): "green" | "blue" | "amber" | "neutral" {
  if (priority === "P0") return "green";
  if (priority === "P1") return "blue";
  if (priority === "P2") return "amber";
  return "neutral";
}

function missionResultLabel(result: RfqIntelMissionCheckResult): string {
  const labels: Record<RfqIntelMissionCheckResult, string> = {
    useful: "有有效线索",
    no_valid_leads: "无有效线索",
    needs_recheck: "需要复查",
    outdated: "无效/过期",
  };
  return labels[result];
}

function platformCategoryLabel(value: BuyerPlatformCategory): string {
  return PLATFORM_CATEGORY_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function platformUseCaseLabel(value: BuyerPlatformUseCase): string {
  return PLATFORM_USE_CASE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export default function DemandSearchPage() {
  const [workbenchMode, setWorkbenchMode] = useState<DemandWorkbenchMode>("rfq_intel");
  const [productLineId, setProductLineId] = useState<ProductLineId>("filament");
  const [sourceChannel, setSourceChannel] = useState<DemandSourceChannel>("all_sources");
  const [targetMarketPresetId, setTargetMarketPresetId] = useState<TargetMarketPresetId>("global");
  const [freshnessWindow, setFreshnessWindow] = useState<DemandFreshnessWindow>("past_6_months");
  const [intentType, setIntentType] = useState<DemandIntentType>("looking_for_supplier");
  const [country, setCountry] = useState("");
  const [customProductKeyword, setCustomProductKeyword] = useState("");
  const [strictness, setStrictness] = useState<SearchStrictness>("balanced");
  const [customQuery, setCustomQuery] = useState("");
  const [platformCategory, setPlatformCategory] = useState<BuyerPlatformCategory | "all">("all");
  const [platformUseCase, setPlatformUseCase] = useState<BuyerPlatformUseCase | "all">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [candidates, setCandidates] = useState<SerperSearchCandidate[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [debug, setDebug] = useState({ rawOrganicCount: 0, candidateCount: 0, filteredOutCount: 0 });
  const [activeMission, setActiveMission] = useState<RfqIntelMission | null>(null);
  const [activePlatformMission, setActivePlatformMission] = useState<BuyerPlatformMission | null>(null);
  const [missionChecks, setMissionChecks] = useState<RfqIntelMissionCheck[]>([]);

  const plans = useMemo(
    () =>
      generateDemandSearchPlans({
        productLineId,
        targetCountry: country,
        targetMarketPresetId,
        sourceChannel,
        freshnessWindow,
        intentType,
        strictness,
        customProductKeyword,
      }),
    [country, customProductKeyword, freshnessWindow, intentType, productLineId, sourceChannel, strictness, targetMarketPresetId],
  );
  const missions = useMemo(
    () =>
      generateRfqIntelMissions({
        productLineId,
        targetMarketPresetId,
        sourceChannel,
        freshnessWindow,
        strictness,
        customProductKeyword,
      }),
    [customProductKeyword, freshnessWindow, productLineId, sourceChannel, strictness, targetMarketPresetId],
  );
  const platformMissions = useMemo(
    () =>
      generateBuyerPlatformMissions({
        productLineId,
        targetMarketPresetId,
        platformCategory,
        useCase: platformUseCase,
        freshnessWindow,
        strictness,
        customProductKeyword,
      }),
    [customProductKeyword, freshnessWindow, platformCategory, platformUseCase, productLineId, strictness, targetMarketPresetId],
  );
  const visibleCandidates = useMemo(
    () => showHidden ? candidates : candidates.filter((candidate) => !candidate.demandClassification?.shouldHideByDefault && candidate.demandClassification?.detectedDateText),
    [candidates, showHidden],
  );
  const filteredPlans = useMemo(() => {
    if (planFilter === "all") return plans;
    if (planFilter === "platform") {
      return plans.filter((plan) => plan.sourceType === "b2b_platform" || plan.sourceType === "rfq_platform");
    }
    return plans.filter((plan) => plan.signalStrength === planFilter);
  }, [planFilter, plans]);
  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => pendingIds.includes(candidate.id)),
    [candidates, pendingIds],
  );
  const stats = useMemo(() => ({
    total: candidates.length,
    highDemand: candidates.filter((candidate) => (candidate.demandScore ?? 0) >= 60).length,
    save: candidates.filter((candidate) => candidate.demandRecommendedAction === "save_candidate").length,
    hidden: candidates.filter((candidate) => candidate.demandClassification?.shouldHideByDefault).length,
  }), [candidates]);
  const missionStats = useMemo(() => ({
    total: missions.length,
    p0: missions.filter((mission) => mission.priority === "P0").length,
    checked: missionChecks.length,
    useful: missionChecks.filter((check) => check.result === "useful").length,
  }), [missionChecks, missions]);

  useEffect(() => {
    const refresh = () => setMissionChecks(listMissionChecks());
    refresh();
    window.addEventListener("rfq-intel:updated", refresh);
    return () => window.removeEventListener("rfq-intel:updated", refresh);
  }, []);

  async function runSearch(query: string, plan?: DemandSearchPlan, mission?: RfqIntelMission, platformMission?: BuyerPlatformMission) {
    const nextQuery = query.trim();
    if (!nextQuery) {
      setError("请输入搜索词");
      return;
    }

    setLoading(true);
    setError("");
    setLastQuery(nextQuery);
    setCandidates([]);
    setPendingIds([]);
    setActiveMission(mission ?? null);
    setActivePlatformMission(platformMission ?? null);
    try {
      const response = await fetch("/api/serper-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: nextQuery,
          country,
          productKeyword: productKeyword(productLineId, customProductKeyword),
          customerType: "demand signal",
          productLineId,
          searchMode: "demand_signal",
          demandIntentType: plan?.intentType ?? intentType,
          demandSearchPlanId: plan?.id,
          demandSearchPlan: plan,
          buyerPlatformMission: platformMission,
          targetMarketPresetId,
          freshnessWindow,
          serperTbs: plan?.serperTbs,
          limit: 10,
        }),
      });
      const data = (await response.json()) as DemandSearchResponse;
      if (!response.ok) {
        setError(data.error || "Serper 需求信号搜索失败");
        return;
      }
      const runId = createRunId();
      setCandidates(data.candidates.map((candidate) => ({ ...candidate, searchRunId: runId, rfqIntelMission: mission, buyerPlatformMission: platformMission })));
      setDebug({
        rawOrganicCount: data.rawOrganicCount,
        candidateCount: data.candidateCount,
        filteredOutCount: data.filteredOutCount,
      });
    } catch {
      setError("Serper 需求信号搜索请求失败，请检查网络或服务端配置。");
    } finally {
      setLoading(false);
    }
  }

  function markMission(mission: RfqIntelMission, result: RfqIntelMissionCheckResult) {
    const note = window.prompt("记录本次检查备注（可留空）", "");
    if (note === null) return;
    addMissionCheck({
      missionId: mission.id,
      missionTitle: mission.title,
      missionPriority: mission.priority,
      missionType: mission.missionType,
      productLineId: mission.productLineId,
      targetMarketPresetId: mission.targetMarketPresetId as TargetMarketPresetId,
      result,
      note,
      usefulResultCount: result === "useful" ? visibleCandidates.length : 0,
      savedLeadCount: pendingCandidates.length,
    });
  }

  function markPlatformMission(mission: BuyerPlatformMission, result: RfqIntelMissionCheckResult) {
    const note = window.prompt("记录本次平台检查备注（可留空）", "");
    if (note === null) return;
    addMissionCheck({
      missionId: mission.id,
      missionTitle: `${mission.platformName} · ${mission.useCase}`,
      missionPriority: mission.priority,
      missionType: mission.platformCategory === "tender_procurement"
        ? "tender_procurement"
        : mission.platformCategory === "forum_community"
          ? "forum_request"
          : mission.platformCategory === "marketplace_ecommerce" || mission.platformCategory === "business_procurement"
            ? "manual_platform_check"
            : "platform_buying_leads",
      productLineId: mission.productLineId,
      targetMarketPresetId: mission.targetMarketPresetId as TargetMarketPresetId,
      result,
      note,
      usefulResultCount: result === "useful" ? visibleCandidates.length : 0,
      savedLeadCount: pendingCandidates.length,
    });
  }

  function stageCandidate(candidate: SerperSearchCandidate) {
    const action = candidate.demandRecommendedAction;
    if (action === "peer_supplier") {
      const confirmed = window.confirm("该结果疑似同行/供应商，不是目标采购需求。确定仍要加入待确认录入吗？");
      if (!confirmed) return;
    }
    if (action === "ignore" || action === "directory_only") {
      const confirmed = window.confirm("该结果被标记为低质量/目录结果，建议先核实。确定仍要加入待确认录入吗？");
      if (!confirmed) return;
    }
    setPendingIds((current) => Array.from(new Set([...current, candidate.id])));
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
      <Card>
        <h2 className="text-lg font-semibold text-slate-950">求购情报作战台</h2>
        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <p>普通客户搜索用于寻找可能会用产品的客户；求购情报作战台用于把 RFQ、buying leads、招标、论坛求助和本地语言采购线索拆成可验证任务。</p>
          <p>买家平台优先搜索会模拟买家采购路径：先去熟悉平台找供应商、发 RFQ、比价、找本地经销商或查采购公告，再用 Google/Serper 搜公开入口。</p>
          <p>搜索结果仍需要人工核实。系统不会自动保存客户、不会自动联系客户、不会编造需求、联系人、邮箱或电话。</p>
          <p>B2B 平台页面、目录页和无日期结果只能作为入口线索；必须打开原网页确认发布日期、买家身份、产品匹配和有效期。</p>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">搜索模式</span>
            <Select value={workbenchMode} onChange={(event) => setWorkbenchMode(event.target.value as DemandWorkbenchMode)}>
              <option value="rfq_intel">求购信号搜索</option>
              <option value="buyer_platform">买家平台优先搜索</option>
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">产品线</span>
            <Select value={productLineId} onChange={(event) => setProductLineId(event.target.value as ProductLineId)}>
              {PRODUCT_LINE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">搜索方式</span>
            <Select value={sourceChannel} onChange={(event) => setSourceChannel(event.target.value as DemandSourceChannel)}>
              {SOURCE_CHANNEL_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">目标市场</span>
            <Select value={targetMarketPresetId} onChange={(event) => setTargetMarketPresetId(event.target.value as TargetMarketPresetId)}>
              {TARGET_MARKET_PRESET_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">需求类型</span>
            <Select value={intentType} onChange={(event) => setIntentType(event.target.value as DemandIntentType)}>
              {DEMAND_INTENT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">时间范围</span>
            <Select value={freshnessWindow} onChange={(event) => setFreshnessWindow(event.target.value as DemandFreshnessWindow)}>
              {FRESHNESS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">目标国家，可留空表示全球搜索</span>
            <Select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="">全球 / 不限制国家</option>
              {TARGET_COUNTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">搜索严格度</span>
            <Select value={strictness} onChange={(event) => setStrictness(event.target.value as SearchStrictness)}>
              {STRICTNESS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">自定义产品词</span>
            <Input value={customProductKeyword} onChange={(event) => setCustomProductKeyword(event.target.value)} />
          </label>
          {workbenchMode === "buyer_platform" ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">平台类型</span>
                <Select value={platformCategory} onChange={(event) => setPlatformCategory(event.target.value as BuyerPlatformCategory | "all")}>
                  {PLATFORM_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">用途</span>
                <Select value={platformUseCase} onChange={(event) => setPlatformUseCase(event.target.value as BuyerPlatformUseCase | "all")}>
                  {PLATFORM_USE_CASE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
              </label>
            </>
          ) : null}
        </div>
        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-700">自定义搜索词</span>
          <Input value={customQuery} onChange={(event) => setCustomQuery(event.target.value)} placeholder="可从下方计划填入，或自行输入需求搜索词" />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={loading} type="button" onClick={() => runSearch(customQuery)}>
            {loading ? "搜索中..." : "用自定义词搜索"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          搜索范围：{country.trim() ? country : "全球 / 不限制国家"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          市场预设：{TARGET_MARKET_PRESETS[targetMarketPresetId].labelZh}。{TARGET_MARKET_PRESETS[targetMarketPresetId].notes}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          求购信息默认只看最近 6 个月；没有发布日期的结果只能作为待核实线索，旧年份结果会被自动降权或隐藏。
        </p>
        {workbenchMode === "buyer_platform" ? (
          <div className="mt-3 rounded-md bg-sky-50 px-3 py-3 text-sm leading-6 text-sky-900">
            <p>买家通常先去熟悉的平台找供应商、发 RFQ、看价格或找本地经销商。B2B RFQ / tender 平台更接近真实采购需求；电商平台结果不等于求购，只能用于渠道、价格和竞品验证。</p>
          </div>
        ) : null}
      </Card>

      {workbenchMode === "buyer_platform" ? (
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">买家平台优先搜索任务</h3>
              <p className="mt-1 text-sm text-slate-600">从买家采购路径出发：RFQ 平台、招标采购、本地电商/渠道、论坛社区。所有结果都只作为公开入口，必须人工验证。</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">任务 {platformMissions.length}</div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {platformMissions.map((mission) => (
              <div className="rounded-md border border-slate-200 bg-white p-4" key={mission.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={priorityTone(mission.priority)}>{mission.priority}</Badge>
                  <Badge>{mission.platformName}</Badge>
                  <Badge>{platformCategoryLabel(mission.platformCategory)}</Badge>
                  <Badge>{platformUseCaseLabel(mission.useCase)}</Badge>
                  <Badge>{mission.requiresLoginLikely ? "可能需登录" : "公开入口优先"}</Badge>
                </div>
                <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-950">{mission.searchQuery}</p>
                <p className="mt-2 text-sm text-slate-700">为什么值得搜：{mission.whyThisPlatform}</p>
                <p className="mt-1 text-sm text-slate-700">结果代表：{mission.resultMeaning}</p>
                <p className="mt-1 text-sm text-slate-700">预期结果：{mission.expectedResult}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">验证步骤</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {mission.verificationSteps.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">可能风险</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {mission.redFlags.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">保存标准</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {mission.saveCriteria.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">拒绝标准</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {mission.rejectCriteria.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" disabled={loading} onClick={() => runSearch(mission.searchQuery, undefined, undefined, mission)}>用 Serper 搜索</Button>
                  <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(mission.searchQuery)}>复制搜索词</Button>
                  <a className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href={`https://${mission.searchQuery.match(/site:([^\s"]+)/)?.[1] ?? ""}`} target="_blank" rel="noreferrer">打开平台首页</a>
                  <Button type="button" variant="secondary" onClick={() => markPlatformMission(mission, "useful")}>标记为已检查</Button>
                  <Button type="button" variant="secondary" onClick={() => markPlatformMission(mission, "no_valid_leads")}>标记无有效线索</Button>
                </div>
              </div>
            ))}
            {platformMissions.length === 0 ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">当前筛选下没有平台任务。</p> : null}
          </div>
        </Card>
      ) : (
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">求购情报任务</h3>
            <p className="mt-1 text-sm text-slate-600">每张任务卡都包含搜索词、预期结果、验证步骤、红旗风险和保存标准。任务检查记录只保存在本地 localStorage。</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-600">
            <div className="rounded-md bg-slate-50 px-3 py-2"><p>任务</p><p className="mt-1 text-lg font-semibold text-slate-950">{missionStats.total}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-2"><p>P0</p><p className="mt-1 text-lg font-semibold text-slate-950">{missionStats.p0}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-2"><p>已检查</p><p className="mt-1 text-lg font-semibold text-slate-950">{missionStats.checked}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-2"><p>有效</p><p className="mt-1 text-lg font-semibold text-slate-950">{missionStats.useful}</p></div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {missions.map((mission) => (
            <div className="rounded-md border border-slate-200 bg-white p-4" key={mission.id}>
              <div className="flex flex-wrap gap-2">
                <Badge tone={priorityTone(mission.priority)}>{mission.priority}</Badge>
                <Badge>{mission.missionType}</Badge>
                <Badge>{mission.sourceChannel}</Badge>
                <Badge>{mission.targetMarketPresetId}</Badge>
              </div>
              <h4 className="mt-3 text-sm font-semibold text-slate-950">{mission.title}</h4>
              <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-950">{mission.searchQuery}</p>
              <p className="mt-2 text-sm text-slate-700">预期结果：{mission.expectedResult}</p>
              <p className="mt-1 text-sm text-slate-700">为什么值得搜：{mission.whyThisMatters}</p>
              <p className="mt-1 text-sm text-slate-700">时效要求：{mission.freshnessRequirement}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">验证步骤</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {mission.verificationSteps.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">红旗风险</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {mission.redFlags.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">保存标准</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {mission.saveCriteria.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">拒绝标准</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {mission.rejectCriteria.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">sourceDomains: {mission.sourceDomains.join(", ") || "公开网页"} · languageHints: {mission.languageHints.join(", ") || "en"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" disabled={loading} onClick={() => runSearch(mission.searchQuery, undefined, mission)}>用 Serper 搜索</Button>
                <Button type="button" variant="secondary" onClick={() => setCustomQuery(mission.searchQuery)}>使用此搜索词</Button>
                <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(mission.searchQuery)}>复制搜索词</Button>
                <Button type="button" variant="secondary" onClick={() => markMission(mission, "useful")}>标记为已检查</Button>
                <Button type="button" variant="secondary" onClick={() => markMission(mission, "no_valid_leads")}>标记为无有效线索</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}

      {workbenchMode === "rfq_intel" ? (
      <Card>
        <h3 className="text-base font-semibold text-slate-950">需求搜索词生成区</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLAN_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant={planFilter === filter.value ? "primary" : "secondary"}
              onClick={() => setPlanFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {filteredPlans.map((plan) => (
            <div className="rounded-md bg-slate-50 p-3" key={plan.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{plan.intentType}</Badge>
                    <Badge>{plan.sourceType}</Badge>
                    <Badge>{plan.productLineId}</Badge>
                    <Badge>{plan.sourceChannel}</Badge>
                    {plan.targetRegionPreset ? <Badge>{plan.targetRegionPreset}</Badge> : null}
                    <Badge>{plan.strictness}</Badge>
                    <Badge>{plan.timeFilterLabel}</Badge>
                    {plan.serperTbs ? <Badge>{`tbs ${plan.serperTbs}`}</Badge> : <Badge>无时间过滤</Badge>}
                    <Badge tone={plan.signalStrength === "strong" ? "green" : plan.signalStrength === "medium" ? "blue" : "amber"}>
                      {strengthLabel(plan.signalStrength)}
                    </Badge>
                    <Badge>{recallLabel(plan.estimatedRecall)}</Badge>
                    <Badge>{precisionLabel(plan.estimatedPrecision)}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{plan.label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{plan.query}</p>
                  <p className="mt-1 text-xs text-slate-600">{plan.purpose}</p>
                  <p className="mt-1 text-xs text-emerald-700">期望信号：{plan.expectedSignal}</p>
                  <p className="mt-1 text-xs text-amber-700">风险：{plan.risk}</p>
                  <p className="mt-1 text-xs text-slate-500">positiveTerms: {plan.positiveTerms.slice(0, 8).join(", ")}</p>
                  <p className="mt-1 text-xs text-slate-500">negativeTerms: {plan.negativeTerms.slice(0, 6).join(", ") || "无"}</p>
                  <p className="mt-1 text-xs text-slate-500">sourceDomains: {plan.sourceDomains.join(", ") || "无"} · languageHints: {plan.languageHints.join(", ") || "en"}</p>
                  <p className="mt-1 text-xs text-slate-500">dateTerms: {plan.dateTerms.join(", ") || "无"}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => setCustomQuery(plan.query)}>使用此搜索词</Button>
                  <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(plan.query)}>复制搜索词</Button>
                  <Button type="button" disabled={loading} onClick={() => runSearch(plan.query, plan)}>用 Serper 搜索</Button>
                </div>
              </div>
            </div>
          ))}
          {filteredPlans.length === 0 ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">当前筛选下没有搜索计划。</p> : null}
        </div>
      </Card>
      ) : null}

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {lastQuery ? (
        <Card>
          <p className="text-xs font-medium uppercase text-slate-500">本次实际搜索词</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{lastQuery}</p>
          {activeMission ? <p className="mt-2 text-sm text-slate-600">当前情报任务：{activeMission.priority} · {activeMission.title}</p> : null}
          {activePlatformMission ? <p className="mt-2 text-sm text-slate-600">当前平台任务：{activePlatformMission.priority} · {activePlatformMission.platformName} · {platformUseCaseLabel(activePlatformMission.useCase)}</p> : null}
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-md bg-slate-50 px-3 py-3"><p className="text-xs text-slate-500">rawOrganic</p><p className="mt-1 text-xl font-semibold">{debug.rawOrganicCount}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-3"><p className="text-xs text-slate-500">候选</p><p className="mt-1 text-xl font-semibold">{debug.candidateCount}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-3"><p className="text-xs text-slate-500">高需求分</p><p className="mt-1 text-xl font-semibold">{stats.highDemand}</p></div>
            <div className="rounded-md bg-slate-50 px-3 py-3"><p className="text-xs text-slate-500">隐藏结果</p><p className="mt-1 text-xl font-semibold">{stats.hidden}</p></div>
          </div>
          {debug.candidateCount <= 2 && !loading ? (
            <div className="mt-4 rounded-md bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-800">
              <p>当前搜索词较精准，公开需求信号可能较少。可以尝试切换到“平衡”或“放宽”，使用平台线索，去掉国家，或改用同义产品词。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {plans
                  .filter((plan) => plan.signalStrength === "broad" || plan.sourceType === "b2b_platform" || plan.sourceType === "rfq_platform")
                  .slice(0, 4)
                  .map((plan) => (
                    <Button key={plan.id} type="button" variant="secondary" onClick={() => setCustomQuery(plan.query)}>
                      {plan.label}
                    </Button>
                  ))}
              </div>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">最近 6 个月主要依赖搜索引擎时间过滤 + 页面摘要日期判断。没有日期的 B2B 页面不会被判断为最新，需要人工打开页面核实。</p>
        </Card>
      ) : null}

      {candidates.length > 0 ? (
        <Card className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">需求信号结果</h3>
              <p className="mt-1 text-sm text-slate-600">结果不会自动保存，必须人工确认后才能写入客户列表。</p>
              <p className="mt-1 text-xs text-slate-500">总数 {stats.total} · 建议保存 {stats.save} · filteredOut {debug.filteredOutCount}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} type="checkbox" />
              显示过期/无日期/低质量结果
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">标题</th>
                  <th className="px-4 py-3">链接</th>
                  <th className="px-4 py-3">摘要</th>
                  <th className="px-4 py-3">需求类型</th>
                  <th className="px-4 py-3">demand</th>
                  <th className="px-4 py-3">freshness</th>
                  <th className="px-4 py-3">日期文本</th>
                  <th className="px-4 py-3">近期</th>
                  <th className="px-4 py-3">过期</th>
                  <th className="px-4 py-3">ageWarning</th>
                  <th className="px-4 py-3">productFit</th>
                  <th className="px-4 py-3">buyerFit</th>
                  <th className="px-4 py-3">peerRisk</th>
                  <th className="px-4 py-3">missionFit</th>
                  <th className="px-4 py-3">人工核实</th>
                  <th className="px-4 py-3">平台门槛</th>
                  <th className="px-4 py-3">任务保存标准</th>
                  <th className="px-4 py-3">红旗</th>
                  <th className="px-4 py-3">source</th>
                  <th className="px-4 py-3">sourceChannel</th>
                  <th className="px-4 py-3">市场</th>
                  <th className="px-4 py-3">语言</th>
                  <th className="px-4 py-3">domain</th>
                  <th className="px-4 py-3">证据词</th>
                  <th className="px-4 py-3">风险</th>
                  <th className="px-4 py-3">建议动作</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visibleCandidates.map((candidate) => {
                  const demand = candidate.demandClassification;
                  return (
                    <tr className="align-top hover:bg-slate-50" key={candidate.id}>
                      <td className="max-w-xs px-4 py-3 font-medium text-slate-950">{candidate.title}</td>
                      <td className="max-w-xs px-4 py-3"><a className="break-all text-sky-700 hover:underline" href={candidate.link} target="_blank" rel="noreferrer">{candidate.link}</a></td>
                      <td className="max-w-md px-4 py-3 text-slate-700">{candidate.snippet}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.intentType ?? "unknown"}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.demandScore ?? 0}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.freshnessScore ?? 0}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.detectedDateText ?? "缺少日期"}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.isLikelyRecent ? "是" : "否"}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.isLikelyOutdated ? "是" : "否"}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{demand?.ageWarning ?? ""}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.productFitScore ?? 0}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.buyerFitScore ?? 0}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.peerRiskScore ?? 0}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.missionFitScore ?? 0}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{demand?.verificationRequired ? (demand.manualCheckReasons ?? []).slice(0, 2).join("；") || "需要打开来源核实" : "否"}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{demand?.platformGateWarning ?? ""}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{(candidate.buyerPlatformMission?.saveCriteria ?? candidate.rfqIntelMission?.saveCriteria ?? activePlatformMission?.saveCriteria ?? activeMission?.saveCriteria ?? []).slice(0, 2).join("；")}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{(candidate.buyerPlatformMission?.redFlags ?? candidate.rfqIntelMission?.redFlags ?? activePlatformMission?.redFlags ?? activeMission?.redFlags ?? []).slice(0, 2).join("；")}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.sourceType ?? "unknown"}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.sourceChannel ?? "unknown"}</td>
                      <td className="px-4 py-3 text-slate-700">{demand?.targetMarketPreset ?? targetMarketPresetId}</td>
                      <td className="px-4 py-3 text-slate-700">{(demand?.languageHints ?? []).join(", ") || "en"}</td>
                      <td className="px-4 py-3 text-slate-700">{candidate.domain}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{(demand?.evidenceTerms ?? []).slice(0, 6).join("；")}</td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">{(demand?.warnings ?? []).slice(0, 2).join("；")}</td>
                      <td className="px-4 py-3"><Badge tone={recommendedTone(demand?.recommendedAction)}>{recommendedLabel(demand?.recommendedAction)}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <Button type="button" variant="secondary" onClick={() => stageCandidate(candidate)}>加入待确认</Button>
                          <a className="text-sky-700 hover:underline" href={candidate.link} target="_blank" rel="noreferrer">打开来源</a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950">已检查任务记录</h3>
            <p className="mt-1 text-sm text-slate-600">记录本地人工检查结果，不代表系统自动确认真实求购。</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {missionChecks.slice(0, 8).map((check) => (
            <div className="flex flex-col gap-3 rounded-md bg-slate-50 p-3 md:flex-row md:items-center md:justify-between" key={check.id}>
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={priorityTone(check.missionPriority)}>{check.missionPriority}</Badge>
                  <Badge>{check.missionType}</Badge>
                  <Badge>{missionResultLabel(check.result)}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-950">{check.missionTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(check.checkedAt).toLocaleString()} · useful {check.usefulResultCount} · saved {check.savedLeadCount}</p>
                {check.note ? <p className="mt-1 text-sm text-slate-600">{check.note}</p> : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => deleteMissionCheck(check.id)}>删除记录</Button>
            </div>
          ))}
          {missionChecks.length === 0 ? <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">暂无已检查任务记录。</p> : null}
        </div>
      </Card>

      {pendingCandidates.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-950">待确认保存</h3>
            <p className="mt-1 text-sm text-slate-600">只有点击确认保存后，才会写入 localStorage。</p>
          </div>
          {pendingCandidates.map((candidate) => (
            <ConfirmCandidateLeadForm
              candidate={candidate}
              country={country}
              customerType="demand signal"
              demandSearchQuery={lastQuery}
              key={candidate.id}
              onCancel={removePending}
              onSaved={removeAfterSaved}
              productKeyword={productKeyword(productLineId, customProductKeyword)}
              searchRunId={candidate.searchRunId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
