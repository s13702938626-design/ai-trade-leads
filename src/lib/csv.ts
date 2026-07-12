import type { Lead, LeadStatus, MatchLevel } from "@/types/lead";
import { createLead } from "@/lib/lead-storage";
import { isLeadStatus, isMatchLevel } from "@/lib/validators";

export const CSV_HEADERS: (keyof Lead)[] = [
  "id",
  "companyName",
  "website",
  "domain",
  "country",
  "customerType",
  "productKeyword",
  "sourceUrl",
  "sourceTitle",
  "sourceSnippet",
  "sourceType",
  "evidenceText",
  "email",
  "phone",
  "linkedinUrl",
  "address",
  "matchLevel",
  "status",
  "notes",
  "fetchedAt",
  "searchRunId",
  "tags",
  "createdAt",
  "updatedAt",
];

const AI_CSV_HEADERS = [
  "aiFitScore",
  "aiFitLevel",
  "aiRecommendedDecision",
  "aiSummary",
  "aiOpeningAngle",
  "aiNextAction",
  "aiConfidence",
  "aiAnalyzedAt",
  "aiModel",
] as const;

const PIPELINE_CSV_HEADERS = [
  "pipelineStatus",
  "lastContactedAt",
  "nextFollowUpAt",
  "followUpTaskCount",
  "pendingFollowUpTaskCount",
  "activityCount",
] as const;

const OUTREACH_CSV_HEADERS = [
  "outreachDraftCount",
  "latestOutreachDraftAt",
  "latestOutreachChannel",
  "latestOutreachLanguage",
] as const;

type ImportResult = {
  leads: Lead[];
  errors: string[];
};

function escapeCsvValue(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function leadsToCsv(leads: Lead[]): string {
  const rows = [
    [...CSV_HEADERS, ...AI_CSV_HEADERS, ...PIPELINE_CSV_HEADERS, ...OUTREACH_CSV_HEADERS].join(","),
    ...leads.map((lead) => {
      const outreachDrafts = lead.outreachDrafts ?? [];
      const latestOutreachDraft = [...outreachDrafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      return [
        ...CSV_HEADERS.map((header) => escapeCsvValue(lead[header])),
        escapeCsvValue(lead.aiAnalysis?.fitScore ?? ""),
        escapeCsvValue(lead.aiAnalysis?.fitLevel ?? ""),
        escapeCsvValue(lead.aiAnalysis?.recommendedDecision ?? ""),
        escapeCsvValue(lead.aiAnalysis?.summary ?? ""),
        escapeCsvValue(lead.aiAnalysis?.openingAngle ?? ""),
        escapeCsvValue(lead.aiAnalysis?.nextAction ?? ""),
        escapeCsvValue(lead.aiAnalysis?.confidence ?? ""),
        escapeCsvValue(lead.aiAnalyzedAt ?? ""),
        escapeCsvValue(lead.aiModel ?? ""),
        escapeCsvValue(lead.pipelineStatus ?? ""),
        escapeCsvValue(lead.lastContactedAt ?? ""),
        escapeCsvValue(lead.nextFollowUpAt ?? ""),
        escapeCsvValue((lead.followUpTasks ?? []).length),
        escapeCsvValue((lead.followUpTasks ?? []).filter((task) => task.status === "pending").length),
        escapeCsvValue((lead.activities ?? []).length),
        escapeCsvValue(outreachDrafts.length),
        escapeCsvValue(latestOutreachDraft?.createdAt ?? ""),
        escapeCsvValue(latestOutreachDraft?.channel ?? ""),
        escapeCsvValue(latestOutreachDraft?.language ?? ""),
      ].join(",");
    }),
  ];

  return rows.join("\n");
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export function csvToLeads(csv: string): ImportResult {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) {
    return { leads: [], errors: ["CSV 文件为空"] };
  }

  const headers = rows[0].map((header) => header.trim());
  const leads: Lead[] = [];
  const errors: string[] = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const lineNumber = rowIndex + 2;
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]));
    const rowErrors: string[] = [];

    if (!record.companyName?.trim()) {
      rowErrors.push("companyName 必填");
    }

    if (!record.sourceUrl?.trim()) {
      rowErrors.push("sourceUrl 必填");
    }

    if (!record.productKeyword?.trim()) {
      rowErrors.push("productKeyword 必填");
    }

    const matchLevelValue = record.matchLevel?.trim() || "unknown";
    const statusValue = record.status?.trim() || "new";

    if (!isMatchLevel(matchLevelValue)) {
      rowErrors.push("matchLevel 不合法");
    }

    if (!isLeadStatus(statusValue)) {
      rowErrors.push("status 不合法");
    }

    if (rowErrors.length > 0) {
      errors.push(`第 ${lineNumber} 行：${rowErrors.join("，")}`);
      return;
    }

    const matchLevel: MatchLevel = isMatchLevel(matchLevelValue) ? matchLevelValue : "unknown";
    const status: LeadStatus = isLeadStatus(statusValue) ? statusValue : "new";

    try {
      const lead = createLead({
        companyName: record.companyName ?? "",
        website: record.website ?? "",
        country: record.country ?? "",
        customerType: record.customerType ?? "",
        productKeyword: record.productKeyword ?? "",
        sourceUrl: record.sourceUrl ?? "",
        sourceTitle: record.sourceTitle ?? "",
        sourceSnippet: record.sourceSnippet ?? "",
        sourceType: record.sourceType || "manual_public_web",
        evidenceText: record.evidenceText ?? "",
        email: record.email || null,
        phone: record.phone || null,
        linkedinUrl: record.linkedinUrl || null,
        address: record.address || null,
        matchLevel,
        status,
        notes: record.notes ?? "",
        fetchedAt: record.fetchedAt ?? "",
        searchRunId: record.searchRunId || null,
        tags: record.tags ? record.tags.split(/[;|,]/).map((tag) => tag.trim()).filter(Boolean) : [],
      });
      leads.push({
        ...lead,
        id: record.id?.trim() || lead.id,
        createdAt: record.createdAt?.trim() || lead.createdAt,
        updatedAt: record.updatedAt?.trim() || lead.updatedAt,
      });
    } catch (error) {
      errors.push(`第 ${lineNumber} 行：${error instanceof Error ? error.message : "导入失败"}`);
    }
  });

  return { leads, errors };
}
