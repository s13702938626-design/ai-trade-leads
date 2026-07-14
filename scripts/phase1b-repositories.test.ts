import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseConnection } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import { ValidationError } from "../src/server/domain/entities/common";
import { findAccountMatchCandidates } from "../src/server/domain/services/account-match-service";
import { buildEvidenceContentHash, canonicalizePublicUrl, normalizeCompanyName, normalizeCountryCode, normalizeDomain, normalizeIdentifierNamespace, stableJsonStringify } from "../src/server/domain/normalization";
import { RepositoryConflictError, RepositoryValidationError } from "../src/server/domain/repositories";
import { createSqliteRepositories } from "../src/server/repositories/sqlite/create-sqlite-repositories";

class FixedClock { constructor(private time = new Date("2026-01-02T03:04:05.000Z")) {} now() { return new Date(this.time); } }
class TestIds { private count = 0; next() { this.count += 1; return `00000000-0000-4000-8000-${String(this.count).padStart(12, "0")}`; } }
const directory = mkdtempSync(join(tmpdir(), "ai-trade-leads-phase1b-"));
const file = join(directory, "test.db");
let connection: ReturnType<typeof createDatabaseConnection>;
let repositories: ReturnType<typeof createSqliteRepositories>;

test.before(() => { migrateDatabase(file); connection = createDatabaseConnection(file); repositories = createSqliteRepositories(connection, { clock: new FixedClock(), idGenerator: new TestIds() }); });
test.after(() => { connection.close(); rmSync(directory, { recursive: true, force: true }); });

test("domain files remain infrastructure-free", () => {
  for (const fileName of ["src/server/domain/entities/account.ts", "src/server/domain/repositories/account-repository.ts"]) {
    const source = readFileSync(fileName, "utf8");
    assert.doesNotMatch(source, /drizzle|better-sqlite3|server\/db\/schema/);
  }
});
test("normalization is Unicode-safe and deterministic", () => {
  assert.equal(normalizeCompanyName(" ＡＢＣ，  Plastics  LLC "), "abc plastics llc");
  assert.equal(normalizeCompanyName("北京 塑料 有限公司"), "北京 塑料 有限公司");
  assert.equal(normalizeCompanyName("ООО Ромашка"), "ооо ромашка");
  assert.equal(normalizeCompanyName("ТОВ Приклад"), "тов приклад");
  assert.equal(normalizeCountryCode("us"), "US");
  assert.throws(() => normalizeCountryCode("United States"), ValidationError);
  assert.equal(normalizeDomain("http://sub.example.co.uk/path"), "example.co.uk");
  assert.equal(normalizeDomain("www.xn--bcher-kva.de"), "xn--bcher-kva.de");
  assert.equal(canonicalizePublicUrl("https://EXAMPLE.com:443/a/?b=2&utm_source=x&a=1#part"), "https://example.com/a?a=1&b=2");
  assert.equal(normalizeIdentifierNamespace(" China / USCC "), "china_uscc");
  assert.equal(stableJsonStringify({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
  const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic; assert.throws(() => stableJsonStringify(cyclic), ValidationError);
});
test("hash is stable and factual", () => {
  const base = { sourceType: "manual_url", sourceExternalId: null, canonicalUrl: "https://example.com", title: "T", rawText: null, excerpt: null, publishedAt: null, metadata: { z: 1, a: 2 } };
  assert.equal(buildEvidenceContentHash(base), buildEvidenceContentHash({ ...base, metadata: { a: 2, z: 1 } }));
  assert.notEqual(buildEvidenceContentHash(base), buildEvidenceContentHash({ ...base, title: "Changed" }));
});
test("SourceRun sanitizes stored summaries and supports finish/failure", async () => {
  const raw = { apiKey: "secret", nested: { token: "secret", visible: "ok" } };
  const run = await repositories.sourceRuns.create({ adapterId: "test", sourceType: "manual_url", inputSummary: raw });
  assert.deepEqual(raw, { apiKey: "secret", nested: { token: "secret", visible: "ok" } });
  assert.deepEqual(run.inputSummary, { apiKey: "[REDACTED]", nested: { token: "[REDACTED]", visible: "ok" } });
  const finished = await repositories.sourceRuns.finish(run.id, { resultCounts: { raw: 3, accepted: 2, duplicate: 1, unresolved: 0, failed: 0 } });
  assert.equal(finished.status, "success");
  assert.equal(finished.resultCounts.accepted, 2);
  const failed = await repositories.sourceRuns.markFailed(run.id, { errorMessage: "safe message\nstack hidden" });
  assert.equal(failed.errorMessage, "safe message");
});
test("Account repository normalizes, resolves aliases and identifiers", async () => {
  const account = await repositories.accounts.create({ displayName: "Example, Plastics LLC", websiteUrl: "https://www.example.co.uk/path", countryCode: "gb" });
  assert.ok(account.id); assert.ok(account.createdAt instanceof Date); assert.equal(account.normalizedDomain, "example.co.uk");
  const alias = await repositories.accounts.addAlias({ accountId: account.id, aliasName: "Example Plastics" });
  await assert.rejects(() => repositories.accounts.addAlias({ accountId: account.id, aliasName: "Example Plastics" }), RepositoryConflictError);
  await repositories.accounts.softDeleteAlias(alias.id); await repositories.accounts.addAlias({ accountId: account.id, aliasName: "Example Plastics" });
  const id = await repositories.accounts.addIdentifier({ accountId: account.id, identifierType: "platform_company_id", identifierNamespace: "kompass", identifierValue: " A-1 " });
  await repositories.accounts.addIdentifier({ accountId: account.id, identifierType: "platform_company_id", identifierNamespace: "alibaba", identifierValue: "A-1" });
  await assert.rejects(() => repositories.accounts.addIdentifier({ accountId: account.id, identifierType: "platform_company_id", identifierNamespace: "kompass", identifierValue: "A-1" }), RepositoryConflictError);
  await repositories.accounts.softDeleteIdentifier(id.id); await repositories.accounts.addIdentifier({ accountId: account.id, identifierType: "platform_company_id", identifierNamespace: "kompass", identifierValue: "A-1" });
  assert.equal((await repositories.accounts.findByNormalizedDomain("example.co.uk")).length, 1);
  assert.equal((await repositories.accounts.findByNormalizedAlias({ normalizedAlias: "Example Plastics" })).length, 1);
  assert.equal((await repositories.accounts.findByIdentifier({ identifierType: "platform_company_id", identifierNamespace: "alibaba", normalizedValue: "A-1", issuingCountryCode: null })).length, 1);
});
test("Evidence creates duplicates, stays immutable, and attaches safely", async () => {
  const run = await repositories.sourceRuns.create({ adapterId: "evidence", sourceType: "manual_url", inputSummary: {} });
  const created = await repositories.evidence.create({ sourceType: "manual_url", sourceExternalId: "source-1", sourceUrl: "https://example.net/path?utm_source=x&q=1", title: "Evidence", sourceRunId: run.id, metadata: { b: 2, a: 1 } });
  assert.equal(created.status, "created"); if (created.status !== "created") return;
  assert.ok(created.evidence.canonicalUrl?.includes("q=1")); assert.deepEqual(created.evidence.metadata, { a: 1, b: 2 });
  const duplicate = await repositories.evidence.create({ sourceType: "manual_url", sourceExternalId: "source-1", title: "Other", sourceRunId: run.id });
  assert.equal(duplicate.status, "duplicate");
  await assert.rejects(() => repositories.evidence.changeResolutionStatus(created.evidence.id, "verified"), RepositoryValidationError);
  const account = (await repositories.accounts.list())[0]!;
  const attached = await repositories.evidence.attachToAccount(created.evidence.id, account.id);
  assert.equal(attached.resolutionStatus, "matched");
  assert.equal((await repositories.evidence.listUnresolved()).some((item) => item.id === attached.id), false);
  await repositories.evidence.softDelete(attached.id);
  const duplicateAfterDelete = await repositories.evidence.create({ sourceType: "manual_url", sourceExternalId: "source-1", title: "Other", sourceRunId: run.id });
  assert.equal(duplicateAfterDelete.status, "duplicate");
});
test("Account matching is explanatory and never merges", async () => {
  const account = (await repositories.accounts.list())[0]!;
  const identifier = await repositories.accounts.addIdentifier({ accountId: account.id, identifierType: "official_registration_id", identifierNamespace: "manual", identifierValue: "REG-1" });
  const exact = await findAccountMatchCandidates({ name: account.displayName, identifier: { identifierType: identifier.identifierType, identifierNamespace: identifier.identifierNamespace, identifierValue: identifier.identifierValue, issuingCountryCode: identifier.issuingCountryCode } }, repositories.accounts);
  assert.equal(exact[0]?.confidence, "high"); assert.equal(exact[0]?.recommendation, "link_existing");
  const differentDomain = await findAccountMatchCandidates({ name: account.displayName, countryCode: account.countryCode, domain: "other.example" }, repositories.accounts);
  assert.equal(differentDomain[0]?.recommendation, "manual_review");
  assert.equal((await repositories.accounts.getById(account.id))?.mergeStatus, "active");
});
test("temporary database remains valid", () => { assert.deepEqual(connection.sqlite.pragma("foreign_key_check"), []); });
