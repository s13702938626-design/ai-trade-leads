import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LEGACY_LEADS_STORAGE_KEY, sha256, stableExportCore, validateLegacyExport } from "../src/shared/legacy-migration";
import { parseLegacyExport } from "../src/server/application/legacy-migration/parse-export";
import { preflightLegacyLeads, preflightLegacyMigration } from "../src/server/application/legacy-migration/preflight";
import { createDatabaseConnection } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { findAccountMatchCandidates } from "../src/server/domain/services/account-match-service";
import { RepositoryConflictError, RepositoryForeignKeyError, RepositoryValidationError } from "../src/server/domain/repositories";
import { createSqliteRepositories } from "../src/server/repositories/sqlite/create-sqlite-repositories";

class FixedClock { now() { return new Date("2026-07-14T00:00:00.000Z"); } }
class TestIds { private count = 0; next() { this.count += 1; return `10000000-0000-4000-8000-${String(this.count).padStart(12, "0")}`; } }
const directory = mkdtempSync(join(tmpdir(), "ai-trade-leads-phase1c-"));
const file = join(directory, "test.db");
let connection: ReturnType<typeof createDatabaseConnection>;
let repositories: ReturnType<typeof createSqliteRepositories>;
const exportFile = (value: string, exportId = "export-1") => {
  const entries = [{ key: LEGACY_LEADS_STORAGE_KEY, rawValue: value, sha256: sha256(value) }];
  const core = { format: "ai-trade-leads-localstorage-backup" as const, formatVersion: 1 as const, exportId, exportedAt: "2026-07-14T00:00:00.000Z", sourceOrigin: "http://localhost", applicationVersion: "v0.6-localstorage" as const, entries };
  return { ...core, payloadSha256: sha256(stableExportCore(core)) };
};
const preflight = (payload: unknown, exportId?: string) => preflightLegacyMigration(exportFile(JSON.stringify(payload), exportId), { legacyMigrationRepository: repositories.legacyMigrations, accountRepository: repositories.accounts, clock: new FixedClock() });

test.before(() => { migrateDatabase(file); connection = createDatabaseConnection(file); repositories = createSqliteRepositories(connection, { clock: new FixedClock(), idGenerator: new TestIds() }); });
test.after(() => { assert.deepEqual(connection.sqlite.pragma("foreign_key_check"), []); connection.close(); rmSync(directory, { recursive: true, force: true }); });

test("Legacy export format and stable hashing", () => {
  const raw = '[{"companyName":"Exact raw  ","sourceUrl":"https://one.example"},null,7,"x"]';
  const backup = exportFile(raw);
  assert.equal(validateLegacyExport(backup).entries[0]?.rawValue, raw);
  assert.equal(parseLegacyExport(backup).leadsRawValue, raw);
  const { payloadSha256: _payloadHash, ...core } = backup;
  void _payloadHash;
  assert.equal(sha256(stableExportCore(core)), backup.payloadSha256);
});

test("Legacy export rejects invalid formats and hashes", () => {
  const backup = exportFile("[]");
  for (const bad of [
    { ...backup, format: "wrong" }, { ...backup, formatVersion: 2 }, { ...backup, exportId: "" }, { ...backup, exportedAt: "not-date" },
    { ...backup, entries: [{ ...backup.entries[0], sha256: "bad" }] }, { ...backup, payloadSha256: "bad" },
    { ...backup, entries: [] }, { ...backup, entries: [{ ...backup.entries[0], key: "outside:allowlist" }] },
  ]) assert.throws(() => validateLegacyExport(bad));
  assert.throws(() => parseLegacyExport(exportFile("{not-json}")));
  assert.throws(() => preflightLegacyLeads("{}"));
  assert.throws(() => parseLegacyExport({ ...backup, entries: [{ ...backup.entries[0], rawValue: null, sha256: null }], payloadSha256: sha256(stableExportCore({ ...backup, entries: [{ ...backup.entries[0], rawValue: null, sha256: null }] })) }));
});

test("Legacy lead validation preserves every original item", () => {
  const payload = [{ companyName: "Good", sourceUrl: "https://good.example" }, null, 2, "text", { companyName: "  " }];
  const staged = preflightLegacyLeads(JSON.stringify(payload));
  assert.equal(staged.length, payload.length);
  assert.deepEqual(staged.map((item) => item.index), [0, 1, 2, 3, 4]);
  assert.equal(staged[1]?.errors[0], "legacy_item_is_not_an_object");
  assert.equal(staged[4]?.recommendedAction, "skip_invalid");
});

test("Deferred fields and conservative field mapping", () => {
  const allDeferred = { companyName: "Deferred Ltd", country: "us", website: "http://", sourceUrl: "bad-url", fetchedAt: "not-date", sourceType: "unmapped", email: "e", phone: "p", linkedinUrl: "l", address: "a", productKeyword: "k", aiAnalysis: {}, aiAnalyzedAt: "x", aiModel: "m", status: "new", pipelineStatus: "p", lastContactedAt: "x", nextFollowUpAt: "x", followUpTasks: [], activities: [], outreachDrafts: [] };
  const [item] = preflightLegacyLeads(JSON.stringify([allDeferred]));
  assert.ok(item?.warnings.includes("invalid_website")); assert.ok(item?.warnings.includes("invalid_source_url")); assert.ok(item?.warnings.includes("invalid_fetched_at")); assert.ok(item?.warnings.includes("unknown_legacy_source_type"));
  assert.equal(item?.plannedAccountGroupKey, null);
  assert.deepEqual(item?.deferredFieldNames.sort(), ["activities", "address", "aiAnalysis", "aiAnalyzedAt", "aiModel", "email", "followUpTasks", "lastContactedAt", "linkedinUrl", "nextFollowUpAt", "outreachDrafts", "phone", "pipelineStatus", "productKeyword", "status"].sort());
  assert.equal(preflightLegacyLeads(JSON.stringify([{ companyName: "CN", country: "中国" }]))[0]?.warnings.includes("country_not_iso2"), true);
  assert.equal(preflightLegacyLeads(JSON.stringify([{ companyName: "RU", country: "Россия" }]))[0]?.warnings.includes("country_not_iso2"), true);
  assert.equal(preflightLegacyLeads(JSON.stringify([{ companyName: "US", country: "us" }]))[0]?.warnings.includes("country_not_iso2"), false);
});

test("Preflight writes staging only", async () => {
  const before = { accounts: (await repositories.accounts.list()).length, evidence: (await repositories.evidence.listUnresolved()).length, runs: (await repositories.sourceRuns.list()).length };
  const records = [{ companyName: "Staged", sourceUrl: "https://staged.example", email: "kept" }, null];
  const run = await preflight(records, "preflight-only"); const items = await repositories.legacyMigrations.listItems(run.id);
  assert.equal(items.length, records.length); assert.equal(items[1]?.itemIndex, 1); assert.equal(items[1]?.importStatus, "skipped");
  assert.equal(run.totalCount, run.report.total); assert.equal(run.report.deferredFieldCounts.email, 1);
  assert.deepEqual(items[0]?.originalPayload, records[0]);
  assert.equal((await repositories.accounts.list()).length, before.accounts); assert.equal((await repositories.evidence.listUnresolved()).length, before.evidence); assert.equal((await repositories.sourceRuns.list()).length, before.runs);
  assert.equal((await preflight(records, "preflight-only")).id, run.id);
  assert.equal((await preflight(records, "different-id-same-source")).id, run.id);
  assert.equal((await repositories.legacyMigrations.listItems(run.id)).length, records.length);
});

test("Account candidate recommendations", async () => {
  const domain = await repositories.accounts.create({ displayName: "Domain Match", websiteUrl: "https://domain-match.example", countryCode: "US" });
  const named = await repositories.accounts.create({ displayName: "Named Match", countryCode: "DE" });
  await repositories.accounts.addAlias({ accountId: named.id, aliasName: "Alias Match" });
  assert.equal((await findAccountMatchCandidates({ name: "Other", domain: "domain-match.example" }, repositories.accounts))[0]?.recommendation, "link_existing");
  assert.equal((await findAccountMatchCandidates({ name: "Named Match", countryCode: "DE" }, repositories.accounts))[0]?.recommendation, "manual_review");
  assert.equal((await findAccountMatchCandidates({ name: "Alias Match", countryCode: "GB" }, repositories.accounts))[0]?.recommendation, "manual_review");
  assert.equal((await findAccountMatchCandidates({ name: "Named Match" }, repositories.accounts))[0]?.recommendation, "manual_review");
  assert.equal((await preflight([{ companyName: "Other", website: "https://domain-match.example" }], "exact-domain")).report.linkAccount, 1);
  assert.equal((await repositories.accounts.getById(domain.id))?.mergeStatus, "active");
});

test("Batch grouping and duplicate-in-export handling", () => {
  const [first, second, nameOnlyA, nameOnlyB, duplicate] = preflightLegacyLeads(JSON.stringify([
    { companyName: "One", website: "https://same.example" }, { companyName: "Two", website: "https://same.example/path" },
    { companyName: "No domain" }, { companyName: "No domain" }, { companyName: "One", website: "https://same.example" },
  ]));
  assert.equal(first?.plannedAccountGroupKey, second?.plannedAccountGroupKey); assert.equal(first?.recommendedAction, "create_new"); assert.equal(second?.recommendedAction, "link_existing");
  assert.equal(nameOnlyA?.plannedAccountGroupKey, null); assert.equal(nameOnlyB?.plannedAccountGroupKey, null);
  assert.equal(duplicate?.recommendedAction, "duplicate_in_export"); assert.ok(duplicate?.warnings.includes("duplicate_item_in_export"));
});

test("LegacyMigration repository mapping and decision validation", async () => {
  const run = await preflight([{ companyName: "Decision", sourceUrl: "https://decision.example" }, null, { companyName: "Decision", sourceUrl: "https://decision.example" }], "decision-run");
  const all = await repositories.legacyMigrations.listRuns({ limit: 999 }); const items = await repositories.legacyMigrations.listItems(run.id, { limit: 999 });
  assert.ok(all[0]?.createdAt instanceof Date); assert.ok(Array.isArray(items[0]?.warnings)); assert.equal("warningsJson" in items[0]!, false); assert.deepEqual(items.map((item) => item.itemIndex), [0, 1, 2]);
  assert.equal((await repositories.legacyMigrations.getRunById(run.id))?.id, run.id); assert.equal((await repositories.legacyMigrations.getRunByExportId(run.exportId))?.id, run.id); assert.equal((await repositories.legacyMigrations.getRunBySourceHash(run.sourceHash))?.id, run.id); assert.equal((await repositories.legacyMigrations.getItemById(items[0]!.id))?.id, items[0]?.id);
  await assert.rejects(() => repositories.legacyMigrations.createPreflightRun({ exportId: run.exportId, formatVersion: 1, sourceStorageKey: run.sourceStorageKey, sourceHash: "other", totalCount: 0, validCount: 0, warningCount: 0, invalidCount: 0, createAccountCount: 0, linkAccountCount: 0, manualReviewCount: 0, skippedCount: 0, report: run.report, createdAt: new Date(), updatedAt: new Date(), items: [] }), RepositoryConflictError);
  await assert.rejects(() => repositories.legacyMigrations.createPreflightRun({ exportId: "new-export-with-same-source", formatVersion: 1, sourceStorageKey: run.sourceStorageKey, sourceHash: run.sourceHash, totalCount: 0, validCount: 0, warningCount: 0, invalidCount: 0, createAccountCount: 0, linkAccountCount: 0, manualReviewCount: 0, skippedCount: 0, report: run.report, createdAt: new Date(), updatedAt: new Date(), items: [] }), RepositoryConflictError);
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[1]!.id, { selectedAction: "create_new" }), RepositoryValidationError);
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[2]!.id, { selectedAction: "link_existing", selectedAccountId: "missing" }), RepositoryValidationError);
  const account = await repositories.accounts.create({ displayName: "Manual selection" });
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[0]!.id, { selectedAction: "link_existing" }), RepositoryValidationError);
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[0]!.id, { selectedAction: "create_new", selectedAccountId: account.id }), RepositoryValidationError);
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[0]!.id, { selectedAction: "skip", selectedAccountId: account.id }), RepositoryValidationError);
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[0]!.id, { selectedAction: "link_existing", selectedAccountId: account.id }), RepositoryValidationError);
  const decided = await repositories.legacyMigrations.updateItemDecision(items[0]!.id, { selectedAction: "link_existing", selectedAccountId: account.id, approvedManualAccountSelection: true });
  assert.equal(decided.importStatus, "ready");
  await assert.rejects(() => repositories.legacyMigrations.updateItemDecision(items[0]!.id, { selectedAction: "link_existing", selectedAccountId: "missing" }), RepositoryForeignKeyError);
  const skipped = await repositories.legacyMigrations.updateItemDecision(items[2]!.id, { selectedAction: "skip" }); assert.equal(skipped.importStatus, "skipped");
});
