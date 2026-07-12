"use client";

import { useMemo, useState } from "react";
import type { ProductLineId } from "@/types/search-intelligence";
import { TARGET_COUNTRIES } from "@/lib/constants";
import { inferProductLineFromText, PRODUCT_LINE_OPTIONS } from "@/lib/product-lines";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

function googleUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function q(value: string): string {
  return `"${value.trim()}"`;
}

function optionalCountry(value: string): string {
  const country = value.trim();
  return country ? ` ${q(country)}` : "";
}

export function CustomsSearchTemplates({ onSerperSearch }: { onSerperSearch: (query: string, country: string, productLineId: ProductLineId) => void }) {
  const [productKeyword, setProductKeyword] = useState("plastic resin");
  const [hsCode, setHsCode] = useState("");
  const [country, setCountry] = useState("");
  const inferredProductLine = inferProductLineFromText(productKeyword);
  const [productLineId, setProductLineId] = useState<ProductLineId>("custom");
  const countryPart = optionalCountry(country);
  const queries = useMemo(
    () => [
      `${q(productKeyword)} customs data importer${countryPart}`,
      `${q(productKeyword)} importers${countryPart} customs`,
      `"${productKeyword}" "HS Code" "${hsCode}" importer`,
      `${q(hsCode)} importer${countryPart}`,
      `${q(productKeyword)} buyer${countryPart} bill of lading`,
      `${q(productKeyword)} shipment${countryPart} importer`,
      `${q(productKeyword)} trade data${countryPart}`,
      `${q(productKeyword)} import data${countryPart}`,
    ].map((query) => query.replace(/""/g, "").replace(/\s+/g, " ").trim()),
    [countryPart, hsCode, productKeyword],
  );

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-950">HS Code / 产品词查询模板</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">产品英文关键词</span>
          <Input
            value={productKeyword}
            onChange={(event) => {
              setProductKeyword(event.target.value);
              const next = inferProductLineFromText(event.target.value);
              if (next) setProductLineId(next);
            }}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">HS Code</span>
          <Input value={hsCode} onChange={(event) => setHsCode(event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">目标国家，可留空表示全球搜索</span>
          <Select value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="">全球 / 不限制国家</option>
            {TARGET_COUNTRIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">产品线</span>
          <Select value={productLineId} onChange={(event) => setProductLineId(event.target.value as ProductLineId)}>
            {PRODUCT_LINE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
          {!inferredProductLine ? <span className="text-xs text-amber-700">无法从关键词确定产品线，请人工选择。</span> : null}
        </label>
      </div>
      <div className="mt-5 space-y-3">
        {queries.map((query) => (
          <div className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between" key={query}>
            <p className="text-sm font-medium text-slate-950">{query}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(query)}>
                复制搜索词
              </Button>
              <Button type="button" variant="secondary" onClick={() => onSerperSearch(query, country, productLineId)}>
                用 Serper 搜索
              </Button>
              <a className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href={googleUrl(query)} target="_blank" rel="noreferrer">
                打开 Google 搜索
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-600">这些只是查找海关数据入口或公开进口记录的搜索词，不代表系统已经拿到海关数据。</p>
    </Card>
  );
}
