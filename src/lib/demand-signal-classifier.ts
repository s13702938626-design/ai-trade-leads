import type {
  BuyerPlatformCategory,
  BuyerPlatformUseCase,
} from "@/types/buyer-platform";
import type {
  DemandFreshnessWindow,
  DemandIntentType,
  DemandSearchPlan,
  DemandSignalClassification,
  DemandSourceType,
} from "@/types/demand-intelligence";
import type { ProductLineId } from "@/types/search-intelligence";
import { classifyCandidateResult } from "@/lib/candidate-classifier";

type ClassifyDemandSignalInput = {
  title: string;
  link: string;
  domain: string;
  snippet: string;
};

type ClassifyDemandSignalContext = {
  productLineId: ProductLineId;
  searchPlan?: DemandSearchPlan;
  targetCountry: string;
  targetMarketPresetId?: string;
  freshnessWindow?: DemandFreshnessWindow;
  platformId?: string;
  platformCategory?: BuyerPlatformCategory;
  useCase?: BuyerPlatformUseCase;
  resultMeaning?: string;
};

const DEMAND_TERMS: { term: string; points: number; intentType: DemandIntentType }[] = [
  { term: "rfq", points: 40, intentType: "rfq" },
  { term: "request for quote", points: 40, intentType: "rfq" },
  { term: "request quotation", points: 40, intentType: "rfq" },
  { term: "quotation required", points: 40, intentType: "rfq" },
  { term: "request quote", points: 35, intentType: "rfq" },
  { term: "looking for supplier", points: 40, intentType: "looking_for_supplier" },
  { term: "need supplier", points: 30, intentType: "looking_for_supplier" },
  { term: "supplier needed", points: 30, intentType: "looking_for_supplier" },
  { term: "sourcing", points: 30, intentType: "procurement" },
  { term: "procurement", points: 30, intentType: "procurement" },
  { term: "buying request", points: 25, intentType: "rfq" },
  { term: "buying leads", points: 25, intentType: "rfq" },
  { term: "tender", points: 35, intentType: "tender" },
  { term: "bid", points: 35, intentType: "tender" },
  { term: "deadline", points: 20, intentType: "tender" },
  { term: "wanted", points: 25, intentType: "looking_for_supplier" },
  { term: "import requirement", points: 25, intentType: "procurement" },
  { term: "buy", points: 20, intentType: "procurement" },
  { term: "wholesale", points: 20, intentType: "procurement" },
  { term: "bulk buy", points: 20, intentType: "procurement" },
  { term: "alternative supplier", points: 25, intentType: "substitution" },
  { term: "new supplier", points: 25, intentType: "substitution" },
  { term: "replace supplier", points: 25, intentType: "substitution" },
  { term: "distributor wanted", points: 30, intentType: "distributor_wanted" },
  { term: "buyers", points: 12, intentType: "all" },
  { term: "importers", points: 12, intentType: "all" },
  { term: "trade leads", points: 15, intentType: "all" },
  { term: "purchase inquiry", points: 20, intentType: "procurement" },
  { term: "sourcing agent", points: 15, intentType: "procurement" },
  { term: "procurement manager", points: 15, intentType: "procurement" },
  { term: "material supplier inquiry", points: 20, intentType: "looking_for_supplier" },
  { term: "looking to buy", points: 20, intentType: "procurement" },
];

const STRONG_OR_MEDIUM_DEMAND_TERMS = [
  "rfq",
  "request for quote",
  "request quotation",
  "quotation required",
  "request quote",
  "looking for supplier",
  "need supplier",
  "supplier needed",
  "sourcing",
  "procurement",
  "buying request",
  "buying leads",
  "tender",
  "bid",
  "wanted",
  "import requirement",
  "alternative supplier",
  "new supplier",
  "replace supplier",
  "supplier wanted",
  "purchase inquiry",
  "looking to buy",
];

const FRESHNESS_TERMS = [
  { term: "2026", points: 35 },
  { term: "2025", points: 20 },
  { term: "latest", points: 20 },
  { term: "recent", points: 20 },
  { term: "posted", points: 20 },
  { term: "today", points: 20 },
  { term: "this week", points: 20 },
  { term: "this month", points: 20 },
  { term: "deadline", points: 20 },
  { term: "closing date", points: 20 },
  { term: "valid until", points: 20 },
  { term: "published", points: 20 },
  { term: "дата", points: 15 },
  { term: "опубликовано", points: 20 },
  { term: "срок", points: 20 },
  { term: "дедлайн", points: 20 },
];

const OUTDATED_YEARS = ["2023", "2022", "2021", "2020", "2019"];
const MONTH_TERMS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PLATFORM_GATE_TERMS = [
  "login",
  "sign in",
  "register",
  "registration required",
  "subscribe",
  "premium",
  "paid",
  "membership",
  "contact buyer",
  "view details",
  "captcha",
];

function detectDateText(haystack: string): string | null {
  const pieces = [
    ...["2026", "2025", "2024", ...OUTDATED_YEARS].filter((item) => haystack.includes(item)),
    ...FRESHNESS_TERMS.map((item) => item.term).filter((item) => haystack.includes(item)),
    ...MONTH_TERMS.filter((item) => haystack.includes(item)),
  ];
  return pieces.length > 0 ? Array.from(new Set(pieces)).join(", ") : null;
}

const PRODUCT_TERMS: Record<ProductLineId, string[]> = {
  masterbatch: [
    "color masterbatch",
    "colour masterbatch",
    "color concentrate",
    "plastic colorant",
    "additive masterbatch",
    "white masterbatch",
    "black masterbatch",
    "pp masterbatch",
    "pe masterbatch",
    "masterbatch",
    "plastic color",
    "color matching",
  ],
  filament: [
    "3d printer filament",
    "pla filament",
    "petg filament",
    "tpu filament",
    "abs filament",
    "fdm filament",
    "3d printing material",
    "additive manufacturing material",
    "filament supplier",
    "bulk pla filament",
    "wholesale 3d printer filament",
  ],
  custom: [],
};

const BUYER_TERMS = [
  "buyer",
  "importer",
  "distributor",
  "company",
  "service",
  "print farm",
  "manufacturer",
  "procurement",
  "sourcing",
  "purchasing",
  "factory",
  "supplier wanted",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function detectSourceType(haystack: string): DemandSourceType {
  if (/(zakupki\.gov\.ru|tenderguru|roseltorg|fabrikant|prozorro|smarttender|tendersinfo|tenderimpulse|globaltenders|tender|bid|procurement portal)/.test(haystack)) return "tender_site";
  if (/(forum|reddit|stackexchange|quora|reprap|prusa3d)/.test(haystack)) return "forum";
  if (/(go4worldbusiness|tradewheel)/.test(haystack)) return "rfq_platform";
  if (/(exporthub|tradeford|globalsources|ec21|ecplaza|b2bmap|eworldtrade|allbiz|tiu\.ru|avito\.ru|prom\.ua)/.test(haystack)) return "b2b_platform";
  if (haystack.includes("linkedin")) return "social_public";
  if (/(directory|thomasnet|kompass|europages)/.test(haystack)) return "directory";
  if (/(contact us|about us|products|request a quote)/.test(haystack)) return "company_page";
  return "search_engine";
}

function platformSignalType(
  sourceType: DemandSourceType,
  platformCategory: BuyerPlatformCategory | undefined,
  haystack: string,
): DemandSignalClassification["platformSignalType"] {
  if (platformCategory === "marketplace_ecommerce" || platformCategory === "business_procurement") return "marketplace_listing";
  if (platformCategory === "tender_procurement" || sourceType === "tender_site") return "tender_notice";
  if (platformCategory === "forum_community" || sourceType === "forum") return "forum_discussion";
  if (sourceType === "directory" || platformCategory === "industry_directory") return "supplier_directory";
  if (platformCategory === "regional_b2b") return "distributor_channel";
  if (platformCategory === "global_b2b_rfq" && /(rfq|buying leads|buyer|request quotation|request for quote|submit rfq)/.test(haystack)) return "rfq_or_buying_lead";
  return "unknown";
}

function scoreTerms(haystack: string, terms: string[]): { score: number; matched: string[] } {
  const matched = terms.filter((term) => haystack.includes(term));
  return { score: clamp(matched.length * 20), matched };
}

function inferIntent(matchedDemand: typeof DEMAND_TERMS): DemandIntentType {
  return matchedDemand[0]?.intentType ?? "all";
}

export function classifyDemandSignal(
  result: ClassifyDemandSignalInput,
  context: ClassifyDemandSignalContext,
): DemandSignalClassification {
  const haystack = normalize(`${result.title} ${result.link} ${result.domain} ${result.snippet}`);
  const matchedDemand = DEMAND_TERMS.filter((item) => haystack.includes(item.term));
  const evidenceTerms = matchedDemand.map((item) => item.term);
  const hasStrongOrMediumDemandTerm = STRONG_OR_MEDIUM_DEMAND_TERMS.some((term) => haystack.includes(term));
  const broadEntranceOnly = matchedDemand.length > 0 && !hasStrongOrMediumDemandTerm;
  let demandScore = clamp(matchedDemand.reduce((sum, item) => sum + item.points, 0));
  if (broadEntranceOnly) {
    demandScore = Math.min(demandScore, 35);
  }
  const matchedFreshness = FRESHNESS_TERMS.filter((item) => haystack.includes(item.term));
  const detectedDateText = detectDateText(haystack);
  const hasOutdatedYear = OUTDATED_YEARS.some((year) => haystack.includes(year));
  const has2026 = haystack.includes("2026");
  const has2025 = haystack.includes("2025");
  let freshnessScore = clamp(matchedFreshness.reduce((sum, item) => sum + item.points, 0) + (has2026 ? 35 : 0) + (has2025 ? 10 : 0));
  let isLikelyRecent = has2026;
  const isLikelyOutdated = hasOutdatedYear;
  let ageWarning: string | null = null;
  if (hasOutdatedYear) {
    freshnessScore = 0;
    ageWarning = "结果疑似超过半年或年份过旧，需要谨慎";
  } else if (!detectedDateText) {
    freshnessScore = 0;
    isLikelyRecent = false;
    ageWarning = "缺少发布日期或有效期，无法确认是否在最近 6 个月内";
  } else if (has2025 && !has2026) {
    ageWarning = "结果包含 2025，但不确定是否在最近 6 个月内";
  }
  const sourceType = detectSourceType(haystack);
  const sourceChannel = context.searchPlan?.sourceChannel;
  const signalType = platformSignalType(sourceType, context.platformCategory, haystack);
  const languageHints = context.searchPlan?.languageHints ?? [];
  const productLineTerms = PRODUCT_TERMS[context.productLineId];
  const productMatch = scoreTerms(haystack, productLineTerms);
  const otherProductLine = context.productLineId === "filament" ? "masterbatch" : "filament";
  const otherProductMatch = context.productLineId === "custom" ? { score: 0, matched: [] } : scoreTerms(haystack, PRODUCT_TERMS[otherProductLine]);
  const buyerMatch = scoreTerms(haystack, BUYER_TERMS);
  const candidateClassification = context.productLineId === "custom"
    ? null
    : classifyCandidateResult(result, { productLineId: context.productLineId });
  const warnings: string[] = [];
  const missingInfo: string[] = [];
  const classificationReasons: string[] = [];
  const manualCheckReasons: string[] = [];
  let verificationRequired = false;
  let platformGateWarning: string | null = null;

  if (otherProductMatch.score > 0) {
    warnings.push("命中另一产品线词，可能不是当前产品线需求");
  }
  if (freshnessScore === 0 && !hasOutdatedYear) {
    missingInfo.push("缺少发布日期或有效期，无法确认是否在最近 6 个月内");
    manualCheckReasons.push("需要人工打开原网页核实发布日期或有效期");
    verificationRequired = true;
  }
  if (has2025 && !has2026) missingInfo.push("结果包含 2025，但不确定是否在最近 6 个月内");
  if (!context.targetCountry.trim()) {
    missingInfo.push("缺少目标国家，结果需要人工确认市场区域");
  }
  if (!result.link) missingInfo.push("缺少原始链接");
  if (!result.snippet) {
    missingInfo.push("缺少摘要证据");
    manualCheckReasons.push("搜索摘要不足，需要打开来源确认");
    verificationRequired = true;
  }
  if (demandScore === 0) {
    missingInfo.push("未看到明确 RFQ / 找供应商 / 采购需求词");
    manualCheckReasons.push("未看到明确求购词，需要人工确认是否只是普通页面");
    verificationRequired = true;
  }
  if (productMatch.score === 0) {
    missingInfo.push("未看到当前产品线产品词");
    manualCheckReasons.push("未看到当前产品线词，需要确认产品是否匹配");
    verificationRequired = true;
  }
  if (broadEntranceOnly) {
    warnings.push("该结果更像买家入口或平台线索，不一定是当前采购需求");
  }

  const productFitScore = clamp(productMatch.score + (context.searchPlan?.positiveTerms ?? []).filter((term) => haystack.includes(normalize(term))).length * 8 - otherProductMatch.score);
  const buyerFitScore = sourceType === "directory" ? Math.min(45, buyerMatch.score) : clamp(buyerMatch.score + (sourceType === "company_page" ? 15 : 0));
  const peerRiskScore = candidateClassification?.peerRiskScore ?? 0;
  const intentType = context.searchPlan?.intentType === "all" || !context.searchPlan?.intentType
    ? inferIntent(matchedDemand)
    : context.searchPlan.intentType;

  if (matchedDemand.length > 0) classificationReasons.push(`命中需求词：${evidenceTerms.join(", ")}`);
  if (productMatch.matched.length > 0) classificationReasons.push(`命中产品词：${productMatch.matched.join(", ")}`);
  if (matchedFreshness.length > 0) classificationReasons.push(`命中新鲜度词：${matchedFreshness.map((item) => item.term).join(", ")}`);
  if (buyerMatch.matched.length > 0) classificationReasons.push(`命中买家词：${buyerMatch.matched.join(", ")}`);
  if (sourceType === "directory") warnings.push("来源更像目录页，需求强度不足时不建议保存");
  if (sourceType === "b2b_platform" || sourceType === "rfq_platform") {
    demandScore = Math.min(100, demandScore + 20);
    warnings.push("平台线索需要人工核实需求方真实性和时效");
    missingInfo.push("需要打开原始页面核实发布日期、买家身份和有效期");
    manualCheckReasons.push("需要打开平台页面核实发布日期、买家身份和有效期");
    verificationRequired = true;
    if (!detectedDateText) {
      manualCheckReasons.push("B2B 平台 buyers/buying leads 页面缺少具体日期，不能直接视为有效求购");
    }
  }
  if (context.platformCategory === "global_b2b_rfq") {
    manualCheckReasons.push("B2B RFQ 平台结果需要人工确认是否为单条 buying lead 或 RFQ");
    verificationRequired = true;
    if (signalType === "rfq_or_buying_lead") {
      demandScore = Math.min(100, demandScore + 15);
      classificationReasons.push("平台上下文显示为 B2B RFQ / buying lead 搜索");
    }
    if (!detectedDateText) {
      missingInfo.push("RFQ 平台结果缺少日期，必须打开平台核实");
    }
  }
  if (context.platformCategory === "marketplace_ecommerce" || context.platformCategory === "business_procurement") {
    demandScore = Math.min(demandScore, 25);
    warnings.push("电商平台结果用于市场/价格/渠道验证，不等于求购信息。");
    manualCheckReasons.push("电商平台结果不能直接当作求购，需要作为渠道或竞品线索核实");
    verificationRequired = true;
  }
  if (context.platformCategory === "tender_procurement") {
    if (/(2026|deadline|procurement|tender|bid|closing date)/.test(haystack)) {
      demandScore = Math.min(100, demandScore + 20);
    }
    warnings.push("招标采购平台需要核实截止日期、供应商资质和是否允许海外供应。");
  }
  if (context.platformCategory === "forum_community") {
    warnings.push("论坛/社区结果通常是需求启发，不等于企业采购。");
    verificationRequired = true;
  }
  if (sourceType === "tender_site") {
    demandScore = Math.min(100, demandScore + 30);
    warnings.push("招标信息需要核实资质、交付条款、付款条件、合规要求和有效期");
    manualCheckReasons.push("招标信息需要人工核实截止日期、资质和交付条款");
    verificationRequired = true;
  }
  if (sourceType === "forum") {
    if (/(looking for|need|supplier|bulk|wholesale|купить|поставщик|постачальник)/.test(haystack)) {
      demandScore = Math.min(100, demandScore + 20);
    }
    warnings.push("论坛线索需要核实是否企业采购需求");
    manualCheckReasons.push("论坛线索需要人工核实发帖人身份和是否代表企业采购");
    verificationRequired = true;
  }
  if (/classified|avito|prom\.ua/.test(haystack)) {
    warnings.push("分类信息需人工核实买家身份");
  }
  const localTerms = ["купить", "закупка", "поставщик", "запрос цены", "коммерческое предложение", "тендер", "оптом", "купити", "закупівля", "постачальник", "запит ціни", "комерційна пропозиція"];
  const matchedLocalTerms = localTerms.filter((term) => haystack.includes(term));
  if (matchedLocalTerms.length > 0) {
    demandScore = Math.min(100, demandScore + Math.min(35, matchedLocalTerms.length * 12));
    evidenceTerms.push(...matchedLocalTerms);
  }
  if (/(seller|supplier directory|manufacturer|factory|producer|exporter)/.test(haystack)) {
    warnings.push("标题或摘要更像供应商展示页，需要排除同行或卖家页面");
    manualCheckReasons.push("标题或摘要可能是供应商广告，需要人工排除");
    verificationRequired = true;
  }
  if (PLATFORM_GATE_TERMS.some((term) => haystack.includes(term))) {
    platformGateWarning = "该结果可能需要登录或付费查看，不能直接视为有效求购";
    warnings.push(platformGateWarning);
    manualCheckReasons.push("页面可能需要登录、注册或付费查看完整信息");
    verificationRequired = true;
  }

  const missionFitScore = clamp(
    demandScore * 0.35 +
    productFitScore * 0.25 +
    freshnessScore * 0.25 +
    buyerFitScore * 0.1 -
    peerRiskScore * 0.2 +
    (sourceType === "tender_site" || sourceType === "rfq_platform" ? 10 : 0) -
    (sourceType === "directory" ? 20 : 0),
  );

  let recommendedAction: DemandSignalClassification["recommendedAction"] = "research_more";
  if (context.platformCategory === "marketplace_ecommerce" || context.platformCategory === "business_procurement") {
    recommendedAction = "research_more";
  } else if (context.platformCategory === "forum_community") {
    recommendedAction = "research_more";
  } else if (peerRiskScore >= 60) {
    recommendedAction = "peer_supplier";
  } else if (sourceType === "directory" && demandScore < 30) {
    recommendedAction = "directory_only";
  } else if (isLikelyOutdated) {
    recommendedAction = "ignore";
  } else if (platformGateWarning) {
    recommendedAction = "research_more";
  } else if (demandScore >= 60 && productFitScore >= 35 && peerRiskScore < 50 && hasStrongOrMediumDemandTerm && context.searchPlan?.signalStrength !== "broad" && (freshnessScore >= 20 || isLikelyRecent)) {
    recommendedAction = "save_candidate";
  } else if (demandScore >= 40 && productFitScore >= 25) {
    recommendedAction = "research_more";
  } else if (productFitScore < 20 || demandScore < 20) {
    recommendedAction = "ignore";
  }

  if (context.searchPlan?.signalStrength === "broad" && demandScore < 40 && recommendedAction !== "peer_supplier") {
    recommendedAction = productFitScore >= 25 ? "research_more" : "ignore";
  }

  return {
    intentType,
    sourceType,
    sourceChannel,
    targetMarketPreset: context.targetMarketPresetId ?? context.searchPlan?.targetRegionPreset,
    languageHints,
    detectedDateText,
    isLikelyRecent,
    isLikelyOutdated,
    ageWarning,
    demandScore,
    freshnessScore,
    productFitScore,
    buyerFitScore,
    peerRiskScore,
    missionFitScore,
    verificationRequired,
    manualCheckReasons: Array.from(new Set(manualCheckReasons)),
    platformGateWarning,
    platformId: context.platformId,
    platformCategory: context.platformCategory,
    useCase: context.useCase,
    resultMeaning: context.resultMeaning,
    platformSignalType: signalType,
    recommendedAction,
    evidenceTerms: Array.from(new Set([...evidenceTerms, ...productMatch.matched, ...matchedFreshness.map((item) => item.term)])),
    missingInfo,
    warnings,
    classificationReasons: classificationReasons.length > 0 ? classificationReasons : ["当前结果需要人工打开来源确认是否存在真实需求"],
    shouldHideByDefault: recommendedAction === "peer_supplier" || recommendedAction === "ignore" || recommendedAction === "directory_only" || isLikelyOutdated,
  };
}
