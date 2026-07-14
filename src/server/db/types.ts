import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  accountAliases,
  accountIdentifiers,
  accounts,
  evidence,
  sourceRuns,
} from "./schema";

export type DbAccountRow = InferSelectModel<typeof accounts>;
export type DbNewAccountRow = InferInsertModel<typeof accounts>;
export type DbAccountAliasRow = InferSelectModel<typeof accountAliases>;
export type DbNewAccountAliasRow = InferInsertModel<typeof accountAliases>;
export type DbAccountIdentifierRow = InferSelectModel<typeof accountIdentifiers>;
export type DbNewAccountIdentifierRow = InferInsertModel<typeof accountIdentifiers>;
export type DbAccountIdentifierNamespace = NonNullable<DbAccountIdentifierRow["identifierNamespace"]>;
export type DbEvidenceRow = InferSelectModel<typeof evidence>;
export type DbNewEvidenceRow = InferInsertModel<typeof evidence>;
export type DbSourceRunRow = InferSelectModel<typeof sourceRuns>;
export type DbNewSourceRunRow = InferInsertModel<typeof sourceRuns>;
