# Feature Backlog

This file is a prioritized reference of the most useful trading journal features
to consider next.

The ranking is based on current feature patterns across:

- TradeZella
- TraderSync
- Edgewonk
- TradesViz

The goal is not to copy them blindly. The goal is to identify the features that
most directly help traders:

- spot profitable setups
- spot costly mistakes
- improve rule adherence
- design better strategies

Sources used:

- https://www.tradezella.com/features
- https://www.tradezella.com/
- https://tradersync.com/features/
- https://edgewonk.com/features
- https://www.tradesviz.com/

## Current Status

### Implemented

- Rule adherence / followed-plan tracking
- Mistake tagging on trades
- Advanced filter bar on real and demo journals
- Timeframe-aware dashboard analytics
- Range-aware cumulative P&L chart
- Setup capture on trades
- Grade and confidence scoring fields
- Setup analytics on real and demo analytics pages
- Best / worst setup reporting through ranked setup tables
- Playbook / strategy pages on real and demo routes
- Review scoring analytics with grade and confidence breakdowns

### Partially Implemented

- Weekly / monthly review foundations
  Current state:
  the app now stores review metadata and exposes review analytics, but there is not yet a dedicated recurring review workflow or calendar-period report surface

### Not Implemented

- Planned stop / target / risk vs actual
- Screenshot attachments
- Saved views
- Expectancy and R-multiple
- Time-of-day and day-of-week reports
- Trade replay
- AI Q&A / AI summaries
- Backtesting / simulator
- Mentor / read-only sharing

## Highest Relevance

### 1. Setup Analytics

What it is:

- setup-level performance reporting
- win rate by setup
- total P&L by setup
- average win / average loss by setup
- sample size by setup

Pros:

- directly answers which setups actually work
- easy to understand
- high value without requiring heavy UI complexity

Cons:

- only useful if setup naming is consistent
- weak data hygiene makes the report noisy

Why it matters:

- this is one of the fastest ways to improve strategy selection

### 2. Mistake Tagging And Mistake-Cost Report

What it is:

- attach mistake tags to trades
- report how often each mistake happens
- show total money lost by each mistake pattern

Pros:

- exposes repeated execution errors quickly
- directly aligns with journaling as a self-improvement tool
- strong leverage feature for behavioral review

Cons:

- requires honest tagging
- can be underused if the UI adds too much friction

Why it matters:

- this is one of the most useful features for reducing avoidable losses

### 3. Rule Adherence / Followed-Plan Tracking

What it is:

- mark whether a trade followed the plan
- compare followed-plan vs broken-plan performance

Pros:

- separates bad strategy from bad execution
- useful for coaching and self-review
- simple concept with strong analytical value

Cons:

- needs a lightweight rules model
- can become noisy if too many subjective rules exist

Why it matters:

- traders need to know whether they are losing because of discipline or because
  the setup itself is weak

### 4. Planned Stop / Target / Risk Vs Actual

What it is:

- record planned entry, stop, target, and intended risk
- compare actual outcome against plan

Pros:

- enables serious review of trade quality
- helps explain oversized losses and poor exits
- creates the foundation for R-multiple metrics

Cons:

- adds more inputs unless kept optional
- requires careful UX so data entry stays fast

Why it matters:

- this is the bridge between a trade log and a true decision journal

### 5. Advanced Filter Bar And Saved Views

What it is:

- filter by setup, tag, mistake, timeframe, symbol, direction, account, and review fields
- optionally save useful filter combinations

Pros:

- makes every analytics feature more useful
- lets users answer real review questions quickly
- supports workflows like “show all late-entry losses on opening setups”

Cons:

- filter UX can become cluttered
- saved views introduce more state and persistence complexity

Why it matters:

- analytics are only useful if the user can isolate the conditions they care about

### 6. Screenshot Attachments

What it is:

- attach pre-trade, in-trade, or post-trade screenshots

Pros:

- very high review value
- connects execution decisions to price context
- useful for maintaining a high-quality playbook

Cons:

- storage and compression need to be handled well
- more work than purely text-based review features

Why it matters:

- screenshots are one of the most valuable inputs for reviewing both setups and mistakes

## Strong Next Tier

### 7. Time-Of-Day And Day-Of-Week Reports

What it is:

- P&L and win rate by hour block
- P&L and win rate by weekday

Pros:

- often reveals hidden edge or recurring weak periods quickly
- relatively simple once timestamps are structured

Cons:

- can be misleading with small sample sizes

### 8. Best Setup / Worst Setup Report

What it is:

- direct ranking of strongest and weakest setups

Pros:

- highly actionable
- helps prune unproductive trade types

Cons:

- needs enough sample size per setup
- depends on normalized setup definitions

### 9. Playbook / Strategy Pages

What it is:

- a page per setup or strategy
- thesis, entry criteria, invalidation, checklist, examples

Pros:

- turns the app into a repeatable process tool
- pairs naturally with setup analytics and screenshots

Cons:

- content-heavy feature
- only useful if maintained over time

### 10. Weekly / Monthly Review Reports

What it is:

- structured review summaries by week or month

Pros:

- encourages consistent review habits
- helps detect changes in discipline and performance over time

Cons:

- lower value if the user does not review regularly

### 11. Expectancy And R-Multiple

What it is:

- expectancy per trade
- average R
- setup performance in R instead of just dollars

Pros:

- strong metric for comparing strategies fairly
- useful once planned risk is recorded correctly

Cons:

- requires good risk-plan data
- more advanced than basic P&L metrics

### 12. Trade Replay

What it is:

- replay the trade and its context after the fact

Pros:

- powerful for execution review
- visually compelling feature

Cons:

- expensive and complex to build
- lower ROI than simpler analytics earlier on

## Useful But Lower Priority

### 13. AI Q&A / AI Summaries

What it is:

- ask questions about trading history in natural language
- AI-generated summaries of strengths and weaknesses

Pros:

- attractive and flexible
- can help with discovery

Cons:

- easy to build something gimmicky
- structured analytics are usually more reliable
- adds cost and complexity

### 14. Backtesting / Simulator Inside The Journal

What it is:

- test strategy ideas or replay scenarios within the app

Pros:

- powerful long-term feature
- strong differentiation if done well

Cons:

- very large scope
- not needed before the core journaling system is strong

### 15. Mentor / Read-Only Sharing

What it is:

- share trades or journals with a mentor or trusted friend in read-only mode

Pros:

- useful for accountability and coaching
- fits small private multi-user workflows

Cons:

- adds permissions complexity
- not as core as review analytics for v1

## Recommended Build Order

This is the recommended order for this project:

1. Setup analytics
2. Mistake tagging and mistake-cost analytics
3. Followed-plan plus planned stop / target / risk
4. Advanced journal filters
5. Screenshot uploads
6. Weekly review page
7. Expectancy and R-multiple
8. Playbook pages
9. Time-of-day and day-of-week reports
10. Replay much later

## Why This Order

The strongest journaling tools do not win because they have the most charts.
They win because they help traders answer:

- what setup works best
- what mistake costs the most
- when discipline breaks down
- how risk management changes results

The features above are ordered to maximize those answers as early as possible.
