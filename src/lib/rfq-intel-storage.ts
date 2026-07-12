import type { RfqIntelMissionCheck, RfqIntelMissionCheckResult } from "@/types/demand-intelligence";

const STORAGE_KEY = "ai-trade-leads-rfq-intel-mission-checks";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rfq-intel:updated"));
  }
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function listMissionChecks(): RfqIntelMissionCheck[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMissionChecks(checks: RfqIntelMissionCheck[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
  emitUpdate();
}

export function addMissionCheck(input: Omit<RfqIntelMissionCheck, "id" | "checkedAt"> & { checkedAt?: string }): RfqIntelMissionCheck {
  const next: RfqIntelMissionCheck = {
    ...input,
    id: createId(),
    checkedAt: input.checkedAt ?? new Date().toISOString(),
  };
  saveMissionChecks([next, ...listMissionChecks()]);
  return next;
}

export function updateMissionCheck(id: string, patch: Partial<Omit<RfqIntelMissionCheck, "id">>): RfqIntelMissionCheck | null {
  let updated: RfqIntelMissionCheck | null = null;
  const next = listMissionChecks().map((check) => {
    if (check.id !== id) return check;
    updated = { ...check, ...patch };
    return updated;
  });
  saveMissionChecks(next);
  return updated;
}

export function deleteMissionCheck(id: string) {
  saveMissionChecks(listMissionChecks().filter((check) => check.id !== id));
}

export function getMissionStats() {
  const checks = listMissionChecks();
  const countBy = (result: RfqIntelMissionCheckResult) => checks.filter((check) => check.result === result).length;
  return {
    checkedCount: checks.length,
    usefulCount: countBy("useful"),
    invalidOrOutdatedCount: countBy("no_valid_leads") + countBy("outdated"),
    needsRecheckCount: countBy("needs_recheck"),
    savedLeadCount: checks.reduce((sum, check) => sum + check.savedLeadCount, 0),
  };
}
