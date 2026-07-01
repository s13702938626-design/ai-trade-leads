"use client";

import { FormEvent, useState } from "react";
import type { Lead, LeadInput, LeadStatus, MatchLevel } from "@/types/lead";
import { CUSTOMER_TYPES, LEAD_SOURCE_TYPES, LEAD_STATUSES, MATCH_LEVELS, TARGET_COUNTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type LeadFormProps = {
  lead?: Lead;
  onSubmit: (input: LeadInput) => void;
  onCancel?: () => void;
};

function initialForm(lead?: Lead): LeadInput {
  return {
    companyName: lead?.companyName ?? "",
    website: lead?.website ?? "",
    country: lead?.country ?? "",
    customerType: lead?.customerType ?? "",
    productKeyword: lead?.productKeyword ?? "",
    sourceUrl: lead?.sourceUrl ?? "",
    sourceTitle: lead?.sourceTitle ?? "",
    sourceSnippet: lead?.sourceSnippet ?? "",
    sourceType: lead?.sourceType ?? "manual_public_web",
    evidenceText: lead?.evidenceText ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    linkedinUrl: lead?.linkedinUrl ?? "",
    address: lead?.address ?? "",
    matchLevel: lead?.matchLevel ?? "unknown",
    status: lead?.status ?? "new",
    notes: lead?.notes ?? "",
  };
}

export function LeadForm({ lead, onSubmit, onCancel }: LeadFormProps) {
  const [form, setForm] = useState<LeadInput>(initialForm(lead));
  const [error, setError] = useState("");

  function update<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.companyName.trim() || !form.productKeyword.trim() || !form.sourceUrl.trim()) {
      setError("companyName、productKeyword、sourceUrl 必填");
      return;
    }

    setError("");
    onSubmit(form);
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">公司名 *</span>
          <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">官网</span>
          <Input value={form.website} onChange={(event) => update("website", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">国家</span>
          <Select value={form.country} onChange={(event) => update("country", event.target.value)}>
            <option value="">未填写</option>
            {TARGET_COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">客户类型</span>
          <Select value={form.customerType} onChange={(event) => update("customerType", event.target.value)}>
            <option value="">未填写</option>
            {CUSTOMER_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">产品关键词 *</span>
          <Input value={form.productKeyword} onChange={(event) => update("productKeyword", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">来源链接 sourceUrl *</span>
          <Input value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">来源标题</span>
          <Input value={form.sourceTitle} onChange={(event) => update("sourceTitle", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">来源类型</span>
          <Select value={form.sourceType} onChange={(event) => update("sourceType", event.target.value)}>
            {LEAD_SOURCE_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">匹配度</span>
          <Select value={form.matchLevel} onChange={(event) => update("matchLevel", event.target.value as MatchLevel)}>
            {MATCH_LEVELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">状态</span>
          <Select value={form.status} onChange={(event) => update("status", event.target.value as LeadStatus)}>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">邮箱</span>
          <Input value={form.email ?? ""} onChange={(event) => update("email", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">电话</span>
          <Input value={form.phone ?? ""} onChange={(event) => update("phone", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">LinkedIn</span>
          <Input value={form.linkedinUrl ?? ""} onChange={(event) => update("linkedinUrl", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">地址</span>
          <Input value={form.address ?? ""} onChange={(event) => update("address", event.target.value)} />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-medium text-slate-700">来源摘要</span>
        <Textarea value={form.sourceSnippet} onChange={(event) => update("sourceSnippet", event.target.value)} />
      </label>
      <label className="space-y-2 block">
        <span className="text-sm font-medium text-slate-700">证据文本</span>
        <Textarea value={form.evidenceText} onChange={(event) => update("evidenceText", event.target.value)} />
      </label>
      <label className="space-y-2 block">
        <span className="text-sm font-medium text-slate-700">备注</span>
        <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{lead ? "保存修改" : "新增客户"}</Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            取消
          </Button>
        ) : null}
      </div>
    </form>
  );
}
