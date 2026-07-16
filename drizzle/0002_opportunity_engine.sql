CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`opportunity_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`note` text,
	`actor_type` text DEFAULT 'user' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "activities_metadata_json" CHECK(json_valid("activities"."metadata_json"))
);
--> statement-breakpoint
CREATE INDEX `activities_account_idx` ON `activities` (`account_id`);--> statement-breakpoint
CREATE INDEX `activities_opportunity_idx` ON `activities` (`opportunity_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "app_settings_value_json" CHECK(json_valid("app_settings"."value_json"))
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`name` text,
	`role` text,
	`email` text,
	`phone` text,
	`linkedin_url` text,
	`source_evidence_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_evidence_id`) REFERENCES `evidence`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `contacts_account_idx` ON `contacts` (`account_id`);--> statement-breakpoint
CREATE TABLE `follow_up_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`opportunity_id` text,
	`title` text NOT NULL,
	`due_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`channel` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `follow_up_tasks_due_idx` ON `follow_up_tasks` (`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`product_line_id` text NOT NULL,
	`lifecycle_status` text DEFAULT 'needs_verification' NOT NULL,
	`priority` text DEFAULT 'P3' NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`account_fit_score` integer DEFAULT 0 NOT NULL,
	`intent_score` integer DEFAULT 0 NOT NULL,
	`freshness_score` integer DEFAULT 0 NOT NULL,
	`evidence_quality_score` integer DEFAULT 0 NOT NULL,
	`actionability_score` integer DEFAULT 0 NOT NULL,
	`penalties_json` text DEFAULT '{}' NOT NULL,
	`signal_ids_json` text DEFAULT '[]' NOT NULL,
	`evidence_ids_json` text DEFAULT '[]' NOT NULL,
	`score_reasons_json` text DEFAULT '[]' NOT NULL,
	`risks_json` text DEFAULT '[]' NOT NULL,
	`recommended_next_action` text NOT NULL,
	`verification_status` text DEFAULT 'needs_verification' NOT NULL,
	`assigned_at` integer,
	`last_scored_at` integer NOT NULL,
	`score_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_line_id`) REFERENCES `product_lines`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "opportunities_json_check" CHECK(json_valid("opportunities"."penalties_json") and json_valid("opportunities"."signal_ids_json") and json_valid("opportunities"."evidence_ids_json") and json_valid("opportunities"."score_reasons_json") and json_valid("opportunities"."risks_json"))
);
--> statement-breakpoint
CREATE INDEX `opportunities_priority_idx` ON `opportunities` (`priority`);--> statement-breakpoint
CREATE INDEX `opportunities_account_idx` ON `opportunities` (`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `opportunities_active_account_product_unique` ON `opportunities` (`account_id`,`product_line_id`) WHERE "opportunities"."deleted_at" is null and "opportunities"."lifecycle_status" not in ('won','lost','rejected','expired');--> statement-breakpoint
CREATE TABLE `opportunity_score_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunity_id` text NOT NULL,
	`score_version` text NOT NULL,
	`total_score` integer NOT NULL,
	`components_json` text NOT NULL,
	`penalties_json` text NOT NULL,
	`signal_ids_json` text NOT NULL,
	`evidence_ids_json` text NOT NULL,
	`reasons_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "score_revisions_json_check" CHECK(json_valid("opportunity_score_revisions"."components_json") and json_valid("opportunity_score_revisions"."penalties_json") and json_valid("opportunity_score_revisions"."signal_ids_json") and json_valid("opportunity_score_revisions"."evidence_ids_json") and json_valid("opportunity_score_revisions"."reasons_json"))
);
--> statement-breakpoint
CREATE INDEX `score_revisions_opportunity_idx` ON `opportunity_score_revisions` (`opportunity_id`);--> statement-breakpoint
CREATE TABLE `outreach_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`opportunity_id` text,
	`channel` text NOT NULL,
	`subject` text,
	`body` text NOT NULL,
	`missing_info_json` text DEFAULT '[]' NOT NULL,
	`assumptions_json` text DEFAULT '[]' NOT NULL,
	`warnings_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "outreach_drafts_json_check" CHECK(json_valid("outreach_drafts"."missing_info_json") and json_valid("outreach_drafts"."assumptions_json") and json_valid("outreach_drafts"."warnings_json"))
);
--> statement-breakpoint
CREATE INDEX `outreach_drafts_account_idx` ON `outreach_drafts` (`account_id`);--> statement-breakpoint
CREATE TABLE `product_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`rules_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "product_lines_rules_json" CHECK(json_valid("product_lines"."rules_json"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_lines_code_unique` ON `product_lines` (`code`);--> statement-breakpoint
CREATE TABLE `signals` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`product_line_id` text NOT NULL,
	`signal_type` text NOT NULL,
	`strength` text NOT NULL,
	`confidence` text NOT NULL,
	`occurred_at` integer,
	`detected_at` integer NOT NULL,
	`expires_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`evidence_ids_json` text NOT NULL,
	`reasons_json` text NOT NULL,
	`rule_version` text NOT NULL,
	`superseded_by_signal_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_line_id`) REFERENCES `product_lines`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "signals_json_check" CHECK(json_valid("signals"."evidence_ids_json") and json_valid("signals"."reasons_json"))
);
--> statement-breakpoint
CREATE INDEX `signals_account_product_idx` ON `signals` (`account_id`,`product_line_id`);--> statement-breakpoint
CREATE INDEX `signals_status_idx` ON `signals` (`status`);