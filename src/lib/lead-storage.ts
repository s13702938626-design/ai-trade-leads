"use client";

import type {
  Lead,
  LeadActivity,
  LeadAiAnalysis,
  LeadContactChannel,
  LeadFollowUpTask,
  LeadInput,
  LeadPipelineStatus,
} from "@/types/lead";
import { getDomainFromUrl, isLead, normalizeOptional, validateLeadInput } from "@/lib/validators";

const STORAGE_KEY = "ai-trade-leads:v0.1:leads";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLead(lead: Lead): Lead {
  return {
    ...lead,
    pipelineStatus: lead.pipelineStatus ?? "new",
    lastContactedAt: lead.lastContactedAt ?? null,
    nextFollowUpAt: lead.nextFollowUpAt ?? null,
    followUpTasks: Array.isArray(lead.followUpTasks) ? lead.followUpTasks : [],
    activities: Array.isArray(lead.activities) ? lead.activities : [],
  };
}

function pendingNextFollowUp(tasks: LeadFollowUpTask[]): string | null {
  const pending = tasks
    .filter((task) => task.status === "pending")
    .map((task) => task.dueDate)
    .filter(Boolean)
    .sort();
  return pending[0] ?? null;
}

function createActivity(input: Omit<LeadActivity, "id" | "createdAt">): LeadActivity {
  return {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
}

function mutateLead(leadId: string, mutate: (lead: Lead) => Lead): Lead {
  const leads = getLeads();
  const index = leads.findIndex((lead) => lead.id === leadId);
  if (index === -1) {
    throw new Error("Lead not found");
  }

  const updated = {
    ...mutate(normalizeLead(leads[index])),
    updatedAt: new Date().toISOString(),
  };
  leads[index] = updated;
  saveLeads(leads);
  return updated;
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

    return parsed.filter(isLead).map(normalizeLead);
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
    pipelineStatus: input.pipelineStatus ?? "new",
    lastContactedAt: input.lastContactedAt ?? null,
    nextFollowUpAt: input.nextFollowUpAt ?? null,
    followUpTasks: input.followUpTasks ?? [],
    activities: input.activities ?? [],
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
    pipelineStatus: input.pipelineStatus ?? leads[index].pipelineStatus ?? "new",
    lastContactedAt: input.lastContactedAt ?? leads[index].lastContactedAt ?? null,
    nextFollowUpAt: input.nextFollowUpAt ?? leads[index].nextFollowUpAt ?? null,
    followUpTasks: input.followUpTasks ?? leads[index].followUpTasks ?? [],
    activities: input.activities ?? leads[index].activities ?? [],
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

export function addLeadActivity(leadId: string, activity: Omit<LeadActivity, "id" | "leadId" | "createdAt">): Lead {
  return mutateLead(leadId, (lead) => ({
    ...lead,
    activities: [
      createActivity({
        ...activity,
        leadId,
      }),
      ...(lead.activities ?? []),
    ],
  }));
}

export function updateLeadPipelineStatus(leadId: string, toStatus: LeadPipelineStatus, note = ""): Lead {
  return mutateLead(leadId, (lead) => {
    const fromStatus = lead.pipelineStatus ?? "new";
    return {
      ...lead,
      pipelineStatus: toStatus,
      activities: [
        createActivity({
          leadId,
          type: "status_change",
          title: `状态变更为 ${toStatus}`,
          note,
          fromStatus,
          toStatus,
        }),
        ...(lead.activities ?? []),
      ],
    };
  });
}

export function addFollowUpTask(
  leadId: string,
  task: Omit<LeadFollowUpTask, "id" | "leadId" | "status" | "createdAt" | "completedAt">,
): Lead {
  return mutateLead(leadId, (lead) => {
    const nextTask: LeadFollowUpTask = {
      ...task,
      id: createId(),
      leadId,
      status: "pending",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const tasks = [nextTask, ...(lead.followUpTasks ?? [])];
    return {
      ...lead,
      pipelineStatus: lead.pipelineStatus === "qualified" || lead.pipelineStatus === "rejected" ? lead.pipelineStatus : "follow_up",
      followUpTasks: tasks,
      nextFollowUpAt: pendingNextFollowUp(tasks),
      activities: [
        createActivity({
          leadId,
          type: "follow_up_scheduled",
          title: nextTask.title,
          note: nextTask.note,
          channel: nextTask.channel,
        }),
        ...(lead.activities ?? []),
      ],
    };
  });
}

export function completeFollowUpTask(leadId: string, taskId: string, note = ""): Lead {
  return mutateLead(leadId, (lead) => {
    const tasks = (lead.followUpTasks ?? []).map((task) =>
      task.id === taskId ? { ...task, status: "completed" as const, completedAt: new Date().toISOString() } : task,
    );
    return {
      ...lead,
      followUpTasks: tasks,
      nextFollowUpAt: pendingNextFollowUp(tasks),
      activities: [
        createActivity({
          leadId,
          type: "note_added",
          title: "完成跟进任务",
          note,
        }),
        ...(lead.activities ?? []),
      ],
    };
  });
}

export function cancelFollowUpTask(leadId: string, taskId: string, note = ""): Lead {
  return mutateLead(leadId, (lead) => {
    const tasks = (lead.followUpTasks ?? []).map((task) =>
      task.id === taskId ? { ...task, status: "cancelled" as const } : task,
    );
    return {
      ...lead,
      followUpTasks: tasks,
      nextFollowUpAt: pendingNextFollowUp(tasks),
      activities: [
        createActivity({
          leadId,
          type: "note_added",
          title: "取消跟进任务",
          note,
        }),
        ...(lead.activities ?? []),
      ],
    };
  });
}

export function recordContactAttempt(
  leadId: string,
  channel: LeadContactChannel,
  note: string,
  nextFollowUpDate?: string,
  nextFollowUpTitle?: string,
): Lead {
  const contactedAt = new Date().toISOString();
  const updated = mutateLead(leadId, (lead) => ({
    ...lead,
    pipelineStatus:
      lead.pipelineStatus === "new" || lead.pipelineStatus === "ready_to_contact"
        ? "contacted"
        : lead.pipelineStatus,
    lastContactedAt: contactedAt,
    activities: [
      createActivity({
        leadId,
        type: "contact_attempt",
        title: "记录一次联系",
        note,
        channel,
      }),
      ...(lead.activities ?? []),
    ],
  }));

  if (nextFollowUpDate) {
    return addFollowUpTask(leadId, {
      title: nextFollowUpTitle || "下一次跟进",
      dueDate: nextFollowUpDate,
      channel,
      note: "联系后安排的下一次跟进",
    });
  }

  return updated;
}

export function recordReplyReceived(leadId: string, note = ""): Lead {
  const lead = updateLeadPipelineStatus(leadId, "replied", note);
  return addLeadActivity(lead.id, { type: "reply_received", title: "客户已回复", note });
}

export function markLeadQualified(leadId: string, note = ""): Lead {
  const lead = updateLeadPipelineStatus(leadId, "qualified", note);
  return addLeadActivity(lead.id, { type: "qualified", title: "标记为合格客户", note });
}

export function markLeadRejected(leadId: string, note = ""): Lead {
  const lead = updateLeadPipelineStatus(leadId, "rejected", note);
  return addLeadActivity(lead.id, { type: "rejected", title: "放弃客户", note });
}

export function getFollowUpStats() {
  const leads = getLeads();
  const today = new Date().toISOString().slice(0, 10);
  const pendingTasks = leads.flatMap((lead) => lead.followUpTasks ?? []).filter((task) => task.status === "pending");
  return {
    totalLeads: leads.length,
    readyToContactCount: leads.filter((lead) => lead.pipelineStatus === "ready_to_contact").length,
    contactedCount: leads.filter((lead) => lead.pipelineStatus === "contacted").length,
    repliedCount: leads.filter((lead) => lead.pipelineStatus === "replied").length,
    qualifiedCount: leads.filter((lead) => lead.pipelineStatus === "qualified").length,
    rejectedCount: leads.filter((lead) => lead.pipelineStatus === "rejected").length,
    pendingFollowUpCount: pendingTasks.length,
    overdueFollowUpCount: pendingTasks.filter((task) => task.dueDate < today).length,
    todayFollowUpCount: pendingTasks.filter((task) => task.dueDate === today).length,
    followUpCount: leads.filter((lead) => lead.pipelineStatus === "follow_up").length,
  };
}

export { STORAGE_KEY };
