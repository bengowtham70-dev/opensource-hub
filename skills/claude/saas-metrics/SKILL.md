---
name: saas-metrics
description: "Churn rate, LTV, CAC, cohort analysis, MRR waterfall, and expansion revenue tracking."
homepage: https://yepapi.com/skills/saas-metrics
metadata:
  tags: [saas, metrics, churn, ltv]
---

# SaaS Metrics

## Rules

- Churn rate: (customers lost in period / customers at start of period) * 100 — calculate monthly, track logo churn and revenue churn separately
- LTV (Lifetime Value): ARPU / monthly churn rate — or sum of revenue per customer over their lifetime for actuals
- CAC (Customer Acquisition Cost): total sales + marketing spend / new customers acquired in period
- LTV:CAC ratio: target 3:1 or higher — below 1:1 means losing money on every customer
- Net Revenue Retention (NRR): (starting MRR + expansion - contraction - churn) / starting MRR * 100 — target >100%
- MRR waterfall: display as stacked bar chart — new, expansion, contraction, churn, net change per month
- Cohort analysis: group customers by signup month — track retention and revenue per cohort over time — display as heatmap
- Expansion revenue: track upgrades, add-ons, and seat additions separately — expansion >30% of new MRR is healthy

## Metric Calculations

```typescript
function churnRate(startCustomers: number, lostCustomers: number): number {
  return (lostCustomers / startCustomers) * 100;
}

function ltv(arpu: number, monthlyChurnRate: number): number {
  return arpu / (monthlyChurnRate / 100);
}

function nrr(startMRR: number, expansion: number, contraction: number, churn: number): number {
  return ((startMRR + expansion - contraction - churn) / startMRR) * 100;
}
```

## Cohort Table Schema

```sql
CREATE TABLE cohort_metrics (
  cohort_month DATE NOT NULL,
  period_month DATE NOT NULL,
  customers_start INTEGER NOT NULL,
  customers_end INTEGER NOT NULL,
  revenue_cents INTEGER NOT NULL,
  PRIMARY KEY (cohort_month, period_month)
);
```

Query: `SELECT cohort_month, period_month, (customers_end::float / customers_start * 100) as retention_pct FROM cohort_metrics`.

## Avoid

- Confusing logo churn with revenue churn — a big customer leaving is worse than 5 small ones
- Calculating LTV without accounting for churn — infinite LTV is not real
- Monthly-only snapshots — store event-level data to allow recomputation
- Ignoring negative churn (NRR >100%) as a goal — expansion revenue is the path to growth
