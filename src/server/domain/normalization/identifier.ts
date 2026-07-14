import { ValidationError } from "../entities/common";
export function normalizeIdentifierValue(value: string): string { const result = value.normalize("NFKC").trim().toUpperCase().replace(/\s+/g, ""); if (!result) throw new ValidationError("Identifier is required."); return result; }
export function normalizeIdentifierNamespace(value: string): string { const result = value.normalize("NFKC").trim().toLowerCase().replace(/[\s/]+/g, "_").replace(/_+/g, "_"); if (!result || !/^[a-z0-9_.-]+$/.test(result)) throw new ValidationError("Identifier namespace is invalid."); return result; }
