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
  createdAt: string;
  updatedAt: string;
};

export type LeadInput = Omit<Lead, "id" | "domain" | "createdAt" | "updatedAt">;
