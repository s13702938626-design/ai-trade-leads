export const LEGACY_LEADS_STORAGE_KEY = "ai-trade-leads:v0.1:leads";
export const LEGACY_AUXILIARY_STORAGE_KEYS = ["ai-trade-leads:v0.3.3:search-runs", "ai-trade-leads:v0.3.4:customs-leads"] as const;
export type LegacyLocalStorageExportV1 = { format: "ai-trade-leads-localstorage-backup"; formatVersion: 1; exportId: string; exportedAt: string; sourceOrigin: string; applicationVersion: "v0.6-localstorage"; entries: Array<{ key: string; rawValue: string | null; sha256: string | null }>; payloadSha256: string };
