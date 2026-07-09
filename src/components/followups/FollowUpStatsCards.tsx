import { Card } from "@/components/ui/Card";

type FollowUpStats = {
  readyToContactCount: number;
  contactedCount: number;
  followUpCount: number;
  todayFollowUpCount: number;
  overdueFollowUpCount: number;
  repliedCount: number;
  qualifiedCount: number;
};

export function FollowUpStatsCards({ stats }: { stats: FollowUpStats }) {
  const items = [
    { label: "待开发客户", value: stats.readyToContactCount },
    { label: "已联系", value: stats.contactedCount },
    { label: "待跟进", value: stats.followUpCount },
    { label: "今日应跟进", value: stats.todayFollowUpCount },
    { label: "已逾期跟进", value: stats.overdueFollowUpCount },
    { label: "已回复", value: stats.repliedCount },
    { label: "合格客户", value: stats.qualifiedCount },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
