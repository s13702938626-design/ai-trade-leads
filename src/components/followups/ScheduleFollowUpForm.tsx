"use client";

import { FormEvent, useState } from "react";
import type { LeadContactChannel } from "@/types/lead";
import { CONTACT_CHANNELS } from "@/components/followups/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function ScheduleFollowUpForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: { title: string; dueDate: string; channel: LeadContactChannel; note: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("下一次跟进");
  const [dueDate, setDueDate] = useState("");
  const [channel, setChannel] = useState<LeadContactChannel>("email");
  const [note, setNote] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dueDate.trim()) return;
    onSubmit({ title, dueDate, channel, note });
  }

  return (
    <form className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">标题</span><Input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">到期日期</span><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700">渠道</span><Select value={channel} onChange={(event) => setChannel(event.target.value as LeadContactChannel)}>{CONTACT_CHANNELS.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label>
      </div>
      <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">备注</span><Textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <div className="flex gap-2">
        <Button type="submit">安排跟进</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>取消</Button>
      </div>
    </form>
  );
}
