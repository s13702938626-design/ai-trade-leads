"use client";

import type { Lead } from "@/types/lead";
import type { OutreachChannel, OutreachDraft } from "@/types/outreach";
import { saveOutreachDraft } from "@/lib/lead-storage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildDraft(lead: Lead, channel: OutreachChannel, subject: string, body: string, shortVersion = ""): OutreachDraft {
  return {
    id: createId(),
    leadId: lead.id,
    channel,
    language: "english",
    tone: "concise",
    subject,
    body,
    shortVersion,
    callToAction: `Ask whether ${lead.companyName} is open to discussing ${lead.productKeyword || "plastic materials"} needs.`,
    assumptions: ["This draft only uses existing lead fields.", "The recipient name is not assumed."],
    missingInfo: ["Contact person name", "Verified target product need", "Preferred communication channel"],
    evidenceUsed: [
      `companyName: ${lead.companyName}`,
      `productKeyword: ${lead.productKeyword || "not provided"}`,
      `sourceUrl: ${lead.sourceUrl || "not provided"}`,
    ],
    warnings: ["草稿未自动发送，建议人工核实联系人和客户背景后再使用"],
    createdAt: new Date().toISOString(),
    model: "basic-template",
  };
}

export function OutreachQuickTemplates({ lead, onUpdated }: { lead: Lead; onUpdated: (lead: Lead) => void }) {
  const product = lead.productKeyword || "plastic materials";
  const company = lead.companyName;
  const sourceLine = lead.sourceUrl ? `I found your company from this public source: ${lead.sourceUrl}.` : "";
  const templates = [
    buildDraft(
      lead,
      "email_first_touch",
      `Potential ${product} cooperation`,
      `Hello,\n\nI noticed ${company} while researching companies related to ${product}. ${sourceLine}\n\nWe work with plastic materials and would like to understand whether your team has current needs around ${product} or related materials.\n\nIf relevant, would it be okay to share a brief product overview for your review?\n\nBest regards,`,
    ),
    buildDraft(
      lead,
      "linkedin_message",
      "",
      `Hello, I noticed ${company} while researching ${product}. I am exploring whether there may be a relevant materials cooperation opportunity. Would it be okay to connect?`,
      `Hello, I noticed ${company} in relation to ${product}. Would it be okay to connect?`,
    ),
    buildDraft(
      lead,
      "whatsapp_message",
      "",
      `Hello, I found ${company} while researching ${product}. I wanted to ask whether your team has any current interest in related plastic materials. No pressure if this is not relevant.`,
      `Hello, I found ${company} while researching ${product}. Is this topic relevant for your team?`,
    ),
    buildDraft(
      lead,
      "website_form",
      "",
      `Hello, I found ${company} while researching ${product}. We are looking to understand whether your team sources or evaluates related plastic materials. If this is relevant, could the responsible person let me know the best way to share a short product introduction?`,
    ),
  ];

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-950">基础模板</h2>
      <p className="mt-1 text-sm text-slate-600">无 AI API 时也可生成基础草稿。模板只使用当前 Lead 已有字段。</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {templates.map((draft) => (
          <Button key={draft.channel} type="button" variant="secondary" onClick={() => onUpdated(saveOutreachDraft(lead.id, draft))}>
            保存{draft.channel}
          </Button>
        ))}
      </div>
    </Card>
  );
}
