import type { ProductLineId, SearchStrictness } from "@/types/search-intelligence";
import type { TargetMarketPresetId } from "@/lib/target-market-presets";
import type { BuyerPlatformCategory, BuyerPlatformUseCase } from "@/types/buyer-platform";

export type DemandIntentType =
  | "rfq"
  | "looking_for_supplier"
  | "procurement"
  | "tender"
  | "distributor_wanted"
  | "substitution"
  | "forum_request"
  | "all";

export type DemandSourceType =
  | "search_engine"
  | "b2b_platform"
  | "rfq_platform"
  | "tender_site"
  | "forum"
  | "social_public"
  | "company_page"
  | "directory"
  | "unknown";

export type DemandRecommendedAction =
  | "save_candidate"
  | "research_more"
  | "ignore"
  | "peer_supplier"
  | "directory_only";

export type DemandSignalStrength =
  | "strong"
  | "medium"
  | "broad";

export type DemandSourceChannel =
  | "general_web"
  | "b2b_rfq_platforms"
  | "trade_leads_platforms"
  | "tender_procurement"
  | "forums_communities"
  | "classifieds"
  | "social_public_posts"
  | "regional_local_sites"
  | "all_sources";

export type DemandFreshnessWindow =
  | "past_month"
  | "past_3_months"
  | "past_6_months"
  | "past_year"
  | "anytime";

export type DemandSearchPlan = {
  id: string;
  productLineId: ProductLineId;
  intentType: DemandIntentType;
  sourceType: DemandSourceType;
  sourceChannel: DemandSourceChannel;
  targetRegionPreset?: string;
  sourceDomains: string[];
  languageHints: string[];
  freshnessWindow: DemandFreshnessWindow;
  timeFilterLabel: string;
  serperTbs?: string;
  dateTerms: string[];
  strictness: SearchStrictness;
  signalStrength: DemandSignalStrength;
  estimatedRecall: "low" | "medium" | "high";
  estimatedPrecision: "high" | "medium" | "low";
  label: string;
  query: string;
  purpose: string;
  expectedSignal: string;
  risk: string;
  positiveTerms: string[];
  negativeTerms: string[];
};

export type DemandSignalClassification = {
  intentType: DemandIntentType;
  sourceType: DemandSourceType;
  sourceChannel?: DemandSourceChannel;
  targetMarketPreset?: string;
  languageHints?: string[];
  detectedDateText?: string | null;
  isLikelyRecent: boolean;
  isLikelyOutdated: boolean;
  ageWarning?: string | null;
  demandScore: number;
  freshnessScore: number;
  productFitScore: number;
  buyerFitScore: number;
  peerRiskScore: number;
  missionFitScore: number;
  verificationRequired: boolean;
  manualCheckReasons: string[];
  platformGateWarning: string | null;
  platformId?: string;
  platformCategory?: BuyerPlatformCategory;
  useCase?: BuyerPlatformUseCase;
  resultMeaning?: string;
  platformSignalType:
    | "rfq_or_buying_lead"
    | "tender_notice"
    | "marketplace_listing"
    | "distributor_channel"
    | "forum_discussion"
    | "supplier_directory"
    | "unknown";
  recommendedAction: DemandRecommendedAction;
  evidenceTerms: string[];
  missingInfo: string[];
  warnings: string[];
  classificationReasons: string[];
  shouldHideByDefault: boolean;
};

export type RfqIntelMissionType =
  | "fresh_rfq"
  | "platform_buying_leads"
  | "tender_procurement"
  | "forum_request"
  | "local_language_search"
  | "buyer_directory_entry"
  | "manual_platform_check";

export type RfqIntelMissionPriority =
  | "P0"
  | "P1"
  | "P2"
  | "P3";

export type RfqIntelMission = {
  id: string;
  missionType: RfqIntelMissionType;
  priority: RfqIntelMissionPriority;
  productLineId: ProductLineId;
  targetMarketPresetId: string;
  sourceChannel: DemandSourceChannel;
  title: string;
  searchQuery: string;
  searchUrlHint?: string;
  expectedResult: string;
  whyThisMatters: string;
  verificationSteps: string[];
  redFlags: string[];
  freshnessRequirement: string;
  saveCriteria: string[];
  rejectCriteria: string[];
  languageHints: string[];
  sourceDomains: string[];
};

export type RfqIntelMissionCheckResult =
  | "useful"
  | "no_valid_leads"
  | "needs_recheck"
  | "outdated";

export type RfqIntelMissionCheck = {
  id: string;
  missionId: string;
  missionTitle: string;
  missionPriority: RfqIntelMissionPriority;
  missionType: RfqIntelMissionType;
  productLineId: ProductLineId;
  targetMarketPresetId: TargetMarketPresetId;
  checkedAt: string;
  result: RfqIntelMissionCheckResult;
  note: string;
  usefulResultCount: number;
  savedLeadCount: number;
};
