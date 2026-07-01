"use client";

import { useMemo, useState } from "react";
import { CUSTOMER_TYPES, INDUSTRY_DIRECTIONS, TARGET_COUNTRIES } from "@/lib/constants";
import { buildSearchQueries } from "@/lib/search-queries";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { SearchQueryList } from "@/components/search/SearchQueryList";

export function SearchQueryBuilder() {
  const [industry, setIndustry] = useState(INDUSTRY_DIRECTIONS[0]);
  const [country, setCountry] = useState(TARGET_COUNTRIES[0]);
  const [customerType, setCustomerType] = useState(CUSTOMER_TYPES[0]);

  const queries = useMemo(
    () => buildSearchQueries({ industry, country, customerType }),
    [industry, country, customerType],
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      </Card>

      <SearchQueryList queries={queries} />
    </div>
  );
}
