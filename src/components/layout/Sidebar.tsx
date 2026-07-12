"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "控制台" },
  { href: "/dashboard/search", label: "搜索词" },
  { href: "/dashboard/serper", label: "Serper 实时搜索" },
  { href: "/dashboard/demand", label: "需求信号搜索" },
  { href: "/dashboard/customs", label: "海关进口商" },
  { href: "/dashboard/followups", label: "客户开发动作台" },
  { href: "/dashboard/outreach", label: "开发话术中心" },
  { href: "/dashboard/leads", label: "客户" },
  { href: "/dashboard/export", label: "导入导出" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-semibold text-slate-950">AI Trade Leads</p>
        <p className="mt-1 text-xs text-slate-500">塑料材料外贸 v0.8</p>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
