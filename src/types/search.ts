import type { SearchMode } from "@/lib/search-strategies";
import type {
  BuyerPersonaId,
  CandidateBusinessRole,
  CandidateClassification,
  ProductLineId,
  SearchIntent,
} from "@/types/search-intelligence";
import type {
  DemandFreshnessWindow,
  DemandIntentType,
  DemandRecommendedAction,
  DemandSignalClassification,
  RfqIntelMission,
} from "@/types/demand-intelligence";
import type { BuyerPlatformMission } from "@/types/buyer-platform";

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
  businessRole?: CandidateBusinessRole;
  productLineId?: ProductLineId;
  buyerPersonaId?: BuyerPersonaId | "unknown";
  buyerFitScore?: number;
  peerRiskScore?: number;
  shouldHideByDefault?: boolean;
  matchedPositiveTerms?: string[];
  matchedNegativeTerms?: string[];
  rejectionReasons?: string[];
  classification?: CandidateClassification;
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
  productLineId?: ProductLineId;
  buyerPersonaId?: BuyerPersonaId | "unknown";
  searchIntent?: SearchIntent;
  searchPlanId?: string;
  classification?: CandidateClassification;
  businessRole?: CandidateBusinessRole;
  buyerFitScore?: number;
  peerRiskScore?: number;
  shouldHideByDefault?: boolean;
  demandClassification?: DemandSignalClassification;
  demandScore?: number;
  demandIntentType?: DemandIntentType;
  demandRecommendedAction?: DemandRecommendedAction;
  demandEvidenceTerms?: string[];
  demandFreshnessWindow?: DemandFreshnessWindow;
  demandSerperTbs?: string;
  rfqIntelMission?: RfqIntelMission;
  buyerPlatformMission?: BuyerPlatformMission;
};

export type SearchRunRecord = {
  id: string;
  query: string;
  mode: SearchMode | "buyer_search" | "custom";
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
  targetEndUserCount?: number;
  targetDistributorCount?: number;
  peerSupplierCount?: number;
  hiddenPeerCount?: number;
  averageBuyerFitScore?: number;
  highValueCandidateCount?: number;
  fetchedAt: string;
};
