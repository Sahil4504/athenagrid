---
tags: [athenagrid, transport, bidding]
---

# Bidding Engine

The heart of [[Transport System]]. Code: `apps/api/src/bids/`.

## Verification gate
Only **VERIFIED** carriers can bid. New signups are UNVERIFIED unless the
`AUTO_VERIFY_CARRIERS=true` flag is set (on for the test deployment so friends can bid
immediately — see [[Deployment]]). The guard rejects unverified bidders at the API boundary,
before the auction.

## Placing a bid (concurrency-safe)
`BidsService.placeBid` opens a Postgres transaction, re-reads the job `FOR UPDATE`, and asserts:
job is `OPEN`, bidding window still open, carrier `VERIFIED`, vehicle belongs to carrier,
vehicle is refrigerated if cold-chain, and capacity ≥ cargo weight. Then upsert (unique
`jobId+carrierId` → one bid per carrier). Broadcasts `bid:new` over WebSocket to the job room.

## Multiple concurrent bidders — how it's handled
- Unique constraint = one bid per carrier per job.
- Row-locked award transaction = no double-award, no late bids after close.
- Every bid broadcasts live, so the shipper's feed updates instantly regardless of how many
  bidders pile in. Tested with several seeded accounts → [[Accounts and Testing]].

## Awarding
`BidsService.award` (one transaction): mark winning bid `WON`, reject the rest, flip job to
`AWARDED`, create the **Trip** (auto-assign the carrier's driver / the individual themselves),
create the **Settlement** ([[Pricing and Commission]]), write an AuditLog. Emits `bid:awarded`.

## Scoring (not just cheapest)
Shipper's bid list is scored against the fair band and the best is flagged **Recommended** —
see [[Pricing and Commission]].

Related: [[Data Model]] · [[Architecture]]
