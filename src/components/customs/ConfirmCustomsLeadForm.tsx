"use client";

import { useMemo, useState } from "react";
import type { LeadInput } from "@/types/lead";
import type { CustomsLead } from "@/types/customs";
import { convertCustomsLeadToLead } from "@/lib/customs-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { TARGET_COUNTRIES } from "@/lib/constants";
import { CustomsPriorityBadge } from "@/components/customs/CustomsPriorityBadge";

function evidenceText(lead: CustomsLead): string {
  return [
    `HS Code: ${lead.hsCode || "Not provided"}`,
    `产品描述: ${lead.productDescription || "Not provided"}`,
    `最近进口日期: ${lead.lastImportDate || "Not provided"}`,
    `进口频率: ${lead.importFrequency}`,
    `估算月采购量: ${lead.estimatedMonthlyVolume ?? "Not provided"}`,
    `优先级: ${lead.priority}`,
    `来源名称: ${lead.sourceName || "Not provided"}`,
  ].join("\n");
}

export function ConfirmCustomsLeadForm({
  customsLead,
  onCancel,
  onSaved,
}: {
  customsLead: CustomsLead;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const initial = useMemo<LeadInput>(() => ({
    companyName: customsLead.importerName,
    website: "",
    country: customsLead.country,
    customerType: "importer",
    productKeyword: customsLead.productDescription,
    sourceUrl: customsLead.sourceUrl,
    sourceTitle: customsLead.sourceName,
    sourceSnippet: customsLead.productDescription,
    sourceType: "customs_csv_import",
    evidenceText: evidenceText(customsLead),
    email: "",
    phone: "",
    linkedinUrl: "",
    address: "",
    matchLevel: "unknown",
    status: "researching",
    notes: "",
    fetchedAt: customsLead.importedAt,
    searchRunId: null,
  }), [customsLead]);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  function update<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (!form.companyName.trim() || !form.productKeyword.trim() || !form.sourceUrl.trim()) {
      setError("companyName、productKeyword、sourceUrl 必填。缺少来源的海关线索不能转为 Lead。");
      return;
    }
    convertCustomsLeadToLead(customsLead.id, form);
    onSaved();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">确认转为客户线索</h3>
          <p className="mt-1 text-sm text-slate-600">保存前请人工确认来源、公司名和产品信息。</p>
        </div>
        <CustomsPriorityBadge priority={customsLead.priority} />
      </div>
      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">companyName *</span><Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">country</span><Select value={form.country} onChange={(event) => update("country", event.target.value)}><option value="">清空，不填写</option>{TARGET_COUNTRIES.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">productKeyword *</span><Input value={form.productKeyword} onChange={(event) => update("productKeyword", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">sourceUrl *</span><Input value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">sourceTitle</span><Input value={form.sourceTitle} onChange={(event) => update("sourceTitle", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">customerType</span><Input value={form.customerType} onChange={(event) => update("customerType", event.target.value)} /></label>
        <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">evidenceText</span><Textarea value={form.evidenceText} onChange={(event) => update("evidenceText", event.target.value)} /></label>
      </div>
      <div className="mt-5 flex gap-2">
        <Button type="button" onClick={save}>确认保存到客户列表</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>取消</Button>
      </div>
    </Card>
  );
}
