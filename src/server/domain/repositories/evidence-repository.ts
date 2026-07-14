import type { Evidence, EvidenceCreateResult } from "../entities/evidence";
import type { AccountId, EvidenceId, EvidenceResolutionStatus, SourceRunId } from "../entities/common";
import type { PageOptions } from "./account-repository";
export interface EvidenceRepository {
  create(input: { sourceType: Evidence["sourceType"]; sourceExternalId?: string | null; sourceUrl?: string | null; title?: string | null; rawText?: string | null; excerpt?: string | null; publishedAt?: Date | null; observedAt?: Date; fetchedAt?: Date; metadata?: Record<string, unknown>; legacyPayload?: unknown | null; sourceRunId: SourceRunId }): Promise<EvidenceCreateResult>;
  getById(id: EvidenceId, options?: { includeDeleted?: boolean }): Promise<Evidence | null>; list(options?: PageOptions): Promise<Evidence[]>; listUnresolved(options?: PageOptions): Promise<Evidence[]>;
  attachToAccount(evidenceId: EvidenceId, accountId: AccountId): Promise<Evidence>; changeResolutionStatus(evidenceId: EvidenceId, status: EvidenceResolutionStatus): Promise<Evidence>; softDelete(evidenceId: EvidenceId): Promise<Evidence>; restore(evidenceId: EvidenceId): Promise<Evidence>;
}
