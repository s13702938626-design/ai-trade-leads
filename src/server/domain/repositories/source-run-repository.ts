import type { SourceRun } from "../entities/source-run";
import type { SourceRunId, SourceRunStatus } from "../entities/common";
import type { PageOptions } from "./account-repository";
export interface SourceRunRepository { create(input: { adapterId: string; sourceType: string; inputSummary: Record<string, unknown>; startedAt?: Date }): Promise<SourceRun>; getById(id: SourceRunId): Promise<SourceRun | null>; list(options?: PageOptions): Promise<SourceRun[]>; finish(id: SourceRunId, input: { status?: Extract<SourceRunStatus, "success" | "partial">; resultCounts: SourceRun["resultCounts"]; finishedAt?: Date }): Promise<SourceRun>; markFailed(id: SourceRunId, input: { errorMessage: string; finishedAt?: Date }): Promise<SourceRun>; }
