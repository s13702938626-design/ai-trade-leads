# v1 Architecture Decisions

## ADR-001: Opportunity-first, not search-first

**Context:** v0.7-v0.8 made users choose queries, strategies, strictness, platforms, and filters before seeing value.

**Decision:** The default experience starts with ranked opportunities and their evidence. Search operations live in advanced mode.

**Consequences:** The product must explain priority and next action clearly; source execution becomes an internal capability rather than the primary workflow.

**Alternatives rejected:** Keeping a search page as the homepage; exposing query composition to every user.

## ADR-002: Evidence-first data chain

**Context:** Search result snippets and AI interpretations are not independently reliable customer records.

**Decision:** Use `SourceRun -> Evidence -> Account resolution -> Signal -> Opportunity`. Adapters create Evidence only.

**Consequences:** Account resolution, scoring, and opportunity creation are delayed until traceable evidence exists. Unresolved evidence remains reviewable without inventing a company.

**Alternatives rejected:** Creating Leads/Accounts directly from source results; letting search adapters create opportunities.

## ADR-003: Local SQLite with repository isolation

**Context:** v1 must be usable locally without cloud deployment complexity, while preserving a migration path.

**Decision:** Start with local SQLite through Drizzle ORM in the Next.js Node runtime. Business services depend on repository interfaces, not Drizzle objects or SQLite details.

**Consequences:** No Vercel SQLite deployment, account system, multi-user collaboration, or cloud scheduling in the MVP. PostgreSQL can be introduced later behind the same repository contracts.

**Alternatives rejected:** Direct Drizzle calls throughout business/UI code; localStorage as the long-term datastore; deploying SQLite to Vercel.

## ADR-004: AI is not a factual source

**Context:** AI can summarize incorrectly or infer information not present in a source.

**Decision:** AI output is separately stored derived content. It cannot overwrite Evidence or create factual source fields.

**Consequences:** Raw evidence remains inspectable; AI can suggest explanations and drafts but requires human review.

**Alternatives rejected:** Writing AI summaries back into raw Evidence; treating AI output as an evidence record.

## ADR-005: Scores bind to evidence IDs

**Context:** A priority label without provenance cannot be verified or safely improved.

**Decision:** Every score reason references Signals and Evidence IDs. A Signal without `evidenceIds` is invalid.

**Consequences:** Scoring is explainable and can be regenerated when rules change; untraceable scores are rejected.

**Alternatives rejected:** Opaque aggregate scores; free-text recommendations without references.

## ADR-006: Low-confidence deduplication requires human confirmation

**Context:** Similar company names frequently refer to different organizations, especially across markets.

**Decision:** Only strong domain, registration/platform ID, or country-plus-name evidence can support automatic matching. Low-confidence matches enter a merge queue.

**Consequences:** Some duplicate accounts will remain temporarily, but incorrect data loss through forced merges is avoided. Merges retain the source record with `mergedIntoAccountId`.

**Alternatives rejected:** Fuzzy-name auto-merge; physical deletion of merged accounts.

## ADR-007: Only three initial source adapters

**Context:** Broad platform coverage creates fragile and misleading integrations.

**Decision:** Implement only Manual URL Evidence, Serper Web Search, and Customs CSV adapters first.

**Consequences:** Each adapter has a clear evidence contract. Other source types remain interfaces, not implied integrations.

**Alternatives rejected:** Pretending tender/RFQ/marketplace/news/forum adapters are connected; platform-specific expansion before the core model works.

## ADR-008: v0.7-v0.8 is research reference only

**Context:** The archived search experiments contain useful learning but an unsuitable default product model.

**Decision:** Preserve `archive/v0-7-v0-8-search-experiments` as research reference and do not merge it into `main` or copy its pages wholesale.

**Consequences:** Reusable safety patterns may be selectively adapted, but v1 begins from the documented model.

**Alternatives rejected:** Merging the archive into v1; continuing to layer controls onto the old search UX.

## ADR-009: Do not keep extending Lead

**Context:** The old Lead object conflates account, evidence, scoring, contact, and workflow state.

**Decision:** Use Account, Evidence, Signal, Opportunity, Contact, SourceRun, Activity, and FollowUpTask as separate entities.

**Consequences:** Migration maps old fields into dedicated records and retains `legacyPayload`; some views require joins/repositories.

**Alternatives rejected:** Adding more optional fields to Lead; treating all source results as saved leads.

## ADR-010: No automated outreach or platform login in MVP

**Context:** Automatic platform access and external contact increase safety, compliance, and operational risk.

**Decision:** MVP supports human verification, tasks, and drafts only. It does not auto-login, find contacts, send email, or contact companies.

**Consequences:** Human approval remains required before any external action.

**Alternatives rejected:** Autonomous AI agents; automated email campaigns; automated platform workflows.
