# 科聚隆外贸机会雷达

English name: Kejulong Trade Opportunity Radar

## Core Question

The product exists to answer one operational question every day:

> 今天最值得联系的客户是谁，为什么现在值得联系，下一步应该做什么？

The user should not need to understand search operators, RFQ platforms, source channels, strictness levels, freshness filters, or product-line query logic. The system should turn source evidence into a short, ranked, explainable list of opportunities.

## What This Product Is Not

Kejulong Trade Opportunity Radar is no longer positioned as:

- A search keyword generator
- A Google search tool
- An RFQ searcher
- A multi-platform link collection
- A dashboard that asks users to tune many search concepts before seeing value

Search tasks and source queries still exist, but they belong in advanced mode, source adapters, and evidence collection jobs. They are not the main user experience.

## Target Users

The primary users are small manufacturers, export sales owners, and business managers who are not experts in overseas lead search.

They need:

- A daily shortlist of companies worth contacting
- Evidence they can inspect
- A clear reason the timing is relevant
- A suggested next action
- A way to verify before contacting

They do not want to become search engineers.

## Product Lines

The initial product lines are:

- 色母 / 功能母粒
- 3D 打印耗材

The product-line model must separate target buyers, peer suppliers, and irrelevant sources. For example, 3D filament opportunities must not be mixed with masterbatch downstream buyers, and masterbatch opportunities must not be mixed with 3D printing service demand unless evidence explicitly supports a cross-product opportunity.

## Core Outcomes

The product should produce:

- Daily opportunity list
- Real evidence
- Explainable scores
- Manual verification workflow
- Recommended next development action

## Opportunity Definition

An opportunity is not just a company. It is a company plus product line plus timely evidence plus a next action.

Examples:

- A plastic packaging manufacturer expanding a product line that uses color masterbatch
- A distributor repeatedly importing PLA filament
- A tender mentioning relevant product terms and a valid deadline
- A company page plus recent public procurement signal

No evidence means no high-priority opportunity.

## Product Principle

The v1 product should hide complexity by default:

- Users see opportunities, not queries
- Users see reasons, not raw scoring formulas
- Users see evidence, not scraped claims
- Users see next actions, not feature menus
- Users verify before saving or contacting

Advanced search and source operations should be available for debugging, but not required for normal use.

## v1 Deployment Boundary

The first v1 release is a local, single-user application:

- Next.js running in the Node runtime
- SQLite and Drizzle ORM
- Data stored on the user's local machine
- No account system and no multi-user collaboration
- No deployment of SQLite to Vercel
- No cloud-scheduled source runs in the MVP

The Repository layer is the boundary between business behavior and persistence. Domain and application services must depend on repository interfaces, not SQLite tables, Drizzle query objects, or database-specific types. PostgreSQL can replace SQLite later without rewriting opportunity, evidence, scoring, or verification rules.
