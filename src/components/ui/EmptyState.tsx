import { Card } from "@/components/ui/Card";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="flex min-h-44 flex-col items-center justify-center text-center">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      {description ? <p className="mt-2 max-w-xl text-sm text-slate-600">{description}</p> : null}
    </Card>
  );
}
