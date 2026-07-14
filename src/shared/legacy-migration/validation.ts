import {
  LEGACY_AUXILIARY_STORAGE_KEYS,
  LEGACY_LEADS_STORAGE_KEY,
  type LegacyLocalStorageExportV1,
} from "./export-format";
import { sha256, stableExportCore } from "./hash";

const allowedKeys = new Set<string>([LEGACY_LEADS_STORAGE_KEY, ...LEGACY_AUXILIARY_STORAGE_KEYS]);

export function validateLegacyExport(value: unknown): LegacyLocalStorageExportV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid legacy export.");
  }

  const item = value as LegacyLocalStorageExportV1;
  if (item.format !== "ai-trade-leads-localstorage-backup" || item.formatVersion !== 1 || !Array.isArray(item.entries)) {
    throw new Error("Unsupported legacy export format.");
  }
  if (typeof item.exportId !== "string" || !item.exportId.trim()) {
    throw new Error("Legacy exportId is required.");
  }
  if (typeof item.exportedAt !== "string" || Number.isNaN(Date.parse(item.exportedAt))) {
    throw new Error("Legacy exportedAt is invalid.");
  }

  let hasLeadsEntry = false;
  for (const entry of item.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.key !== "string" || !allowedKeys.has(entry.key)) {
      throw new Error("Legacy export contains an unsupported storage key.");
    }
    if (entry.key === LEGACY_LEADS_STORAGE_KEY) hasLeadsEntry = true;
    if (entry.rawValue !== null && typeof entry.rawValue !== "string") {
      throw new Error("Legacy export entry value is invalid.");
    }
    if (entry.sha256 !== (entry.rawValue === null ? null : sha256(entry.rawValue))) {
      throw new Error("Legacy export entry hash mismatch.");
    }
  }
  if (!hasLeadsEntry) throw new Error("Legacy leads entry is missing.");

  const core = {
    format: item.format,
    formatVersion: item.formatVersion,
    exportId: item.exportId,
    exportedAt: item.exportedAt,
    sourceOrigin: item.sourceOrigin,
    applicationVersion: item.applicationVersion,
    entries: item.entries,
  };
  if (typeof item.payloadSha256 !== "string" || item.payloadSha256 !== sha256(stableExportCore(core))) {
    throw new Error("Legacy export payload hash mismatch.");
  }
  return item;
}
