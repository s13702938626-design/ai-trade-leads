import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { createDatabaseConnection } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
import {
  accountAliases,
  accountIdentifiers,
  accounts,
  evidence,
  sourceRuns,
} from "../src/server/db/schema";

function expectFailure(action: () => void, expectedMessage: string): void {
  try {
    action();
  } catch (error) {
    if (error instanceof Error && error.message.includes(expectedMessage)) {
      return;
    }

    throw error;
  }

  throw new Error(`Expected failure containing: ${expectedMessage}`);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "ai-trade-leads-phase1-"));
const databaseFile = join(temporaryDirectory, "smoke.db");
let connection: ReturnType<typeof createDatabaseConnection> | undefined;

try {
  migrateDatabase(databaseFile);
  connection = createDatabaseConnection(databaseFile);
  const { db, sqlite } = connection;
  const now = Date.now();
  const sourceRunId = randomUUID();
  const accountId = randomUUID();
  const evidenceId = randomUUID();

  db.insert(sourceRuns).values({
    id: sourceRunId,
    adapterId: "smoke_test",
    sourceType: "manual_url",
    status: "success",
    inputSummaryJson: '{"test":"temporary"}',
    startedAt: now,
    finishedAt: now,
    createdAt: now,
    updatedAt: now,
  }).run();

  db.insert(accounts).values({
    id: accountId,
    displayName: "Temporary technical account",
    normalizedName: "temporary technical account",
    normalizedDomain: "temporary.example.test",
    countryCode: "US",
    dedupeConfidence: "high",
    dedupeReasonsJson: '["temporary smoke test"]',
    createdAt: now,
    updatedAt: now,
  }).run();

  db.insert(evidence).values({
    id: evidenceId,
    sourceType: "manual_url",
    sourceExternalId: "smoke-source-1",
    sourceUrl: "https://example.test/source",
    canonicalUrl: "https://example.test/source",
    title: "Temporary smoke evidence",
    rawText: "Temporary technical smoke-test evidence.",
    excerpt: "Temporary technical evidence",
    observedAt: now,
    fetchedAt: now,
    contentHash: "smoke-content-hash-1",
    sourceRunId,
    accountId,
    resolutionStatus: "matched",
    metadataJson: '{"origin":"temporary"}',
    createdAt: now,
    updatedAt: now,
  }).run();

  db.insert(accountAliases).values({
    id: randomUUID(),
    accountId,
    aliasName: "Temporary account alias",
    normalizedAlias: "temporary account alias",
    sourceEvidenceId: evidenceId,
    createdAt: now,
  }).run();

  const identifierId = randomUUID();
  db.insert(accountIdentifiers).values({
    id: identifierId,
    accountId,
    identifierType: "other",
    identifierNamespace: "manual",
    identifierValue: "TEMP-IDENTIFIER",
    normalizedValue: "temp-identifier",
    issuingCountryCode: "",
    sourceEvidenceId: evidenceId,
    createdAt: now,
  }).run();

  const savedEvidence = db.select().from(evidence).where(eq(evidence.id, evidenceId)).get();
  if (!savedEvidence || savedEvidence.sourceRunId !== sourceRunId || savedEvidence.accountId !== accountId) {
    throw new Error("Evidence was not saved with its SourceRun and Account relationship.");
  }

  db.insert(accountIdentifiers).values({
    id: randomUUID(),
    accountId,
    identifierType: "other",
    identifierNamespace: "kompass",
    identifierValue: "TEMP-IDENTIFIER",
    normalizedValue: "temp-identifier",
    issuingCountryCode: "",
    createdAt: now,
  }).run();

  expectFailure(
    () => db.insert(accountIdentifiers).values({
      id: randomUUID(), accountId, identifierType: "other", identifierNamespace: "manual",
      identifierValue: "TEMP-IDENTIFIER", normalizedValue: "temp-identifier", issuingCountryCode: "", createdAt: now,
    }).run(),
    "UNIQUE constraint failed",
  );

  const aliasToSoftDeleteId = randomUUID();
  db.insert(accountAliases).values({
    id: aliasToSoftDeleteId, accountId, aliasName: "Temporary reusable alias",
    normalizedAlias: "temporary reusable alias", createdAt: now,
  }).run();
  expectFailure(
    () => db.insert(accountAliases).values({
      id: randomUUID(), accountId, aliasName: "Temporary reusable alias",
      normalizedAlias: "temporary reusable alias", createdAt: now,
    }).run(),
    "UNIQUE constraint failed",
  );
  db.update(accountAliases).set({ deletedAt: now + 1 }).where(eq(accountAliases.id, aliasToSoftDeleteId)).run();
  db.insert(accountAliases).values({
    id: randomUUID(), accountId, aliasName: "Temporary reusable alias",
    normalizedAlias: "temporary reusable alias", createdAt: now,
  }).run();

  db.update(accountIdentifiers).set({ deletedAt: now + 1 }).where(eq(accountIdentifiers.id, identifierId)).run();
  db.insert(accountIdentifiers).values({
    id: randomUUID(), accountId, identifierType: "other", identifierNamespace: "manual",
    identifierValue: "TEMP-IDENTIFIER", normalizedValue: "temp-identifier", issuingCountryCode: "", createdAt: now,
  }).run();

  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "manual_url", sourceExternalId: "smoke-source-1", observedAt: now,
      fetchedAt: now, contentHash: "smoke-content-hash-duplicate-external-id", sourceRunId, createdAt: now, updatedAt: now,
    }).run(),
    "UNIQUE constraint failed",
  );
  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "web_search", sourceExternalId: "smoke-source-2",
      canonicalUrl: "https://example.test/source", observedAt: now, fetchedAt: now,
      contentHash: "smoke-content-hash-1", sourceRunId, createdAt: now, updatedAt: now,
    }).run(),
    "UNIQUE constraint failed",
  );

  const nullableEvidenceId = randomUUID();
  db.insert(evidence).values({
    id: nullableEvidenceId, sourceType: "manual_url", sourceExternalId: "nullable-source",
    observedAt: now, fetchedAt: now, contentHash: "nullable-content-hash", sourceRunId,
    createdAt: now, updatedAt: now,
  }).run();
  expectFailure(
    () => db.update(evidence).set({ rawText: "Mutated text" }).where(eq(evidence.id, evidenceId)).run(),
    "immutable evidence fields cannot be updated",
  );
  expectFailure(
    () => db.update(evidence).set({ title: "New title" }).where(eq(evidence.id, nullableEvidenceId)).run(),
    "immutable evidence fields cannot be updated",
  );
  expectFailure(
    () => db.update(evidence).set({ publishedAt: now }).where(eq(evidence.id, nullableEvidenceId)).run(),
    "immutable evidence fields cannot be updated",
  );
  expectFailure(
    () => db.update(evidence).set({ sourceExternalId: null }).where(eq(evidence.id, nullableEvidenceId)).run(),
    "immutable evidence fields cannot be updated",
  );
  expectFailure(
    () => db.update(evidence).set({ metadataJson: '{"changed":true}' }).where(eq(evidence.id, evidenceId)).run(),
    "immutable evidence fields cannot be updated",
  );

  db.update(evidence).set({ accountId: null, resolutionStatus: "verified", updatedAt: now + 2 })
    .where(eq(evidence.id, evidenceId)).run();
  db.update(evidence).set({ deletedAt: now + 3, updatedAt: now + 3 })
    .where(eq(evidence.id, evidenceId)).run();
  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "manual_url", sourceExternalId: "smoke-source-1", observedAt: now,
      fetchedAt: now, contentHash: "soft-deleted-duplicate", sourceRunId, createdAt: now, updatedAt: now,
    }).run(),
    "UNIQUE constraint failed",
  );

  expectFailure(
    () => db.insert(sourceRuns).values({
      id: randomUUID(), adapterId: "smoke_test", sourceType: "manual_url", status: "invalid" as never,
      startedAt: now, createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "invalid" as never, sourceExternalId: "invalid-source-type",
      observedAt: now, fetchedAt: now, contentHash: "invalid-source-type", sourceRunId, createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "manual_url", sourceExternalId: "invalid-resolution",
      observedAt: now, fetchedAt: now, contentHash: "invalid-resolution", sourceRunId,
      resolutionStatus: "invalid" as never, createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(sourceRuns).values({
      id: randomUUID(), adapterId: "smoke_test", sourceType: "manual_url", status: "success",
      inputSummaryJson: "not json", startedAt: now, createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(accounts).values({
      id: randomUUID(), displayName: "Invalid JSON account", normalizedName: "invalid json account",
      dedupeReasonsJson: "not json", createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "manual_url", sourceExternalId: "invalid-metadata",
      observedAt: now, fetchedAt: now, contentHash: "invalid-metadata", sourceRunId,
      metadataJson: "not json", createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(evidence).values({
      id: randomUUID(), sourceType: "manual_url", sourceExternalId: "invalid-legacy",
      observedAt: now, fetchedAt: now, contentHash: "invalid-legacy", sourceRunId,
      legacyPayloadJson: "not json", createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(sourceRuns).values({
      id: randomUUID(), adapterId: "smoke_test", sourceType: "manual_url", status: "success",
      rawCount: -1, startedAt: now, createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(sourceRuns).values({
      id: randomUUID(), adapterId: "smoke_test", sourceType: "manual_url", status: "success",
      startedAt: now, finishedAt: now - 1, createdAt: now, updatedAt: now,
    }).run(),
    "CHECK constraint failed",
  );
  expectFailure(
    () => db.insert(accountAliases).values({
      id: randomUUID(), accountId, aliasName: "Invalid source evidence alias",
      normalizedAlias: "invalid source evidence alias", sourceEvidenceId: randomUUID(), createdAt: now,
    }).run(),
    "FOREIGN KEY constraint failed",
  );
  expectFailure(
    () => db.delete(sourceRuns).where(eq(sourceRuns.id, sourceRunId)).run(),
    "FOREIGN KEY constraint failed",
  );
  expectFailure(
    () => db.delete(accounts).where(eq(accounts.id, accountId)).run(),
    "FOREIGN KEY constraint failed",
  );

  const updatedEvidence = db.select().from(evidence).where(eq(evidence.id, evidenceId)).get();
  if (!updatedEvidence || updatedEvidence.accountId !== null || updatedEvidence.resolutionStatus !== "verified" || updatedEvidence.deletedAt !== now + 3) {
    throw new Error("Allowed Evidence fields could not be updated.");
  }
  if (sqlite.pragma("foreign_keys", { simple: true }) !== 1) {
    throw new Error("SQLite foreign_keys pragma is not enabled.");
  }
  if (sqlite.pragma("journal_mode", { simple: true }) !== "wal") {
    throw new Error("SQLite journal_mode is not WAL.");
  }
  if (sqlite.pragma("busy_timeout", { simple: true }) !== 5000) {
    throw new Error("SQLite busy_timeout is not 5000.");
  }
  if ((sqlite.pragma("foreign_key_check") as unknown[]).length !== 0) {
    throw new Error("SQLite foreign_key_check found violations.");
  }

  console.log("Phase 1A database integrity smoke test passed.");
} finally {
  connection?.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
