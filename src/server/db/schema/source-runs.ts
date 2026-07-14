import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sourceRuns = sqliteTable(
  "source_runs",
  {
    id: text("id").primaryKey(),
    adapterId: text("adapter_id").notNull(),
    sourceType: text("source_type").notNull(),
    status: text("status", {
      enum: ["running", "success", "partial", "failed"],
    }).notNull(),
    inputSummaryJson: text("input_summary_json").notNull().default("{}"),
    rawCount: integer("raw_count").notNull().default(0),
    acceptedCount: integer("accepted_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    unresolvedCount: integer("unresolved_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    startedAt: integer("started_at").notNull(),
    finishedAt: integer("finished_at"),
    errorMessage: text("error_message"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("source_runs_adapter_id_idx").on(table.adapterId),
    index("source_runs_source_type_idx").on(table.sourceType),
    index("source_runs_status_idx").on(table.status),
    index("source_runs_started_at_idx").on(table.startedAt),
    check(
      "source_runs_status_check",
      sql`${table.status} in ('running', 'success', 'partial', 'failed')`,
    ),
    check("source_runs_input_summary_json_check", sql`json_valid(${table.inputSummaryJson})`),
    check(
      "source_runs_counts_non_negative_check",
      sql`${table.rawCount} >= 0 and ${table.acceptedCount} >= 0 and ${table.duplicateCount} >= 0 and ${table.unresolvedCount} >= 0 and ${table.failedCount} >= 0`,
    ),
    check(
      "source_runs_finished_at_check",
      sql`${table.finishedAt} is null or ${table.finishedAt} >= ${table.startedAt}`,
    ),
    check(
      "source_runs_required_times_non_negative_check",
      sql`${table.startedAt} >= 0 and ${table.createdAt} >= 0 and ${table.updatedAt} >= 0`,
    ),
  ],
);
