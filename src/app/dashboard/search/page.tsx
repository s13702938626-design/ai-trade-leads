import { SearchQueryBuilder } from "@/components/search/SearchQueryBuilder";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">搜索词生成页</h2>
        <p className="mt-1 text-sm text-slate-600">
          这里只生成搜索语句和搜索入口，不展示、不生成、不导入任何假客户。
        </p>
      </div>
      <SearchQueryBuilder />
    </div>
  );
}
