import { NextResponse } from "next/server";
import type { Lead } from "@/types/lead";
import type {
  OutreachChannel,
  OutreachDraft,
  OutreachDraftRequest,
  OutreachLanguage,
  OutreachTone,
} from "@/types/outreach";

type GenerateRequest = {
  lead?: unknown;
  request?: unknown;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

const CHANNELS: OutreachChannel[] = [
  "email_first_touch",
  "email_follow_up",
  "linkedin_message",
  "whatsapp_message",
  "website_form",
  "reply_follow_up",
];
const LANGUAGES: OutreachLanguage[] = ["english", "chinese", "spanish", "french", "arabic", "portuguese"];
const TONES: OutreachTone[] = ["professional", "concise", "friendly", "technical", "factory_direct", "trading"];

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isLead(value: unknown): value is Lead {
  return Boolean(value && typeof value === "object" && "id" in value && "companyName" in value);
}

function isRequest(value: unknown): value is OutreachDraftRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<OutreachDraftRequest>;
  return Boolean(
    record.leadId &&
      CHANNELS.includes(record.channel as OutreachChannel) &&
      LANGUAGES.includes(record.language as OutreachLanguage) &&
      TONES.includes(record.tone as OutreachTone),
  );
}

function stripCodeFence(value: string): string {
  return value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizeDraft(value: unknown, leadId: string, request: OutreachDraftRequest, model: string): OutreachDraft | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const warnings = asStringArray(record.warnings);
  const body = typeof record.body === "string" ? record.body.trim() : "";
  const callToAction = typeof record.callToAction === "string" ? record.callToAction.trim() : "";
  if (!body || !callToAction) return null;

  return {
    id: createId(),
    leadId,
    channel: request.channel,
    language: request.language,
    tone: request.tone,
    subject: typeof record.subject === "string" ? record.subject : "",
    body,
    shortVersion: typeof record.shortVersion === "string" ? record.shortVersion : "",
    callToAction,
    assumptions: asStringArray(record.assumptions),
    missingInfo: asStringArray(record.missingInfo),
    evidenceUsed: asStringArray(record.evidenceUsed),
    warnings: warnings.length > 0 ? warnings : ["草稿未自动发送，建议人工核实联系人和客户背景后再使用"],
    createdAt: new Date().toISOString(),
    model,
  };
}

function buildLeadFacts(lead: Lead): string {
  return JSON.stringify(
    {
      companyName: lead.companyName,
      country: lead.country,
      website: lead.website,
      customerType: lead.customerType,
      productKeyword: lead.productKeyword,
      sourceType: lead.sourceType,
      sourceUrl: lead.sourceUrl,
      sourceTitle: lead.sourceTitle,
      sourceSnippet: lead.sourceSnippet,
      evidenceText: lead.evidenceText,
      notes: lead.notes,
      aiAnalysis: lead.aiAnalysis ?? null,
      pipelineStatus: lead.pipelineStatus ?? "new",
      activities: lead.activities ?? [],
      followUpTasks: lead.followUpTasks ?? [],
      lastContactedAt: lead.lastContactedAt ?? null,
      nextFollowUpAt: lead.nextFollowUpAt ?? null,
      searchRunId: lead.searchRunId ?? null,
      fetchedAt: lead.fetchedAt,
    },
    null,
    2,
  );
}

export async function POST(request: Request) {
  const baseUrl = process.env.AI_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json(
      { error: "AI API 未配置，请先配置 AI_BASE_URL、AI_API_KEY、AI_MODEL" },
      { status: 400 },
    );
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "请求 JSON 不合法" }, { status: 400 });
  }

  if (!isLead(body.lead) || !isRequest(body.request)) {
    return NextResponse.json({ error: "lead 和 request 必填" }, { status: 400 });
  }

  const systemPrompt = [
    "你是一个外贸客户开发文案助手。",
    "你只能基于用户提供的 Lead 真实字段生成开发话术。",
    "你不能编造客户联系人、邮箱、电话、WhatsApp、国家、官网、采购记录。",
    "你不能声称已经联系过客户，除非 Lead 的活动记录明确显示。",
    "你不能声称客户已经回复，除非 Lead 的活动记录或 notes 明确显示。",
    "你不能替用户承诺价格、账期、认证、交期、独家代理。",
    "你必须输出严格 JSON，不能输出 markdown。",
    "你生成的是草稿，不是自动发送内容。",
    "话术应自然、具体、克制，避免 spam 风格。",
  ].join("\n");

  const userPrompt = `Lead fields:
${buildLeadFacts(body.lead)}

Request:
${JSON.stringify(body.request, null, 2)}

请严格返回 JSON：
{
  "subject": "",
  "body": "",
  "shortVersion": "",
  "callToAction": "",
  "assumptions": [],
  "missingInfo": [],
  "evidenceUsed": [],
  "warnings": []
}

要求：
- body 必须是最终可复制草稿。
- subject 只在邮件类需要；非邮件类可以是空字符串。
- whatsapp_message 要短，不要长篇邮件。
- linkedin_message 要自然、短，不能像群发广告。
- website_form 要适合网站留言框。
- reply_follow_up 如果 Lead 里没有客户回复内容，要提醒缺少客户回复内容。
- evidenceUsed 必须只引用 Lead 里真实存在的信息。
- warnings 至少 1 条。`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: `AI API 调用失败，状态码 ${response.status}` }, { status: 502 });
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "AI 返回为空" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(stripCodeFence(content));
    const draft = normalizeDraft(parsed, body.lead.id, body.request, model);
    if (!draft) {
      return NextResponse.json({ error: "AI 返回格式无法解析" }, { status: 500 });
    }
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ error: "AI 返回格式无法解析" }, { status: 500 });
  }
}
