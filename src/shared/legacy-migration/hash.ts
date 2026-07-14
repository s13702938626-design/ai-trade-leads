import { createHash } from "node:crypto";
export const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
export const stableExportCore = (value: Omit<import("./export-format").LegacyLocalStorageExportV1, "payloadSha256">) => JSON.stringify({ ...value, entries: value.entries.map((entry) => ({ key: entry.key, rawValue: entry.rawValue, sha256: entry.sha256 })) });
