# v1 Implementation Phases

## Phase 1: Data Foundation

Goal:

- Establish the local single-user foundation: SQLite, Drizzle ORM, migrations, repository interfaces, and old-data migration design.

File scope:

- SQLite schema and Drizzle configuration
- database migrations
- repository interfaces and SQLite implementations
- Account, Evidence, and SourceRun models
- migration utility scaffolding
- tests for dedup keys and basic persistence

Acceptance criteria:

- Account, Evidence, and SourceRun tables exist with immutable-evidence and soft-delete rules.
- Repository layer can create, update, list, and deduplicate the Phase 1 entities.
- Domain services do not depend on Drizzle query objects or SQLite-specific types.
- Existing localStorage Lead data can be exported and mapped into a migration staging format.
- No UI rewrite required yet.

Not included:

- Signal, Opportunity, and scoring engine
- New source adapters
- Daily opportunity UI
- AI scoring
- Email sending

## Phase 2: Evidence, Signal, Opportunity Engine

Goal:

- Build Signal and Opportunity models, account/evidence deduplication, score calculation, lifecycle transitions, and audit logging.

File scope:

- evidence normalizers
- account matching
- signal extraction
- scoring engine
- score explanation types
- audit log
- unit tests

Acceptance criteria:

- Same company across multiple sources merges into one Account.
- Same evidence cannot duplicate.
- Same account can have product-line-specific Opportunities.
- Scores include reasons and evidence IDs.
- Signals expire and a rescore cannot retain stale score effects.
- Every opportunity score is traceable through Signals to Evidence.

Not included:

- Full source crawling
- Large search UI
- Automated outreach

## Phase 3: Core UX

Goal:

- Build the main v1 user experience.

File scope:

- 今日机会
- 公司库
- 机会核实
- shared opportunity cards
- verification checklist

Acceptance criteria:

- User can see ranked opportunities.
- User can inspect evidence and score explanation.
- User can verify, reject, or mark for more research.
- User does not need to see search query controls.

Not included:

- Complex adapter management
- Background scheduling
- Email automation

## Phase 4: Initial Source Adapters

Goal:

- Implement first evidence-producing adapters.

File scope:

- Serper Web Search Adapter
- Customs CSV Adapter
- Manual URL Evidence Adapter
- SourceRun UI for advanced mode
- adapter health checks

Acceptance criteria:

- Adapters output Evidence only.
- API keys remain server-side.
- Customs CSV import does not pretend to query paid customs data.
- Manual URL evidence can support opportunity scoring.

Not included:

- Direct RFQ platform login
- Paid marketplace scraping
- CAPTCHA bypass

## Phase 5: Development Actions

Goal:

- Migrate useful v0.5/v0.6 action concepts into v1.

File scope:

- Activity
- FollowUpTask
- outreach drafts
- account/opportunity action panel

Acceptance criteria:

- User can create next action from an Opportunity.
- User can schedule follow-up.
- User can draft outreach based on verified evidence.
- No automatic sending.

Not included:

- SMTP
- LinkedIn automation
- WhatsApp automation
- automatic status changes

## Phase 6: Daily Refresh

Goal:

- Design and later add optional scheduled refresh, cloud persistence, and collaboration after the local MVP is proven.

File scope:

- scheduler and source run queue
- daily score refresh and summary generation
- cloud database migration path
- multi-user and settings design
- additional source adapters

Acceptance criteria:

- A future deployment plan can move data without leaking persistence details into domain services.
- A scheduled run cannot create an unverified outreach action.
- Daily summaries explain what changed and why it matters.

Not included:

- Full CRM automation
- black-box AI decisions
- unsupervised customer contact

## v1 MVP Boundary

The v1 MVP is Phases 1-5 as a local, single-user application. It does not include:

- Alibaba-specific API integration
- Russia- or Ukraine-specific platform connectors
- Automated login to any platform
- Automatic contact discovery
- Automatic email or other outreach sending
- Cloud task scheduling
- Multi-user collaboration or complex permissions
- Fully autonomous AI agents
