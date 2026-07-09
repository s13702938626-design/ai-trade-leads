import type { LeadActivity } from "@/types/lead";
import { Card } from "@/components/ui/Card";

export function LeadActivityTimeline({ activities = [] }: { activities?: LeadActivity[] }) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">客户动作时间线</h2>
      {activities.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">暂无动作记录</p>
      ) : (
        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <div className="rounded-md bg-slate-50 p-3" key={activity.id}>
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-slate-950">{activity.title}</p>
                <p className="text-xs text-slate-500">{activity.createdAt}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {activity.type}
                {activity.channel ? ` · ${activity.channel}` : ""}
                {activity.fromStatus || activity.toStatus ? ` · ${activity.fromStatus ?? ""} -> ${activity.toStatus ?? ""}` : ""}
              </p>
              {activity.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{activity.note}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
