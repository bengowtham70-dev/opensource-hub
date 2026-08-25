---
title: How we compute Trust Scores (and how to dispute one)
description: The exact heuristic inputs behind our maintenance and trust signals — commit recency, archived status, license clarity, contributor bus factor, backing and OpenSSF Scorecard.
date: 2026-08-24
---

Trust Scores exist because star counts lie: a repo can have 40,000 stars and a single burnt-out maintainer. Here is exactly how the signal is computed — no black boxes.

## The inputs

The scoring engine (`src/server/trust.js` in this repository) starts from six base signals:

1. **Commit recency** — up to 30 points, decaying as the last push ages
2. **Archived flag** — GitHub's own "this repo is done" marker costs 15 points
3. **License clarity** — 15 points when a recognizable license is declared
4. **Issue hygiene** — 15 points from how the project handles its issue tracker
5. **Community traction** — 15 points from stars and derivatives
6. **Project maturity** — 10 points for repo age

Phase-2 additions stack on top:

- **Bus factor** — contributor-count shape; a solo maintainer is risk regardless of stars
- **Backing** — foundation ownership (Apache/CNCF/Linux Foundation patterns) earns credit
- **OpenSSF Scorecard** — we read Google's precomputed score from the free deps.dev API instead of inventing our own security grade

## What it is not

A Trust Score is a **heuristic, not a security audit**. It says "this project looks maintained" — it cannot prove the code is safe. That is why every score ships with that disclaimer on the dashboard.

## Maintenance pills

The green/amber/red pill on each card uses fixed thresholds on the same data:

- **active** — pushed within ~90 days
- **slowing** — pushes are aging out past 90 days
- **abandoned** — archived, or silent for roughly 7 months

On public pages these render only when real collected snapshot data exists. Nothing is fabricated to make a page look complete.

## Disputing a score

Automated flags can be wrong about *your* project — that is a real reputational risk we take seriously (PRD §15). Every trust panel includes a **"Dispute this score"** deep-link that opens a prefilled issue in our repository for human review. No appeals-by-email black hole; the trail is public.
