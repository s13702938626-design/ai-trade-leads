"use client";

import type { SearchRunRecord } from "@/types/search";

const SEARCH_RUN_STORAGE_KEY = "ai-trade-leads:v0.3.3:search-runs";

function readRecords(): SearchRunRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SEARCH_RUN_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records: SearchRunRecord[]): void {
  window.localStorage.setItem(SEARCH_RUN_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("search-runs:updated"));
}

export function saveSearchRun(record: SearchRunRecord): void {
  writeRecords([record, ...readRecords()].slice(0, 100));
}

export function listSearchRuns(): SearchRunRecord[] {
  return readRecords();
}

export function clearSearchRuns(): void {
  writeRecords([]);
}

export function updateSearchRunSavedLeadCount(runId: string, count: number): void {
  writeRecords(
    readRecords().map((record) =>
      record.id === runId
        ? { ...record, savedLeadCount: Math.max(0, record.savedLeadCount + count) }
        : record,
    ),
  );
}

export function getSearchRunStats() {
  const records = readRecords();
  const candidateCount = records.reduce((sum, record) => sum + record.candidateCount, 0);
  const savedLeadCount = records.reduce((sum, record) => sum + record.savedLeadCount, 0);
  const totalBuyerFit = records.reduce((sum, record) => sum + (record.averageBuyerFitScore ?? 0) * record.candidateCount, 0);

  return {
    searchCount: records.length,
    candidateCount,
    reviewedSaveCount: records.reduce((sum, record) => sum + record.reviewedSaveCount, 0),
    savedLeadCount,
    saveRate: candidateCount > 0 ? savedLeadCount / candidateCount : 0,
    targetEndUserCount: records.reduce((sum, record) => sum + (record.targetEndUserCount ?? 0), 0),
    targetDistributorCount: records.reduce((sum, record) => sum + (record.targetDistributorCount ?? 0), 0),
    peerSupplierCount: records.reduce((sum, record) => sum + (record.peerSupplierCount ?? 0), 0),
    hiddenPeerCount: records.reduce((sum, record) => sum + (record.hiddenPeerCount ?? 0), 0),
    averageBuyerFitScore: candidateCount > 0 ? Math.round(totalBuyerFit / candidateCount) : 0,
    highValueCandidateCount: records.reduce((sum, record) => sum + (record.highValueCandidateCount ?? 0), 0),
  };
}

export { SEARCH_RUN_STORAGE_KEY };
