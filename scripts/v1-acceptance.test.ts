import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDatabaseConnection } from "../src/server/db/connection";
import { migrateDatabase } from "../src/server/db/migrate";
test("fresh v1 database contains all required local MVP tables", () => { const dir = mkdtempSync(join(tmpdir(), "v1-acceptance-")); const file = join(dir, "acceptance.db"); try { migrateDatabase(file); const connection = createDatabaseConnection(file); const names = new Set((connection.sqlite.prepare("select name from sqlite_master where type='table'").all() as Array<{ name: string }>).map((row) => row.name)); for (const table of ["accounts", "evidence", "source_runs", "legacy_migration_runs", "legacy_migration_items", "contacts", "signals", "opportunities", "opportunity_score_revisions", "activities", "follow_up_tasks", "outreach_drafts", "product_lines", "app_settings"]) assert.ok(names.has(table), `missing ${table}`); assert.deepEqual(connection.sqlite.pragma("foreign_key_check"), []); connection.close(); } finally { rmSync(dir, { recursive: true, force: true }); } });
