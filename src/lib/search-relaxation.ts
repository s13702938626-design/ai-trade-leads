import type { SearchStrategyQuery } from "@/lib/search-strategies";

type BuildRelaxedQueriesInput = {
  productKeyword: string;
  country: string;
  customerType: string;
};

function q(value: string): string {
  return `"${value}"`;
}

export function buildRelaxedQueries({
  productKeyword,
  country,
  customerType,
}: BuildRelaxedQueriesInput): SearchStrategyQuery[] {
  const targetCountry = country.trim();
  const product = productKeyword.trim();
  const type = customerType.trim();
  const queries = [
    {
      label: "原精准词",
      query: `${q(product)} ${q(type)} ${q(targetCountry)}`,
      purpose: "保留原始精准搜索条件",
      strictness: "narrow" as const,
    },
    {
      label: "放宽 1：masterbatch",
      query: `"masterbatch" ${q(targetCountry)}`,
      purpose: "去掉客户类型，保留色母核心词",
      strictness: "medium" as const,
    },
    {
      label: "放宽 2：color concentrate",
      query: `"color concentrate" ${q(targetCountry)}`,
      purpose: "用北美常见色母表达扩展搜索",
      strictness: "medium" as const,
    },
    {
      label: "放宽 3：plastic additives",
      query: `"plastic additives" ${q(targetCountry)}`,
      purpose: "扩展到塑料助剂渠道",
      strictness: "medium" as const,
    },
    {
      label: "放宽 4：resin distributor",
      query: `"resin distributor" ${q(targetCountry)}`,
      purpose: "扩展到树脂分销商",
      strictness: "broad" as const,
    },
    {
      label: "放宽 5：plastic materials supplier",
      query: `"plastic materials supplier" ${q(targetCountry)}`,
      purpose: "扩展到塑料材料供应商",
      strictness: "broad" as const,
    },
    {
      label: "放宽 6：plastic distributor",
      query: `"plastic distributor" ${q(targetCountry)}`,
      purpose: "扩展到泛塑料分销商",
      strictness: "broad" as const,
    },
  ];

  return queries.map((item, index) => ({
    id: `relaxed-${index + 1}`,
    mode: "general_customer",
    ...item,
  }));
}
