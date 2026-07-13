# v1 Business Acceptance Tests

These are product-level acceptance scenarios. They should become automated tests where the relevant repository, importer, resolver, and scoring components exist.

## 1. Multi-source company resolution

**Given:** Serper evidence and a customs CSV row identify the same verified domain or registration ID.

**When:** Both sources are imported.

**Then:** One Account is used and both Evidence records remain linked to it.

**Forbidden result:** Two active Accounts are created solely because sources differ.

## 2. Repeated source import

**Given:** A source item has the same `sourceType + sourceExternalId`, or matching canonical URL and content hash.

**When:** The same source is imported again.

**Then:** No duplicate Evidence is created and the SourceRun records the duplicate count.

**Forbidden result:** A second identical Evidence changes opportunity priority.

## 3. Amazon product page

**Given:** The only evidence is an Amazon product page.

**When:** Signals and opportunities are generated.

**Then:** It cannot produce a P0 or P1 purchasing opportunity.

**Forbidden result:** Marketplace availability is treated as an explicit buyer request.

## 4. Current RFQ with verified company

**Given:** A verified Account has a public, explicit RFQ dated within the last 30 days and at least one medium- or high-quality Evidence record.

**When:** The score engine runs.

**Then:** It may generate P0 if all P0 gates, including no peer-supplier penalty or critical conflict, are satisfied.

**Forbidden result:** P0 is denied merely because the item came through a supported adapter.

## 5. Undated RFQ

**Given:** An RFQ is explicit but has no credible publication, occurrence, or deadline date.

**When:** It is scored.

**Then:** The Opportunity is `needs_verification` and cannot directly be P0.

**Forbidden result:** `fetchedAt` is treated as `publishedAt`.

## 6. Peer supplier exclusion

**Given:** Evidence identifies a masterbatch manufacturer as a peer supplier for the configured product line.

**When:** It is scored as a buyer opportunity.

**Then:** It receives P3 or a rejected lifecycle state unless the user explicitly requests competitor/channel intelligence.

**Forbidden result:** It becomes P0/P1 as a buyer based on product-keyword overlap.

## 7. Filament buying signal

**Given:** A 3D printing service has recent evidence of a bulk filament purchase request.

**When:** Account resolution and signal extraction complete.

**Then:** A filament Opportunity can be created with the request evidence and signal IDs.

**Forbidden result:** The opportunity is classified as masterbatch without cross-product evidence.

## 8. Separate product-line opportunities

**Given:** One Account has separately evidenced masterbatch and filament use cases.

**When:** Opportunities are generated.

**Then:** It can have one active Opportunity per product line.

**Forbidden result:** The product lines are collapsed into one untraceable opportunity or duplicate active opportunities exist for the same product line.

## 9. Incorrect AI summary

**Given:** AI generates an incorrect explanation suggestion.

**When:** A user reviews the record.

**Then:** Original Evidence fields, links, text, and dates remain unchanged and inspectable.

**Forbidden result:** AI overwrites raw Evidence or changes score components directly.

## 10. Signal expiry and rescore

**Given:** A score includes a signal with an expired `expiresAt`.

**When:** The score refresh runs.

**Then:** The expired signal no longer increases the Opportunity score and the new score revision is audited.

**Forbidden result:** Old demand permanently retains freshness points.

## 11. Similar names, different domains

**Given:** Two company names are similar but their domains differ and there is no matching registration/platform ID or other strong proof.

**When:** Account resolution runs.

**Then:** The records are not automatically merged; a low-confidence match may enter the manual merge queue.

**Forbidden result:** Name similarity alone causes a forced merge.

## 12. Legacy Lead migration

**Given:** A v0.6 localStorage Lead is migrated.

**When:** The migration creates new records.

**Then:** Original fields are preserved in `legacyPayload`, source fields map to Evidence, and no country/email is inferred.

**Forbidden result:** Legacy values are silently discarded or fabricated data is introduced.
