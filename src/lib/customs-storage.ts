"use client";

import type { Lead, LeadInput } from "@/types/lead";
import type { CustomsLead } from "@/types/customs";
import { addLead } from "@/lib/lead-storage";

const CUSTOMS_STORAGE_KEY = "ai-trade-leads:v0.3.4:customs-leads";

function readCustomsLeads(): CustomsLead[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(CUSTOMS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomsLeads(leads: CustomsLead[]): void {
  window.localStorage.setItem(CUSTOMS_STORAGE_KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event("customs-leads:updated"));
}

export function listCustomsLeads(): CustomsLead[] {
  return readCustomsLeads();
}

export function addCustomsLeads(leads: CustomsLead[]): void {
  writeCustomsLeads([...leads, ...readCustomsLeads()]);
}

export function updateCustomsLead(id: string, patch: Partial<CustomsLead>): void {
  writeCustomsLeads(readCustomsLeads().map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
}

export function deleteCustomsLead(id: string): void {
  writeCustomsLeads(readCustomsLeads().filter((lead) => lead.id !== id));
}

export function clearCustomsLeads(): void {
  writeCustomsLeads([]);
}

export function convertCustomsLeadToLead(id: string, extraFields: LeadInput): Lead {
  const customsLead = readCustomsLeads().find((lead) => lead.id === id);
  if (!customsLead) {
    throw new Error("Customs lead not found");
  }

  if (!extraFields.sourceUrl.trim()) {
    throw new Error("sourceUrl 必填，必须来自海关来源或用户补充");
  }

  const lead = addLead({
    ...extraFields,
    sourceType: "customs_csv_import",
    email: "",
    phone: "",
    linkedinUrl: "",
  });

  updateCustomsLead(id, {
    status: "converted_to_lead",
    convertedLeadId: lead.id,
  });

  return lead;
}

export function getCustomsLeadStats() {
  const leads = readCustomsLeads();
  return {
    total: leads.length,
    highPriority: leads.filter((lead) => lead.priority === "P0" || lead.priority === "P1").length,
    converted: leads.filter((lead) => lead.status === "converted_to_lead").length,
  };
}

export { CUSTOMS_STORAGE_KEY };
