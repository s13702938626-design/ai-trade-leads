import assert from "node:assert/strict";
import test from "node:test";
import { scoreOpportunity } from "../src/server/application/opportunity/scoring";
const evidence = (sourceType: "tender" | "marketplace", publishedAt: Date | null) => ({ sourceType, publishedAt, sourceUrl: "https://example.com" }) as never;
const signal = (strength: "strong" | "medium" | "weak", occurredAt: Date | null) => ({ strength, occurredAt, detectedAt: new Date("2026-07-15"), expiresAt: null, status: "active", signalType: "recent_rfq" }) as never;
test("verified current RFQ can reach P0", () => assert.equal(scoreOpportunity({ accountVerified: true, peerSupplier: false, signals: [signal("strong", new Date("2026-07-10"))], evidence: [evidence("tender", new Date("2026-07-10"))], at: new Date("2026-07-16") }).priority, "P0"));
test("undated RFQ is never P0", () => assert.notEqual(scoreOpportunity({ accountVerified: true, peerSupplier: false, signals: [signal("strong", null)], evidence: [evidence("tender", null)], at: new Date("2026-07-16") }).priority, "P0"));
test("marketplace-only and peer suppliers stay low", () => { assert.equal(scoreOpportunity({ accountVerified: true, peerSupplier: false, signals: [signal("weak", null)], evidence: [evidence("marketplace", null)], at: new Date("2026-07-16") }).priority, "P2"); assert.equal(scoreOpportunity({ accountVerified: true, peerSupplier: true, signals: [signal("strong", new Date("2026-07-10"))], evidence: [evidence("tender", new Date("2026-07-10"))], at: new Date("2026-07-16") }).priority, "P3"); });
