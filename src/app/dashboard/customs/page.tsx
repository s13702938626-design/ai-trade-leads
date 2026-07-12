"use client";

import { useEffect, useState } from "react";
import type { CustomsLead } from "@/types/customs";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CustomsImportBox } from "@/components/customs/CustomsImportBox";
import { CustomsLeadTable } from "@/components/customs/CustomsLeadTable";
import { CustomsSearchTemplates } from "@/components/customs/CustomsSearchTemplates";
import { ConfirmCustomsLeadForm } from "@/components/customs/ConfirmCustomsLeadForm";
import { deleteCustomsLead, listCustomsLeads } from "@/lib/customs-storage";
import { inferProductLineFromText } from "@/lib/product-lines";
import type { ProductLineId } from "@/types/search-intelligence";

export default function CustomsPage() {
  const [leads, setLeads] = useState<CustomsLead[]>([]);
  const [convertingLead, setConvertingLead] = useState<CustomsLead | null>(null);
  const [message, setMessage] = useState("");

  function refresh() {
    setLeads(listCustomsLeads());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("customs-leads:updated", refresh);
    return () => window.removeEventListener("customs-leads:updated", refresh);
  }, []);

  function openSerper(query: string, country = "", productLineId?: ProductLineId) {
    const inferredProductLine = productLineId ?? (inferProductLineFromText(query) || "custom");
    const params = new URLSearchParams({ customsQuery: query, country, productLineId: inferredProductLine });
    window.location.href = `/dashboard/serper?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">海关数据反查进口商</h2>
        <p className="mt-1 text-sm text-slate-600">导入合法来源海关 CSV，按采购记录评分，再人工确认转为客户线索。</p>
      </div>

      <Card>
        <h3 className="text-base font-semibold text-slate-950">海关数据来源说明</h3>
        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <p>当前版本不直接查询付费海关数据库，也不假装接入真实海关 API。</p>
          <p>你可以从自己购买或合法获取的海关数据平台导出 CSV，系统负责导入、清洗、评分、转成客户线索。</p>
          <p>不能上传非法来源数据。每条记录必须有来源；缺少来源的记录可导入为待补来源状态，但不能转为 Lead。</p>
        </div>
      </Card>

      <CustomsSearchTemplates onSerperSearch={openSerper} />
      <CustomsImportBox onImported={refresh} />

      {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      {convertingLead ? (
        <ConfirmCustomsLeadForm
          customsLead={convertingLead}
          onCancel={() => setConvertingLead(null)}
          onSaved={() => {
            setConvertingLead(null);
            setMessage("已转为客户线索");
            refresh();
          }}
        />
      ) : null}

      <div>
        <h3 className="mb-3 text-base font-semibold text-slate-950">海关线索列表</h3>
        {leads.length === 0 ? (
          <EmptyState title="暂无海关线索" description="请先导入合法来源的海关 CSV。系统不会创建任何假数据。" />
        ) : (
          <CustomsLeadTable
            leads={leads}
            onConvert={setConvertingLead}
            onDeepSearch={(query) => openSerper(query)}
            onDelete={(id) => {
              deleteCustomsLead(id);
              refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
