import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  accountAliases,
  accountIdentifiers,
  accounts,
  evidence,
  sourceRuns,
} from "./schema";

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;
export type AccountAlias = InferSelectModel<typeof accountAliases>;
export type NewAccountAlias = InferInsertModel<typeof accountAliases>;
export type AccountIdentifier = InferSelectModel<typeof accountIdentifiers>;
export type NewAccountIdentifier = InferInsertModel<typeof accountIdentifiers>;
export type AccountIdentifierNamespace = NonNullable<AccountIdentifier["identifierNamespace"]>;
export type Evidence = InferSelectModel<typeof evidence>;
export type NewEvidence = InferInsertModel<typeof evidence>;
export type SourceRun = InferSelectModel<typeof sourceRuns>;
export type NewSourceRun = InferInsertModel<typeof sourceRuns>;
