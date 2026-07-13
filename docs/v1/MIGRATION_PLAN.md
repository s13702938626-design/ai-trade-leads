# v1 Migration Plan

## Branch Strategy

- `main` remains stable v0.6.
- `archive/v0-7-v0-8-search-experiments` preserves v0.7-v0.8 search experiments for reference.
- `v1-opportunity-radar` starts the v1 architecture reset.

The archive branch must not be merged into main. It is research material only.

## What To Keep

Keep these concepts and implementation lessons:

- Serper API route security pattern: read keys only on the server
- CSV import/export experience
- AI analysis server-side calling pattern
- Follow-up and Activity business concepts
- Outreach Draft business concept
- Manual confirmation before saving or contacting
- Evidence-first thinking from the later search experiments

## What To Deprecate Or Rewrite

Deprecate or rewrite:

- Large search strategy card interfaces
- Multi-layer query selectors
- Repeated filters across pages
- Making users choose source channel, strictness, freshness, platform category before seeing value
- Treating search results directly as customer candidates
- Putting all business state into one large Lead object
- Using localStorage as a long-term database
- Migrating the old demand page directly into v1

## Old Feature Mapping

| Old Feature | v1 Decision |
| --- | --- |
| Lead list | Migrate into Account plus Opportunity where possible |
| Lead detail | Replace with Account detail plus Opportunity detail |
| AI analysis | Keep server-side model, attach to Opportunity/Account as commentary |
| Follow-up workbench | Keep concept, migrate to Activity and FollowUpTask |
| Outreach drafts | Keep concept, connect to Opportunity and Account |
| Serper search | Move behind Serper Web Search Adapter |
| Customs importer | Move behind Customs CSV Adapter |
| Demand search page | Do not directly migrate; rewrite as evidence/source advanced mode |

## localStorage Migration

v1 should provide a one-time migration tool:

1. Read old localStorage Lead data in browser.
2. Create Account records from company/domain.
3. Create Evidence from sourceUrl/sourceTitle/sourceSnippet/evidenceText.
4. Create initial Opportunity per productKeyword/productLine.
5. Create Activity records from old activities.
6. Create FollowUpTask records from old follow-up tasks.
7. Preserve outreach drafts as related content.

Migration rules:

- Do not directly copy the old large Lead type into v1.
- Do not overwrite raw evidence.
- Do not infer missing email, phone, contact, country, or dates.
- If confidence is low, mark migrated Opportunity as `needs_research`.

## Database Direction

Move from localStorage to SQLite plus ORM in Phase 1. localStorage can remain as an export/import fallback, but not as the long-term source of truth.

## Risk Controls

- Keep v0.6 main stable until v1 has a usable slice.
- Do not merge the archive branch.
- Do not rebuild v1 by copying the old demand page.
- Implement migration after the new data model is stable.
