"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "控制台",
  "/dashboard/search": "搜索词生成",
  "/dashboard/serper": "Serper 实时搜索",
  "/dashboard/leads": "客户列表",
  "/dashboard/export": "导入导出",
};

export function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "客户详情";

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">v0.1 本地工作台</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">{title}</h1>
        </div>
        <div className="flex gap-2 md:hidden">
          <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/dashboard">
            控制台
          </Link>
          <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/dashboard/leads">
            客户
          </Link>
        </div>
      </div>
    </header>
  );
}
