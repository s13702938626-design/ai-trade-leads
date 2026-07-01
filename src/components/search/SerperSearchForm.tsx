"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CUSTOMER_TYPES, INDUSTRY_DIRECTIONS, TARGET_COUNTRIES } from "@/lib/constants";
import { buildSearchQueries } from "@/lib/search-queries";
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
};

type SerperSearchFormProps = {
  loading: boolean;
  onSearch: (values: SerperSearchFormValues) => void;
};

function buildPrimarySerperQuery(industry: string, customerType: string, country: string): string {
  return [industry, customerType, country].filter(Boolean).join(" ");
}

const PRACTICAL_SEARCH_TERMS = [
  "plastic distributor United States",
  "plastic resin distributor United States",
  "plastic additives supplier United States",
  "color concentrate distributor United States",
  "masterbatch distributor United States",
  "PLA filament distributor United States",
  "3D printer filament distributor United States",
  "plastic packaging manufacturer United States",
  "injection molding factory United States",
];

export function SerperSearchForm({ loading, onSearch }: SerperSearchFormProps) {
  const [industry, setIndustry] = useState(INDUSTRY_DIRECTIONS[0]);
  const [country, setCountry] = useState(TARGET_COUNTRIES[0]);
  const [customerType, setCustomerType] = useState(CUSTOMER_TYPES[0]);
  const [limit, setLimit] = useState(10);
  const [customQuery, setCustomQuery] = useState(() =>
    buildPrimarySerperQuery(INDUSTRY_DIRECTIONS[0], CUSTOMER_TYPES[0], TARGET_COUNTRIES[0]),
  );

  const defaultQuery = useMemo(
    () => buildPrimarySerperQuery(industry, customerType, country),
    [country, customerType, industry],
  );
  const recommendedQueries = useMemo(
    () => buildSearchQueries({ industry, country, customerType }),
    [country, customerType, industry],
  );
  const actualQuery = customQuery.trim() || defaultQuery;

  useEffect(() => {
    setCustomQuery(defaultQuery);
  }, [defaultQuery]);

  function runSearch(query: string) {
    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }

    onSearch({ industry, country, customerType, limit, query: nextQuery });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(actualQuery);
  }

  return (
    <div className="space-y-4">
      <Card>
        <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">行业方向</span>
            <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              {INDUSTRY_DIRECTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">目标国家</span>
            <Select value={country} onChange={(event) => setCountry(event.target.value)}>
              {TARGET_COUNTRIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">客户类型</span>
            <Select value={customerType} onChange={(event) => setCustomerType(event.target.value)}>
              {CUSTOMER_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">自定义搜索词</span>
          <Input
            value={customQuery}
            onChange={(event) => setCustomQuery(event.target.value)}
            placeholder="例如 plastic distributor United States"
          />
        </label>

        <div className="rounded-md bg-slate-50 px-3 py-3">
          <p className="text-xs font-medium uppercase text-slate-500">本次实际搜索词</p>
          <p className="mt-1 text-sm font-medium text-slate-950">{actualQuery}</p>
        </div>

        <Button disabled={loading} type="submit">
          {loading ? "搜索中..." : "调用 Serper 实时搜索"}
        </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-950">推荐搜索词</h3>
        <div className="mt-4 space-y-3">
          {recommendedQueries.map((query) => (
            <div
              className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between"
              key={query}
            >
              <p className="text-sm font-medium text-slate-950">{query}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setCustomQuery(query)}>
                  使用此搜索词
                </Button>
                <Button type="button" disabled={loading} onClick={() => runSearch(query)}>
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
            <Button key={query} type="button" variant="secondary" onClick={() => setCustomQuery(query)}>
              {query}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
