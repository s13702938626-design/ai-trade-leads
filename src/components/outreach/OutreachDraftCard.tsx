"use client";

import { useState } from "react";
import type { OutreachDraft } from "@/types/outreach";
import { deleteOutreachDraft } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OutreachChannelBadge } from "@/components/outreach/OutreachChannelBadge";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{items.length > 0 ? items.join("\n") : "无"}</p>
    </div>
  );
}

export function OutreachDraftCard({
  draft,
  onDeleted,
}: {
  draft: OutreachDraft;
  onDeleted: () => void;
}) {
  const [copied, setCopied] = useState("");

  async function copy(label: string, text?: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(label);
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <OutreachChannelBadge channel={draft.channel} />
          <span className="text-xs text-slate-500">{draft.language}</span>
          <span className="text-xs text-slate-500">{draft.tone}</span>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={() => {
            deleteOutreachDraft(draft.leadId, draft.id);
            onDeleted();
          }}
        >
          删除草稿
        </Button>
      </div>
      {draft.subject ? <p className="mt-4 text-sm font-semibold text-slate-950">{draft.subject}</p> : null}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{draft.body}</p>
      {draft.shortVersion ? (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{draft.shortVersion}</p>
      ) : null}
      <p className="mt-3 text-sm text-slate-700"><span className="font-medium">CTA：</span>{draft.callToAction}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => copy("主题", draft.subject)}>复制主题</Button>
        <Button type="button" variant="secondary" onClick={() => copy("正文", draft.body)}>复制正文</Button>
        <Button type="button" variant="secondary" onClick={() => copy("短版", draft.shortVersion)}>复制短版</Button>
        {copied ? <span className="self-center text-sm text-emerald-700">已复制{copied}</span> : null}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ListBlock title="assumptions" items={draft.assumptions} />
        <ListBlock title="missingInfo" items={draft.missingInfo} />
        <ListBlock title="evidenceUsed" items={draft.evidenceUsed} />
        <ListBlock title="warnings" items={draft.warnings} />
      </div>
      <p className="mt-4 text-xs text-slate-500">createdAt: {draft.createdAt} · model: {draft.model || "basic-template"}</p>
    </Card>
  );
}
