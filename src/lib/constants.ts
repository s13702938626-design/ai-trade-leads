import type { LeadStatus, MatchLevel } from "@/types/lead";

export const INDUSTRY_DIRECTIONS = [
  "色母 masterbatch",
  "黑色母 black masterbatch",
  "白色母 white masterbatch",
  "改性塑料 plastic compound",
  "PLA 3D 打印耗材 PLA filament",
  "PETG 3D 打印耗材 PETG filament",
  "TPU 3D 打印耗材 TPU filament",
  "PP 餐盒 PP food container",
  "注塑工厂 injection molding factory",
  "塑料包装 plastic packaging manufacturer",
];

export const TARGET_COUNTRIES = [
  "United States",
  "Germany",
  "United Kingdom",
  "Canada",
  "Australia",
  "Mexico",
  "Brazil",
  "UAE",
  "Saudi Arabia",
  "India",
  "Vietnam",
  "Thailand",
  "Indonesia",
];

export const CUSTOMER_TYPES = [
  "importer",
  "distributor",
  "wholesaler",
  "manufacturer",
  "factory",
  "supplier",
  "plastic products manufacturer",
  "injection molding factory",
  "packaging manufacturer",
  "3D printer filament distributor",
];

export const MATCH_LEVELS: MatchLevel[] = ["unknown", "high", "medium", "low"];

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "researching",
  "qualified",
  "emailed",
  "replied",
  "invalid",
];

export const LEAD_SOURCE_TYPES = ["manual_public_web", "serper_google_search", "demand_signal_search"];
