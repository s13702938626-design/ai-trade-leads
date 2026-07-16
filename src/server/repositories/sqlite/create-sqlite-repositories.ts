import { getDatabase, type DatabaseConnection } from "../../db/connection";
import { RandomUuidGenerator, SystemClock, type Clock, type IdGenerator } from "../../domain/entities/common";
import { SqliteAccountRepository } from "./sqlite-account-repository";
import { SqliteEvidenceRepository } from "./sqlite-evidence-repository";
import { SqliteSourceRunRepository } from "./sqlite-source-run-repository";
import { SqliteLegacyMigrationRepository } from "./sqlite-legacy-migration-repository";
import { SqliteOpportunityRepository } from "./sqlite-opportunity-repository";
import { withAccountRestore, withEvidenceRestore } from "./restore-support";
import type { AccountRepository, EvidenceRepository, LegacyMigrationRepository, OpportunityRepository } from "../../domain/repositories";
export function createSqliteRepositories(connection: DatabaseConnection, options: { clock?: Clock; idGenerator?: IdGenerator } = {}) { const clock = options.clock ?? new SystemClock(); const ids = options.idGenerator ?? new RandomUuidGenerator(); return { accounts: withAccountRestore(new SqliteAccountRepository(connection, clock, ids), connection, clock) as AccountRepository, evidence: withEvidenceRestore(new SqliteEvidenceRepository(connection, clock, ids), connection, clock) as EvidenceRepository, sourceRuns: new SqliteSourceRunRepository(connection, clock, ids), legacyMigrations: new SqliteLegacyMigrationRepository(connection, clock, ids) as LegacyMigrationRepository, opportunities: new SqliteOpportunityRepository(connection, clock, ids) as OpportunityRepository }; }
export function getRepositories() { return createSqliteRepositories(getDatabase()); }
