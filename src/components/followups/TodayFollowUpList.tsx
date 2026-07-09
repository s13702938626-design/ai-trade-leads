"use client";

import Link from "next/link";
import type { Lead, LeadFollowUpTask } from "@/types/lead";
import { cancelFollowUpTask, completeFollowUpTask } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipelineStatusBadge } from "@/components/followups/PipelineStatusBadge";

type DueTask = {
  lead: Lead;
  task: LeadFollowUpTask;
};

export function TodayFollowUpList({ items, onChanged }: { items: DueTask[]; onChanged: () => void }) {
  return (
    <Card className="p-0">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-base font-semibold text-slate-950">今日/逾期待跟进</h3>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">暂无今日或逾期待跟进</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">公司</th>
                <th className="px-4 py-3">国家</th>
                <th className="px-4 py-3">渠道</th>
                <th className="px-4 py-3">到期</th>
                <th className="px-4 py-3">标题</th>
                <th className="px-4 py-3">备注</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map(({ lead, task }) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{lead.companyName}</td>
                  <td className="px-4 py-3 text-slate-700">{lead.country || "未填写"}</td>
                  <td className="px-4 py-3 text-slate-700">{task.channel}</td>
                  <td className="px-4 py-3 text-slate-700">{task.dueDate}</td>
                  <td className="px-4 py-3 text-slate-700">{task.title}</td>
                  <td className="px-4 py-3 text-slate-700">{task.note}</td>
                  <td className="px-4 py-3"><PipelineStatusBadge status={lead.pipelineStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => { completeFollowUpTask(lead.id, task.id, "动作台完成跟进"); onChanged(); }}>完成跟进</Button>
                      <Button type="button" variant="secondary" onClick={() => { cancelFollowUpTask(lead.id, task.id, "动作台取消跟进"); onChanged(); }}>取消跟进</Button>
                      <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50" href={`/dashboard/leads/${lead.id}`}>打开详情</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
