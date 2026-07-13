# v1 Scoring Model

## Opportunity Score

Total score is 0-100.

Positive components:

- `accountFitScore`: 0-30
- `intentScore`: 0-25
- `freshnessScore`: 0-20
- `evidenceQualityScore`: 0-15
- `actionabilityScore`: 0-10

Penalties:

- `peerSupplierPenalty`
- `outdatedPenalty`
- `directoryOnlyPenalty`
- `anonymousBuyerPenalty`
- `conflictingEvidencePenalty`

Final score:

```text
score = positive components - penalties
```

## Priority Bands

- P0: 80-100, verified account, current strong signal, high-quality evidence, clear next action
- P1: 65-79, account fit with a medium signal or a strong signal that still needs verification
- P2: 45-64, account fit but only weak signals or no explicit current demand
- P3: below 45, peer supplier, stale, directory-only, anonymous, unresolved, or clearly irrelevant

## Strong Signals

Strong signals can drive P0/P1 only when backed by evidence IDs:

- `recent_rfq`
- `recent_tender`
- `recent_import`
- `explicit_supplier_request`
- `bulk_purchase_request`

## Medium Signals

Medium signals support opportunity creation but usually need more evidence:

- `repeated_imports`
- `new_product_line`
- `expansion`
- `procurement_hiring`
- `distributor_listing`
- `trade_show_participation`

## Weak Signals

Weak signals help fit scoring but cannot create high priority alone:

- `target_industry_match`
- `target_customer_type_match`
- `relevant_marketplace_presence`

## Required Explainability

Every score output must include:

- component scores
- penalties
- reasons
- evidenceIds
- signalIds

No score should be a black box.

## Hard Rules

- P0 must have all of: a verified Account; at least one strong Signal in its validity window; at least one medium- or high-quality Evidence record; no triggered `peerSupplierPenalty`; and no unresolved critical conflict.
- P1 needs account fit plus a medium signal or an incompletely verified strong signal, and remains subject to human verification.
- P2 requires account fit and has only weak signals or no current explicit demand.
- P3 includes peer suppliers, expired signals, directory-only sources, anonymous demand, unresolved companies, and clearly irrelevant evidence.
- No evidence means no high score.
- No `publishedAt`, `occurredAt`, deadline, or other credible time evidence means no recent-demand classification. `fetchedAt` is not publication time.
- No-date evidence alone cannot form P0.
- Ecommerce product pages cannot directly become buyer purchase intent.
- Directory-only evidence cannot exceed P2 by itself; forum discussion cannot exceed P1 by itself.
- One weak signal cannot form P0 or P1.
- Peer supplier evidence applies a penalty unless the user explicitly requests competitor or channel intelligence.
- Conflicting evidence lowers confidence and can block P0.
- AI output cannot create evidence or directly change component scores. It may only create a separately stored `explanationSuggestion` for human review.

## Example Score Breakdown

```json
{
  "priority": "P1",
  "score": 72,
  "accountFitScore": 24,
  "intentScore": 20,
  "freshnessScore": 14,
  "evidenceQualityScore": 10,
  "actionabilityScore": 8,
  "penalties": {
    "peerSupplierPenalty": 0,
    "outdatedPenalty": 0,
    "directoryOnlyPenalty": 0,
    "anonymousBuyerPenalty": 4,
    "conflictingEvidencePenalty": 0
  },
  "reasons": [
    "Recent tender evidence mentions relevant product terms",
    "Account appears to be a target packaging manufacturer",
    "Deadline is available but buyer contact is not public"
  ],
  "evidenceIds": ["ev_123", "ev_456"],
  "signalIds": ["sig_789"]
}
```
