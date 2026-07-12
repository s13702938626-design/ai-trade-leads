export type ProductLineId = "masterbatch" | "filament" | "custom";

export type BuyerPersonaId =
  | "plastic_product_manufacturer"
  | "injection_molder"
  | "extrusion_factory"
  | "blow_molding_factory"
  | "packaging_manufacturer"
  | "pp_container_manufacturer"
  | "toy_manufacturer"
  | "pipe_manufacturer"
  | "cable_manufacturer"
  | "3d_printing_service"
  | "print_farm"
  | "rapid_prototyping_service"
  | "additive_manufacturing_service"
  | "model_making_studio"
  | "cosplay_prop_studio"
  | "makerspace"
  | "school_lab"
  | "distributor"
  | "trader"
  | "reseller"
  | "peer_supplier"
  | "directory_or_platform"
  | "unknown";

export type SearchIntent =
  | "end_user"
  | "distributor"
  | "service_bureau"
  | "trade_show"
  | "directory"
  | "procurement"
  | "customs"
  | "competitor_check";

export type CandidateBusinessRole =
  | "target_end_user"
  | "target_distributor"
  | "target_trader"
  | "peer_supplier"
  | "directory_or_platform"
  | "content_article"
  | "irrelevant"
  | "unknown";

export type SearchStrictness = "strict" | "balanced" | "broad";

export type SearchQueryPlan = {
  id: string;
  productLineId: ProductLineId;
  buyerPersonaId: BuyerPersonaId;
  intent: SearchIntent;
  strictness: SearchStrictness;
  label: string;
  query: string;
  purpose: string;
  expectedBuyer: string;
  forbiddenBuyer: string;
  positiveTerms: string[];
  negativeTerms: string[];
  shouldExcludePeerSuppliers: boolean;
};

export type CandidateClassification = {
  businessRole: CandidateBusinessRole;
  productLineId: ProductLineId;
  buyerPersonaId: BuyerPersonaId | "unknown";
  relevanceScore: number;
  buyerFitScore: number;
  peerRiskScore: number;
  shouldHideByDefault: boolean;
  classificationReasons: string[];
  rejectionReasons: string[];
  matchedPositiveTerms: string[];
  matchedNegativeTerms: string[];
};
