"use client";

import Link from "next/link";
import type { Lead } from "@/types/lead";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type LeadTableProps = {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
};

function matchTone(matchLevel: Lead["matchLevel"]) {
  if (matchLevel === "high") return "green";
  if (matchLevel === "medium") return "amber";
  if (matchLevel === "low") return "red";
  return "neutral";
}

export function LeadTable({ leads, onEdit, onDelete }: LeadTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">公司</th>
              <th className="px-4 py-3">国家</th>
              <th className="px-4 py-3">产品</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">匹配</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((lead) => (
              <tr className="hover:bg-slate-50" key={lead.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium text-slate-950 hover:underline" href={`/dashboard/leads/${lead.id}`}>
                    {lead.companyName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{lead.website || lead.sourceUrl}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.country || "未填写"}</td>
                <td className="px-4 py-3 text-slate-700">{lead.productKeyword}</td>
                <td className="px-4 py-3 text-slate-700">{lead.customerType || "未填写"}</td>
                <td className="px-4 py-3">
                  <Badge tone={matchTone(lead.matchLevel)}>{lead.matchLevel}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={lead.status === "replied" ? "green" : "blue"}>{lead.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => onEdit(lead)}>
                      编辑
                    </Button>
                    <Button type="button" variant="danger" onClick={() => onDelete(lead.id)}>
                      删除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
