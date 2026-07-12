import type {
  BuyerPersonaId,
  CandidateBusinessRole,
  CandidateClassification,
  ProductLineId,
  SearchQueryPlan,
} from "@/types/search-intelligence";

type ClassifyCandidateInput = {
  title: string;
  link: string;
  domain: string;
  snippet: string;
};

type ClassifyContext = {
  productLineId: ProductLineId;
  searchPlan?: SearchQueryPlan;
};

type TermMatch = {
  term: string;
  points: number;
  persona?: BuyerPersonaId;
};

const MASTERBATCH_POSITIVE: TermMatch[] = [
  { term: "plastic injection molding", points: 55, persona: "injection_molder" },
  { term: "injection molder", points: 55, persona: "injection_molder" },
  { term: "plastic product manufacturer", points: 45, persona: "plastic_product_manufacturer" },
  { term: "plastic packaging", points: 45, persona: "packaging_manufacturer" },
  { term: "food container manufacturer", points: 45, persona: "pp_container_manufacturer" },
  { term: "plastic container", points: 35, persona: "pp_container_manufacturer" },
  { term: "plastic extrusion", points: 45, persona: "extrusion_factory" },
  { term: "blow molding", points: 45, persona: "blow_molding_factory" },
  { term: "plastic toys", points: 35, persona: "toy_manufacturer" },
  { term: "plastic toy", points: 35, persona: "toy_manufacturer" },
  { term: "plastic pipe", points: 35, persona: "pipe_manufacturer" },
  { term: "plastic household", points: 30, persona: "plastic_product_manufacturer" },
  { term: "bottle cap", points: 30, persona: "plastic_product_manufacturer" },
  { term: "cable manufacturer", points: 30, persona: "cable_manufacturer" },
  { term: "custom color plastic", points: 25, persona: "plastic_product_manufacturer" },
  { term: "color matching", points: 25, persona: "plastic_product_manufacturer" },
];

const MASTERBATCH_PEER: TermMatch[] = [
  { term: "masterbatch manufacturer", points: 95 },
  { term: "color masterbatch manufacturer", points: 100 },
  { term: "masterbatch supplier", points: 85 },
  { term: "color concentrate manufacturer", points: 95 },
  { term: "pigment manufacturer", points: 75 },
  { term: "compounder", points: 65 },
  { term: "plastic raw material supplier", points: 70 },
  { term: "resin supplier", points: 65 },
  { term: "additive masterbatch manufacturer", points: 95 },
];

const FILAMENT_POSITIVE: TermMatch[] = [
  { term: "3d printing service", points: 60, persona: "3d_printing_service" },
  { term: "3d print service", points: 60, persona: "3d_printing_service" },
  { term: "3d printing bureau", points: 60, persona: "3d_printing_service" },
  { term: "3d print farm", points: 60, persona: "print_farm" },
  { term: "fdm printing", points: 45, persona: "3d_printing_service" },
  { term: "rapid prototyping", points: 55, persona: "rapid_prototyping_service" },
  { term: "additive manufacturing service", points: 55, persona: "additive_manufacturing_service" },
  { term: "prototyping service", points: 45, persona: "rapid_prototyping_service" },
  { term: "model making", points: 35, persona: "model_making_studio" },
  { term: "cosplay props", points: 35, persona: "cosplay_prop_studio" },
  { term: "miniature printing", points: 35, persona: "3d_printing_service" },
  { term: "makerspace", points: 45, persona: "makerspace" },
  { term: "fab lab", points: 40, persona: "makerspace" },
  { term: "school 3d printing", points: 35, persona: "school_lab" },
  { term: "university maker lab", points: 35, persona: "school_lab" },
  { term: "3d printing shop", points: 40, persona: "3d_printing_service" },
];

const FILAMENT_PEER: TermMatch[] = [
  { term: "filament manufacturer", points: 95 },
  { term: "pla filament manufacturer", points: 100 },
  { term: "petg filament manufacturer", points: 100 },
  { term: "3d printer filament manufacturer", points: 100 },
  { term: "filament supplier", points: 90 },
  { term: "filament factory", points: 95 },
  { term: "filament producer", points: 90 },
  { term: "filament exporter", points: 85 },
  { term: "oem filament", points: 75 },
];

const DISTRIBUTOR_TERMS: TermMatch[] = [
  { term: "distributor", points: 35, persona: "distributor" },
  { term: "reseller", points: 35, persona: "reseller" },
  { term: "wholesaler", points: 30, persona: "trader" },
  { term: "importer", points: 30, persona: "trader" },
  { term: "trading", points: 25, persona: "trader" },
  { term: "dealer", points: 25, persona: "reseller" },
  { term: "supplies store", points: 25, persona: "reseller" },
  { term: "materials distributor", points: 40, persona: "distributor" },
];

const DIRECTORY_TERMS = [
  "directory",
  "marketplace",
  "suppliers list",
  "manufacturers list",
  "thomasnet",
  "kompass",
  "europages",
  "alibaba",
  "made-in-china",
  "global sources",
];

const CONTENT_TERMS = ["blog", "news", "article", "guide", "how-to", "how to", "what is"];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function collectMatches(
  rules: TermMatch[],
  haystack: string,
): { matchedTerms: string[]; score: number; persona: BuyerPersonaId | "unknown" } {
  const matchedTerms: string[] = [];
  let score = 0;
  let persona: BuyerPersonaId | "unknown" = "unknown";
  rules.forEach((rule) => {
    if (haystack.includes(rule.term.toLowerCase())) {
      matchedTerms.push(rule.term);
      score += rule.points;
      if (persona === "unknown" && rule.persona) persona = rule.persona;
    }
  });
  return { matchedTerms, score: clamp(score), persona };
}

function hasAny(haystack: string, terms: string[]): boolean {
  return terms.some((term) => haystack.includes(term));
}

function productTerms(productLineId: ProductLineId): string[] {
  if (productLineId === "filament") {
    return ["3d printing", "3d printer", "filament", "pla", "petg", "tpu", "fdm", "additive manufacturing"];
  }
  if (productLineId === "masterbatch") {
    return ["plastic", "injection molding", "packaging", "extrusion", "blow molding", "container", "color", "masterbatch"];
  }
  return [];
}

export function classifyCandidateResult(
  result: ClassifyCandidateInput,
  context: ClassifyContext,
): CandidateClassification {
  const haystack = normalize(`${result.title} ${result.link} ${result.domain} ${result.snippet}`);
  const positiveRules = context.productLineId === "filament" ? FILAMENT_POSITIVE : MASTERBATCH_POSITIVE;
  const peerRules = context.productLineId === "filament" ? FILAMENT_PEER : MASTERBATCH_PEER;
  const positive = collectMatches(positiveRules, haystack);
  const peer = collectMatches(peerRules, haystack);
  const distributor = collectMatches(DISTRIBUTOR_TERMS, haystack);
  const matchedPlanPositive = (context.searchPlan?.positiveTerms ?? []).filter((term) => haystack.includes(normalize(term)));
  const matchedPlanNegative = (context.searchPlan?.negativeTerms ?? []).filter((term) => haystack.includes(normalize(term)));
  const matchedPositiveTerms = Array.from(new Set([...positive.matchedTerms, ...distributor.matchedTerms, ...matchedPlanPositive]));
  const matchedNegativeTerms = Array.from(new Set([...peer.matchedTerms, ...matchedPlanNegative]));
  const classificationReasons: string[] = [];
  const rejectionReasons: string[] = [];
  const directory = hasAny(haystack, DIRECTORY_TERMS);
  const contentArticle = hasAny(haystack, CONTENT_TERMS);
  const productLineRelated = hasAny(haystack, productTerms(context.productLineId));
  const peerRiskScore = clamp(peer.score + matchedPlanNegative.length * 15);
  const buyerFitScore = clamp(positive.score + distributor.score + matchedPlanPositive.length * 8);
  const relevanceScore = clamp(buyerFitScore + (productLineRelated ? 15 : 0) - Math.floor(peerRiskScore / 2));

  let businessRole: CandidateBusinessRole = "unknown";
  let buyerPersonaId: BuyerPersonaId | "unknown" = positive.persona !== "unknown" ? positive.persona : distributor.persona;

  if (peerRiskScore >= 60) {
    businessRole = "peer_supplier";
    buyerPersonaId = "peer_supplier";
    rejectionReasons.push("命中同行/供应商负向关键词，可能不是目标买家");
  } else if (directory) {
    businessRole = "directory_or_platform";
    buyerPersonaId = "directory_or_platform";
    classificationReasons.push("来源更像目录或平台页，需要人工点开筛选真实公司");
  } else if (contentArticle) {
    businessRole = "content_article";
    classificationReasons.push("来源更像文章、新闻或指南，不一定是公司买家页面");
  } else if (positive.score > 0) {
    businessRole = "target_end_user";
    classificationReasons.push("命中目标使用商场景关键词");
  } else if (distributor.score > 0) {
    businessRole = distributor.persona === "trader" ? "target_trader" : "target_distributor";
    classificationReasons.push("命中贸易商/分销商关键词");
  } else if (!productLineRelated) {
    businessRole = "irrelevant";
    rejectionReasons.push("未看到当前产品线相关业务信号");
  } else {
    classificationReasons.push("有产品线相关词，但买家角色证据不足");
  }

  if (matchedPositiveTerms.length > 0) {
    classificationReasons.push(`命中正向词：${matchedPositiveTerms.slice(0, 5).join(", ")}`);
  }
  if (matchedNegativeTerms.length > 0) {
    rejectionReasons.push(`命中负向词：${matchedNegativeTerms.slice(0, 5).join(", ")}`);
  }

  return {
    businessRole,
    productLineId: context.productLineId,
    buyerPersonaId,
    relevanceScore,
    buyerFitScore: directory ? Math.min(buyerFitScore, 55) : buyerFitScore,
    peerRiskScore,
    shouldHideByDefault: businessRole === "peer_supplier" || businessRole === "irrelevant",
    classificationReasons: classificationReasons.length > 0 ? classificationReasons : ["信息不足，无法明确判断客户角色"],
    rejectionReasons,
    matchedPositiveTerms,
    matchedNegativeTerms,
  };
}
