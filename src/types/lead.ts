import type { OutreachDraft } from "@/types/outreach";

export type MatchLevel = "high" | "medium" | "low" | "unknown";

export type LeadStatus =
  | "new"
  | "researching"
  | "qualified"
  | "emailed"
  | "replied"
  | "invalid";

export type LeadAiFitLevel = "high" | "medium" | "low" | "unknown";

export type LeadAiDecision =
  | "develop_now"
  | "research_more"
  | "hold"
  | "reject"
  | "unknown";

export type LeadAiAnalysis = {
  fitScore: number;
  fitLevel: LeadAiFitLevel;
  recommendedDecision: LeadAiDecision;
  customerReality: string;
  targetRelevance: string;
  summary: string;
  reasons: string[];
  possibleNeeds: string[];
  recommendedProducts: string[];
  openingAngle: string;
  risks: string[];
  missingInfo: string[];
  evidenceUsed: string[];
  nextAction: string;
  confidence: "high" | "medium" | "low";
};

export type LeadPipelineStatus =
  | "new"
  | "research_more"
  | "ready_to_contact"
  | "contacted"
  | "follow_up"
  | "replied"
  | "qualified"
  | "hold"
  | "rejected";

export type LeadContactChannel =
  | "email"
  | "linkedin"
  | "whatsapp"
  | "phone"
  | "website_form"
  | "other";

export type LeadActivityType =
  | "status_change"
  | "contact_attempt"
  | "reply_received"
  | "follow_up_scheduled"
  | "note_added"
  | "qualified"
  | "rejected";

export type LeadFollowUpTask = {
  id: string;
  leadId: string;
  title: string;
  dueDate: string;
  status: "pending" | "completed" | "cancelled";
  channel: LeadContactChannel;
  note: string;
  createdAt: string;
  completedAt?: string | null;
};

export type LeadActivity = {
  id: string;
  leadId: string;
  type: LeadActivityType;
  title: string;
  note: string;
  channel?: LeadContactChannel;
  fromStatus?: LeadPipelineStatus;
  toStatus?: LeadPipelineStatus;
  createdAt: string;
};

export type Lead = {
  id: string;
  companyName: string;
  website: string;
  domain: string;
  country: string;
  customerType: string;
  productKeyword: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceSnippet: string;
  sourceType: string;
  evidenceText: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  address: string | null;
  matchLevel: MatchLevel;
  status: LeadStatus;
  notes: string;
  fetchedAt: string;
  searchRunId?: string | null;
  aiAnalysis?: LeadAiAnalysis | null;
  aiAnalyzedAt?: string | null;
  aiModel?: string | null;
  pipelineStatus?: LeadPipelineStatus;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  followUpTasks?: LeadFollowUpTask[];
  activities?: LeadActivity[];
  outreachDrafts?: OutreachDraft[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type LeadInput = Omit<Lead, "id" | "domain" | "createdAt" | "updatedAt">;
