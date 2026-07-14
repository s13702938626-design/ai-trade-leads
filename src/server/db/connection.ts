import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type DatabaseConnection = {
  sqlite: BetterSqlite3.Database;
  db: BetterSQLite3Database<typeof schema>;
  close: () => void;
};

type GlobalDatabase = typeof globalThis & {
  __aiTradeLeadsDatabase?: DatabaseConnection;
  __aiTradeLeadsDatabaseFile?: string;
};

const defaultDatabaseFile = "./data/ai-trade-leads.db";

export function getDatabaseFile(): string {
  return process.env.DATABASE_FILE ?? defaultDatabaseFile;
}

export function createDatabaseConnection(databaseFile: string): DatabaseConnection {
  const resolvedDatabaseFile = resolve(databaseFile);
  mkdirSync(dirname(resolvedDatabaseFile), { recursive: true });

  const sqlite = new BetterSqlite3(resolvedDatabaseFile);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

export function getDatabase(): DatabaseConnection {
  const globalDatabase = globalThis as GlobalDatabase;
  const databaseFile = getDatabaseFile();

  if (
    !globalDatabase.__aiTradeLeadsDatabase ||
    globalDatabase.__aiTradeLeadsDatabaseFile !== databaseFile
  ) {
    globalDatabase.__aiTradeLeadsDatabase?.close();
    globalDatabase.__aiTradeLeadsDatabase = createDatabaseConnection(databaseFile);
    globalDatabase.__aiTradeLeadsDatabaseFile = databaseFile;
  }

  return globalDatabase.__aiTradeLeadsDatabase;
}
