# v1 Data Model

v1 is evidence-first. Its required data flow is:

```text
SourceRun -> Evidence -> Account resolution -> Signal -> Opportunity
```

Source adapters create only Evidence. Account resolution may associate an Evidence with an Account or leave it unresolved. Signals are regenerable derived data. Opportunities combine derived scoring with human lifecycle management. AI summaries are separate derived records and can never overwrite raw Evidence.

The model deliberately replaces the former large `Lead` object with smaller, traceable entities.

## Account

Represents a company or organization. It is created or linked only after account resolution, never directly from a raw search result.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `displayName` | User-facing company name | yes |
| `normalizedName` | Normalized form for matching | yes |
| `websiteUrl` | Main site when known | no |
| `normalizedDomain` | Normalized registrable domain | no |
| `countryCode` | Verified or manually entered country code | no |
| `registrationIds` | Official registration or platform company IDs | no |
| `alternateNames` | Historical, translated, and source-provided names | no |
| `accountType` | buyer, manufacturer, distributor, importer, peer_supplier, tender_owner, unknown | no |
| `mergeStatus` | active, merge_candidate, merged | yes |
| `mergedIntoAccountId` | Surviving account after a merge | no |
| `dedupeConfidence` | high, medium, low | yes |
| `dedupeReasons` | Explainable matching reasons | yes |
| `excludedReason` | Why it is excluded from buyer opportunities | no |
| `createdAt` / `updatedAt` | Audit timestamps | yes |
| `deletedAt` | Soft-delete timestamp | no |

Deduplication priority:

1. `normalizedDomain`
2. `officialRegistrationId` or `platformCompanyId` in `registrationIds`
3. `countryCode + normalizedName`
4. Explicit `manualMerge`

Rules and relationships:

- Near-similar company names must never force an automatic merge.
- Different domains without other strong evidence must not auto-merge.
- Low-confidence matches go to a human merge queue.
- A merge re-associates Evidence, Signals, Opportunities, Contacts, Activities, and FollowUpTasks with the survivor.
- The merged account is retained as a soft record with `mergedIntoAccountId`; it is not physically deleted.
- Account has many Evidence, Signals, Opportunities, Contacts, Activities, and FollowUpTasks.

## Evidence

Represents one raw, inspectable fact from a source. It is the source of truth, not an AI interpretation.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `sourceType` | web_search, customs_csv, tender, rfq_platform, marketplace, company_website, news, forum, manual_url | yes |
| `sourceExternalId` | Stable source item/row identifier | no |
| `sourceUrl` | Original URL or import-row reference | no for CSV, yes for web evidence when available |
| `canonicalUrl` | Canonicalized URL used for matching | no |
| `title` | Original source title | no |
| `rawText` | Original extracted or entered raw content | no |
| `excerpt` | Source excerpt, not an AI rewrite | no |
| `publishedAt` | Explicit source publication time | no |
| `observedAt` | When user/system observed the item | yes |
| `fetchedAt` | When adapter fetched it | yes |
| `contentHash` | Hash of canonical raw source content | yes |
| `sourceRunId` | SourceRun that imported/discovered it | yes |
| `accountId` | Resolved company, if confidently known | no |
| `resolutionStatus` | unresolved, matched, verified, rejected | yes |
| `metadataJson` | Source-specific structured metadata | no |
| `legacyPayload` | Original legacy Lead payload during migration | no |
| `createdAt` / `updatedAt` | Audit timestamps | yes |
| `deletedAt` | Soft-delete timestamp | no |

Deduplication priority:

1. `sourceType + sourceExternalId`
2. `canonicalUrl + contentHash`
3. `sourceType + contentHash`

Rules and relationships:

- If account identity cannot be resolved, keep the Evidence in unresolved evidence; do not create a speculative Account or Opportunity.
- Raw fields (`sourceUrl`, URL canonicalization inputs, title, rawText, excerpt, source dates, and metadata) are immutable after write. AI cannot alter them.
- Changed source content creates a new Evidence version or a new Evidence record; it does not overwrite prior evidence.
- Deletion is soft only.
- Missing dates remain missing: do not fabricate `publishedAt`, and never use `fetchedAt` as a substitute for publication time.
- Evidence belongs to one SourceRun and can support many Signals and Opportunities.

## SourceRun

Represents one adapter execution or import. It is the provenance root of every Evidence record.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `adapterId` | Source adapter identifier | yes |
| `sourceType` | Source type | yes |
| `status` | running, success, partial, failed | yes |
| `inputSummary` | Sanitized run input without secrets | yes |
| `resultCounts` | Raw, accepted, duplicate, unresolved, and failed counts | yes |
| `startedAt` / `finishedAt` | Execution timestamps | yes / no |
| `errorMessage` | Sanitized failure message | no |
| `createdAt` | Audit time | yes |

Relationships and rules:

- One SourceRun has many Evidence.
- Runs never store API keys, passwords, cookies, or credentials.
- A successful run creates Evidence only; it never writes an Opportunity directly.

## Signal

Represents a derived, regenerable interpretation of one or more Evidence records.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `accountId` | Resolved account | yes |
| `productLineId` | Product line context | yes |
| `signalType` | Classified signal type | yes |
| `strength` | strong, medium, weak | yes |
| `confidence` | high, medium, low | yes |
| `occurredAt` | When the underlying event occurred, if evidenced | no |
| `detectedAt` | When the rule detected it | yes |
| `expiresAt` | When it should stop affecting scores | no |
| `status` | active, expired, superseded, confirmed, rejected | yes |
| `evidenceIds` | Supporting Evidence IDs | yes |
| `reasons` | Rule-produced explanation | yes |
| `ruleVersion` | Extractor/rule version | yes |
| `supersededBySignalId` | Replacement signal, if any | no |
| `createdAt` / `updatedAt` | Audit timestamps | yes |

Signal types:

- Strong: `recent_rfq`, `recent_tender`, `recent_import`, `explicit_supplier_request`, `bulk_purchase_request`
- Medium: `repeated_imports`, `new_product_line`, `expansion`, `procurement_hiring`, `distributor_listing`, `trade_show_participation`
- Weak: `target_industry_match`, `target_customer_type_match`, `relevant_marketplace_presence`

Rules and relationships:

- A Signal without `evidenceIds` is invalid and cannot score an Opportunity.
- Signals are derived data and may be regenerated when rules change; `ruleVersion` preserves the audit trail.
- Expired signals stop affecting scores. Old signals cannot increase an Opportunity forever.
- Human confirmation and human rejection are Activities/audit records; neither deletes the underlying Signal.
- Signal belongs to an Account and product line, references Evidence, and may support many Opportunity score revisions.

## Opportunity

Represents an account/product-line-specific chance to take a human business action. It combines derived scoring with a managed lifecycle.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `accountId` | Target account | yes |
| `productLineId` | Product line | yes |
| `lifecycleStatus` | Current lifecycle state | yes |
| `priority` | P0, P1, P2, P3 | yes |
| `totalScore` | Current total score | yes |
| `accountFitScore` | 0-30 component | yes |
| `intentScore` | 0-25 component | yes |
| `freshnessScore` | 0-20 component | yes |
| `evidenceQualityScore` | 0-15 component | yes |
| `actionabilityScore` | 0-10 component | yes |
| `penalties` | Named penalty breakdown | yes |
| `signalIds` | Signals used for this score | yes |
| `evidenceIds` | Evidence used for this score | yes |
| `scoreReasons` | Explainable score rationale | yes |
| `risks` | Uncertainty/conflict notes | no |
| `recommendedNextAction` | Human next action | yes |
| `verificationStatus` | unverified, needs_verification, verified, rejected, stale | yes |
| `assignedAt` | When placed in a daily/user queue | no |
| `lastScoredAt` | Last scoring time | yes |
| `scoreVersion` | Scoring-rule version | yes |
| `createdAt` / `updatedAt` | Audit timestamps | yes |
| `deletedAt` | Soft-delete timestamp | no |

Uniqueness and lifecycle:

- The open uniqueness key is `accountId + productLineId + lifecycleStatus=open` (implemented as one active/open lifecycle record per pair).
- Lifecycle states: `new`, `needs_verification`, `verified`, `ready_to_contact`, `contacted`, `replied`, `qualified`, `won`, `lost`, `rejected`, `expired`.
- The same Account may have one Opportunity per product line, for example separate masterbatch and filament opportunities.
- The same Account and product line cannot have multiple simultaneously open Opportunities.
- New relevant Evidence updates/re-scores the existing open Opportunity instead of creating a duplicate.
- An expired Opportunity can be reactivated only with a recorded reason and new or revalidated evidence.
- Score reasons must trace through `signalIds` to `evidenceIds`.

## Contact

Represents a known contact method or person, only when sourced or manually entered.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `accountId` | Related account | yes |
| `name` / `role` | Person details | no |
| `email` / `phone` | Explicitly sourced or entered contact details | no |
| `linkedinUrl` | Public LinkedIn profile, if known | no |
| `sourceEvidenceId` | Evidence supporting the data | no |
| `createdAt` / `updatedAt` | Audit timestamps | yes |

Never guess email, phone, country, or contact name.

## Activity

Represents immutable user/system audit history.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `accountId` / `opportunityId` | Related entity | no |
| `type` | verification, merge, note, status_change, score_refresh, outreach_draft, contact_attempt | yes |
| `title` / `note` | Human-readable audit detail | yes / no |
| `actorType` | user or system | yes |
| `createdAt` | Event time | yes |

Activities preserve manual confirmations, rejections, merges, score refreshes, and lifecycle transitions.

## FollowUpTask

Represents a scheduled human next action.

| Field | Purpose | Required |
| --- | --- | --- |
| `id` | Internal primary key | yes |
| `accountId` / `opportunityId` | Related entities | yes / no |
| `title` | Task title | yes |
| `dueAt` | Due date/time | yes |
| `status` | pending, completed, cancelled | yes |
| `channel` | email, linkedin, website_form, phone, other | no |
| `createdAt` / `completedAt` | Audit timestamps | yes / no |

## AI-Derived Content Rule

Any AI summary, fit explanation, or draft is stored separately from Evidence with its own generation metadata and review status. It may provide `explanationSuggestion`, but it cannot modify raw evidence, source dates, account identity, Signal score components, or evidence links.
