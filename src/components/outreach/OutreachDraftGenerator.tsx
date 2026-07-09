"use client";

import { FormEvent, useState } from "react";
import type { Lead } from "@/types/lead";
import type { OutreachDraft, OutreachDraftRequest } from "@/types/outreach";
import { saveOutreachDraft } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { OUTREACH_CHANNELS, OUTREACH_LANGUAGES, OUTREACH_TONES } from "@/components/outreach/shared";

type ApiResponse = {
  draft?: OutreachDraft;
  error?: string;
};

export function OutreachDraftGenerator({
  lead,
  onUpdated,
}: {
  lead: Lead;
  onUpdated: (lead: Lead) => void;
}) {
  const [form, setForm] = useState<OutreachDraftRequest>({
    leadId: lead.id,
    channel: "email_first_touch",
    language: "english",
    tone: "professional",
    productFocus: lead.productKeyword,
    userCompanyIntro: "",
    userAdvantages: "",
    userCaseReference: "",
    extraInstruction: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof OutreachDraftRequest>(key: K, value: OutreachDraftRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-outreach-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead, request: form }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.draft) {
        setError(data.error || "开发话术生成失败");
        return;
      }
      onUpdated(saveOutreachDraft(lead.id, data.draft));
    } catch {
      setError("开发话术生成请求失败，请检查服务端配置或网络。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">AI 开发话术生成</h2>
      <p className="mt-1 text-sm text-slate-600">生成草稿，不自动发送，不自动修改客户状态。</p>
      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">channel</span><Select value={form.channel} onChange={(event) => update("channel", event.target.value as OutreachDraftRequest["channel"])}>{OUTREACH_CHANNELS.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">language</span><Select value={form.language} onChange={(event) => update("language", event.target.value as OutreachDraftRequest["language"])}>{OUTREACH_LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">tone</span><Select value={form.tone} onChange={(event) => update("tone", event.target.value as OutreachDraftRequest["tone"])}>{OUTREACH_TONES.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">productFocus</span><Input value={form.productFocus ?? ""} onChange={(event) => update("productFocus", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">userCompanyIntro</span><Input value={form.userCompanyIntro ?? ""} onChange={(event) => update("userCompanyIntro", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">userAdvantages</span><Input value={form.userAdvantages ?? ""} onChange={(event) => update("userAdvantages", event.target.value)} /></label>
        </div>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">userCaseReference</span><Textarea value={form.userCaseReference ?? ""} onChange={(event) => update("userCaseReference", event.target.value)} /></label>
        <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">extraInstruction</span><Textarea value={form.extraInstruction ?? ""} onChange={(event) => update("extraInstruction", event.target.value)} /></label>
        <Button disabled={loading} type="submit">{loading ? "生成中..." : "生成开发话术"}</Button>
      </form>
    </Card>
  );
}
