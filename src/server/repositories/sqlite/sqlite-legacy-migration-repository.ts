/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { asc, desc, eq } from "drizzle-orm";
import { accounts, legacyMigrationItems, legacyMigrationRuns } from "../../db/schema";
import type { DatabaseConnection } from "../../db/connection";
import { parseJsonUnknown, stableJsonStringify } from "../../domain/normalization";
import { RepositoryConflictError, RepositoryError, RepositoryForeignKeyError, RepositoryNotFoundError, RepositoryValidationError } from "../../domain/repositories";

const toDate = (value) => value == null ? null : new Date(value);
const parseJson = (value) => { try { return parseJsonUnknown(value); } catch (cause) { throw new RepositoryError("Invalid migration JSON in database.", cause); } };
const mapRun = (row) => ({ id: row.id, exportId: row.exportId, formatVersion: row.formatVersion, sourceStorageKey: row.sourceStorageKey, sourceHash: row.sourceHash, sourceRunId: row.sourceRunId ?? null, status: row.status, totalCount: row.totalCount, validCount: row.validCount, warningCount: row.warningCount, invalidCount: row.invalidCount, createAccountCount: row.createAccountCount, linkAccountCount: row.linkAccountCount, manualReviewCount: row.manualReviewCount, skippedCount: row.skippedCount, importedCount: row.importedCount, failedCount: row.failedCount, report: parseJson(row.reportJson), errorMessage: row.errorMessage ?? null, createdAt: toDate(row.createdAt), updatedAt: toDate(row.updatedAt), importedAt: toDate(row.importedAt), rolledBackAt: toDate(row.rolledBackAt) });
const mapItem = (row) => ({ id: row.id, migrationRunId: row.migrationRunId, itemIndex: row.itemIndex, legacyLeadId: row.legacyLeadId ?? null, itemHash: row.itemHash, validationStatus: row.validationStatus, recommendedAction: row.recommendedAction, selectedAction: row.selectedAction ?? null, plannedAccountGroupKey: row.plannedAccountGroupKey ?? null, selectedAccountId: row.selectedAccountId ?? null, accountId: row.accountId ?? null, evidenceId: row.evidenceId ?? null, candidateAccountIds: parseJson(row.candidateAccountIdsJson), accountResult: row.accountResult, evidenceResult: row.evidenceResult, importStatus: row.importStatus, warnings: parseJson(row.warningsJson), errors: parseJson(row.errorsJson), originalPayload: parseJson(row.originalPayloadJson), createdAt: toDate(row.createdAt), updatedAt: toDate(row.updatedAt) });

export class SqliteLegacyMigrationRepository {
  constructor(private c: DatabaseConnection, private clock, private ids) {}

  async createPreflightRun(input) {
    const now = this.clock.now().getTime(); const id = this.ids.next();
    try {
      this.c.db.transaction(() => {
        this.c.db.insert(legacyMigrationRuns).values({ id, exportId: input.exportId, formatVersion: input.formatVersion, sourceStorageKey: input.sourceStorageKey, sourceHash: input.sourceHash, status: "preflighted", totalCount: input.totalCount, validCount: input.validCount, warningCount: input.warningCount, invalidCount: input.invalidCount, createAccountCount: input.createAccountCount, linkAccountCount: input.linkAccountCount, manualReviewCount: input.manualReviewCount, skippedCount: input.skippedCount, reportJson: stableJsonStringify(input.report), createdAt: now, updatedAt: now }).run();
        for (const value of input.items) this.c.db.insert(legacyMigrationItems).values({ id: this.ids.next(), migrationRunId: id, itemIndex: value.itemIndex, legacyLeadId: value.legacyLeadId ?? null, itemHash: value.itemHash, validationStatus: value.validationStatus, recommendedAction: value.recommendedAction, plannedAccountGroupKey: value.plannedAccountGroupKey ?? null, selectedAction: value.selectedAction ?? null, selectedAccountId: value.selectedAccountId ?? null, candidateAccountIdsJson: stableJsonStringify(value.candidateAccountIds), warningsJson: stableJsonStringify(value.warnings), errorsJson: stableJsonStringify(value.errors), originalPayloadJson: stableJsonStringify(value.originalPayload), importStatus: value.importStatus, createdAt: now, updatedAt: now }).run();
      });
    } catch (cause) { throw new RepositoryConflictError("duplicate_account_identifier", "Migration run already exists.", "legacy_migration", null, cause); }
    return (await this.getRunById(id))!;
  }
  async getRunById(id) { const row = this.c.db.select().from(legacyMigrationRuns).where(eq(legacyMigrationRuns.id, id)).get(); return row ? mapRun(row) : null; }
  async getRunByExportId(id) { const row = this.c.db.select().from(legacyMigrationRuns).where(eq(legacyMigrationRuns.exportId, id)).get(); return row ? mapRun(row) : null; }
  async getRunBySourceHash(hash) { const row = this.c.db.select().from(legacyMigrationRuns).where(eq(legacyMigrationRuns.sourceHash, hash)).get(); return row ? mapRun(row) : null; }
  async listRuns(options = {}) { return this.c.db.select().from(legacyMigrationRuns).orderBy(desc(legacyMigrationRuns.createdAt), desc(legacyMigrationRuns.id)).limit(Math.min(options.limit ?? 50, 100)).offset(options.offset ?? 0).all().map(mapRun); }
  async listItems(runId, options = {}) { return this.c.db.select().from(legacyMigrationItems).where(eq(legacyMigrationItems.migrationRunId, runId)).orderBy(asc(legacyMigrationItems.itemIndex), asc(legacyMigrationItems.id)).limit(Math.min(options.limit ?? 50, 100)).offset(options.offset ?? 0).all().map(mapItem); }
  async getItemById(id) { const row = this.c.db.select().from(legacyMigrationItems).where(eq(legacyMigrationItems.id, id)).get(); return row ? mapItem(row) : null; }

  async updateItemDecision(id, input) {
    const current = await this.getItemById(id);
    if (!current) throw new RepositoryNotFoundError("Migration item not found.");
    const action = input.selectedAction;
    if (!action) throw new RepositoryValidationError("A migration decision is required.");
    if ((current.validationStatus === "invalid" || current.recommendedAction === "duplicate_in_export") && action !== "skip") throw new RepositoryValidationError("This migration item can only be skipped.");
    if (action === "skip" && input.selectedAccountId) throw new RepositoryValidationError("Skip action cannot select an account.");
    if (action === "create_new" && input.selectedAccountId) throw new RepositoryValidationError("Create action cannot select an account.");
    if (action === "link_existing") {
      if (!input.selectedAccountId) throw new RepositoryValidationError("Link action requires an account.");
      const account = this.c.db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, input.selectedAccountId)).get();
      if (!account) throw new RepositoryForeignKeyError("Selected account does not exist.");
      if (!current.candidateAccountIds.includes(input.selectedAccountId) && !input.approvedManualAccountSelection) throw new RepositoryValidationError("Selected account is not a candidate and requires manual approval.");
    }
    this.c.db.update(legacyMigrationItems).set({ selectedAction: action, selectedAccountId: action === "link_existing" ? input.selectedAccountId : null, importStatus: action === "skip" ? "skipped" : "ready", updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationItems.id, id)).run();
    return (await this.getItemById(id))!;
  }
  async markRunImporting(id, sourceRunId) { this.c.db.update(legacyMigrationRuns).set({ status: "importing", sourceRunId, updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationRuns.id, id)).run(); return (await this.getRunById(id))!; }
  async markItemAccountResolved(id, input) { const current = await this.getItemById(id); if (!current) throw new RepositoryNotFoundError("Migration item not found."); if (current.accountId && current.accountId !== input.accountId) throw new RepositoryConflictError("duplicate_account_identifier", "Migration item is already linked to another account.", "legacy_migration_item"); this.c.db.update(legacyMigrationItems).set({ accountId: input.accountId, accountResult: input.accountResult, updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationItems.id, id)).run(); return (await this.getItemById(id))!; }
  async markItemImported(id, value) { this.c.db.update(legacyMigrationItems).set({ ...value, importStatus: "imported", updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationItems.id, id)).run(); return (await this.getItemById(id))!; }
  async markItemFailed(id, error) { this.c.db.update(legacyMigrationItems).set({ importStatus: "failed", errorsJson: stableJsonStringify([error.slice(0, 2000)]), updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationItems.id, id)).run(); return (await this.getItemById(id))!; }
  async markItemSkipped(id) { this.c.db.update(legacyMigrationItems).set({ importStatus: "skipped", selectedAction: "skip", updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationItems.id, id)).run(); return (await this.getItemById(id))!; }
  async completeRun(id, value) { this.c.db.update(legacyMigrationRuns).set({ ...value, reportJson: stableJsonStringify(value.report), importedAt: this.clock.now().getTime(), updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationRuns.id, id)).run(); return (await this.getRunById(id))!; }
  async markRunRolledBack(id) { this.c.db.update(legacyMigrationRuns).set({ status: "rolled_back", rolledBackAt: this.clock.now().getTime(), updatedAt: this.clock.now().getTime() }).where(eq(legacyMigrationRuns.id, id)).run(); return (await this.getRunById(id))!; }
}
