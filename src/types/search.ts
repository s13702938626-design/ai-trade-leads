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
  review?: CandidateReview;
};
