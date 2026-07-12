import type {
  BuyerPersonaId,
  ProductLineId,
  SearchIntent,
  SearchQueryPlan,
  SearchStrictness,
} from "@/types/search-intelligence";
import { PRODUCT_LINES } from "@/lib/product-lines";

export type TargetBuyerMode =
  | "end_users"
  | "distributors"
  | "both"
  | "service_bureaus"
  | "trade_shows"
  | "directories";

type GenerateBuyerSearchPlansInput = {
  productLineId: ProductLineId;
  targetCountry: string;
  targetBuyerMode: TargetBuyerMode;
  strictness: SearchStrictness;
  customProductKeyword?: string;
};

type PlanSeed = {
  buyerPersonaId: BuyerPersonaId;
  intent: SearchIntent;
  label: string;
  query: string;
  purpose: string;
  expectedBuyer: string;
  forbiddenBuyer: string;
  positiveTerms: string[];
  negativeTerms: string[];
  shouldExcludePeerSuppliers?: boolean;
};

function q(value: string): string {
  return `"${value.trim()}"`;
}

function optionalCountry(targetCountry?: string): string {
  const country = targetCountry?.trim();
  return country ? ` ${q(country)}` : "";
}

function normalizeQuery(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function makePlans(productLineId: ProductLineId, strictness: SearchStrictness, seeds: PlanSeed[]): SearchQueryPlan[] {
  return seeds.map((seed, index) => ({
    id: `${productLineId}-${seed.intent}-${index + 1}`,
    productLineId,
    strictness,
    shouldExcludePeerSuppliers: seed.shouldExcludePeerSuppliers ?? true,
    ...seed,
    query: normalizeQuery(seed.query),
  }));
}

function masterbatchEndUserSeeds(country: string): PlanSeed[] {
  const forbiddenBuyer = "masterbatch manufacturer / color concentrate manufacturer / pigment manufacturer / resin supplier";
  const countryPart = optionalCountry(country);
  return [
    ["injection_molder", "plastic injection molding company", "custom color", "注塑工厂会消耗色母，custom color 是使用场景"],
    ["plastic_product_manufacturer", "plastic product manufacturer", "color matching", "塑料制品厂可能需要配色和色母"],
    ["packaging_manufacturer", "plastic packaging manufacturer", "color masterbatch", "包装厂可能使用色母做颜色方案"],
    ["pp_container_manufacturer", "PP food container manufacturer", "plastic", "PP 餐盒厂属于色母下游应用"],
    ["extrusion_factory", "plastic extrusion company", "color", "挤出厂可能需要色母和颜色稳定性"],
    ["blow_molding_factory", "plastic blow molding company", "color", "吹塑厂可能使用色母"],
    ["toy_manufacturer", "plastic toy manufacturer", "color", "塑料玩具厂通常有颜色需求"],
    ["pipe_manufacturer", "plastic pipe manufacturer", "color", "塑料管材厂可能需要颜色母粒"],
    ["plastic_product_manufacturer", "bottle cap manufacturer", "plastic color", "瓶盖厂属于塑料制品色母使用场景"],
    ["plastic_product_manufacturer", "plastic household products manufacturer", "", "家居塑料制品厂是色母潜在使用商"],
  ].map(([buyerPersonaId, buyer, signal, purpose]) => ({
    buyerPersonaId: buyerPersonaId as BuyerPersonaId,
    intent: "end_user" as const,
    label: buyer,
    query: `${q(buyer)} ${signal ? q(signal) : ""}${countryPart}`,
    purpose,
    expectedBuyer: "使用色母的塑料制品工厂",
    forbiddenBuyer,
    positiveTerms: [buyer, signal].filter(Boolean),
    negativeTerms: PRODUCT_LINES.masterbatch.peerSupplierTerms,
  }));
}

function masterbatchDistributorSeeds(country: string): PlanSeed[] {
  const countryPart = optionalCountry(country);
  const terms = [
    ["distributor", "plastic raw material distributor", "塑料原料分销商可能销售色母或塑料助剂"],
    ["distributor", "plastic resin distributor", "树脂渠道商可能覆盖色母/助剂采购或分销"],
    ["distributor", "polymer distributor", "聚合物分销商可能是渠道客户"],
    ["distributor", "plastic additives distributor", "塑料助剂分销商与色母产品相邻"],
    ["distributor", "plastic colorant distributor", "塑料着色剂分销商是更贴近的渠道客户"],
  ];
  return terms.map(([buyerPersonaId, term, purpose]) => ({
    buyerPersonaId: buyerPersonaId as BuyerPersonaId,
    intent: "distributor" as const,
    label: term,
    query: `${q(term)}${countryPart}`,
    purpose,
    expectedBuyer: "塑料材料贸易商或分销商",
    forbiddenBuyer: "masterbatch manufacturer / pigment manufacturer / resin supplier",
    positiveTerms: [term, "distributor"],
    negativeTerms: PRODUCT_LINES.masterbatch.peerSupplierTerms,
  }));
}

function filamentServiceSeeds(country: string): PlanSeed[] {
  const forbiddenBuyer = "filament manufacturer / PLA filament manufacturer / filament factory / OEM filament supplier";
  const countryPart = optionalCountry(country);
  return [
    ["3d_printing_service", "FDM 3D printing service", "", "FDM 打印服务商会实际消耗耗材"],
    ["3d_printing_service", "3D printing service bureau", "", "打印服务局是耗材使用商"],
    ["print_farm", "3D print farm", "", "打印农场通常持续消耗 PLA/PETG/TPU"],
    ["rapid_prototyping_service", "rapid prototyping service", "FDM", "快速原型公司可能有 FDM 耗材需求"],
    ["additive_manufacturing_service", "additive manufacturing service", "PLA", "增材制造服务商可能采购耗材"],
    ["rapid_prototyping_service", "product prototyping company", "3D printing", "产品原型公司可能使用耗材"],
    ["model_making_studio", "model making studio", "3D printing", "模型制作工作室是耗材使用场景"],
    ["cosplay_prop_studio", "cosplay prop 3D printing service", "", "Cosplay 道具打印会消耗耗材"],
    ["3d_printing_service", "miniature 3D printing service", "", "微缩模型打印服务可能持续采购耗材"],
    ["makerspace", "makerspace", "3D printing", "创客空间通常有 3D 打印耗材消耗"],
    ["school_lab", "university maker lab", "3D printing", "高校 maker lab 可能采购耗材"],
    ["school_lab", "school 3D printing lab", "", "学校 3D 打印实验室可能需要耗材"],
  ].map(([buyerPersonaId, buyer, signal, purpose]) => ({
    buyerPersonaId: buyerPersonaId as BuyerPersonaId,
    intent: "service_bureau" as const,
    label: buyer,
    query: `${q(buyer)} ${signal ? q(signal) : ""}${countryPart}`,
    purpose,
    expectedBuyer: "消耗 3D 打印耗材的服务商或机构",
    forbiddenBuyer,
    positiveTerms: [buyer, signal].filter(Boolean),
    negativeTerms: PRODUCT_LINES.filament.peerSupplierTerms,
  }));
}

function filamentDistributorSeeds(country: string): PlanSeed[] {
  const countryPart = optionalCountry(country);
  const terms = [
    ["distributor", "3D printing supplies distributor", "3D 打印用品分销商可能销售耗材"],
    ["reseller", "3D printer reseller", "打印机经销商可能兼营耗材"],
    ["distributor", "3D printing filament distributor", "耗材分销商是目标渠道"],
    ["reseller", "3D printer filament reseller", "耗材经销商是目标渠道"],
    ["distributor", "additive manufacturing materials distributor", "增材制造材料分销商可能采购耗材"],
  ];
  return terms.map(([buyerPersonaId, term, purpose]) => ({
    buyerPersonaId: buyerPersonaId as BuyerPersonaId,
    intent: "distributor" as const,
    label: term,
    query: `${q(term)}${countryPart}`,
    purpose,
    expectedBuyer: "3D 打印耗材渠道商或经销商",
    forbiddenBuyer: "filament manufacturer / filament factory / filament exporter",
    positiveTerms: [term, "distributor", "reseller"],
    negativeTerms: PRODUCT_LINES.filament.peerSupplierTerms,
  }));
}

function tradeShowSeeds(productLineId: ProductLineId, country: string): PlanSeed[] {
  const isFilament = productLineId === "filament";
  const countryPart = optionalCountry(country);
  const rows = isFilament
    ? [
        ["3D printing trade show", "exhibitor list"],
        ["additive manufacturing expo", "exhibitor"],
        ["rapid prototyping exhibition", "exhibitor list"],
      ]
    : [
        ["plastics exhibition", "exhibitor list"],
        ["plastic packaging trade show", "exhibitor"],
        ["injection molding expo", "exhibitor list"],
      ];
  return rows.map(([event, suffix]) => ({
    buyerPersonaId: "directory_or_platform" as const,
    intent: "trade_show" as const,
    label: event,
    query: `${q(event)}${countryPart} ${q(suffix)}`,
    purpose: "找公开展会或展商目录，再人工筛选潜在买家",
    expectedBuyer: isFilament ? "3D 打印服务商、渠道商或相关展商" : "塑料制品厂、包装厂、注塑厂或相关展商",
    forbiddenBuyer: isFilament ? "filament manufacturer / filament factory" : "masterbatch manufacturer / pigment manufacturer",
    positiveTerms: [event, suffix],
    negativeTerms: PRODUCT_LINES[productLineId].peerSupplierTerms,
    shouldExcludePeerSuppliers: false,
  }));
}

function directorySeeds(productLineId: ProductLineId, country: string): PlanSeed[] {
  const countryPart = optionalCountry(country);
  const rows =
    productLineId === "filament"
      ? [
          ["site:thomasnet.com", "3D printing service"],
          ["site:kompass.com", "additive manufacturing service"],
          ["site:europages.com", "3D printing service"],
        ]
      : [
          ["site:thomasnet.com", "plastic injection molding"],
          ["site:kompass.com", "plastic product manufacturer"],
          ["site:europages.com", "plastic injection molding"],
        ];
  return rows.map(([site, term]) => ({
    buyerPersonaId: "directory_or_platform" as const,
    intent: "directory" as const,
    label: `${site} ${term}`,
    query: `${site} ${q(term)}${countryPart}`,
    purpose: "从行业目录入口人工筛选公司官网",
    expectedBuyer: productLineId === "filament" ? "3D 打印服务商目录结果" : "塑料制品或注塑工厂目录结果",
    forbiddenBuyer: productLineId === "filament" ? "filament manufacturer / filament supplier" : "masterbatch manufacturer / pigment manufacturer",
    positiveTerms: [term],
    negativeTerms: PRODUCT_LINES[productLineId].peerSupplierTerms,
    shouldExcludePeerSuppliers: false,
  }));
}

export function generateBuyerSearchPlans(input: GenerateBuyerSearchPlansInput): SearchQueryPlan[] {
  const country = input.targetCountry.trim();
  const productLineId = input.productLineId;

  if (productLineId === "custom") {
    const keyword = input.customProductKeyword?.trim() || "plastic materials";
    return makePlans(productLineId, input.strictness, [
      {
        buyerPersonaId: "unknown",
        intent: "end_user",
        label: "自定义产品搜索",
        query: `${q(keyword)}${optionalCountry(country)}`,
        purpose: "按自定义产品关键词搜索候选客户",
        expectedBuyer: "用户人工判断的目标客户",
        forbiddenBuyer: "无明确产品线，需人工排除同行和平台页",
        positiveTerms: [keyword],
        negativeTerms: [],
      },
    ]);
  }

  const seeds: PlanSeed[] = [];
  if (input.targetBuyerMode === "end_users" || input.targetBuyerMode === "both") {
    seeds.push(...(productLineId === "filament" ? filamentServiceSeeds(country) : masterbatchEndUserSeeds(country)));
  }
  if (input.targetBuyerMode === "service_bureaus") {
    seeds.push(...(productLineId === "filament" ? filamentServiceSeeds(country) : masterbatchEndUserSeeds(country)));
  }
  if (input.targetBuyerMode === "distributors" || input.targetBuyerMode === "both") {
    seeds.push(...(productLineId === "filament" ? filamentDistributorSeeds(country) : masterbatchDistributorSeeds(country)));
  }
  if (input.targetBuyerMode === "trade_shows") {
    seeds.push(...tradeShowSeeds(productLineId, country));
  }
  if (input.targetBuyerMode === "directories") {
    seeds.push(...directorySeeds(productLineId, country));
  }

  return makePlans(productLineId, input.strictness, seeds);
}
