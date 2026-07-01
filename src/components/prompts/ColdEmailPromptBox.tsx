"use client";

import type { Lead } from "@/types/lead";
import { buildColdEmailPrompt } from "@/lib/prompt-builders";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

export function ColdEmailPromptBox({ lead }: { lead: Lead }) {
  const prompt = buildColdEmailPrompt(lead);

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-base font-semibold text-slate-950">英文开发信 Prompt</h2>
        <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(prompt)}>
          复制英文开发信 Prompt
        </Button>
      </div>
      <Textarea className="mt-4 min-h-80 font-mono text-xs" readOnly value={prompt} />
    </Card>
  );
}
