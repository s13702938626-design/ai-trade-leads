import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { accounts } from "./accounts";
import { sourceRuns } from "./source-runs";

export const evidence = sqliteTable(
  "evidence",
  {
    id: text("id").primaryKey(),
    sourceType: text("source_type", {
      enum: [
        "web_search",
        "customs_csv",
        "tender",
        "rfq_platform",
        "marketplace",
        "company_website",
        "news",
        "forum",
        "manual_url",
      ],
    }).notNull(),
    sourceExternalId: text("source_external_id"),
    sourceUrl: text("source_url"),
    canonicalUrl: text("canonical_url"),
    title: text("title"),
    rawText: text("raw_text"),
    excerpt: text("excerpt"),
    publishedAt: integer("published_at"),
    observedAt: integer("observed_at").notNull(),
    fetchedAt: integer("fetched_at").notNull(),
    contentHash: text("content_hash").notNull(),
    sourceRunId: text("source_run_id").notNull().references(() => sourceRuns.id),
    accountId: text("account_id").references(() => accounts.id),
    resolutionStatus: text("resolution_status", {
      enum: ["unresolved", "matched", "verified", "rejected"],
    }).notNull().default("unresolved"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    legacyPayloadJson: text("legacy_payload_json"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  (table) => [
    index("evidence_source_run_id_idx").on(table.sourceRunId),
    index("evidence_account_id_idx").on(table.accountId),
    index("evidence_source_type_idx").on(table.sourceType),
    index("evidence_resolution_status_idx").on(table.resolutionStatus),
    index("evidence_published_at_idx").on(table.publishedAt),
    index("evidence_fetched_at_idx").on(table.fetchedAt),
    index("evidence_deleted_at_idx").on(table.deletedAt),
    index("evidence_canonical_url_idx").on(table.canonicalUrl),
    index("evidence_content_hash_idx").on(table.contentHash),
    uniqueIndex("evidence_source_external_id_unique")
      .on(table.sourceType, table.sourceExternalId)
      .where(sql`${table.sourceExternalId} is not null`),
    uniqueIndex("evidence_canonical_url_content_hash_unique")
      .on(table.canonicalUrl, table.contentHash)
      .where(sql`${table.canonicalUrl} is not null`),
    check(
      "evidence_source_type_check",
      sql`${table.sourceType} in ('web_search', 'customs_csv', 'tender', 'rfq_platform', 'marketplace', 'company_website', 'news', 'forum', 'manual_url')`,
    ),
    check(
      "evidence_resolution_status_check",
      sql`${table.resolutionStatus} in ('unresolved', 'matched', 'verified', 'rejected')`,
    ),
    check("evidence_metadata_json_check", sql`json_valid(${table.metadataJson})`),
    check(
      "evidence_legacy_payload_json_check",
      sql`${table.legacyPayloadJson} is null or json_valid(${table.legacyPayloadJson})`,
    ),
    check(
      "evidence_required_times_non_negative_check",
      sql`${table.observedAt} >= 0 and ${table.fetchedAt} >= 0 and ${table.createdAt} >= 0 and ${table.updatedAt} >= 0`,
    ),
    check(
      "evidence_optional_times_non_negative_check",
      sql`(${table.publishedAt} is null or ${table.publishedAt} >= 0) and (${table.deletedAt} is null or ${table.deletedAt} >= 0)`,
    ),
  ],
);
