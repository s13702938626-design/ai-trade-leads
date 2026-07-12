"use client";

import { useMemo, useState } from "react";
import type { LeadInput } from "@/types/lead";
import type { CandidateReviewDecision, SerperSearchCandidate } from "@/types/search";
import { addLead } from "@/lib/lead-storage";
import { getDomainFromUrl, validateLeadInput } from "@/lib/validators";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CUSTOMER_TYPES, TARGET_COUNTRIES } from "@/lib/constants";

type ConfirmCandidateLeadFormProps = {
  candidate: SerperSearchCandidate;
  country: string;
  customerType: string;
  productKeyword: string;
  demandSearchQuery?: string;
  searchRunId?: string | null;
  onSaved: (candidateId: string) => void;
  onCancel: (candidateId: string) => void;
};

function titleToCompanyDraft(title: string): string {
  return title
    .split(/[|-]/)[0]
    .replace(/\s+/g, " ")
    .trim();
}

function originFromLink(link: string): string {
  try {
    return new URL(link).origin;
  } catch {
    return "";
  }
}

function decisionLabel(decision: CandidateReviewDecision): string {
  const labels = {
    save: "建议保存",
    research_more: "继续研究",
    reject: "不建议保存",
    unknown: "证据不足",
  };

  return labels[decision];
}

function businessRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    target_end_user: "使用商",
    target_distributor: "贸易商/分销商",
    target_trader: "贸易商/分销商",
    peer_supplier: "同行/供应商",
    directory_or_platform: "目录/平台",
    content_article: "文章/内容",
    irrelevant: "无关",
    unknown: "未知",
  };
  return labels[role] ?? "未知";
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">无</p>
      )}
    </div>
  );
}

export function ConfirmCandidateLeadForm({
  candidate,
  country,
  customerType,
  productKeyword,
  demandSearchQuery,
  searchRunId,
  onSaved,
  onCancel,
}: ConfirmCandidateLeadFormProps) {
  const demand = candidate.demandClassification;
  const mission = candidate.rfqIntelMission;
  const platformMission = candidate.buyerPlatformMission;
  const isMarketplacePlatform = platformMission?.platformCategory === "marketplace_ecommerce" || platformMission?.platformCategory === "business_procurement";
  const [verification, setVerification] = useState({
    openedSource: false,
    confirmedDemand: false,
    notSupplierAd: false,
    notOldPage: false,
    reasonableDate: false,
    noFabrication: false,
  });
  const verificationComplete = Object.values(verification).every(Boolean);
  const checkedCriteria = [
    verification.openedSource ? "opened original source" : "",
    verification.confirmedDemand ? "confirmed RFQ/procurement/tender signal" : "",
    verification.notSupplierAd ? "confirmed not supplier advertisement" : "",
    verification.notOldPage ? "confirmed not old page" : "",
    verification.reasonableDate ? "confirmed date or validity is reasonable" : "",
    verification.noFabrication ? "acknowledged no fabricated contacts or email" : "",
  ].filter(Boolean);
  const demandEvidence = demand
    ? [
        `Mission title: ${mission?.title ?? ""}`,
        `Mission priority: ${mission?.priority ?? ""}`,
        `Mission type: ${mission?.missionType ?? ""}`,
        `Mission source channel: ${mission?.sourceChannel ?? ""}`,
        `Buyer platform name: ${platformMission?.platformName ?? ""}`,
        `Buyer platform id: ${platformMission?.platformId ?? ""}`,
        `Buyer platform category: ${platformMission?.platformCategory ?? ""}`,
        `Buyer platform use case: ${platformMission?.useCase ?? ""}`,
        `Buyer platform result meaning: ${platformMission?.resultMeaning ?? ""}`,
        `Verification status: ${verificationComplete ? "verified-demand-signal" : "unverified-demand-signal"}`,
        `Checked criteria: ${checkedCriteria.join(", ")}`,
        `Source channel: ${demand.sourceChannel ?? ""}`,
        `Source type: ${demand.sourceType}`,
        `Target market preset: ${demand.targetMarketPreset ?? ""}`,
        `Freshness window: ${candidate.demandFreshnessWindow ?? ""}`,
        `Serper tbs: ${candidate.demandSerperTbs ?? ""}`,
        `Freshness score: ${demand.freshnessScore}`,
        `Detected date text: ${demand.detectedDateText ?? ""}`,
        `Is likely recent: ${demand.isLikelyRecent}`,
        `Is likely outdated: ${demand.isLikelyOutdated}`,
        `Age warning: ${demand.ageWarning ?? ""}`,
        `Demand search query: ${demandSearchQuery ?? ""}`,
        `Search scope: ${country.trim() ? country : "Global / no country filter"}`,
        `Demand intent type: ${demand.intentType}`,
        `Demand score: ${demand.demandScore}`,
        `Product fit score: ${demand.productFitScore}`,
        `Buyer fit score: ${demand.buyerFitScore}`,
        `Mission fit score: ${demand.missionFitScore}`,
        `Verification required: ${demand.verificationRequired}`,
        `Manual check reasons: ${demand.manualCheckReasons.join(", ")}`,
        `Platform gate warning: ${demand.platformGateWarning ?? ""}`,
        `Platform signal type: ${demand.platformSignalType}`,
        `Evidence terms: ${demand.evidenceTerms.join(", ")}`,
        `Language hints: ${(demand.languageHints ?? []).join(", ")}`,
        `Result title: ${candidate.title}`,
        `Result snippet: ${candidate.snippet}`,
        `Result link: ${candidate.link}`,
      ].join("\n")
    : candidate.snippet;
  const demandTags = useMemo(
    () =>
      demand
        ? [
            "demand-signal",
            "rfq-intel",
            ...(platformMission?.tags ?? []),
            verificationComplete ? "verified-demand-signal" : "unverified-demand-signal",
            mission?.missionType ?? "",
            mission?.priority ? `mission-${mission.priority.toLowerCase()}` : "",
            mission?.targetMarketPresetId ? `target-market-${mission.targetMarketPresetId}` : "",
            demand.intentType.replaceAll("_", "-"),
            demand.sourceChannel === "forums_communities" ? "forum" : "",
            demand.sourceChannel === "tender_procurement" ? "tender" : "",
            demand.sourceType === "rfq_platform" ? "rfq-platform" : "",
            demand.sourceChannel === "b2b_rfq_platforms" || demand.sourceChannel === "trade_leads_platforms" ? "trade-site" : "",
            demand.targetMarketPreset === "belt_and_road" ? "belt-and-road" : demand.targetMarketPreset ?? "",
            candidate.productLineId ?? "",
          ].filter(Boolean)
        : [],
    [candidate.productLineId, demand, mission, platformMission, verificationComplete],
  );
  const defaultEvidence = [
    `Search scope: ${country.trim() ? country : "Global / no country filter"}`,
    `Result title: ${candidate.title}`,
    `Result snippet: ${candidate.snippet}`,
    `Result link: ${candidate.link}`,
  ].join("\n");
  const initial = useMemo<LeadInput>(
    () => ({
      companyName: titleToCompanyDraft(candidate.title),
      website: originFromLink(candidate.link),
      country,
      customerType,
      productKeyword,
      sourceUrl: candidate.link,
      sourceTitle: candidate.title,
      sourceSnippet: candidate.snippet,
      sourceType: demand ? "demand_signal_search" : candidate.sourceType,
      evidenceText: demand ? demandEvidence : defaultEvidence,
      email: "",
      phone: "",
      linkedinUrl: "",
      address: "",
      matchLevel: "unknown",
      status: "researching",
      notes: "",
      fetchedAt: candidate.fetchedAt,
      searchRunId: searchRunId ?? candidate.searchRunId ?? null,
      tags: demand ? demandTags : [],
    }),
    [candidate, country, customerType, defaultEvidence, demand, demandEvidence, demandTags, productKeyword, searchRunId],
  );
  const [form, setForm] = useState<LeadInput>(initial);
  const [error, setError] = useState("");

  const domain = getDomainFromUrl(form.website);
  const review = candidate.review;

  function update<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (candidate.businessRole === "peer_supplier" || review?.businessRole === "peer_supplier") {
      const confirmed = window.confirm("该结果可能是同行/供应商，不是目标客户。确定仍要保存吗？");
      if (!confirmed) return;
    }
    if (demand?.isLikelyOutdated) {
      const confirmed = window.confirm("该结果疑似过期，不建议作为当前求购线索。确定仍要保存吗？");
      if (!confirmed) return;
    } else if (demand && !demand.detectedDateText) {
      const confirmed = window.confirm("该结果缺少发布日期，不能确认是否为最近 6 个月求购信息。确定仍要保存吗？");
      if (!confirmed) return;
    }
    if (isMarketplacePlatform) {
      const confirmed = window.confirm("该结果来自电商平台，通常代表市场/渠道/价格线索，不代表买家求购。确定仍要保存为渠道或竞品线索吗？");
      if (!confirmed) return;
    }
    if (platformMission?.requiresLoginLikely) {
      const confirmed = window.confirm("该平台可能需要登录或付费查看完整买家信息，请人工核实后再保存。确定继续保存吗？");
      if (!confirmed) return;
    }
    if (demand && !verificationComplete) {
      const confirmed = window.confirm("该求购线索尚未完成验证，建议先标记为继续调研。确定仍要保存吗？");
      if (!confirmed) return;
    }

    const validation = validateLeadInput(form);
    if (!validation.valid) {
      setError(validation.errors.join("，"));
      return;
    }

    addLead({
      ...form,
      sourceUrl: candidate.link,
      sourceTitle: candidate.title,
      sourceSnippet: candidate.snippet,
      sourceType: demand ? "demand_signal_search" : candidate.sourceType,
      evidenceText: demand ? demandEvidence : form.evidenceText,
      fetchedAt: candidate.fetchedAt,
      searchRunId: searchRunId ?? candidate.searchRunId ?? null,
      email: "",
      phone: "",
      linkedinUrl: "",
      tags: demand ? demandTags : form.tags,
    });
    setError("");
    onSaved(candidate.id);
  }

  return (
    <Card>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">确认保存候选客户</h3>
          <p className="mt-1 text-sm text-slate-600">请人工确认必填字段和来源证据，确认后才会写入客户列表。</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => onCancel(candidate.id)}>
          移除
        </Button>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {review ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={review.decision === "save" ? "green" : review.decision === "reject" ? "neutral" : "blue"}>
              {decisionLabel(review.decision)}
            </Badge>
            <Badge>{`预审分数 ${review.score}`}</Badge>
            <Badge>{`匹配度 ${review.fitLevel}`}</Badge>
            <Badge>{`角色 ${businessRoleLabel(review.businessRole ?? candidate.businessRole ?? "unknown")}`}</Badge>
            <Badge>{`buyerFit ${review.buyerFitScore ?? candidate.buyerFitScore ?? 0}`}</Badge>
            <Badge>{`peerRisk ${review.peerRiskScore ?? candidate.peerRiskScore ?? 0}`}</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ReviewList title="reasons" items={review.reasons} />
            <ReviewList title="risks" items={review.risks} />
            <ReviewList title="matchedSignals" items={review.matchedSignals} />
            <ReviewList title="missingInfo" items={review.missingInfo} />
            <ReviewList title="matchedPositiveTerms" items={review.matchedPositiveTerms ?? []} />
            <ReviewList title="matchedNegativeTerms" items={review.matchedNegativeTerms ?? []} />
            <ReviewList title="rejectionReasons" items={review.rejectionReasons ?? []} />
          </div>
        </div>
      ) : null}

      {demand ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={demand.recommendedAction === "save_candidate" ? "green" : demand.recommendedAction === "ignore" ? "neutral" : "blue"}>
              {demand.recommendedAction}
            </Badge>
            <Badge>{`demand ${demand.demandScore}`}</Badge>
            <Badge>{`freshness ${demand.freshnessScore}`}</Badge>
            <Badge>{`date ${demand.detectedDateText ?? "missing"}`}</Badge>
            <Badge>{demand.isLikelyOutdated ? "疑似过期" : demand.isLikelyRecent ? "近期" : "日期待核实"}</Badge>
            <Badge>{`productFit ${demand.productFitScore}`}</Badge>
            <Badge>{`buyerFit ${demand.buyerFitScore}`}</Badge>
            <Badge>{`missionFit ${demand.missionFitScore}`}</Badge>
            <Badge>{demand.verificationRequired ? "需要人工核实" : "初筛证据较完整"}</Badge>
            <Badge>{`platform ${demand.platformSignalType}`}</Badge>
            <Badge>{`source ${demand.sourceType}`}</Badge>
          </div>
          {platformMission ? (
            <div className={`mt-4 rounded-md p-3 ${isMarketplacePlatform ? "bg-amber-100" : "bg-white/70"}`}>
              <p className="text-xs font-medium uppercase text-slate-500">buyer platform context</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{platformMission.platformName} · {platformMission.platformCategory} · {platformMission.useCase}</p>
              <p className="mt-1 text-sm text-slate-700">{platformMission.resultMeaning}</p>
              {isMarketplacePlatform ? <p className="mt-2 text-sm font-medium text-amber-900">该结果来自电商平台，通常代表市场/渠道/价格线索，不代表买家求购。建议保存为渠道线索或竞品线索，而不是求购客户。</p> : null}
              {platformMission.requiresLoginLikely ? <p className="mt-2 text-sm font-medium text-amber-900">该平台可能需要登录或付费查看完整买家信息，请人工核实后再保存。</p> : null}
            </div>
          ) : null}
          {mission ? (
            <div className="mt-4 rounded-md bg-white/70 p-3">
              <p className="text-xs font-medium uppercase text-slate-500">rfq intel mission</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{mission.priority} · {mission.title}</p>
              <p className="mt-1 text-sm text-slate-700">保存标准：{mission.saveCriteria.join("；")}</p>
              <p className="mt-1 text-sm text-slate-700">红旗风险：{mission.redFlags.join("；")}</p>
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ReviewList title="evidenceTerms" items={demand.evidenceTerms} />
            <ReviewList title="warnings" items={demand.warnings} />
            <ReviewList title="missingInfo" items={demand.missingInfo} />
            <ReviewList title="classificationReasons" items={demand.classificationReasons} />
            <ReviewList title="ageWarning" items={demand.ageWarning ? [demand.ageWarning] : []} />
            <ReviewList title="manualCheckReasons" items={demand.manualCheckReasons} />
            <ReviewList title="platformGateWarning" items={demand.platformGateWarning ? [demand.platformGateWarning] : []} />
          </div>
        </div>
      ) : null}

      {demand ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-slate-950">求购真实性验证</h4>
          <p className="mt-1 text-sm text-slate-700">保存前建议人工勾选。未完成也允许保存，但会二次提醒，并标记为 unverified-demand-signal。</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[
              ["openedSource", "我已打开原始页面"],
              ["confirmedDemand", "我确认这是求购/RFQ/采购/招标信息"],
              ["notSupplierAd", "我确认不是供应商广告"],
              ["notOldPage", "我确认不是旧页面"],
              ["reasonableDate", "我确认发布日期或有效期合理"],
              ["noFabrication", "我知道系统不会编造联系人/邮箱"],
            ].map(([key, label]) => (
              <label className="flex items-center gap-2 text-sm text-slate-700" key={key}>
                <input
                  checked={verification[key as keyof typeof verification]}
                  onChange={(event) => setVerification((current) => ({ ...current, [key]: event.target.checked }))}
                  type="checkbox"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">companyName *</span>
          <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">website</span>
          <Input value={form.website} onChange={(event) => update("website", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">domain</span>
          <Input readOnly value={domain} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">country</span>
          <Select value={form.country} onChange={(event) => update("country", event.target.value)}>
            <option value="">清空，不填写</option>
            {TARGET_COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">customerType</span>
          <Select value={form.customerType} onChange={(event) => update("customerType", event.target.value)}>
            <option value="">未填写</option>
            {CUSTOMER_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">productKeyword *</span>
          <Input value={form.productKeyword} onChange={(event) => update("productKeyword", event.target.value)} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">sourceUrl *</span>
          <Input readOnly value={form.sourceUrl} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">sourceTitle</span>
          <Input readOnly value={form.sourceTitle} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">fetchedAt</span>
          <Input readOnly value={form.fetchedAt} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">sourceSnippet</span>
          <Textarea readOnly value={form.sourceSnippet} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">evidenceText</span>
          <Textarea value={form.evidenceText} onChange={(event) => update("evidenceText", event.target.value)} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">notes</span>
          <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={save}>
          确认保存到客户列表
        </Button>
        <Button type="button" variant="secondary" onClick={() => onCancel(candidate.id)}>
          取消
        </Button>
      </div>
    </Card>
  );
}
