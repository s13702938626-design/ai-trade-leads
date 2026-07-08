import type { SearchMode } from "@/lib/search-strategies";

export type CandidateReviewDecision =
  | "save"
  | "research_more"
  | "reject"
  | "unknown";

export type CandidateReview = {
  score: number;
  decision: CandidateReviewDecision;
  fitLevel: "high" | "medium" | "low" | "unknown";
  reasons: string[];
  risks: string[];
  matchedSignals: string[];
  missingInfo: string[];
  suggestedCustomerType: string;
  suggestedProductKeyword: string;
};

export type SerperSearchCandidate = {
  id: string;
  title: string;
  link: string;
  snippet: string;
  domain: string;
  position: number;
  sourceType: "serper_google_search";
  fetchedAt: string;
  searchRunId?: string | null;
  review?: CandidateReview;
};

export type SearchRunRecord = {
  id: string;
  query: string;
  mode: SearchMode | "custom";
  productKeyword: string;
  country: string;
  customerType: string;
  rawOrganicCount: number;
  candidateCount: number;
  filteredOutCount: number;
  reviewedSaveCount: number;
  reviewedResearchMoreCount: number;
  reviewedRejectCount: number;
  reviewedUnknownCount: number;
  savedLeadCount: number;
  fetchedAt: string;
};
