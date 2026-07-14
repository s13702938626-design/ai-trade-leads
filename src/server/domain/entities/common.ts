import { randomUUID } from "node:crypto";

export type AccountId = string;
export type EvidenceId = string;
export type SourceRunId = string;
export type AccountType = "buyer" | "manufacturer" | "distributor" | "importer" | "peer_supplier" | "tender_owner" | "unknown";
export type MergeStatus = "active" | "merge_candidate" | "merged";
export type DedupeConfidence = "high" | "medium" | "low";
export type EvidenceSourceType = "web_search" | "customs_csv" | "tender" | "rfq_platform" | "marketplace" | "company_website" | "news" | "forum" | "manual_url";
export type EvidenceResolutionStatus = "unresolved" | "matched" | "verified" | "rejected";
export type SourceRunStatus = "running" | "success" | "partial" | "failed";

export interface Clock { now(): Date }
export interface IdGenerator { next(): string }
export class SystemClock implements Clock { now(): Date { return new Date(); } }
export class RandomUuidGenerator implements IdGenerator { next(): string { return randomUUID(); } }
export class ValidationError extends Error { constructor(message: string) { super(message); this.name = "ValidationError"; } }
