import { sql } from "drizzle-orm";
import {
  check,
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { evidence } from "./evidence";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    websiteUrl: text("website_url"),
    normalizedDomain: text("normalized_domain"),
    countryCode: text("country_code"),
    accountType: text("account_type", {
      enum: ["buyer", "manufacturer", "distributor", "importer", "peer_supplier", "tender_owner", "unknown"],
    }),
    mergeStatus: text("merge_status", {
      enum: ["active", "merge_candidate", "merged"],
    }).notNull().default("active"),
    mergedIntoAccountId: text("merged_into_account_id").references(
      (): AnySQLiteColumn => accounts.id,
    ),
    dedupeConfidence: text("dedupe_confidence", {
      enum: ["high", "medium", "low"],
    }).notNull().default("low"),
    dedupeReasonsJson: text("dedupe_reasons_json").notNull().default("[]"),
    excludedReason: text("excluded_reason"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  (table) => [
    index("accounts_normalized_domain_idx").on(table.normalizedDomain),
    index("accounts_country_normalized_name_idx").on(table.countryCode, table.normalizedName),
    index("accounts_merge_status_idx").on(table.mergeStatus),
    index("accounts_merged_into_account_id_idx").on(table.mergedIntoAccountId),
    index("accounts_deleted_at_idx").on(table.deletedAt),
    check(
      "accounts_account_type_check",
      sql`${table.accountType} is null or ${table.accountType} in ('buyer', 'manufacturer', 'distributor', 'importer', 'peer_supplier', 'tender_owner', 'unknown')`,
    ),
    check("accounts_merge_status_check", sql`${table.mergeStatus} in ('active', 'merge_candidate', 'merged')`),
    check("accounts_dedupe_confidence_check", sql`${table.dedupeConfidence} in ('high', 'medium', 'low')`),
    check(
      "accounts_merged_into_self_check",
      sql`${table.mergedIntoAccountId} is null or ${table.mergedIntoAccountId} <> ${table.id}`,
    ),
    check(
      "accounts_dedupe_reasons_json_check",
      sql`json_valid(${table.dedupeReasonsJson})`,
    ),
    check(
      "accounts_required_times_non_negative_check",
      sql`${table.createdAt} >= 0 and ${table.updatedAt} >= 0`,
    ),
  ],
);

export const accountAliases = sqliteTable(
  "account_aliases",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => accounts.id),
    aliasName: text("alias_name").notNull(),
    normalizedAlias: text("normalized_alias").notNull(),
    languageCode: text("language_code"),
    sourceEvidenceId: text("source_evidence_id").references(() => evidence.id),
    createdAt: integer("created_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  (table) => [
    index("account_aliases_account_id_idx").on(table.accountId),
    index("account_aliases_normalized_alias_idx").on(table.normalizedAlias),
    uniqueIndex("account_aliases_account_normalized_alias_active_unique")
      .on(table.accountId, table.normalizedAlias)
      .where(sql`${table.deletedAt} is null`),
    check("account_aliases_created_at_non_negative_check", sql`${table.createdAt} >= 0`),
  ],
);

export const accountIdentifiers = sqliteTable(
  "account_identifiers",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => accounts.id),
    identifierType: text("identifier_type", {
      enum: ["official_registration_id", "tax_id", "platform_company_id", "customs_importer_id", "other"],
    }).notNull(),
    identifierNamespace: text("identifier_namespace").notNull(),
    identifierValue: text("identifier_value").notNull(),
    normalizedValue: text("normalized_value").notNull(),
    // Empty string represents an unknown issuing country so SQLite UNIQUE remains deterministic.
    issuingCountryCode: text("issuing_country_code").notNull().default(""),
    sourceEvidenceId: text("source_evidence_id").references(() => evidence.id),
    createdAt: integer("created_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  (table) => [
    index("account_identifiers_account_id_idx").on(table.accountId),
    index("account_identifiers_type_namespace_normalized_value_idx").on(
      table.identifierType,
      table.identifierNamespace,
      table.normalizedValue,
    ),
    index("account_identifiers_issuing_country_code_idx").on(table.issuingCountryCode),
    uniqueIndex("account_identifiers_active_unique")
      .on(
        table.identifierType,
        table.identifierNamespace,
        table.normalizedValue,
        table.issuingCountryCode,
      )
      .where(sql`${table.deletedAt} is null`),
    check(
      "account_identifiers_type_check",
      sql`${table.identifierType} in ('official_registration_id', 'tax_id', 'platform_company_id', 'customs_importer_id', 'other')`,
    ),
    check(
      "account_identifiers_namespace_non_empty_check",
      sql`length(trim(${table.identifierNamespace})) > 0`,
    ),
    check("account_identifiers_created_at_non_negative_check", sql`${table.createdAt} >= 0`),
  ],
);
