import type { Evidence } from "../../domain/entities/evidence";
import type { OpportunityPriority, Signal } from "../../domain/entities/opportunity";

export type ScoreResult = { totalScore: number; priority: OpportunityPriority; accountFitScore: number; intentScore: number; freshnessScore: number; evidenceQualityScore: number; actionabilityScore: number; penalties: Record<string, number>; reasons: string[]; risks: string[]; recommendedNextAction: string };
const now = (value?: Date) => value ?? new Date();
const isRecent = (date: Date | null, at: Date) => date !== null && at.getTime() - date.getTime() <= 30 * 86_400_000;
const quality = (evidence: Evidence) => evidence.sourceType === "tender" || evidence.sourceType === "customs_csv" || evidence.sourceType === "company_website" ? 8 : evidence.sourceType === "rfq_platform" ? 6 : evidence.sourceType === "marketplace" || evidence.sourceType === "forum" ? 1 : 3;
export function scoreOpportunity(input: { accountVerified: boolean; peerSupplier: boolean; signals: Signal[]; evidence: Evidence[]; at?: Date }): ScoreResult {
  const at = now(input.at); const active = input.signals.filter((signal) => signal.status !== "rejected" && signal.status !== "superseded" && (!signal.expiresAt || signal.expiresAt > at));
  const strong = active.filter((signal) => signal.strength === "strong"); const medium = active.filter((signal) => signal.strength === "medium"); const weak = active.filter((signal) => signal.strength === "weak");
  const datedStrong = strong.filter((signal) => isRecent(signal.occurredAt, at)); const sourceTypes = new Set(input.evidence.map((item) => item.sourceType));
  const accountFitScore = input.peerSupplier ? 0 : Math.min(30, input.accountVerified ? 26 : active.length ? 16 : 0);
  const intentScore = Math.min(25, strong.length * 15 + medium.length * 7 + weak.length * 2);
  const freshnessScore = Math.min(20, datedStrong.length * 14 + active.filter((signal) => isRecent(signal.detectedAt, at)).length * 2);
  const evidenceQualityScore = Math.min(15, input.evidence.reduce((sum, item) => sum + quality(item), 0));
  const actionabilityScore = Math.min(10, (input.evidence.some((item) => Boolean(item.sourceUrl)) ? 6 : 0) + (input.accountVerified ? 4 : 0));
  const penalties: Record<string, number> = { peerSupplierPenalty: input.peerSupplier ? 35 : 0, outdatedPenalty: active.length === 0 ? 15 : 0, directoryOnlyPenalty: sourceTypes.size === 1 && sourceTypes.has("marketplace") ? 15 : 0, anonymousBuyerPenalty: input.accountVerified ? 0 : 8, conflictingEvidencePenalty: 0 };
  const totalScore = Math.max(0, accountFitScore + intentScore + freshnessScore + evidenceQualityScore + actionabilityScore - Object.values(penalties).reduce((sum, value) => sum + value, 0));
  const dateTrusted = datedStrong.length > 0 && input.evidence.some((item) => item.publishedAt !== null || item.sourceType === "customs_csv");
  let priority: OpportunityPriority = "P3";
  if (!input.peerSupplier && input.accountVerified && strong.length > 0 && dateTrusted && evidenceQualityScore >= 8) priority = "P0";
  else if (!input.peerSupplier && (medium.length > 0 || strong.length > 0) && input.evidence.length > 0) priority = "P1";
  else if (!input.peerSupplier && (weak.length > 0 || active.length > 0)) priority = "P2";
  if (sourceTypes.size === 1 && (sourceTypes.has("marketplace") || sourceTypes.has("forum")) && priority === "P0") priority = "P2";
  if (strong.length > 0 && datedStrong.length === 0 && priority === "P0") priority = "P1";
  const reasons = [...strong.map((signal) => `强信号：${signal.signalType}`), ...medium.map((signal) => `中等信号：${signal.signalType}`), ...weak.map((signal) => `弱信号：${signal.signalType}`)];
  const risks = [...(!input.accountVerified ? ["公司尚未人工核实"] : []), ...(strong.length > 0 && datedStrong.length === 0 ? ["强信号缺少可信日期"] : []), ...(input.peerSupplier ? ["该公司可能是同行供应商"] : [])];
  return { totalScore, priority, accountFitScore, intentScore, freshnessScore, evidenceQualityScore, actionabilityScore, penalties, reasons, risks, recommendedNextAction: priority === "P0" || priority === "P1" ? "核实来源与公司业务后准备低压力开发" : "补充或核实公开证据" };
}
