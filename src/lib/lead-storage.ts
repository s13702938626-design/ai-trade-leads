"use client";

import type { Lead, LeadAiAnalysis, LeadInput } from "@/types/lead";
import { getDomainFromUrl, isLead, normalizeOptional, validateLeadInput } from "@/lib/validators";

const STORAGE_KEY = "ai-trade-leads:v0.1:leads";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getLeads(): Lead[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isLead);
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event("leads:updated"));
}

export function createLead(input: LeadInput): Lead {
  const validation = validateLeadInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const now = new Date().toISOString();
  const website = input.website.trim();

  return {
    id: createId(),
    companyName: input.companyName.trim(),
    website,
    domain: getDomainFromUrl(website),
    country: input.country.trim(),
    customerType: input.customerType.trim(),
    productKeyword: input.productKeyword.trim(),
    sourceUrl: input.sourceUrl.trim(),
    sourceTitle: input.sourceTitle.trim(),
    sourceSnippet: input.sourceSnippet.trim(),
    sourceType: input.sourceType.trim() || "manual_public_web",
    evidenceText: input.evidenceText.trim(),
    email: normalizeOptional(input.email),
    phone: normalizeOptional(input.phone),
    linkedinUrl: normalizeOptional(input.linkedinUrl),
    address: normalizeOptional(input.address),
    matchLevel: input.matchLevel || "unknown",
    status: input.status || "new",
    notes: input.notes.trim(),
    fetchedAt: input.fetchedAt.trim(),
    searchRunId: input.searchRunId ?? null,
    aiAnalysis: input.aiAnalysis ?? null,
    aiAnalyzedAt: input.aiAnalyzedAt ?? null,
    aiModel: input.aiModel ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function addLead(input: LeadInput): Lead {
  const lead = createLead(input);
  saveLeads([lead, ...getLeads()]);
  return lead;
}

export function updateLead(id: string, input: LeadInput): Lead {
  const validation = validateLeadInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  const leads = getLeads();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) {
    throw new Error("Lead not found");
  }

  const website = input.website.trim();
  const updated: Lead = {
    ...leads[index],
    companyName: input.companyName.trim(),
    website,
    domain: getDomainFromUrl(website),
    country: input.country.trim(),
    customerType: input.customerType.trim(),
    productKeyword: input.productKeyword.trim(),
    sourceUrl: input.sourceUrl.trim(),
    sourceTitle: input.sourceTitle.trim(),
    sourceSnippet: input.sourceSnippet.trim(),
    sourceType: input.sourceType.trim() || "manual_public_web",
    evidenceText: input.evidenceText.trim(),
    email: normalizeOptional(input.email),
    phone: normalizeOptional(input.phone),
    linkedinUrl: normalizeOptional(input.linkedinUrl),
    address: normalizeOptional(input.address),
    matchLevel: input.matchLevel || "unknown",
    status: input.status || "new",
    notes: input.notes.trim(),
    fetchedAt: input.fetchedAt.trim(),
    searchRunId: input.searchRunId ?? null,
    aiAnalysis: input.aiAnalysis ?? leads[index].aiAnalysis ?? null,
    aiAnalyzedAt: input.aiAnalyzedAt ?? leads[index].aiAnalyzedAt ?? null,
    aiModel: input.aiModel ?? leads[index].aiModel ?? null,
    updatedAt: new Date().toISOString(),
  };

  leads[index] = updated;
  saveLeads(leads);
  return updated;
}

export function deleteLead(id: string): void {
  saveLeads(getLeads().filter((lead) => lead.id !== id));
}

export function replaceLeads(leads: Lead[]): void {
  saveLeads(leads);
}

export function updateLeadAiAnalysis(
  leadId: string,
  analysis: LeadAiAnalysis,
  model: string,
  analyzedAt: string,
): Lead {
  const leads = getLeads();
  const index = leads.findIndex((lead) => lead.id === leadId);
  if (index === -1) {
    throw new Error("Lead not found");
  }

  const updated: Lead = {
    ...leads[index],
    aiAnalysis: analysis,
    aiAnalyzedAt: analyzedAt,
    aiModel: model,
    updatedAt: new Date().toISOString(),
  };
  leads[index] = updated;
  saveLeads(leads);
  return updated;
}

export { STORAGE_KEY };
