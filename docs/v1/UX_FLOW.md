# v1 UX Flow

## Main Navigation

The v1 navigation should contain only:

1. 今日机会
2. 公司库
3. 机会核实
4. 开发动作
5. 设置

Search query builders, source runs, adapter diagnostics, and raw platform tasks belong in advanced mode or settings. They should not be primary navigation for normal users.

## First-Time Setup

The first setup should ask only five business questions:

1. 我卖什么产品
2. 哪些客户会使用
3. 哪些客户要排除
4. 目标市场
5. 每天希望处理多少机会

The user should be able to complete setup in a few minutes. The system can translate answers into product-line rules, source plans, exclusions, scoring preferences, and daily limits behind the scenes.

## Daily Flow

The daily flow is:

1. User opens 今日机会
2. User sees ranked Opportunity Cards
3. User opens one opportunity
4. User reviews evidence and score explanation
5. User marks verification status
6. User chooses next action
7. User moves to 开发动作 if contact is appropriate

The user should never be forced to pick search mode, strictness, source channel, platform category, or date terms before seeing opportunities.

## Opportunity Card

Each card must include at least:

- `companyName`
- `country`
- `productLine`
- `priority`
- `whyNow`
- `fitSummary`
- `strongestSignals`
- `freshness`
- `evidenceCount`
- `risks`
- `recommendedNextAction`

Example card structure:

```text
P0 · ABC Packaging GmbH · Germany
Product line: Functional masterbatch
Why now: Recent tender mentions colored PP food containers
Fit: Plastic packaging manufacturer, likely uses masterbatch
Signals: recent_tender, target_customer_type_match
Freshness: deadline in 18 days
Evidence: 3 public sources
Risks: tender eligibility unknown
Next action: Verify tender details, then prepare low-pressure intro
```

## Opportunity Detail

Opportunity detail should show:

- Company profile summary
- Product-line fit
- Evidence timeline
- Signal list
- Score breakdown
- Risks and missing information
- Verification checklist
- Suggested next action
- Activity history

AI summaries can help, but the raw evidence must remain visible and unchanged.

## Opportunity Verification

机会核实 should focus on human confirmation:

- Is the original source accessible?
- Is the company real?
- Is the evidence recent enough?
- Does the evidence match the product line?
- Is the company a buyer, distributor, tender owner, or peer supplier?
- Are there contradictions?
- Is the next action safe and appropriate?

Verification should produce a status such as:

- new
- needs_verification
- verified
- ready_to_contact
- contacted
- replied
- qualified
- won
- lost
- rejected
- expired

An Opportunity represents one open account/product-line combination. New evidence updates that existing Opportunity rather than producing duplicate cards. Reactivation after expiry must show why it was reactivated and which evidence caused it.

## Advanced Mode

Search query, source task, and adapter run details should be moved into advanced mode. They are useful for debugging and improving sources, but they should not be the default mental model.
