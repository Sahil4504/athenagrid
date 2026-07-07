---
tags: [athenagrid, vision]
---

# Project Overview

**AthenaGrid** is a Y-Combinator-track startup: a marketplace connecting **US farmers**
with **industries, restaurants and local shops**, with logistics as the connective tissue.

## The three pillars
1. **Farmer tools** — a farmer shares land details; the platform recommends a suitable
   crop, does disease detection & prevention, quality assessment, resource advising,
   growth-timeline and yield segmentation. *(teammates — powered by [[ML Models]])*
2. **Industry marketplace** — recommends nearby suppliers of seeds/pesticides/equipment;
   lets industries/restaurants/shops buy harvested crops from farmers. *(teammates)*
3. **[[Transport System]]** — the USP. All movement of goods (farmer → industry / restaurant
   and back) is managed here: a job is posted, carriers/drivers **bid**, the best bid wins,
   and delivery is tracked live. **Sahil owns this end to end.**

## Team split
- Teammates: Farmer + Industry segments and the ML models.
- **Sahil:** the complete transportation functionality (this vault).

## How transport ties into the rest
The transport module consumes the ML `SalesDistribution` output (yield split into
export / marketplace / processing) and the `LogisticsTransportationOptimizer`
(`minimizedLogisticsCost`) — see [[ML Models]] — which is the intended future input to
the [[Pricing and Commission]] reference price.

Related: [[Architecture]] · [[Roadmap]]
