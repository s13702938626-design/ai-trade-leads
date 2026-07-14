CREATE TABLE `account_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`alias_name` text NOT NULL,
	`normalized_alias` text NOT NULL,
	`language_code` text,
	`source_evidence_id` text,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_evidence_id`) REFERENCES `evidence`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "account_aliases_created_at_non_negative_check" CHECK("account_aliases"."created_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `account_aliases_account_id_idx` ON `account_aliases` (`account_id`);--> statement-breakpoint
CREATE INDEX `account_aliases_normalized_alias_idx` ON `account_aliases` (`normalized_alias`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_aliases_account_normalized_alias_active_unique` ON `account_aliases` (`account_id`,`normalized_alias`) WHERE "account_aliases"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `account_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`identifier_type` text NOT NULL,
	`identifier_namespace` text NOT NULL,
	`identifier_value` text NOT NULL,
	`normalized_value` text NOT NULL,
	`issuing_country_code` text DEFAULT '' NOT NULL,
	`source_evidence_id` text,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_evidence_id`) REFERENCES `evidence`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "account_identifiers_type_check" CHECK("account_identifiers"."identifier_type" in ('official_registration_id', 'tax_id', 'platform_company_id', 'customs_importer_id', 'other')),
	CONSTRAINT "account_identifiers_namespace_non_empty_check" CHECK(length(trim("account_identifiers"."identifier_namespace")) > 0),
	CONSTRAINT "account_identifiers_created_at_non_negative_check" CHECK("account_identifiers"."created_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `account_identifiers_account_id_idx` ON `account_identifiers` (`account_id`);--> statement-breakpoint
CREATE INDEX `account_identifiers_type_namespace_normalized_value_idx` ON `account_identifiers` (`identifier_type`,`identifier_namespace`,`normalized_value`);--> statement-breakpoint
CREATE INDEX `account_identifiers_issuing_country_code_idx` ON `account_identifiers` (`issuing_country_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_identifiers_active_unique` ON `account_identifiers` (`identifier_type`,`identifier_namespace`,`normalized_value`,`issuing_country_code`) WHERE "account_identifiers"."deleted_at" is null;--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`website_url` text,
	`normalized_domain` text,
	`country_code` text,
	`account_type` text,
	`merge_status` text DEFAULT 'active' NOT NULL,
	`merged_into_account_id` text,
	`dedupe_confidence` text DEFAULT 'low' NOT NULL,
	`dedupe_reasons_json` text DEFAULT '[]' NOT NULL,
	`excluded_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`merged_into_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "accounts_account_type_check" CHECK("accounts"."account_type" is null or "accounts"."account_type" in ('buyer', 'manufacturer', 'distributor', 'importer', 'peer_supplier', 'tender_owner', 'unknown')),
	CONSTRAINT "accounts_merge_status_check" CHECK("accounts"."merge_status" in ('active', 'merge_candidate', 'merged')),
	CONSTRAINT "accounts_dedupe_confidence_check" CHECK("accounts"."dedupe_confidence" in ('high', 'medium', 'low')),
	CONSTRAINT "accounts_merged_into_self_check" CHECK("accounts"."merged_into_account_id" is null or "accounts"."merged_into_account_id" <> "accounts"."id"),
	CONSTRAINT "accounts_dedupe_reasons_json_check" CHECK(json_valid("accounts"."dedupe_reasons_json")),
	CONSTRAINT "accounts_required_times_non_negative_check" CHECK("accounts"."created_at" >= 0 and "accounts"."updated_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `accounts_normalized_domain_idx` ON `accounts` (`normalized_domain`);--> statement-breakpoint
CREATE INDEX `accounts_country_normalized_name_idx` ON `accounts` (`country_code`,`normalized_name`);--> statement-breakpoint
CREATE INDEX `accounts_merge_status_idx` ON `accounts` (`merge_status`);--> statement-breakpoint
CREATE INDEX `accounts_merged_into_account_id_idx` ON `accounts` (`merged_into_account_id`);--> statement-breakpoint
CREATE INDEX `accounts_deleted_at_idx` ON `accounts` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`source_external_id` text,
	`source_url` text,
	`canonical_url` text,
	`title` text,
	`raw_text` text,
	`excerpt` text,
	`published_at` integer,
	`observed_at` integer NOT NULL,
	`fetched_at` integer NOT NULL,
	`content_hash` text NOT NULL,
	`source_run_id` text NOT NULL,
	`account_id` text,
	`resolution_status` text DEFAULT 'unresolved' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`legacy_payload_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`source_run_id`) REFERENCES `source_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "evidence_source_type_check" CHECK("evidence"."source_type" in ('web_search', 'customs_csv', 'tender', 'rfq_platform', 'marketplace', 'company_website', 'news', 'forum', 'manual_url')),
	CONSTRAINT "evidence_resolution_status_check" CHECK("evidence"."resolution_status" in ('unresolved', 'matched', 'verified', 'rejected')),
	CONSTRAINT "evidence_metadata_json_check" CHECK(json_valid("evidence"."metadata_json")),
	CONSTRAINT "evidence_legacy_payload_json_check" CHECK("evidence"."legacy_payload_json" is null or json_valid("evidence"."legacy_payload_json")),
	CONSTRAINT "evidence_required_times_non_negative_check" CHECK("evidence"."observed_at" >= 0 and "evidence"."fetched_at" >= 0 and "evidence"."created_at" >= 0 and "evidence"."updated_at" >= 0),
	CONSTRAINT "evidence_optional_times_non_negative_check" CHECK(("evidence"."published_at" is null or "evidence"."published_at" >= 0) and ("evidence"."deleted_at" is null or "evidence"."deleted_at" >= 0))
);
--> statement-breakpoint
CREATE INDEX `evidence_source_run_id_idx` ON `evidence` (`source_run_id`);--> statement-breakpoint
CREATE INDEX `evidence_account_id_idx` ON `evidence` (`account_id`);--> statement-breakpoint
CREATE INDEX `evidence_source_type_idx` ON `evidence` (`source_type`);--> statement-breakpoint
CREATE INDEX `evidence_resolution_status_idx` ON `evidence` (`resolution_status`);--> statement-breakpoint
CREATE INDEX `evidence_published_at_idx` ON `evidence` (`published_at`);--> statement-breakpoint
CREATE INDEX `evidence_fetched_at_idx` ON `evidence` (`fetched_at`);--> statement-breakpoint
CREATE INDEX `evidence_deleted_at_idx` ON `evidence` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `evidence_canonical_url_idx` ON `evidence` (`canonical_url`);--> statement-breakpoint
CREATE INDEX `evidence_content_hash_idx` ON `evidence` (`content_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_source_external_id_unique` ON `evidence` (`source_type`,`source_external_id`) WHERE "evidence"."source_external_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_canonical_url_content_hash_unique` ON `evidence` (`canonical_url`,`content_hash`) WHERE "evidence"."canonical_url" is not null;--> statement-breakpoint
CREATE TABLE `source_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`adapter_id` text NOT NULL,
	`source_type` text NOT NULL,
	`status` text NOT NULL,
	`input_summary_json` text DEFAULT '{}' NOT NULL,
	`raw_count` integer DEFAULT 0 NOT NULL,
	`accepted_count` integer DEFAULT 0 NOT NULL,
	`duplicate_count` integer DEFAULT 0 NOT NULL,
	`unresolved_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "source_runs_status_check" CHECK("source_runs"."status" in ('running', 'success', 'partial', 'failed')),
	CONSTRAINT "source_runs_input_summary_json_check" CHECK(json_valid("source_runs"."input_summary_json")),
	CONSTRAINT "source_runs_counts_non_negative_check" CHECK("source_runs"."raw_count" >= 0 and "source_runs"."accepted_count" >= 0 and "source_runs"."duplicate_count" >= 0 and "source_runs"."unresolved_count" >= 0 and "source_runs"."failed_count" >= 0),
	CONSTRAINT "source_runs_finished_at_check" CHECK("source_runs"."finished_at" is null or "source_runs"."finished_at" >= "source_runs"."started_at"),
	CONSTRAINT "source_runs_required_times_non_negative_check" CHECK("source_runs"."started_at" >= 0 and "source_runs"."created_at" >= 0 and "source_runs"."updated_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `source_runs_adapter_id_idx` ON `source_runs` (`adapter_id`);--> statement-breakpoint
CREATE INDEX `source_runs_source_type_idx` ON `source_runs` (`source_type`);--> statement-breakpoint
CREATE INDEX `source_runs_status_idx` ON `source_runs` (`status`);--> statement-breakpoint
CREATE INDEX `source_runs_started_at_idx` ON `source_runs` (`started_at`);--> statement-breakpoint
CREATE TRIGGER `evidence_immutable_fields_before_update`
BEFORE UPDATE ON `evidence`
FOR EACH ROW
WHEN
  OLD.source_type IS NOT NEW.source_type OR
  OLD.source_external_id IS NOT NEW.source_external_id OR
  OLD.source_url IS NOT NEW.source_url OR
  OLD.canonical_url IS NOT NEW.canonical_url OR
  OLD.title IS NOT NEW.title OR
  OLD.raw_text IS NOT NEW.raw_text OR
  OLD.excerpt IS NOT NEW.excerpt OR
  OLD.published_at IS NOT NEW.published_at OR
  OLD.observed_at IS NOT NEW.observed_at OR
  OLD.fetched_at IS NOT NEW.fetched_at OR
  OLD.content_hash IS NOT NEW.content_hash OR
  OLD.source_run_id IS NOT NEW.source_run_id OR
  OLD.metadata_json IS NOT NEW.metadata_json OR
  OLD.legacy_payload_json IS NOT NEW.legacy_payload_json
BEGIN
  SELECT RAISE(ABORT, 'immutable evidence fields cannot be updated');
END;
