import type { OutreachDraft } from "@/types/outreach";
import { OutreachDraftCard } from "@/components/outreach/OutreachDraftCard";

export function OutreachDraftList({
  drafts = [],
  onChanged,
}: {
  drafts?: OutreachDraft[];
  onChanged: () => void;
}) {
  if (drafts.length === 0) {
    return <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">暂无开发话术草稿</p>;
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <OutreachDraftCard draft={draft} key={draft.id} onDeleted={onChanged} />
      ))}
    </div>
  );
}
