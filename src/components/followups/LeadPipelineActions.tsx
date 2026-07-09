"use client";

import { useState } from "react";
import type { Lead } from "@/types/lead";
import {
  addFollowUpTask,
  markLeadQualified,
  markLeadRejected,
  recordContactAttempt,
  recordReplyReceived,
  updateLeadPipelineStatus,
} from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipelineStatusBadge } from "@/components/followups/PipelineStatusBadge";
import { RecordContactForm } from "@/components/followups/RecordContactForm";
import { ScheduleFollowUpForm } from "@/components/followups/ScheduleFollowUpForm";

export function LeadPipelineActions({ lead, onUpdated }: { lead: Lead; onUpdated: (lead: Lead) => void }) {
  const [mode, setMode] = useState<"contact" | "followup" | null>(null);

  function run(action: () => Lead) {
    onUpdated(action());
    setMode(null);
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">开发流程动作</h2>
          <p className="mt-1 text-sm text-slate-600">所有状态变化都必须由用户点击，不会自动发邮件或自动生成联系人。</p>
        </div>
        <PipelineStatusBadge status={lead.pipelineStatus} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => run(() => updateLeadPipelineStatus(lead.id, "ready_to_contact", "用户标记为待开发"))}>标记为待开发</Button>
        <Button type="button" variant="secondary" onClick={() => setMode(mode === "contact" ? null : "contact")}>记录一次联系</Button>
        <Button type="button" variant="secondary" onClick={() => setMode(mode === "followup" ? null : "followup")}>安排跟进</Button>
        <Button type="button" variant="secondary" onClick={() => run(() => recordReplyReceived(lead.id, "用户标记客户已回复"))}>标记已回复</Button>
        <Button type="button" variant="secondary" onClick={() => run(() => markLeadQualified(lead.id, "用户标记为合格客户"))}>标记合格客户</Button>
        <Button type="button" variant="secondary" onClick={() => run(() => updateLeadPipelineStatus(lead.id, "hold", "用户标记暂缓"))}>暂缓</Button>
        <Button type="button" variant="danger" onClick={() => run(() => markLeadRejected(lead.id, "用户放弃客户"))}>放弃</Button>
      </div>
      {mode === "contact" ? (
        <div className="mt-4">
          <RecordContactForm
            onCancel={() => setMode(null)}
            onSubmit={(input) => run(() => recordContactAttempt(lead.id, input.channel, input.note, input.nextFollowUpDate, input.nextFollowUpTitle))}
          />
        </div>
      ) : null}
      {mode === "followup" ? (
        <div className="mt-4">
          <ScheduleFollowUpForm
            onCancel={() => setMode(null)}
            onSubmit={(input) => run(() => addFollowUpTask(lead.id, input))}
          />
        </div>
      ) : null}
    </Card>
  );
}
