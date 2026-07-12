"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ProductLineId, SearchQueryPlan, SearchStrictness } from "@/types/search-intelligence";
import { TARGET_COUNTRIES } from "@/lib/constants";
import {
  generateBuyerSearchPlans,
  type TargetBuyerMode,
} from "@/lib/buyer-search-query-builder";
import { PRODUCT_LINE_OPTIONS, PRODUCT_LINES } from "@/lib/product-lines";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export type SerperSearchFormValues = {
  industry: string;
  country: string;
  customerType: string;
  limit: number;
  query: string;
  mode: "buyer_search" | "custom";
  productLineId: ProductLineId;
  targetBuyerMode: TargetBuyerMode;
  strictness: SearchStrictness;
  searchPlan?: SearchQueryPlan;
  hidePeerSuppliers: boolean;
};

type SerperSearchFormProps = {
  loading: boolean;
  queryOverride?: string;
  onSearch: (values: SerperSearchFormValues) => void;
};

const BUYER_MODE_OPTIONS: { value: TargetBuyerMode; label: string }[] = [
  { value: "end_users", label: "使用商" },
  { value: "distributors", label: "贸易商/分销商" },
  { value: "both", label: "使用商 + 贸易商" },
  { value: "service_bureaus", label: "3D打印服务商" },
  { value: "trade_shows", label: "展会线索" },
  { value: "directories", label: "行业目录" },
];

const STRICTNESS_OPTIONS: { value: SearchStrictness; label: string }[] = [
  { value: "strict", label: "精准" },
  { value: "balanced", label: "平衡" },
  { value: "broad", label: "放宽" },
];

const PRACTICAL_SEARCH_TERMS = [
  "FDM 3D printing service United States",
  "3D print farm PLA United States",
  "rapid prototyping service FDM United States",
  "additive manufacturing service PLA United States",
  "3D printing service bureau PETG United States",
  "plastic injection molding company custom color United States",
  "plastic packaging manufacturer color matching United States",
  "PP food container manufacturer plastic United States",
  "plastic extrusion company color United States",
];

function productKeywordForLine(productLineId: ProductLineId, customQuery = ""): string {
  if (productLineId === "filament") return "3D printer filament";
  if (productLineId === "masterbatch") return "color masterbatch";
  return customQuery.trim() || "plastic materials";
}

function customerTypeForMode(mode: TargetBuyerMode, productLineId: ProductLineId): string {
  if (mode === "distributors") return "distributor";
  if (mode === "both") return "end user or distributor";
  if (mode === "service_bureaus" || productLineId === "filament") return "3D printing service";
  if (mode === "trade_shows") return "trade show exhibitor";
  if (mode === "directories") return "directory listing";
  return "end user";
}

export function SerperSearchForm({ loading, queryOverride, onSearch }: SerperSearchFormProps) {
  const [productLineId, setProductLineId] = useState<ProductLineId>("filament");
  const [country, setCountry] = useState("");
  const [targetBuyerMode, setTargetBuyerMode] = useState<TargetBuyerMode>("service_bureaus");
  const [strictness, setStrictness] = useState<SearchStrictness>("balanced");
  const [limit, setLimit] = useState(10);
  const [customQuery, setCustomQuery] = useState("");
  const [customTouched, setCustomTouched] = useState(false);
  const [hidePeerSuppliers, setHidePeerSuppliers] = useState(true);

  const plans = useMemo(
    () =>
      generateBuyerSearchPlans({
        productLineId,
        targetCountry: country,
        targetBuyerMode,
        strictness,
        customProductKeyword: customQuery,
      }),
    [country, customQuery, productLineId, strictness, targetBuyerMode],
  );
  const defaultPlan = plans[0];
  const defaultQuery = defaultPlan?.query ?? [productKeywordForLine(productLineId, customQuery), country].join(" ");
  const actualQuery = customQuery.trim() || defaultQuery;

  useEffect(() => {
    if (!customTouched) {
      setCustomQuery(defaultQuery);
    }
  }, [customTouched, defaultQuery]);

  useEffect(() => {
    if (queryOverride) {
      setCustomTouched(true);
      setCustomQuery(queryOverride);
    }
  }, [queryOverride]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const customsQuery = searchParams.get("customsQuery");
    const customsCountry = searchParams.get("country");
    const customsProductLine = searchParams.get("productLineId");
    if (customsProductLine === "masterbatch" || customsProductLine === "filament" || customsProductLine === "custom") {
      setProductLineId(customsProductLine);
    }
    if (customsQuery) {
      setCustomTouched(true);
      setCustomQuery(customsQuery);
    }
    if (customsCountry) {
      setCountry(customsCountry);
    }
  }, []);

  function runSearch(query: string, searchPlan?: SearchQueryPlan) {
    const nextQuery = query.trim();
    if (!nextQuery) return;

    onSearch({
      industry: productKeywordForLine(productLineId, customQuery),
      country,
      customerType: customerTypeForMode(targetBuyerMode, productLineId),
      limit,
      query: nextQuery,
      mode: searchPlan ? "buyer_search" : "custom",
      productLineId,
      targetBuyerMode,
      strictness,
      searchPlan,
      hidePeerSuppliers,
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matchingPlan = plans.find((plan) => plan.query === actualQuery);
    runSearch(actualQuery, matchingPlan);
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-5">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">产品线</span>
              <Select value={productLineId} onChange={(event) => setProductLineId(event.target.value as ProductLineId)}>
                {PRODUCT_LINE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">目标国家，可留空表示全球搜索</span>
            <Select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="">全球 / 不限制国家</option>
              {TARGET_COUNTRIES.map((item) => (
                <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">目标客户类型</span>
              <Select value={targetBuyerMode} onChange={(event) => setTargetBuyerMode(event.target.value as TargetBuyerMode)}>
                {BUYER_MODE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">搜索严格度</span>
              <Select value={strictness} onChange={(event) => setStrictness(event.target.value as SearchStrictness)}>
                {STRICTNESS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">搜索结果数量</span>
              <Select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
                {[5, 10, 15, 20].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <input
              checked={hidePeerSuppliers}
              onChange={(event) => setHidePeerSuppliers(event.target.checked)}
              type="checkbox"
            />
            默认隐藏同行/供应商结果
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">自定义搜索词</span>
            <Input
              value={customQuery}
              onChange={(event) => {
                setCustomTouched(true);
                setCustomQuery(event.target.value);
              }}
              placeholder="例如 FDM 3D printing service United States"
            />
          </label>

          <div className="rounded-md bg-slate-50 px-3 py-3">
            <p className="text-xs font-medium uppercase text-slate-500">本次实际搜索词</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{actualQuery}</p>
            <p className="mt-2 text-xs text-slate-500">搜索范围：{country.trim() ? country : "全球 / 不限制国家"}</p>
            <p className="mt-2 text-xs text-slate-500">{PRODUCT_LINES[productLineId].searchFocus}</p>
          </div>

          <Button disabled={loading} type="submit">
            {loading ? "搜索中..." : "调用 Serper 实时搜索"}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-950">产品线感知搜索策略</h3>
        <p className="mt-1 text-sm text-slate-600">搜索策略按产品线生成，不会在放宽时把色母客户和 3D 耗材客户混在一起。</p>
        <div className="mt-4 space-y-3">
          {plans.map((plan) => (
            <div
              className="flex flex-col gap-3 rounded-md bg-slate-50 p-3 lg:flex-row lg:items-start lg:justify-between"
              key={plan.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{plan.label}</p>
                  <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">{plan.strictness}</span>
                  <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">{plan.productLineId}</span>
                  <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">{plan.buyerPersonaId}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-950">{plan.query}</p>
                <p className="mt-1 text-xs text-slate-500">{plan.purpose}</p>
                <p className="mt-1 text-xs text-emerald-700">目标：{plan.expectedBuyer}</p>
                <p className="mt-1 text-xs text-red-700">排除：{plan.forbiddenBuyer}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setCustomTouched(true);
                    setCustomQuery(plan.query);
                  }}
                >
                  使用此搜索词
                </Button>
                <Button type="button" disabled={loading} onClick={() => runSearch(plan.query, plan)}>
                  调用 Serper 搜索
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-950">实盘测试词</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRACTICAL_SEARCH_TERMS.map((query) => (
            <Button
              key={query}
              type="button"
              variant="secondary"
              onClick={() => {
                setCustomTouched(true);
                setCustomQuery(query);
              }}
            >
              {query}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
