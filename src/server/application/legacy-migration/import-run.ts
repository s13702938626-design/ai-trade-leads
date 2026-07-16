import type { Clock } from "../../domain/entities/common";
import type { Account } from "../../domain/entities/account";
import type { Evidence } from "../../domain/entities/evidence";
import type { LegacyMigrationItem } from "../../domain/entities/legacy-migration";
import type { LegacyMigrationRun } from "../../domain/entities/legacy-migration";
import type { AccountRepository, EvidenceRepository, LegacyMigrationRepository, SourceRunRepository } from "../../domain/repositories";
import { normalizeCountryCode, normalizeDomain } from "../../domain/normalization";

type Dependencies = { accounts: AccountRepository; evidence: EvidenceRepository; sourceRuns: SourceRunRepository; migrations: LegacyMigrationRepository; clock: Clock };
const activeImports = new Set<string>();
const asRecord = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const validWebsite = (value: unknown): string | null => { if (typeof value !== "string" || !value.trim()) return null; try { const protocol = new URL(value).protocol; return protocol === "http:" || protocol === "https:" ? value.trim() : null; } catch { return null; } };
const validCountry = (value: unknown): string | null => { try { return typeof value === "string" ? normalizeCountryCode(value) : null; } catch { return null; } };
const validDate = (value: unknown, fallback: Date): Date => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Date(value) : fallback;

async function resolveAccount(item: LegacyMigrationItem, groups: Map<string, Account>, dependencies: Dependencies): Promise<{ account: Account; result: "created" | "linked" | "retained" | "restored" }> {
  if (item.accountId) { let existing = await dependencies.accounts.getById(item.accountId, { includeDeleted: true }); if (!existing) throw new Error("Previously resolved account is missing."); if (existing.deletedAt) existing = await dependencies.accounts.restore(existing.id); return { account: existing, result: item.accountResult === "created" ? "restored" : "retained" }; }
  const grouped = item.plannedAccountGroupKey ? groups.get(item.plannedAccountGroupKey) : undefined;
  if (grouped) return { account: grouped, result: "retained" };
  if (item.selectedAction === "link_existing" && item.selectedAccountId) { const account = await dependencies.accounts.getById(item.selectedAccountId); if (!account) throw new Error("Selected account is not available."); return { account, result: "linked" }; }
  if (item.selectedAction !== "create_new") throw new Error("Migration item has no import decision.");
  const payload = asRecord(item.originalPayload); const name = typeof payload?.companyName === "string" ? payload.companyName.trim() : "";
  if (!name) throw new Error("Company name is required.");
  const account = await dependencies.accounts.create({ displayName: name, websiteUrl: validWebsite(payload?.website), normalizedDomain: (() => { try { return normalizeDomain(validWebsite(payload?.website)); } catch { return null; } })(), countryCode: validCountry(payload?.country), accountType: "unknown", dedupeConfidence: "low", dedupeReasons: ["legacy_localstorage_import"] });
  if (item.plannedAccountGroupKey) groups.set(item.plannedAccountGroupKey, account);
  return { account, result: "created" };
}

export async function importLegacyMigrationRun(runId: string, dependencies: Dependencies): Promise<LegacyMigrationRun> {
  if (activeImports.has(runId)) { const existing = await dependencies.migrations.getRunById(runId); if (existing) return existing; throw new Error("Migration run not found."); }
  activeImports.add(runId);
  try {
    const run = await dependencies.migrations.getRunById(runId); if (!run) throw new Error("Migration run not found.");
    if (run.status === "completed" || run.status === "partial") return run;
    const items = await dependencies.migrations.listItems(runId, { limit: 100 });
    if (items.some((item) => item.importStatus === "needs_review")) throw new Error("Resolve all manual-review migration items before import.");
    const sourceRun = run.sourceRunId ? await dependencies.sourceRuns.getById(run.sourceRunId) : await dependencies.sourceRuns.create({ adapterId: "legacy_localstorage_v0_1", sourceType: "manual_url", inputSummary: { exportId: run.exportId, sourceHash: run.sourceHash, totalItemCount: run.totalCount, formatVersion: run.formatVersion } });
    if (!sourceRun) throw new Error("Migration source run is unavailable.");
    await dependencies.migrations.markRunImporting(runId, sourceRun.id);
    const groups = new Map<string, Account>(); let imported = 0; let failed = 0; let duplicates = 0;
    for (const item of items) {
      if (item.importStatus === "skipped" || item.importStatus === "imported") continue;
      try {
        const resolved = await resolveAccount(item, groups, dependencies);
        const resolvedItem = await dependencies.migrations.markItemAccountResolved(item.id, { accountId: resolved.account.id, accountResult: resolved.result });
        const payload = asRecord(resolvedItem.originalPayload) ?? {};
        const restored = resolvedItem.evidenceId ? await dependencies.evidence.getById(resolvedItem.evidenceId, { includeDeleted: true }) : null;
        const evidenceResult = restored ? { status: "restored" as const, evidence: restored.deletedAt ? await dependencies.evidence.restore(restored.id) : restored } : await dependencies.evidence.create({ sourceType: "manual_url", sourceExternalId: resolvedItem.legacyLeadId ? `legacy:v0.1:lead:${resolvedItem.legacyLeadId}` : `legacy:v0.1:item:${resolvedItem.itemHash}`, sourceUrl: typeof payload.sourceUrl === "string" && /^https?:\/\//i.test(payload.sourceUrl) ? payload.sourceUrl : null, title: typeof payload.sourceTitle === "string" ? payload.sourceTitle : null, rawText: typeof payload.evidenceText === "string" ? payload.evidenceText : typeof payload.sourceSnippet === "string" ? payload.sourceSnippet : null, excerpt: typeof payload.sourceSnippet === "string" ? payload.sourceSnippet : null, observedAt: validDate(payload.fetchedAt, dependencies.clock.now()), fetchedAt: validDate(payload.fetchedAt, dependencies.clock.now()), metadata: { migrationRunId: runId, legacyItemHash: resolvedItem.itemHash }, legacyPayload: resolvedItem.originalPayload, sourceRunId: sourceRun.id });
        const linked: Evidence = evidenceResult.evidence.accountId === resolved.account.id ? evidenceResult.evidence : await dependencies.evidence.attachToAccount(evidenceResult.evidence.id, resolved.account.id);
        await dependencies.migrations.markItemImported(resolvedItem.id, { accountId: resolved.account.id, evidenceId: linked.id, accountResult: resolved.result, evidenceResult: evidenceResult.status === "created" ? "created" : evidenceResult.status === "restored" ? "restored" : "duplicate" });
        imported += 1; if (evidenceResult.status === "duplicate") duplicates += 1;
      } catch { failed += 1; await dependencies.migrations.markItemFailed(item.id, "Item import failed. Review the staged migration item before retrying."); }
    }
    const totalProcessed = imported + failed + items.filter((item) => item.importStatus === "skipped").length;
    const status = failed === 0 ? "completed" : imported > 0 ? "partial" : "failed";
    const report = { ...run.report, imported, failed, duplicateEvidence: duplicates, processed: totalProcessed };
    await dependencies.sourceRuns.finish(sourceRun.id, { status: failed ? "partial" : "success", resultCounts: { raw: items.length, accepted: imported - duplicates, duplicate: duplicates, unresolved: 0, failed } });
    return dependencies.migrations.completeRun(runId, { status, importedCount: imported, failedCount: failed, skippedCount: run.skippedCount, report: report as typeof run.report });
  } finally { activeImports.delete(runId); }
}
