import { createHash } from "node:crypto";
import { ValidationError } from "../entities/common";
import { stableJsonStringify } from "./json";
export type EvidenceHashInput = { sourceType: string; sourceExternalId: string | null; canonicalUrl: string | null; title: string | null; rawText: string | null; excerpt: string | null; publishedAt: Date | null; metadata: Record<string, unknown> };
export function buildEvidenceContentHash(input: EvidenceHashInput): string { if (![input.sourceExternalId, input.canonicalUrl, input.title, input.rawText, input.excerpt].some((value) => value?.trim())) throw new ValidationError("Evidence requires at least one factual field."); const content = stableJsonStringify({ ...input, publishedAt: input.publishedAt?.toISOString() ?? null }); return createHash("sha256").update(content).digest("hex"); }
