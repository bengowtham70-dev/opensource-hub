---
name: pricing-pages
description: "Tier comparison layouts, feature gates, toggle monthly/annual, and usage-based billing UI."
homepage: https://yepapi.com/skills/pricing-pages
metadata:
  tags: [pricing, billing, tiers, saas]
---

# Pricing Pages

## Rules

- 3 tiers max: Free/Starter, Pro, Enterprise — highlight the recommended tier with a "Most Popular" badge
- Monthly/annual toggle: show both prices, display annual savings ("Save 20%") — default to annual
- Price display: large font for price, small for period ("/mo") — show annual price as monthly equivalent
- Feature comparison table: checkmarks for included features, dashes for excluded — group features by category
- CTA per tier: "Get Started" (free), "Start Free Trial" (pro), "Contact Sales" (enterprise) — one CTA per card
- Feature gates: define features per plan in a config object — check `user.plan` against feature config at runtime
- Usage-based pricing: show a calculator/slider for usage tiers — update price dynamically as user adjusts
- Social proof: show customer count or logos near pricing — "Trusted by 5,000+ teams"
- FAQ section below pricing — address common objections (cancellation, refunds, upgrades)

## Feature Gate Pattern

```typescript
const PLAN_FEATURES = {
  free: { maxProjects: 3, analytics: false, api: false },
  pro: { maxProjects: 50, analytics: true, api: true },
  enterprise: { maxProjects: Infinity, analytics: true, api: true },
} as const;

function hasFeature(plan: string, feature: string): boolean {
  return !!PLAN_FEATURES[plan]?.[feature];
}
```

## Pricing Card Layout

```
[Badge: "Most Popular"]
Plan Name
$XX/mo (billed annually)
$YY/mo (billed monthly)
- Feature 1 ✓
- Feature 2 ✓
- Feature 3 ✗
[CTA Button]
```

## Avoid

- More than 4 tiers — causes decision paralysis
- Hiding pricing behind "Contact Sales" for all tiers — developers leave
- No annual discount — annual plans reduce churn and improve cash flow
- Feature comparison without clear grouping — becomes unreadable at 10+ features
