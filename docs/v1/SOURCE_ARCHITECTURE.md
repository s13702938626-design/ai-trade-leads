# v1 Source Architecture

## Principle

Sources produce Evidence. They do not directly save Leads or Opportunities.

The required data flow is:

```text
SourceRun -> Evidence -> Account resolution -> Signal -> Opportunity
```

Opportunity generation happens only after evidence normalization, evidence deduplication, account resolution, signal extraction, and scoring. An unresolved Evidence remains in the unresolved-evidence queue; it must not invent an Account or Opportunity.

## Deployment Boundary

The first v1 implementation is a local single-user Next.js application running in the Node runtime with SQLite and Drizzle ORM. SQLite data remains on the local machine; it is not deployed to Vercel. Cloud scheduling, accounts, and collaboration are out of scope.

Repositories isolate persistence. Adapter, resolution, signal, opportunity, and scoring services consume repository interfaces rather than Drizzle query objects or SQLite-specific behavior, so PostgreSQL can later replace SQLite without changing business rules.

## Source Types

Supported source type taxonomy:

- `web_search`
- `customs_csv`
- `tender`
- `rfq_platform`
- `marketplace`
- `company_website`
- `news`
- `forum`
- `manual_url`

## SourceAdapter Interface

Each adapter should implement a common interface:

```ts
type SourceAdapter = {
  id: string;
  name: string;
  sourceType: SourceType;
  run(input: SourceRunInput): Promise<SourceRunResult>;
  normalize(raw: unknown): NormalizedSourceItem[];
  deduplicate(items: NormalizedSourceItem[]): NormalizedSourceItem[];
  extractEvidence(items: NormalizedSourceItem[]): EvidenceInput[];
  healthCheck(): Promise<SourceHealth>;
};
```

Required adapter fields:

- `id`: stable adapter identifier
- `name`: user-facing name
- `sourceType`: one of the source types
- `run()`: performs the source operation or import
- `normalize()`: maps raw source data into internal normalized items
- `deduplicate()`: removes duplicate source items
- `extractEvidence()`: outputs Evidence only
- `healthCheck()`: checks configuration and availability without exposing secrets

## Evidence Output Contract

Every adapter outputs Evidence with:

- sourceType
- sourceAdapterId
- sourceRunId
- source URL or import row reference
- title/snippet/rawText where available
- observedAt
- publishedAt or validUntil only when explicitly available
- evidenceHash
- safe metadata

Adapters must not:

- Create Account, Signal, or Opportunity records directly
- Save Lead records directly
- Guess contact details
- Guess country
- Invent dates
- Store API keys
- Return hidden paid/login-only content as if it were public evidence

Evidence is raw source material. After initial storage, raw source fields are immutable: AI may add a separately stored summary or explanation suggestion, but it may not rewrite original title, text, dates, URL, or metadata. A material source-content change creates a new Evidence version or new Evidence record.

## Initial Adapters

### 1. Serper Web Search Adapter

Purpose:

- Search public web pages through Serper
- Return search result evidence
- Preserve query and run metadata without exposing API key

Initial source types:

- web_search
- rfq_platform when query targets public RFQ pages
- tender when query targets public tender pages
- marketplace when query targets public marketplace pages
- forum when query targets public forum pages

Rules:

- API key is read only on the server.
- Search result is Evidence, not a saved customer.
- No-date results cannot be treated as recent demand.
- Marketplace product pages are market/channel evidence, not buyer RFQ evidence.

### 2. Customs CSV Adapter

Purpose:

- Import user-provided customs CSV from legitimate sources
- Normalize importer, product description, HS code, shipment date, and source reference
- Produce Evidence and possible Account matches

Rules:

- Does not pretend to query a paid customs database.
- Missing source reference should lower evidence quality.
- Importer names require deduplication before account creation.

### 3. Manual URL Evidence Adapter

Purpose:

- Let user add a public URL or source note manually
- Normalize URL, title, user evidence text, and source type
- Produce Evidence for later scoring

Rules:

- User-provided evidence must still be traceable.
- Manual evidence can support score, but should not bypass verification.

## Future Adapter Placeholders

These sources keep the interface but are not implemented in Phase 1:

- Tender-specific API/feeds
- RFQ platform integrations
- Marketplace adapters
- Company website crawler
- News adapter
- Forum adapter

The product must not pretend these are connected before implementation.
