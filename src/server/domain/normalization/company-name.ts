import { ValidationError } from "../entities/common";
export function normalizeCompanyName(value: string): string { const result = value.normalize("NFKC").trim().toLowerCase().replace(/[.,;:()\[\]{}'"/\\|]+/g, " ").replace(/\s+/g, " ").trim(); if (!result) throw new ValidationError("Company name is required."); return result; }
export function buildCompanyComparisonName(value: string): string { return normalizeCompanyName(value).replace(/\b(ltd|limited|llc|inc|corp|co|company|gmbh)\b/g, "").replace(/\s+/g, " ").trim(); }
