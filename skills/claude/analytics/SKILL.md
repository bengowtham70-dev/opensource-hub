---
name: analytics
description: "Web analytics integration — event tracking, custom dashboards, privacy-first."
homepage: https://yepapi.com/skills/analytics
metadata:
  tags: [analytics, tracking, events, privacy]
---

# Web Analytics

## Rules

- Privacy-first: use Plausible, Fathom, or Umami for GDPR compliance — or self-host PostHog
- Server-side tracking for accuracy: Next.js middleware or API routes — not client-side only
- Custom events: track meaningful actions (signup, purchase, feature_used) — not just page views
- UTM parameters: parse `utm_source`, `utm_medium`, `utm_campaign` from URL — store with conversion events
- Event naming convention: `snake_case`, verb_noun format: `click_cta`, `submit_form`, `view_pricing`
- Dashboard: build internal analytics page using YepAPI domain data + your own event data
- Consent banner: required in EU — only load tracking after consent
- Exclude internal traffic: filter by IP or authenticated admin users

## Avoid

- Google Analytics without cookie consent — GDPR violation
- Tracking everything — focus on actionable metrics, not vanity page views
- Client-side only tracking — ad blockers remove 20-40% of data
- Sending PII (email, name) to analytics — use anonymous IDs
