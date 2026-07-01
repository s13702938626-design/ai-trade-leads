"use client";

import { useMemo, useState } from "react";
import type { LeadInput } from "@/types/lead";
import type { CandidateReviewDecision, SerperSearchCandidate } from "@/types/search";
import { addLead } from "@/lib/lead-storage";
import { getDomainFromUrl, validateLeadInput } from "@/lib/validators";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CUSTOMER_TYPES, TARGET_COUNTRIES } from "@/lib/constants";

type ConfirmCandidateLeadFormProps = {
  candidate: SerperSearchCandidate;
  country: string;
  customerType: string;
  productKeyword: string;
  onSaved: (candidateId: string) => void;
  onCancel: (candidateId: string) => void;
};

function titleToCompanyDraft(title: string): string {
  return title
    .split(/[|-]/)[0]
    .replace(/\s+/g, " ")
    .trim();
}

function originFromLink(link: string): string {
  try {
    return new URL(link).origin;
  } catch {
    return "";
  }
}

function decisionLabel(decision: CandidateReviewDecision): string {
  const labels = {
    save: "建议保存",
    research_more: "继续研究",
    reject: "不建议保存",
    unknown: "证据不足",
  };

  return labels[decision];
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">无</p>
      )}
    </div>
  );
}

export function ConfirmCandidateLeadForm({
  candidate,
  country,
  customerType,
  productKeyword,
  onSaved,
  onCancel,
}: ConfirmCandidateLeadFormProps) {
  const initial = useMemo<LeadInput>(
    () => ({
      companyName: titleToCompanyDraft(candidate.title),
      website: originFromLink(candidate.link),
      country,
      customerType,
      productKeyword,
      sourceUrl: candidate.link,
      sourceTitle: candidate.title,
      sourceSnippet: candidate.snippet,
      sourceType: candidate.sourceType,
      evidenceText: candidate.snippet,
      email: "",
      phone: "",
      linkedinUrl: "",
      address: "",
      matchLevel: "unknown",
      status: "researching",
      notes: "",
      fetchedAt: candidate.fetchedAt,
    }),
    [candidate, country, customerType, productKeyword],
  );
  const [form, setForm] = useState<LeadInput>(initial);
  const [error, setError] = useState("");

  const domain = getDomainFromUrl(form.website);
  const review = candidate.review;

  function update<K extends keyof LeadInput>(key: K, value: LeadInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const validation = validateLeadInput(form);
    if (!validation.valid) {
      setError(validation.errors.join("，"));
      return;
    }

    addLead({
      ...form,
      sourceUrl: candidate.link,
      sourceTitle: candidate.title,
      sourceSnippet: candidate.snippet,
      sourceType: candidate.sourceType,
      fetchedAt: candidate.fetchedAt,
      email: "",
      phone: "",
      linkedinUrl: "",
    });
    setError("");
    onSaved(candidate.id);
  }

  return (
    <Card>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">确认保存候选客户</h3>
          <p className="mt-1 text-sm text-slate-600">请人工确认必填字段和来源证据，确认后才会写入客户列表。</p>
        </div>
        <Button type="button" variant="ghost" onClick={() => onCancel(candidate.id)}>
          移除
        </Button>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {review ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={review.decision === "save" ? "green" : review.decision === "reject" ? "neutral" : "blue"}>
              {decisionLabel(review.decision)}
            </Badge>
            <Badge>{`预审分数 ${review.score}`}</Badge>
            <Badge>{`匹配度 ${review.fitLevel}`}</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ReviewList title="reasons" items={review.reasons} />
            <ReviewList title="risks" items={review.risks} />
            <ReviewList title="matchedSignals" items={review.matchedSignals} />
            <ReviewList title="missingInfo" items={review.missingInfo} />
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">companyName *</span>
          <Input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">website</span>
          <Input value={form.website} onChange={(event) => update("website", event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">domain</span>
          <Input readOnly value={domain} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">country</span>
          <Select value={form.country} onChange={(event) => update("country", event.target.value)}>
            <option value="">清空，不填写</option>
            {TARGET_COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">customerType</span>
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
          <span className="text-sm font-medium text-slate-700">productKeyword *</span>
          <Input value={form.productKeyword} onChange={(event) => update("productKeyword", event.target.value)} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">sourceUrl *</span>
          <Input readOnly value={form.sourceUrl} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">sourceTitle</span>
          <Input readOnly value={form.sourceTitle} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">fetchedAt</span>
          <Input readOnly value={form.fetchedAt} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">sourceSnippet</span>
          <Textarea readOnly value={form.sourceSnippet} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">evidenceText</span>
          <Textarea value={form.evidenceText} onChange={(event) => update("evidenceText", event.target.value)} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">notes</span>
          <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={save}>
          确认保存到客户列表
        </Button>
        <Button type="button" variant="secondary" onClick={() => onCancel(candidate.id)}>
          取消
        </Button>
      </div>
    </Card>
  );
}
