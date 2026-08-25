---
name: feature-flags
description: "LaunchDarkly/Flagsmith/Vercel patterns, gradual rollouts, percentage splits, A/B toggles."
homepage: https://yepapi.com/skills/feature-flags
metadata:
  tags: [feature-flags, rollouts, ab-testing, toggles]
---

# Feature Flags

## Rules

- Use feature flags for gradual rollouts — ship code behind flags, enable incrementally
- Flag types: boolean (on/off), percentage (10% of users), user-targeting (specific IDs/segments)
- LaunchDarkly for enterprise, Flagsmith for open-source, Vercel Flags or `@vercel/flags` for Next.js
- Evaluate flags server-side by default — only pass flag values to client, never the evaluation logic
- Flag naming convention: `enable-new-checkout`, `show-pricing-v2` — descriptive, kebab-case
- Clean up flags after full rollout — stale flags are tech debt; set expiration dates
- Percentage rollouts: hash user ID for consistent bucketing — same user always sees same variant
- Default to flag-off for new features — fail safe if flag service is unavailable
- Use flags for A/B testing: define variants, track conversion events, measure statistical significance
- Store flag overrides in environment variables for local development

## Patterns

```ts
// Vercel Flags / Next.js pattern
import { flag } from "@vercel/flags/next";

export const showNewCheckout = flag({
  key: "show-new-checkout",
  decide: () => false, // default off
});

// In server component
const enabled = await showNewCheckout();
```

```ts
// LaunchDarkly pattern
import * as ld from "@launchdarkly/node-server-sdk";
const client = ld.init(process.env.LAUNCHDARKLY_SDK_KEY!);

const showFeature = await client.variation("new-checkout", user, false);
```

## Avoid

- Shipping features without a flag — every new feature should be toggleable
- Nested flag dependencies — keep flag logic flat and independent
- Leaving flags in code after 100% rollout — schedule cleanup within 2 weeks
- Client-side flag evaluation exposing targeting rules — evaluate on server, send result
