import type { CandidateReview, CandidateReviewDecision } from "@/types/search";

type ReviewSearchCandidateInput = {
  title: string;
  link: string;
  domain: string;
  snippet: string;
  query: string;
  productKeyword: string;
  country: string;
  customerType: string;
};

type SignalRule = {
  signal: string;
  points: number;
  reason: string;
};

const HIGH_VALUE_SIGNALS: SignalRule[] = [
  { signal: "masterbatch", points: 30, reason: "出现 masterbatch，和色母需求高度相关" },
  { signal: "color concentrate", points: 30, reason: "出现 color concentrate，和色母/着色母粒高度相关" },
  { signal: "color masterbatch", points: 35, reason: "出现 color masterbatch，和目标产品高度匹配" },
  { signal: "plastic additives", points: 25, reason: "出现 plastic additives，符合塑料助剂相关客户特征" },
  { signal: "resin distributor", points: 20, reason: "出现 resin distributor，可能是塑料原料分销渠道" },
  { signal: "polymer distributor", points: 20, reason: "出现 polymer distributor，可能是聚合物原料分销渠道" },
  { signal: "plastic compound", points: 25, reason: "出现 plastic compound，和改性塑料/配混业务相关" },
  { signal: "compounder", points: 20, reason: "出现 compounder，可能涉及塑料配混或改性业务" },
  { signal: "pla filament", points: 30, reason: "出现 PLA filament，和 3D 打印耗材方向高度相关" },
  { signal: "3d printer filament", points: 30, reason: "出现 3D printer filament，和 3D 打印耗材方向高度相关" },
  { signal: "filament distributor", points: 30, reason: "出现 filament distributor，可能是 3D 打印耗材分销商" },
  { signal: "injection molding", points: 15, reason: "出现 injection molding，可能是注塑类潜在客户" },
  { signal: "plastic packaging", points: 15, reason: "出现 plastic packaging，可能是塑料包装类客户" },
  { signal: "manufacturer", points: 10, reason: "出现 manufacturer，符合生产型客户特征" },
  { signal: "distributor", points: 15, reason: "出现 distributor，符合分销商客户特征" },
  { signal: "importer", points: 15, reason: "出现 importer，符合进口商客户特征" },
  { signal: "wholesaler", points: 10, reason: "出现 wholesaler，符合批发商客户特征" },
  { signal: "supplier", points: 8, reason: "出现 supplier，可能是供应链相关客户" },
];

const MEDIUM_VALUE_SIGNALS: SignalRule[] = [
  { signal: "plastic products", points: 10, reason: "出现 plastic products，属于泛塑料制品方向" },
  { signal: "plastic sheets", points: 8, reason: "出现 plastic sheets，可能是塑料板材客户" },
  { signal: "plastic bottles", points: 8, reason: "出现 plastic bottles，可能是塑料瓶或包装制品客户" },
  { signal: "tubing", points: 5, reason: "出现 tubing，属于塑料制品线索但采购相关性待确认" },
  { signal: "fittings", points: 5, reason: "出现 fittings，属于塑料制品线索但采购相关性待确认" },
  { signal: "tanks", points: 5, reason: "出现 tanks，属于塑料制品线索但采购相关性待确认" },
  { signal: "buckets", points: 5, reason: "出现 buckets，属于塑料制品线索但采购相关性待确认" },
  { signal: "packaging supplies", points: 8, reason: "出现 packaging supplies，可能是包装用品渠道" },
];

const BLOCKED_PATTERNS = [
  "alibaba.com",
  "amazon.com",
  "made-in-china.com",
  "1688.com",
  "temu.com",
  "shein.com",
  "pinterest.com",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "wikipedia.org",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "linkedin.com/jobs",
];

const DIRECTORY_SIGNALS = [
  "thomasnet",
  "directory",
  "yellow pages",
  "suppliers list",
  "top suppliers",
  "companies list",
];

const RAW_MATERIAL_SIGNALS = [
  "masterbatch",
  "color concentrate",
  "color masterbatch",
  "plastic additives",
  "resin distributor",
  "polymer distributor",
  "plastic compound",
  "compounder",
  "pla filament",
  "3d printer filament",
  "filament distributor",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function includesNeedle(text: string, needle: string): boolean {
  return text.includes(normalize(needle));
}

function addSignals(
  rules: SignalRule[],
  text: string,
  matchedSignals: string[],
  reasons: string[],
): number {
  return rules.reduce((score, rule) => {
    if (includesNeedle(text, rule.signal)) {
      matchedSignals.push(rule.signal);
      reasons.push(rule.reason);
      return score + rule.points;
    }

    return score;
  }, 0);
}

function decisionFromScore(score: number): {
  decision: CandidateReviewDecision;
  fitLevel: CandidateReview["fitLevel"];
} {
  if (score >= 75) {
    return { decision: "save", fitLevel: "high" };
  }

  if (score >= 55) {
    return { decision: "research_more", fitLevel: "medium" };
  }

  if (score >= 35) {
    return { decision: "research_more", fitLevel: "low" };
  }

  return { decision: "reject", fitLevel: "low" };
}

export function reviewSearchCandidate(input: ReviewSearchCandidateInput): CandidateReview {
  const title = input.title || "";
  const link = input.link || "";
  const domain = input.domain || "";
  const snippet = input.snippet || "";
  const query = input.query || "";
  const productKeyword = input.productKeyword || "";
  const customerType = input.customerType || "";
  const country = input.country || "";
  const text = normalize([title, link, domain, snippet].join(" "));
  const reasons: string[] = [];
  const risks: string[] = [];
  const matchedSignals: string[] = [];
  const missingInfo: string[] = [];

  if (BLOCKED_PATTERNS.some((pattern) => text.includes(pattern))) {
    return {
      score: 20,
      decision: "reject",
      fitLevel: "low",
      reasons: ["来源域名或链接属于明显无关平台，不建议保存为客户"],
      risks: ["平台页通常不是目标公司官网，客户身份和采购相关性不足"],
      matchedSignals: [],
      missingInfo: ["需要真实公司官网或公开业务页面"],
      suggestedCustomerType: customerType,
      suggestedProductKeyword: productKeyword,
    };
  }

  let score = 0;
  score += addSignals(HIGH_VALUE_SIGNALS, text, matchedSignals, reasons);
  score += addSignals(MEDIUM_VALUE_SIGNALS, text, matchedSignals, reasons);

  const normalizedProductKeyword = normalize(productKeyword);
  const normalizedCustomerType = normalize(customerType);
  if (normalizedProductKeyword && text.includes(normalizedProductKeyword)) {
    score += 15;
    matchedSignals.push(productKeyword);
    reasons.push("title 或 snippet 中明确出现用户搜索的 productKeyword");
  }

  if (normalizedCustomerType && text.includes(normalizedCustomerType)) {
    score += 10;
    matchedSignals.push(customerType);
    reasons.push("title 或 snippet 中明确出现用户搜索的 customerType");
  }

  if (country && query.toLowerCase().includes(country.toLowerCase())) {
    reasons.push("搜索词中包含目标国家，但系统不会据此猜测候选公司的真实国家");
  }

  const hasDirectorySignal = DIRECTORY_SIGNALS.some((signal) => text.includes(signal));
  if (hasDirectorySignal) {
    score = Math.max(40, Math.min(score, 60));
    risks.push("来源更像目录页或黄页列表，不是公司官网，建议点开确认");
  }

  const hasRawMaterialSignal = RAW_MATERIAL_SIGNALS.some((signal) => text.includes(signal));
  const hasGenericPlasticSignal = MEDIUM_VALUE_SIGNALS.some((rule) => text.includes(rule.signal));
  if (hasGenericPlasticSignal && !hasRawMaterialSignal) {
    score = Math.min(score, 60);
    risks.push("更像泛塑料制品或包装用品线索，不一定采购色母、助剂、原料或耗材");
  }

  if (!title) {
    missingInfo.push("缺少 title");
  }

  if (!snippet) {
    missingInfo.push("缺少 snippet，证据不足");
  }

  if (!domain) {
    missingInfo.push("缺少 domain");
  }

  if (!link) {
    missingInfo.push("缺少 sourceUrl");
  }

  if (!hasRawMaterialSignal) {
    missingInfo.push("未看到 masterbatch / color concentrate / plastic additives / filament 等强相关证据");
  }

  if (reasons.length === 0) {
    reasons.push("当前 title、domain、snippet 中没有看到足够明确的塑料材料采购相关信号");
  }

  if (missingInfo.length >= 3) {
    return {
      score: clampScore(Math.min(score, 34)),
      decision: "unknown",
      fitLevel: "unknown",
      reasons,
      risks: [...risks, "信息太少，不能可靠判断是否值得保存"],
      matchedSignals,
      missingInfo,
      suggestedCustomerType: customerType,
      suggestedProductKeyword: productKeyword,
    };
  }

  const finalScore = clampScore(score);
  const decision = hasDirectorySignal
    ? { decision: "research_more" as const, fitLevel: "medium" as const }
    : decisionFromScore(finalScore);

  return {
    score: finalScore,
    decision: decision.decision,
    fitLevel: decision.fitLevel,
    reasons,
    risks,
    matchedSignals,
    missingInfo,
    suggestedCustomerType: customerType,
    suggestedProductKeyword: productKeyword,
  };
}
