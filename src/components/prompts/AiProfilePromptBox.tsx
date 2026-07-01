"use client";

import type { Lead } from "@/types/lead";
import { buildAiProfilePrompt } from "@/lib/prompt-builders";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

export function AiProfilePromptBox({ lead }: { lead: Lead }) {
  const prompt = buildAiProfilePrompt(lead);

  return (
    <Card>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-base font-semibold text-slate-950">AI 客户画像 Prompt</h2>
        <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(prompt)}>
          复制 AI 客户画像 Prompt
        </Button>
      </div>
      <Textarea className="mt-4 min-h-80 font-mono text-xs" readOnly value={prompt} />
    </Card>
  );
}
