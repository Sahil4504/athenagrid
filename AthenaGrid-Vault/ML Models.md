---
tags: [athenagrid, ml, teammates]
---

# ML Models

Teammates' AI models (from `Machine_Learning_Models.pdf`). Mostly the Farmer/Industry pillars,
but **Model 6 & 7 feed the [[Transport System]]**.

1. **CropDiseaseDetector** — image + text → disease, treatments, fertilizers.
2. **CropRecommender** — soil/weather/market/effort → recommended crop + reasoning.
3. **ResourceAdvisor** — selected crop → fertilizer/water needs, cost, irrigation type.
4. **GrowthTimelineGenerator** — sowing date + imagery → daily water/fertilizer schedule.
5. **QualityAssessor** — imagery + history → quality score + improvement suggestions.
6. **YieldSegmenter** — → **SalesDistribution**: split harvest into export /
   restaurant-marketplace / food-processing quantities.
7. **LogisticsTransportationOptimizer** — takes `SalesDistribution`, destination hubs, fleet
   (capacity, refrigeration), live traffic/weather, crop perishability → **LogisticsPlan**
   (fleet assignments, GPS waypoints, ETAs, **minimizedLogisticsCost**). Uses GA / deep RL.

## Transport integration
- The transport marketplace consumes **SalesDistribution** (what/where to ship).
- **`minimizedLogisticsCost` (Model 7)** is the intended future **reference price** anchor for
  [[Pricing and Commission]] (replacing the current formula).

Related: [[Project Overview]]
