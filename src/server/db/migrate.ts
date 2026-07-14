import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDatabaseConnection, getDatabaseFile } from "./connection";

const migrationsFolder = resolve(process.cwd(), "drizzle");

export function migrateDatabase(databaseFile = getDatabaseFile()): void {
  const connection = createDatabaseConnection(databaseFile);

  try {
    migrate(connection.db, { migrationsFolder });
  } finally {
    connection.close();
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  migrateDatabase();
}
