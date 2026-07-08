"use client";

import type { CustomsLead } from "@/types/customs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CustomsPriorityBadge } from "@/components/customs/CustomsPriorityBadge";

export function CustomsLeadTable({
  leads,
  onConvert,
  onDelete,
  onDeepSearch,
}: {
  leads: CustomsLead[];
  onConvert: (lead: CustomsLead) => void;
  onDelete: (id: string) => void;
  onDeepSearch: (query: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">importerName</th>
              <th className="px-3 py-3">country</th>
              <th className="px-3 py-3">productDescription</th>
              <th className="px-3 py-3">hsCode</th>
              <th className="px-3 py-3">lastImportDate</th>
              <th className="px-3 py-3">frequency</th>
              <th className="px-3 py-3">volume</th>
              <th className="px-3 py-3">priority</th>
              <th className="px-3 py-3">source</th>
              <th className="px-3 py-3">score</th>
              <th className="px-3 py-3">status</th>
              <th className="px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {leads.map((lead) => (
              <tr className="align-top hover:bg-slate-50" key={lead.id}>
                <td className="px-3 py-3 font-medium text-slate-950">{lead.importerName}</td>
                <td className="px-3 py-3 text-slate-700">{lead.country || "未填写"}</td>
                <td className="max-w-sm px-3 py-3 text-slate-700">{lead.productDescription}</td>
                <td className="px-3 py-3 text-slate-700">{lead.hsCode}</td>
                <td className="px-3 py-3 text-slate-700">{lead.lastImportDate || "unknown"}</td>
                <td className="px-3 py-3 text-slate-700">{lead.importFrequency}</td>
                <td className="px-3 py-3 text-slate-700">{lead.estimatedMonthlyVolume ?? "unknown"}</td>
                <td className="px-3 py-3"><CustomsPriorityBadge priority={lead.priority} /></td>
                <td className="max-w-xs px-3 py-3 text-slate-700">
                  <p>{lead.sourceName || "待补来源"}</p>
                  {lead.sourceUrl ? <a className="break-all text-sky-700 hover:underline" href={lead.sourceUrl} target="_blank" rel="noreferrer">{lead.sourceUrl}</a> : null}
                </td>
                <td className="px-3 py-3 text-slate-700">{lead.reviewScore}</td>
                <td className="px-3 py-3"><Badge>{lead.status}</Badge></td>
                <td className="px-3 py-3">
                  <div className="flex min-w-56 flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => onConvert(lead)} disabled={!lead.sourceUrl || lead.status === "converted_to_lead"}>
                      转为客户线索
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => onDeepSearch(`${lead.importerName} official website`)}>
                      Serper 深挖
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(`site:linkedin.com/company "${lead.importerName}"`)}>
                      复制 LinkedIn 搜索
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(`"${lead.importerName}" email contact procurement`)}>
                      复制邮箱搜索
                    </Button>
                    <Button type="button" variant="danger" onClick={() => onDelete(lead.id)}>
                      删除
                    </Button>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    {lead.reviewReasons.slice(0, 2).join("；")}
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
