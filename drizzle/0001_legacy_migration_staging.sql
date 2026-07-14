CREATE TABLE `legacy_migration_items` (
	`id` text PRIMARY KEY NOT NULL,
	`migration_run_id` text NOT NULL,
	`item_index` integer NOT NULL,
	`legacy_lead_id` text,
	`item_hash` text NOT NULL,
	`validation_status` text NOT NULL,
	`recommended_action` text NOT NULL,
	`selected_action` text,
	`planned_account_group_key` text,
	`selected_account_id` text,
	`account_id` text,
	`evidence_id` text,
	`candidate_account_ids_json` text DEFAULT '[]' NOT NULL,
	`account_result` text DEFAULT 'none' NOT NULL,
	`evidence_result` text DEFAULT 'none' NOT NULL,
	`import_status` text DEFAULT 'pending' NOT NULL,
	`warnings_json` text DEFAULT '[]' NOT NULL,
	`errors_json` text DEFAULT '[]' NOT NULL,
	`original_payload_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`migration_run_id`) REFERENCES `legacy_migration_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`selected_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evidence_id`) REFERENCES `evidence`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "legacy_items_validation_check" CHECK("legacy_migration_items"."validation_status" in ('valid','warning','invalid')),
	CONSTRAINT "legacy_items_recommended_check" CHECK("legacy_migration_items"."recommended_action" in ('create_new','link_existing','manual_review','skip_invalid','duplicate_in_export')),
	CONSTRAINT "legacy_items_selected_check" CHECK("legacy_migration_items"."selected_action" is null or "legacy_migration_items"."selected_action" in ('create_new','link_existing','skip')),
	CONSTRAINT "legacy_items_account_result_check" CHECK("legacy_migration_items"."account_result" in ('none','created','linked','retained','restored')),
	CONSTRAINT "legacy_items_evidence_result_check" CHECK("legacy_migration_items"."evidence_result" in ('none','created','duplicate','restored')),
	CONSTRAINT "legacy_items_import_status_check" CHECK("legacy_migration_items"."import_status" in ('pending','ready','needs_review','skipped','imported','failed','rolled_back')),
	CONSTRAINT "legacy_items_json_check" CHECK(json_valid("legacy_migration_items"."candidate_account_ids_json") and json_valid("legacy_migration_items"."warnings_json") and json_valid("legacy_migration_items"."errors_json") and json_valid("legacy_migration_items"."original_payload_json")),
	CONSTRAINT "legacy_items_times_check" CHECK("legacy_migration_items"."item_index" >= 0 and "legacy_migration_items"."created_at" >= 0 and "legacy_migration_items"."updated_at" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_items_run_index_unique` ON `legacy_migration_items` (`migration_run_id`,`item_index`);--> statement-breakpoint
CREATE INDEX `legacy_items_run_idx` ON `legacy_migration_items` (`migration_run_id`);--> statement-breakpoint
CREATE INDEX `legacy_items_lead_idx` ON `legacy_migration_items` (`legacy_lead_id`);--> statement-breakpoint
CREATE INDEX `legacy_items_hash_idx` ON `legacy_migration_items` (`item_hash`);--> statement-breakpoint
CREATE INDEX `legacy_items_validation_idx` ON `legacy_migration_items` (`validation_status`);--> statement-breakpoint
CREATE INDEX `legacy_items_recommended_idx` ON `legacy_migration_items` (`recommended_action`);--> statement-breakpoint
CREATE INDEX `legacy_items_selected_idx` ON `legacy_migration_items` (`selected_action`);--> statement-breakpoint
CREATE INDEX `legacy_items_status_idx` ON `legacy_migration_items` (`import_status`);--> statement-breakpoint
CREATE INDEX `legacy_items_account_idx` ON `legacy_migration_items` (`account_id`);--> statement-breakpoint
CREATE INDEX `legacy_items_evidence_idx` ON `legacy_migration_items` (`evidence_id`);--> statement-breakpoint
CREATE TABLE `legacy_migration_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`export_id` text NOT NULL,
	`format_version` integer NOT NULL,
	`source_storage_key` text NOT NULL,
	`source_hash` text NOT NULL,
	`source_run_id` text,
	`status` text NOT NULL,
	`total_count` integer DEFAULT 0 NOT NULL,
	`valid_count` integer DEFAULT 0 NOT NULL,
	`warning_count` integer DEFAULT 0 NOT NULL,
	`invalid_count` integer DEFAULT 0 NOT NULL,
	`create_account_count` integer DEFAULT 0 NOT NULL,
	`link_account_count` integer DEFAULT 0 NOT NULL,
	`manual_review_count` integer DEFAULT 0 NOT NULL,
	`skipped_count` integer DEFAULT 0 NOT NULL,
	`imported_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`report_json` text DEFAULT '{}' NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`imported_at` integer,
	`rolled_back_at` integer,
	FOREIGN KEY (`source_run_id`) REFERENCES `source_runs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "legacy_runs_status_check" CHECK("legacy_migration_runs"."status" in ('preflighted','importing','completed','partial','failed','rolled_back')),
	CONSTRAINT "legacy_runs_counts_check" CHECK("legacy_migration_runs"."total_count" >= 0 and "legacy_migration_runs"."valid_count" >= 0 and "legacy_migration_runs"."warning_count" >= 0 and "legacy_migration_runs"."invalid_count" >= 0 and "legacy_migration_runs"."create_account_count" >= 0 and "legacy_migration_runs"."link_account_count" >= 0 and "legacy_migration_runs"."manual_review_count" >= 0 and "legacy_migration_runs"."skipped_count" >= 0 and "legacy_migration_runs"."imported_count" >= 0 and "legacy_migration_runs"."failed_count" >= 0),
	CONSTRAINT "legacy_runs_json_check" CHECK(json_valid("legacy_migration_runs"."report_json")),
	CONSTRAINT "legacy_runs_times_check" CHECK("legacy_migration_runs"."created_at" >= 0 and "legacy_migration_runs"."updated_at" >= 0 and ("legacy_migration_runs"."imported_at" is null or "legacy_migration_runs"."imported_at" >= 0) and ("legacy_migration_runs"."rolled_back_at" is null or "legacy_migration_runs"."rolled_back_at" >= 0))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_runs_export_id_unique` ON `legacy_migration_runs` (`export_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_runs_source_hash_unique` ON `legacy_migration_runs` (`source_hash`);--> statement-breakpoint
CREATE INDEX `legacy_runs_status_idx` ON `legacy_migration_runs` (`status`);