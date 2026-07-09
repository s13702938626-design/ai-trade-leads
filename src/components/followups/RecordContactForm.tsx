"use client";

import { FormEvent, useState } from "react";
import type { LeadContactChannel } from "@/types/lead";
import { CONTACT_CHANNELS } from "@/components/followups/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function RecordContactForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: { channel: LeadContactChannel; note: string; nextFollowUpDate?: string; nextFollowUpTitle?: string }) => void;
  onCancel: () => void;
}) {
  const [channel, setChannel] = useState<LeadContactChannel>("email");
  const [note, setNote] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTitle, setNextFollowUpTitle] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ channel, note, nextFollowUpDate, nextFollowUpTitle });
  }

  return (
    <form className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">联系渠道</span>
          <Select value={channel} onChange={(event) => setChannel(event.target.value as LeadContactChannel)}>
            {CONTACT_CHANNELS.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">下次跟进日期</span>
          <Input type="date" value={nextFollowUpDate} onChange={(event) => setNextFollowUpDate(event.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">下次跟进标题</span>
          <Input value={nextFollowUpTitle} onChange={(event) => setNextFollowUpTitle(event.target.value)} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">备注</span>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="flex gap-2">
        <Button type="submit">保存联系记录</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>取消</Button>
      </div>
    </form>
  );
}
