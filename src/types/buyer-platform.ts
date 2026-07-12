import type { ProductLineId, SearchStrictness } from "@/types/search-intelligence";
import type { DemandFreshnessWindow } from "@/types/demand-intelligence";
import type { TargetMarketPresetId } from "@/lib/target-market-presets";

export type BuyerPlatformCategory =
  | "global_b2b_rfq"
  | "regional_b2b"
  | "marketplace_ecommerce"
  | "business_procurement"
  | "tender_procurement"
  | "forum_community"
  | "industry_directory"
  | "social_public"
  | "search_engine";

export type BuyerPlatformUseCase =
  | "submit_rfq"
  | "find_buying_leads"
  | "find_suppliers"
  | "compare_prices"
  | "find_distributors"
  | "find_tenders"
  | "ask_for_supplier_recommendation"
  | "market_validation"
  | "competitor_check";

export type BuyerPlatformFit =
  | "high"
  | "medium"
  | "low"
  | "not_recommended";

export type BuyerPlatformProfile = {
  id: string;
  name: string;
  category: BuyerPlatformCategory;
  domain: string;
  marketPresets: string[];
  countries: string[];
  languageHints: string[];
  productLineFit: {
    masterbatch: BuyerPlatformFit;
    filament: BuyerPlatformFit;
  };
  bestUseCases: BuyerPlatformUseCase[];
  resultMeaning: string;
  riskNotes: string[];
  requiresManualVerification: boolean;
  requiresLoginLikely: boolean;
  searchTemplates: {
    productLineId: "masterbatch" | "filament";
    label: string;
    queryTemplate: string;
    expectedResult: string;
    useCase: BuyerPlatformUseCase;
  }[];
};

export type BuyerPlatformMission = {
  id: string;
  platformId: string;
  platformName: string;
  platformCategory: BuyerPlatformCategory;
  useCase: BuyerPlatformUseCase;
  priority: "P0" | "P1" | "P2" | "P3";
  productLineId: ProductLineId;
  targetMarketPresetId: string;
  searchQuery: string;
  expectedResult: string;
  resultMeaning: string;
  manualVerificationRequired: boolean;
  requiresLoginLikely: boolean;
  whyThisPlatform: string;
  verificationSteps: string[];
  redFlags: string[];
  saveCriteria: string[];
  rejectCriteria: string[];
  tags: string[];
};

export type GenerateBuyerPlatformMissionsInput = {
  productLineId: ProductLineId;
  targetMarketPresetId: TargetMarketPresetId;
  platformCategory?: BuyerPlatformCategory | "all";
  useCase?: BuyerPlatformUseCase | "all";
  freshnessWindow: DemandFreshnessWindow;
  strictness: SearchStrictness;
  customProductKeyword?: string;
};
