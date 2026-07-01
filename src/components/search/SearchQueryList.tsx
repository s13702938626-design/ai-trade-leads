"use client";

import { bingSearchUrl, googleSearchUrl } from "@/lib/search-queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type SearchQueryListProps = {
  queries: string[];
};

export function SearchQueryList({ queries }: SearchQueryListProps) {
  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-3">
      {queries.map((query, index) => (
        <Card className="p-4" key={`${query}-${index}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-medium text-slate-950">{query}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => copy(query)} type="button" variant="secondary">
                复制搜索词
              </Button>
              <a
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                href={googleSearchUrl(query)}
                rel="noreferrer"
                target="_blank"
              >
                打开 Google 搜索
              </a>
              <a
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                href={bingSearchUrl(query)}
                rel="noreferrer"
                target="_blank"
              >
                打开 Bing 搜索
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
