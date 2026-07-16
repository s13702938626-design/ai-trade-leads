import { sha256 } from "../../../shared/legacy-migration";
import { normalizeCountryCode, normalizeDomain, stableJsonStringify } from "../../domain/normalization";
import { findAccountMatchCandidates } from "../../domain/services/account-match-service";
import type { Clock } from "../../domain/entities/common";
import type { AccountRepository, LegacyMigrationPreflightItem, LegacyMigrationRepository } from "../../domain/repositories";
import { parseLegacyExport } from "./parse-export";
import { mapLegacySourceType } from "./source-type-mapping";
import type { LegacyLeadPreflight } from "./types";

const deferredKeys = ["email", "phone", "linkedinUrl", "address", "productKeyword", "aiAnalysis", "aiAnalyzedAt", "aiModel", "status", "pipelineStatus", "lastContactedAt", "nextFollowUpAt", "followUpTasks", "activities", "outreachDrafts"] as const;
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function inspection(payload: unknown, index: number, seen: Set<string>, groups: Set<string>): LegacyLeadPreflight {
  const itemHash = sha256(stableJsonStringify(payload));
  if (seen.has(itemHash)) return { index, itemHash, validationStatus: "warning", recommendedAction: "duplicate_in_export", warnings: ["duplicate_item_in_export"], errors: [], plannedAccountGroupKey: null, deferredFieldNames: [], payload };
  seen.add(itemHash);
  if (!isObject(payload)) return { index, itemHash, validationStatus: "invalid", recommendedAction: "skip_invalid", warnings: [], errors: ["legacy_item_is_not_an_object"], plannedAccountGroupKey: null, deferredFieldNames: [], payload };
  const companyName = typeof payload.companyName === "string" ? payload.companyName.trim() : "";
  const deferredFieldNames = deferredKeys.filter((key) => payload[key] !== undefined && payload[key] !== null && payload[key] !== "");
  if (!companyName) return { index, itemHash, validationStatus: "invalid", recommendedAction: "skip_invalid", warnings: [], errors: ["company_name_required"], plannedAccountGroupKey: null, deferredFieldNames, payload };
  const warnings: string[] = [];
  let domain: string | null = null;
  const website = typeof payload.website === "string" ? payload.website : typeof payload.domain === "string" ? payload.domain : null;
  if (website) { try { domain = normalizeDomain(website); } catch { warnings.push("invalid_website"); } }
  if (typeof payload.sourceUrl === "string" && payload.sourceUrl.trim()) { try { const url = new URL(payload.sourceUrl); if (url.protocol !== "http:" && url.protocol !== "https:") warnings.push("invalid_source_url"); } catch { warnings.push("invalid_source_url"); } }
  if (typeof payload.country === "string" && payload.country.trim()) { try { normalizeCountryCode(payload.country); } catch { warnings.push("country_not_iso2"); } }
  if (typeof payload.fetchedAt !== "string" || !payload.fetchedAt.trim()) warnings.push("missing_fetched_at");
  else if (Number.isNaN(Date.parse(payload.fetchedAt))) warnings.push("invalid_fetched_at");
  const source = mapLegacySourceType(payload.sourceType);
  if (source.warning) warnings.push(source.warning);
  const plannedAccountGroupKey = domain ? `domain:${domain}` : null;
  const repeatsDomain = plannedAccountGroupKey !== null && groups.has(plannedAccountGroupKey);
  if (plannedAccountGroupKey) groups.add(plannedAccountGroupKey);
  return { index, itemHash, validationStatus: warnings.length ? "warning" : "valid", recommendedAction: repeatsDomain ? "link_existing" : "create_new", warnings, errors: [], plannedAccountGroupKey, deferredFieldNames, payload };
}

export function preflightLegacyLeads(rawValue: string): LegacyLeadPreflight[] {
  let items: unknown;
  try { items = JSON.parse(rawValue); } catch { throw new Error("Legacy leads payload is not valid JSON."); }
  if (!Array.isArray(items)) throw new Error("Legacy leads payload must be an array.");
  const seen = new Set<string>(); const groups = new Set<string>();
  return items.map((payload, index) => inspection(payload, index, seen, groups));
}

export async function preflightLegacyMigration(input: unknown, dependencies: { legacyMigrationRepository: LegacyMigrationRepository; accountRepository: AccountRepository; clock: Clock }) {
  const { exportFile, leadsRawValue } = parseLegacyExport(input);
  const sourceHash = sha256(leadsRawValue);
  const existing = await dependencies.legacyMigrationRepository.getRunByExportId(exportFile.exportId) ?? await dependencies.legacyMigrationRepository.getRunBySourceHash(sourceHash);
  if (existing) return existing;
  const base = preflightLegacyLeads(leadsRawValue);
  const items = await Promise.all(base.map(async (entry) => {
    const payload = isObject(entry.payload) ? entry.payload : null;
    if (!payload || entry.validationStatus === "invalid" || entry.recommendedAction === "duplicate_in_export") return { ...entry, legacyLeadId: null, candidateAccountIds: [], selectedAction: "skip", importStatus: "skipped" };
    const country = (() => { try { return normalizeCountryCode(typeof payload.country === "string" ? payload.country : null); } catch { return null; } })();
    const domain = (() => { try { return normalizeDomain(typeof payload.website === "string" ? payload.website : typeof payload.domain === "string" ? payload.domain : null); } catch { return null; } })();
    const candidates = await findAccountMatchCandidates({ name: String(payload.companyName), countryCode: country, domain }, dependencies.accountRepository);
    const automaticCandidates = candidates.filter((candidate) => candidate.confidence === "high" && candidate.recommendation === "link_existing" && candidate.account.mergeStatus === "active" && candidate.account.deletedAt === null);
    const recommendedAction = automaticCandidates.length === 1 ? "link_existing" : candidates.length ? "manual_review" : entry.recommendedAction;
    return { ...entry, legacyLeadId: typeof payload.id === "string" ? payload.id : null, candidateAccountIds: candidates.map((candidate) => candidate.account.id), recommendedAction, selectedAction: recommendedAction === "create_new" ? "create_new" : null, importStatus: recommendedAction === "create_new" || recommendedAction === "link_existing" ? "ready" : "needs_review" };
  }));
  const deferredFieldCounts: Record<string, number> = {};
  for (const entry of items) for (const key of entry.deferredFieldNames) deferredFieldCounts[key] = (deferredFieldCounts[key] ?? 0) + 1;
  const report = { total: items.length, valid: items.filter((item) => item.validationStatus === "valid").length, warning: items.filter((item) => item.validationStatus === "warning").length, invalid: items.filter((item) => item.validationStatus === "invalid").length, createAccount: items.filter((item) => item.recommendedAction === "create_new").length, linkAccount: items.filter((item) => item.recommendedAction === "link_existing").length, manualReview: items.filter((item) => item.recommendedAction === "manual_review").length, skipped: items.filter((item) => item.importStatus === "skipped").length, duplicateInExport: items.filter((item) => item.recommendedAction === "duplicate_in_export").length, deferredFieldCounts, sourceStorageKey: "ai-trade-leads:v0.1:leads", formatVersion: exportFile.formatVersion };
  const preflightItems: LegacyMigrationPreflightItem[] = items.map((item) => ({ itemIndex: item.index, legacyLeadId: item.legacyLeadId, itemHash: item.itemHash, validationStatus: item.validationStatus, recommendedAction: item.recommendedAction, selectedAction: item.selectedAction as LegacyMigrationPreflightItem["selectedAction"], plannedAccountGroupKey: item.plannedAccountGroupKey, selectedAccountId: null, candidateAccountIds: item.candidateAccountIds, warnings: item.warnings, errors: item.errors, originalPayload: item.payload, importStatus: item.importStatus as LegacyMigrationPreflightItem["importStatus"] }));
  try { return await dependencies.legacyMigrationRepository.createPreflightRun({ exportId: exportFile.exportId, formatVersion: exportFile.formatVersion, sourceStorageKey: "ai-trade-leads:v0.1:leads", sourceHash, totalCount: report.total, validCount: report.valid, warningCount: report.warning, invalidCount: report.invalid, createAccountCount: report.createAccount, linkAccountCount: report.linkAccount, manualReviewCount: report.manualReview, skippedCount: report.skipped, report, createdAt: dependencies.clock.now(), updatedAt: dependencies.clock.now(), items: preflightItems }); }
  catch (error) { const found = await dependencies.legacyMigrationRepository.getRunByExportId(exportFile.exportId) ?? await dependencies.legacyMigrationRepository.getRunBySourceHash(sourceHash); if (found) return found; throw error; }
}
