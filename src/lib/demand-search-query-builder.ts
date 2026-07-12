import type {
  DemandIntentType,
  DemandFreshnessWindow,
  DemandSearchPlan,
  DemandSignalStrength,
  DemandSourceChannel,
  DemandSourceType,
} from "@/types/demand-intelligence";
import type { ProductLineId, SearchStrictness } from "@/types/search-intelligence";
import { PRODUCT_LINES } from "@/lib/product-lines";
import { TARGET_MARKET_PRESETS, type TargetMarketPresetId } from "@/lib/target-market-presets";

type GenerateDemandSearchPlansInput = {
  productLineId: ProductLineId;
  targetCountry: string;
  targetMarketPresetId?: TargetMarketPresetId;
  sourceChannel?: DemandSourceChannel;
  freshnessWindow?: DemandFreshnessWindow;
  intentType: DemandIntentType;
  strictness: SearchStrictness;
  customProductKeyword?: string;
};

type DemandSeed = {
  intentType: DemandIntentType;
  sourceType: DemandSourceType;
  sourceChannel: DemandSourceChannel;
  targetRegionPreset?: string;
  sourceDomains: string[];
  languageHints: string[];
  signalStrength: DemandSignalStrength;
  label: string;
  query: string;
  purpose: string;
  expectedSignal: string;
  risk: string;
  positiveTerms: string[];
  negativeTerms: string[];
};

function q(value: string): string {
  return `"${value.trim()}"`;
}

function optionalCountry(targetCountry?: string): string {
  const country = targetCountry?.trim();
  return country ? ` ${q(country)}` : "";
}

function recallPrecision(signalStrength: DemandSignalStrength): Pick<DemandSearchPlan, "estimatedRecall" | "estimatedPrecision"> {
  if (signalStrength === "strong") return { estimatedRecall: "low", estimatedPrecision: "high" };
  if (signalStrength === "medium") return { estimatedRecall: "medium", estimatedPrecision: "medium" };
  return { estimatedRecall: "high", estimatedPrecision: "low" };
}

function freshnessMeta(freshnessWindow: DemandFreshnessWindow): Pick<DemandSearchPlan, "freshnessWindow" | "timeFilterLabel" | "serperTbs" | "dateTerms"> {
  const map: Record<DemandFreshnessWindow, Pick<DemandSearchPlan, "timeFilterLabel" | "serperTbs" | "dateTerms">> = {
    past_month: { timeFilterLabel: "近 1 个月", serperTbs: "qdr:m", dateTerms: ["latest", "recent", "2026"] },
    past_3_months: { timeFilterLabel: "近 3 个月", serperTbs: "qdr:m3", dateTerms: ["latest", "recent", "2026"] },
    past_6_months: { timeFilterLabel: "近 6 个月", serperTbs: "qdr:m6", dateTerms: ["latest", "recent", "2026"] },
    past_year: { timeFilterLabel: "近 1 年", serperTbs: "qdr:y", dateTerms: ["2026", "2025", "latest", "recent"] },
    anytime: { timeFilterLabel: "不限时间", serperTbs: undefined, dateTerms: [] },
  };
  return { freshnessWindow, ...map[freshnessWindow] };
}

function withDateTerm(query: string, seed: DemandSeed, dateTerms: string[]): string {
  if (dateTerms.length === 0) return query;
  if (seed.sourceType === "tender_site") return `${query} ${q("2026")}`;
  if (seed.sourceType === "rfq_platform" || seed.sourceType === "b2b_platform") return `${query} ${q("2026")}`;
  if (seed.sourceChannel === "regional_local_sites" && seed.signalStrength !== "strong") return `${query} ${q("2026")}`;
  if (seed.signalStrength === "broad") return `${query} ${q(dateTerms[0])}`;
  return query;
}

function makePlan(productLineId: ProductLineId, strictness: SearchStrictness, freshnessWindow: DemandFreshnessWindow, seed: DemandSeed, index: number): DemandSearchPlan {
  const meta = freshnessMeta(freshnessWindow);
  return {
    id: `demand-${productLineId}-${seed.signalStrength}-${seed.intentType}-${index + 1}`,
    productLineId,
    strictness,
    ...recallPrecision(seed.signalStrength),
    ...meta,
    ...seed,
    query: withDateTerm(seed.query, seed, meta.dateTerms).replace(/\s+/g, " ").trim(),
  };
}

function productTerms(productLineId: ProductLineId, customProductKeyword?: string): string[] {
  if (productLineId === "filament") {
    return [
      "3D printer filament",
      "3D printing filament",
      "PLA filament",
      "PETG filament",
      "TPU filament",
      "ABS filament",
      "FDM filament",
      "3D printing material",
      "additive manufacturing material",
      "filament spool",
      "bulk PLA filament",
      "wholesale 3D filament",
    ];
  }
  if (productLineId === "masterbatch") {
    return [
      "color masterbatch",
      "colour masterbatch",
      "color concentrate",
      "plastic colorant",
      "plastic color additive",
      "additive masterbatch",
      "white masterbatch",
      "black masterbatch",
      "PP masterbatch",
      "PE masterbatch",
      "plastic coloring material",
      "plastic color solution",
      "custom color plastic",
    ];
  }
  return [customProductKeyword?.trim() || "plastic materials"];
}

function seed(
  productLineId: ProductLineId,
  country: string,
  signalStrength: DemandSignalStrength,
  intentType: DemandIntentType,
  product: string,
  signal: string,
  sourceType: DemandSourceType = "search_engine",
  sourceChannel: DemandSourceChannel = "general_web",
  extra?: Partial<Pick<DemandSeed, "targetRegionPreset" | "sourceDomains" | "languageHints">>,
): DemandSeed {
  const query = sourceType === "search_engine"
    ? `${q(product)} ${signal ? q(signal) : ""}${optionalCountry(country)}`
    : product;
  return {
    intentType,
    sourceType,
    sourceChannel,
    targetRegionPreset: extra?.targetRegionPreset,
    sourceDomains: extra?.sourceDomains ?? [],
    languageHints: extra?.languageHints ?? ["en"],
    signalStrength,
    label: sourceType === "search_engine" ? `${product} ${signal}`.trim() : product.replace(/^site:/, ""),
    query,
    purpose: signalStrength === "strong"
      ? "搜索强采购意图公开页面，数量较少但质量较高"
      : signalStrength === "medium"
        ? "搜索中等采购意图和买家入口，需要人工核实"
        : "搜索更宽泛的买家入口和平台线索，召回更高但噪音更多",
    expectedSignal: signal || "buyer / importer / trade lead",
    risk: signalStrength === "broad"
      ? "广泛线索不一定是当前采购需求，必须人工确认发布日期、买家身份和产品匹配"
      : "公开需求可能过期，必须人工确认发布日期和真实需求方",
    positiveTerms: sourceType === "search_engine" ? [product, signal].filter(Boolean) : [product],
    negativeTerms: PRODUCT_LINES[productLineId].peerSupplierTerms,
  };
}

function siteDomain(query: string): string[] {
  const match = query.match(/site:([^\s"]+)/);
  return match ? [match[1]] : [];
}

function platformSeeds(productLineId: ProductLineId, presetId: TargetMarketPresetId = "global"): DemandSeed[] {
  if (productLineId === "custom") return [];
  const rows = productLineId === "filament"
    ? [
        `site:go4worldbusiness.com ${q("PLA filament")} ${q("buying leads")}`,
        `site:go4worldbusiness.com ${q("3D printer filament")} ${q("buyers")}`,
        `site:tradewheel.com ${q("PLA filament")} ${q("RFQ")}`,
        `site:tradewheel.com ${q("3D printer filament")} ${q("buyers")}`,
        `site:exporthub.com ${q("PLA filament")} ${q("buying")}`,
        `site:exporthub.com ${q("3D printer filament")} ${q("buyers")}`,
        `site:tradeford.com ${q("PLA filament")} ${q("buyers")}`,
        `site:ec21.com ${q("PLA filament")} ${q("buying leads")}`,
        `site:ecplaza.net ${q("3D printer filament")} ${q("buyers")}`,
        `site:globalsources.com ${q("PLA filament")} ${q("buying request")}`,
      ]
    : [
        `site:go4worldbusiness.com ${q("color masterbatch")} ${q("buying leads")}`,
        `site:go4worldbusiness.com ${q("color masterbatch")} ${q("buyers")}`,
        `site:tradewheel.com ${q("color masterbatch")} ${q("RFQ")}`,
        `site:tradewheel.com ${q("color masterbatch")} ${q("buyers")}`,
        `site:exporthub.com ${q("color masterbatch")} ${q("buying")}`,
        `site:exporthub.com ${q("plastic colorant")} ${q("buyers")}`,
        `site:tradeford.com ${q("color masterbatch")} ${q("buyers")}`,
        `site:ec21.com ${q("color masterbatch")} ${q("buying leads")}`,
        `site:ecplaza.net ${q("color masterbatch")} ${q("buyers")}`,
        `site:globalsources.com ${q("color masterbatch")} ${q("buying request")}`,
      ];
  return rows.map((query) => seed(
    productLineId,
    "",
    "broad",
    "all",
    query,
    "B2B platform buyer entry",
    query.includes("tradewheel") || query.includes("go4worldbusiness") ? "rfq_platform" : "b2b_platform",
    query.includes("tradeford") || query.includes("ec21") || query.includes("ecplaza") ? "trade_leads_platforms" : "b2b_rfq_platforms",
    { targetRegionPreset: presetId, sourceDomains: siteDomain(query), languageHints: ["en"] },
  ));
}

function multilingualSeeds(productLineId: ProductLineId, country: string): DemandSeed[] {
  if (productLineId === "custom") return [];
  const term = productLineId === "filament" ? "PLA filament" : "color masterbatch";
  const secondTerm = productLineId === "filament" ? "3D printer filament" : "color masterbatch";
  return [
    [term, "cotización"],
    [term, "proveedor"],
    [secondTerm, "devis"],
    [term, "cotação"],
    [term, "fornecedor"],
    [secondTerm, "fournisseur"],
  ].map(([product, signal]) => seed(productLineId, country, "broad", "all", product, signal, "search_engine", "regional_local_sites", { languageHints: ["es", "pt", "fr"] }));
}

function marketCountryTerms(presetId: TargetMarketPresetId | undefined, targetCountry: string): string[] {
  const country = targetCountry.trim();
  if (country) return [country];
  const preset = TARGET_MARKET_PRESETS[presetId ?? "global"];
  return preset.searchCountryTerms.length > 0 ? preset.searchCountryTerms.slice(0, 8) : [""];
}

function marketLocalSeeds(productLineId: ProductLineId, presetId: TargetMarketPresetId, targetCountry: string): DemandSeed[] {
  if (productLineId === "custom") return [];
  const preset = TARGET_MARKET_PRESETS[presetId];
  const product = productLineId === "filament" ? "PLA filament" : "color masterbatch";
  const altProduct = productLineId === "filament" ? "3D printer filament" : "plastic colorant";
  const countryTerms = marketCountryTerms(presetId, targetCountry).slice(0, 4);
  return countryTerms.flatMap((country) =>
    preset.localDemandTerms.slice(0, 5).map((term, index) =>
      seed(
        productLineId,
        country,
        index < 2 ? "medium" : "broad",
        index < 2 ? "procurement" : "all",
        index % 2 === 0 ? product : altProduct,
        term,
        "search_engine",
        "regional_local_sites",
        { targetRegionPreset: presetId, languageHints: preset.languageHints },
      ),
    ),
  );
}

function localSiteSeeds(productLineId: ProductLineId, presetId: TargetMarketPresetId): DemandSeed[] {
  if (productLineId === "custom") return [];
  const preset = TARGET_MARKET_PRESETS[presetId];
  const product = productLineId === "filament" ? "PLA filament" : "masterbatch";
  return [...preset.localB2BSites, ...preset.localTenderSites].map((site) => {
    const tender = preset.localTenderSites.includes(site);
    const query = `${site} ${q(product)}`;
    return seed(
      productLineId,
      "",
      tender ? "medium" : "broad",
      tender ? "tender" : "all",
      query,
      tender ? "tender procurement" : "local B2B demand",
      tender ? "tender_site" : "b2b_platform",
      tender ? "tender_procurement" : "regional_local_sites",
      { targetRegionPreset: presetId, sourceDomains: siteDomain(query), languageHints: preset.languageHints },
    );
  });
}

function presetExampleSeeds(productLineId: ProductLineId, presetId: TargetMarketPresetId): DemandSeed[] {
  if (productLineId === "custom") return [];
  if (presetId === "russia") {
    const rows: Array<[string, string]> = productLineId === "filament"
      ? [["PLA filament", "купить"], ["3D printer filament", "поставщик"], ["PLA filament", "закупка"], ["3D filament", "тендер"], ["PLA filament", "оптом"]]
      : [["color masterbatch", "купить"], ["color masterbatch", "поставщик"], ["masterbatch", "закупка"], ["masterbatch", "тендер"], ["plastic colorant", "коммерческое предложение"]];
    return rows.map(([product, term]) => seed(productLineId, "Россия", "medium", term.includes("тендер") ? "tender" : "procurement", product, term, "search_engine", "regional_local_sites", {
      targetRegionPreset: presetId,
      languageHints: ["ru"],
    }));
  }
  if (presetId === "ukraine") {
    const rows: Array<[string, string]> = productLineId === "filament"
      ? [["PLA filament", "купити"], ["3D printer filament", "постачальник"], ["PLA filament", "закупівля"]]
      : [["color masterbatch", "купити"], ["masterbatch", "закупівля"], ["plastic colorant", "постачальник"]];
    return rows.map(([product, term]) => seed(productLineId, "Україна", "medium", term.includes("тендер") ? "tender" : "procurement", product, term, "search_engine", "regional_local_sites", {
      targetRegionPreset: presetId,
      languageHints: ["uk", "ru"],
    }));
  }
  return [];
}

function forumSeeds(productLineId: ProductLineId, presetId: TargetMarketPresetId): DemandSeed[] {
  const globalRows = productLineId === "filament"
    ? [
        `site:reddit.com ${q("PLA filament")} ${q("supplier")}`,
        `site:reddit.com ${q("PLA filament")} ${q("bulk")}`,
        `site:reddit.com ${q("PLA filament")} ${q("where to buy")}`,
        `site:reddit.com ${q("3D printer filament")} ${q("wholesale")}`,
        `site:reprap.org ${q("filament supplier")}`,
        `site:forum.prusa3d.com ${q("filament supplier")}`,
        `site:3dprinting.stackexchange.com ${q("filament supplier")}`,
      ]
    : [
        `site:quora.com ${q("color masterbatch supplier")}`,
        `site:reddit.com ${q("color masterbatch")} ${q("supplier")}`,
        `site:plasticsindustry.org ${q("color masterbatch")}`,
      ];
  const preset = TARGET_MARKET_PRESETS[presetId];
  const localProduct = productLineId === "filament" ? "PLA filament" : "masterbatch";
  const localRows = preset.forumHints.slice(0, 3).map((hint) => `${q(localProduct)} ${q("форум")} ${q(hint)}`);
  return [...globalRows, ...localRows].map((query) =>
    seed(productLineId, "", "broad", "forum_request", query, "forum demand", "forum", "forums_communities", {
      targetRegionPreset: presetId,
      sourceDomains: siteDomain(query),
      languageHints: preset.languageHints,
    }),
  );
}

function tenderSeeds(productLineId: ProductLineId, presetId: TargetMarketPresetId): DemandSeed[] {
  const preset = TARGET_MARKET_PRESETS[presetId];
  const product = productLineId === "filament" ? "PLA filament" : "masterbatch";
  const global = ["site:tendersinfo.com", "site:tenderimpulse.com", "site:globaltenders.com"];
  const sites = preset.localTenderSites.length > 0 ? preset.localTenderSites : global;
  return sites.map((site) =>
    seed(productLineId, "", "medium", "tender", `${site} ${q(product)} ${q("tender")}`, "tender procurement", "tender_site", "tender_procurement", {
      targetRegionPreset: presetId,
      sourceDomains: siteDomain(site),
      languageHints: preset.languageHints,
    }),
  );
}

function masterbatchSeeds(country: string): DemandSeed[] {
  const strong: Array<[DemandIntentType, string, string]> = [
    ["rfq", "color masterbatch", "RFQ"],
    ["rfq", "color masterbatch", "request for quote"],
    ["rfq", "color concentrate", "request quotation"],
    ["looking_for_supplier", "plastic colorant", "looking for supplier"],
    ["looking_for_supplier", "additive masterbatch", "supplier needed"],
    ["rfq", "plastic color additive", "quotation required"],
  ];
  const medium: Array<[DemandIntentType, string, string]> = [
    ["procurement", "color masterbatch", "sourcing"],
    ["procurement", "color masterbatch", "procurement"],
    ["rfq", "color masterbatch", "buying request"],
    ["rfq", "color concentrate", "buying leads"],
    ["procurement", "plastic colorant", "buyer"],
    ["procurement", "plastic colorant", "importer"],
    ["procurement", "additive masterbatch", "wholesale buyer"],
    ["looking_for_supplier", "plastic color additive", "supplier wanted"],
    ["looking_for_supplier", "custom color plastic", "supplier"],
    ["rfq", "plastic color matching", "request quote"],
  ];
  const broad: Array<[DemandIntentType, string, string]> = [
    ["all", "color masterbatch buyers", ""],
    ["all", "color masterbatch importers", ""],
    ["all", "plastic colorant buyers", ""],
    ["distributor_wanted", "plastic colorant distributors", ""],
    ["all", "color concentrate importers", ""],
    ["all", "masterbatch trade leads", ""],
    ["all", "plastic additive buyers", ""],
    ["all", "plastic color solution", "buyer"],
    ["substitution", "new supplier", "color masterbatch"],
    ["substitution", "alternative supplier", "color masterbatch"],
  ];
  return [
    ...strong.map(([intent, product, signal]) => seed("masterbatch", country, "strong", intent, product, signal)),
    ...medium.map(([intent, product, signal]) => seed("masterbatch", country, "medium", intent, product, signal)),
    ...broad.map(([intent, product, signal]) => seed("masterbatch", country, "broad", intent, product, signal)),
  ];
}

function filamentSeeds(country: string): DemandSeed[] {
  const strong: Array<[DemandIntentType, string, string]> = [
    ["rfq", "PLA filament", "RFQ"],
    ["rfq", "3D printer filament", "request for quote"],
    ["rfq", "PETG filament", "request quotation"],
    ["looking_for_supplier", "TPU filament", "looking for supplier"],
    ["looking_for_supplier", "FDM filament", "supplier needed"],
    ["rfq", "3D printing filament", "quotation required"],
  ];
  const medium: Array<[DemandIntentType, string, string]> = [
    ["procurement", "PLA filament", "sourcing"],
    ["procurement", "3D printer filament", "procurement"],
    ["rfq", "3D printer filament", "buying request"],
    ["rfq", "PLA filament", "buying leads"],
    ["procurement", "3D printing filament", "buyer"],
    ["procurement", "PLA filament", "importer"],
    ["procurement", "bulk PLA filament", "wholesale buyer"],
    ["looking_for_supplier", "3D printer filament", "supplier wanted"],
    ["looking_for_supplier", "3D print farm", "filament supplier"],
    ["looking_for_supplier", "3D printing service", "filament supplier"],
    ["looking_for_supplier", "rapid prototyping", "PLA filament supplier"],
  ];
  const broad: Array<[DemandIntentType, string, string]> = [
    ["all", "3D printer filament buyers", ""],
    ["all", "PLA filament importers", ""],
    ["all", "PETG filament buyers", ""],
    ["distributor_wanted", "TPU filament distributors", ""],
    ["all", "3D filament trade leads", ""],
    ["all", "3D printing material buyers", ""],
    ["procurement", "wholesale 3D printer filament", ""],
    ["procurement", "bulk PLA filament", "buyer"],
    ["substitution", "new supplier", "PLA filament"],
    ["substitution", "alternative supplier", "3D printer filament"],
  ];
  return [
    ...strong.map(([intent, product, signal]) => seed("filament", country, "strong", intent, product, signal)),
    ...medium.map(([intent, product, signal]) => seed("filament", country, "medium", intent, product, signal)),
    ...broad.map(([intent, product, signal]) => seed("filament", country, "broad", intent, product, signal)),
  ];
}

function customSeeds(country: string, customProductKeyword?: string): DemandSeed[] {
  const product = customProductKeyword?.trim() || "plastic materials";
  return [
    seed("custom", country, "strong", "rfq", product, "RFQ"),
    seed("custom", country, "strong", "looking_for_supplier", product, "looking for supplier"),
    seed("custom", country, "medium", "procurement", product, "sourcing"),
    seed("custom", country, "medium", "procurement", product, "procurement"),
    seed("custom", country, "broad", "all", `${product} buyers`, ""),
    seed("custom", country, "broad", "all", `${product} trade leads`, ""),
  ];
}

function strictnessFilter(seeds: DemandSeed[], strictness: SearchStrictness): DemandSeed[] {
  if (strictness === "strict") {
    return seeds.filter((seed) => seed.signalStrength === "strong" || (seed.signalStrength === "medium" && seed.sourceType === "search_engine")).slice(0, 10);
  }
  if (strictness === "balanced") {
    const strongMedium = seeds.filter((seed) => seed.signalStrength !== "broad");
    const lightBroad = seeds.filter((seed) => seed.signalStrength === "broad").slice(0, 6);
    return [...strongMedium, ...lightBroad];
  }
  return seeds;
}

function intentFilter(seeds: DemandSeed[], intentType: DemandIntentType): DemandSeed[] {
  if (intentType === "all") return seeds;
  const direct = seeds.filter((seed) => seed.intentType === intentType);
  const broadComplements = seeds.filter((seed) => seed.signalStrength === "broad" && seed.intentType === "all").slice(0, 6);
  return [...direct, ...broadComplements];
}

export function generateDemandSearchPlans(input: GenerateDemandSearchPlansInput): DemandSearchPlan[] {
  const country = input.targetCountry.trim();
  const presetId = input.targetMarketPresetId ?? "global";
  const sourceChannel = input.sourceChannel ?? "all_sources";
  const freshnessWindow = input.freshnessWindow ?? "past_6_months";
  const baseSeeds =
    input.productLineId === "filament"
      ? filamentSeeds(country)
      : input.productLineId === "masterbatch"
        ? masterbatchSeeds(country)
        : customSeeds(country, input.customProductKeyword);
  const platform = input.productLineId === "custom" ? [] : platformSeeds(input.productLineId, presetId);
  const multilingual = input.strictness === "broad" ? multilingualSeeds(input.productLineId, country).slice(0, 6) : [];
  const localMarket = presetId === "global" || presetId === "custom" ? [] : [...presetExampleSeeds(input.productLineId, presetId), ...marketLocalSeeds(input.productLineId, presetId, country), ...localSiteSeeds(input.productLineId, presetId)];
  const forums = sourceChannel === "forums_communities" || sourceChannel === "all_sources" ? forumSeeds(input.productLineId, presetId) : [];
  const tenders = sourceChannel === "tender_procurement" || sourceChannel === "all_sources" ? tenderSeeds(input.productLineId, presetId) : [];
  const allSeeds = [...baseSeeds, ...platform, ...multilingual, ...localMarket, ...forums, ...tenders];
  const channelFiltered = sourceChannel === "all_sources"
    ? allSeeds
    : allSeeds.filter((seed) => {
        if (seed.sourceChannel === sourceChannel) return true;
        if (sourceChannel === "b2b_rfq_platforms") {
          return ["rfq_platform", "b2b_platform", "tender_site"].includes(seed.sourceType) || seed.sourceChannel === "regional_local_sites" || seed.sourceChannel === "trade_leads_platforms";
        }
        return false;
      });
  const filteredByIntent = intentFilter(channelFiltered, input.intentType);
  const filteredByStrictness = strictnessFilter(filteredByIntent, input.strictness);
  const fallback = filteredByStrictness.length > 0 ? filteredByStrictness : strictnessFilter(channelFiltered, input.strictness);

  return fallback.slice(0, 60).map((item, index) =>
    makePlan(input.productLineId, input.strictness, freshnessWindow, {
      ...item,
      positiveTerms: Array.from(new Set([...item.positiveTerms, ...productTerms(input.productLineId, input.customProductKeyword)])),
    }, index),
  );
}
