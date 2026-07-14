import { getDatabase, type DatabaseConnection } from "../../db/connection";
import { RandomUuidGenerator, SystemClock, type Clock, type IdGenerator } from "../../domain/entities/common";
import { SqliteAccountRepository } from "./sqlite-account-repository";
import { SqliteEvidenceRepository } from "./sqlite-evidence-repository";
import { SqliteSourceRunRepository } from "./sqlite-source-run-repository";
export function createSqliteRepositories(connection: DatabaseConnection, options: { clock?: Clock; idGenerator?: IdGenerator } = {}) { const clock = options.clock ?? new SystemClock(); const ids = options.idGenerator ?? new RandomUuidGenerator(); return { accounts: new SqliteAccountRepository(connection, clock, ids), evidence: new SqliteEvidenceRepository(connection, clock, ids), sourceRuns: new SqliteSourceRunRepository(connection, clock, ids) }; }
export function getRepositories() { return createSqliteRepositories(getDatabase()); }
