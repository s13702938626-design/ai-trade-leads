import { NextResponse } from "next/server";
import type {
  Lead,
  LeadAiAnalysis,
  LeadAiDecision,
  LeadAiFitLevel,
} from "@/types/lead";

type AnalyzeLeadRequest = {
  lead?: unknown;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const FIT_LEVELS: LeadAiFitLevel[] = ["high", "medium", "low", "unknown"];
const DECISIONS: LeadAiDecision[] = ["develop_now", "research_more", "hold", "reject", "unknown"];
const CONFIDENCE = ["high", "medium", "low"] as const;

function isLead(value: unknown): value is Lead {
  return Boolean(value && typeof value === "object" && "id" in value && "companyName" in value);
}

function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeAnalysis(value: unknown): LeadAiAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const fitScore = typeof record.fitScore === "number" ? Math.max(0, Math.min(100, Math.round(record.fitScore))) : 0;
  const fitLevel = FIT_LEVELS.includes(record.fitLevel as LeadAiFitLevel)
    ? (record.fitLevel as LeadAiFitLevel)
    : "unknown";
  const recommendedDecision = DECISIONS.includes(record.recommendedDecision as LeadAiDecision)
    ? (record.recommendedDecision as LeadAiDecision)
    : "unknown";
  const risks = asStringArray(record.risks);
  const missingInfo = asStringArray(record.missingInfo);
  const reasons = asStringArray(record.reasons);

  return {
    fitScore,
    fitLevel,
    recommendedDecision,
    customerReality: typeof record.customerReality === "string" ? record.customerReality : "",
    targetRelevance: typeof record.targetRelevance === "string" ? record.targetRelevance : "",
    summary: typeof record.summary === "string" ? record.summary : "",
    reasons: reasons.length >= 2 ? reasons : [...reasons, "基于现有 Lead 字段进行初步判断", "仍需人工核实官网和来源证据"].slice(0, 2),
    possibleNeeds: asStringArray(record.possibleNeeds),
    recommendedProducts: asStringArray(record.recommendedProducts),
    openingAngle: typeof record.openingAngle === "string" ? record.openingAngle : "",
    risks: risks.length > 0 ? risks : ["暂无明显风险，但信息仍需核实"],
    missingInfo: missingInfo.length > 0 ? missingInfo : ["仍需补充官网、联系人或采购相关证据"],
    evidenceUsed: asStringArray(record.evidenceUsed),
    nextAction: typeof record.nextAction === "string" ? record.nextAction : "",
    confidence: CONFIDENCE.includes(record.confidence as (typeof CONFIDENCE)[number])
      ? (record.confidence as LeadAiAnalysis["confidence"])
      : "low",
  };
}

function buildLeadFacts(lead: Lead): string {
  const facts = {
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
    status: lead.status,
    notes: lead.notes,
    matchLevel: lead.matchLevel,
    searchRunId: lead.searchRunId ?? "",
    fetchedAt: lead.fetchedAt,
  };

  return JSON.stringify(facts, null, 2);
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

  let body: AnalyzeLeadRequest;
  try {
    body = (await request.json()) as AnalyzeLeadRequest;
  } catch {
    return NextResponse.json({ error: "请求 JSON 不合法" }, { status: 400 });
  }

  if (!isLead(body.lead)) {
    return NextResponse.json({ error: "lead 必填" }, { status: 400 });
  }

  const systemPrompt = [
    "你是一个外贸客户开发分析助手。",
    "你只能基于用户提供的 Lead 真实字段分析。",
    "你不能编造官网、邮箱、联系人、国家、采购记录。",
    "你不能声称已经访问了网站，除非 Lead 里已有 website/sourceUrl/evidenceText。",
    "你必须输出严格 JSON，不能输出 markdown。",
  ].join("\n");

  const userPrompt = `请分析下面 Lead。只能使用这些字段，不得补充不存在的信息。

Lead fields:
${buildLeadFacts(body.lead)}

请严格返回以下 JSON 结构：
{
  "fitScore": 0,
  "fitLevel": "unknown",
  "recommendedDecision": "unknown",
  "customerReality": "",
  "targetRelevance": "",
  "summary": "",
  "reasons": [],
  "possibleNeeds": [],
  "recommendedProducts": [],
  "openingAngle": "",
  "risks": [],
  "missingInfo": [],
  "evidenceUsed": [],
  "nextAction": "",
  "confidence": "low"
}

约束：
- fitScore 必须是 0-100。
- fitLevel 只能是 high / medium / low / unknown。
- recommendedDecision 只能是 develop_now / research_more / hold / reject / unknown。
- reasons 至少 2 条。
- risks 至少 1 条，没有明显风险时写“暂无明显风险，但信息仍需核实”。
- missingInfo 至少 1 条。
- evidenceUsed 必须只引用 Lead 已有字段名称和值，不允许凭空引用。
- openingAngle 是中文开发切入角度建议，不是完整邮件。`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
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
    const analysis = normalizeAnalysis(parsed);
    if (!analysis) {
      return NextResponse.json({ error: "AI 返回格式无法解析" }, { status: 500 });
    }

    return NextResponse.json({
      analysis,
      model,
      analyzedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "AI 返回格式无法解析" }, { status: 500 });
  }
}
