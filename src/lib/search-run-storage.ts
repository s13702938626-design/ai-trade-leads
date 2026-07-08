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

  return {
    searchCount: records.length,
    candidateCount,
    reviewedSaveCount: records.reduce((sum, record) => sum + record.reviewedSaveCount, 0),
    savedLeadCount,
    saveRate: candidateCount > 0 ? savedLeadCount / candidateCount : 0,
  };
}

export { SEARCH_RUN_STORAGE_KEY };
