export type CustomsLeadPriority = "P0" | "P1" | "P2" | "P3" | "unknown";

export type CustomsLeadStatus =
  | "imported"
  | "needs_source"
  | "reviewed"
  | "converted_to_lead"
  | "rejected";

export type CustomsLead = {
  id: string;
  importerName: string;
  country: string;
  productDescription: string;
  hsCode: string;
  shipmentDates: string[];
  lastImportDate: string | null;
  importFrequency: "monthly" | "quarterly" | "occasional" | "irregular" | "unknown";
  estimatedMonthlyVolume: number | null;
  quantityRaw: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: "customs_csv_import" | "manual_customs_entry";
  importedAt: string;
  reviewScore: number;
  priority: CustomsLeadPriority;
  reviewReasons: string[];
  risks: string[];
  missingInfo: string[];
  status: CustomsLeadStatus;
  convertedLeadId?: string | null;
};
