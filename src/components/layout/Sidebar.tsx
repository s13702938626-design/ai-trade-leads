"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "今日机会" },
  { href: "/dashboard/accounts", label: "公司库" },
  { href: "/dashboard/verification", label: "机会核实" },
  { href: "/dashboard/actions", label: "开发动作" },
  { href: "/dashboard/settings", label: "设置" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-semibold text-slate-950">科聚隆机会雷达</p>
        <p className="mt-1 text-xs text-slate-500">本地单用户 v1</p>
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
