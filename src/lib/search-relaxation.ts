import type { ProductLineId, SearchQueryPlan } from "@/types/search-intelligence";

type BuildRelaxedQueriesInput = {
  productKeyword: string;
  country: string;
  customerType: string;
  productLineId?: ProductLineId;
};

function q(value: string): string {
  return `"${value.trim()}"`;
}

function optionalCountry(targetCountry?: string): string {
  const country = targetCountry?.trim();
  return country ? ` ${q(country)}` : "";
}

function makeRelaxedPlan(
  productLineId: ProductLineId,
  index: number,
  label: string,
  query: string,
  purpose: string,
): SearchQueryPlan {
  return {
    id: `relaxed-${productLineId}-${index + 1}`,
    productLineId,
    buyerPersonaId: productLineId === "filament" ? "3d_printing_service" : "plastic_product_manufacturer",
    intent: productLineId === "filament" ? "service_bureau" : "end_user",
    strictness: index < 2 ? "balanced" : "broad",
    label,
    query: query.replace(/\s+/g, " ").trim(),
    purpose,
    expectedBuyer: productLineId === "filament" ? "3D 打印耗材使用商或服务商" : "色母下游塑料制品工厂",
    forbiddenBuyer: productLineId === "filament"
      ? "filament manufacturer / filament supplier / filament factory"
      : "masterbatch manufacturer / pigment manufacturer / resin supplier",
    positiveTerms: [],
    negativeTerms: productLineId === "filament"
      ? ["filament manufacturer", "filament supplier", "filament factory", "filament producer"]
      : ["masterbatch manufacturer", "masterbatch supplier", "pigment manufacturer", "resin supplier"],
    shouldExcludePeerSuppliers: true,
  };
}

export function buildRelaxedQueries({
  productKeyword,
  country,
  customerType,
  productLineId = "masterbatch",
}: BuildRelaxedQueriesInput): SearchQueryPlan[] {
  const targetCountry = country.trim();
  const product = productKeyword.trim();
  const type = customerType.trim();
  const countryPart = optionalCountry(targetCountry);

  if (productLineId === "filament") {
    const rows = [
      ["原精准词", `${q(product || "FDM 3D printing service")} ${type ? q(type) : ""}${countryPart}`, "保留 3D 耗材产品线原始搜索条件"],
      ["放宽 1：FDM 3D printing service", `"FDM 3D printing service"${countryPart}`, "仍聚焦消耗耗材的 FDM 打印服务商"],
      ["放宽 2：rapid prototyping service", `"rapid prototyping service"${countryPart}`, "放宽到快速原型服务公司"],
      ["放宽 3：additive manufacturing service", `"additive manufacturing service"${countryPart}`, "放宽到增材制造服务商"],
      ["放宽 4：3D printing shop", `"3D printing shop"${countryPart}`, "放宽到本地 3D 打印店"],
      ["放宽 5：makerspace 3D printing", `"makerspace" "3D printing"${countryPart}`, "放宽到创客空间和实验室"],
      ["放宽 6：3D printing directory", `site:thomasnet.com "3D printing service"${countryPart}`, "在目录里找 3D 打印服务商"],
    ];
    return rows.map(([label, query, purpose], index) => makeRelaxedPlan("filament", index, label, query, purpose));
  }

  const rows = [
    ["原精准词", `${q(product || "plastic injection molding company")} ${type ? q(type) : ""}${countryPart}`, "保留色母产品线原始搜索条件"],
    ["放宽 1：custom color injection molding", `"plastic injection molding company" "custom color"${countryPart}`, "仍聚焦会使用色母的注塑工厂"],
    ["放宽 2：plastic product manufacturer", `"plastic product manufacturer"${countryPart}`, "放宽到塑料制品工厂"],
    ["放宽 3：plastic packaging manufacturer", `"plastic packaging manufacturer"${countryPart}`, "放宽到塑料包装厂"],
    ["放宽 4：plastic extrusion company", `"plastic extrusion company"${countryPart}`, "放宽到挤出工厂"],
    ["放宽 5：PP container manufacturer", `"PP container manufacturer"${countryPart}`, "放宽到 PP 容器应用客户"],
    ["放宽 6：injection molding directory", `site:thomasnet.com "plastic injection molding"${countryPart}`, "在目录里找注塑工厂"],
  ];
  return rows.map(([label, query, purpose], index) => makeRelaxedPlan("masterbatch", index, label, query, purpose));
}
