import type { Lead, LeadInput, LeadStatus, MatchLevel } from "@/types/lead";
import { LEAD_STATUSES, MATCH_LEVELS } from "@/lib/constants";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function isMatchLevel(value: string): value is MatchLevel {
  return MATCH_LEVELS.includes(value as MatchLevel);
}

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}

export function getDomainFromUrl(value: string): string {
  if (!value.trim()) {
    return "";
  }

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function validateLeadInput(input: Partial<LeadInput>): ValidationResult {
  const errors: string[] = [];

  if (!input.companyName?.trim()) {
    errors.push("companyName 必填");
  }

  if (!input.productKeyword?.trim()) {
    errors.push("productKeyword 必填");
  }

  if (!input.sourceUrl?.trim()) {
    errors.push("sourceUrl 必填");
  }

  if (input.matchLevel && !isMatchLevel(input.matchLevel)) {
    errors.push("matchLevel 不合法");
  }

  if (input.status && !isLeadStatus(input.status)) {
    errors.push("status 不合法");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isLead(value: unknown): value is Lead {
  if (!value || typeof value !== "object") {
    return false;
  }

  const lead = value as Partial<Lead>;
  return Boolean(
    lead.id &&
      lead.companyName &&
      lead.productKeyword &&
      lead.sourceUrl &&
      lead.createdAt &&
      lead.updatedAt &&
      lead.matchLevel &&
      isMatchLevel(lead.matchLevel) &&
      lead.status &&
      isLeadStatus(lead.status),
  );
}
