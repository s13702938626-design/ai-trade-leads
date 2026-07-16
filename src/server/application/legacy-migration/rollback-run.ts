import type { AccountRepository, EvidenceRepository, LegacyMigrationRepository } from "../../domain/repositories";

export async function rollbackLegacyMigrationRun(runId: string, dependencies: { accounts: AccountRepository; evidence: EvidenceRepository; migrations: LegacyMigrationRepository }) {
  const run = await dependencies.migrations.getRunById(runId); if (!run) throw new Error("Migration run not found.");
  if (run.status === "rolled_back") return run;
  const items = await dependencies.migrations.listItems(runId, { limit: 100 });
  for (const item of items) {
    if (item.importStatus !== "imported") continue;
    if (item.evidenceId && item.evidenceResult === "created") { const evidence = await dependencies.evidence.getById(item.evidenceId, { includeDeleted: true }); if (evidence && !evidence.deletedAt) await dependencies.evidence.softDelete(evidence.id); }
    if (item.accountId && (item.accountResult === "created" || item.accountResult === "restored")) { const activeEvidence = (await dependencies.evidence.list({ limit: 100 })).filter((evidence) => evidence.accountId === item.accountId && evidence.id !== item.evidenceId); const account = await dependencies.accounts.getById(item.accountId, { includeDeleted: true }); if (account && !account.deletedAt && activeEvidence.length === 0) await dependencies.accounts.softDelete(account.id); }
    await dependencies.migrations.markItemRolledBack(item.id);
  }
  return dependencies.migrations.markRunRolledBack(runId);
}
