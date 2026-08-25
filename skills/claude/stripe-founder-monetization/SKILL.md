---
name: stripe-founder-monetization
description: End-to-end integration patterns for Stripe Checkout, recurring sponsorship subscriptions, paid directory submission tiers ($97, $137, $197/mo), webhook verification, and automated GitHub repository validation.
---

# Stripe Founder Monetization & Submission Pipeline

## 1. Submission Tiers & Pricing Models
- **Tier 1: Standard Review ($97 one-time):**
  - Mode: `payment`
  - Automated 48-hour review turnaround and verified listing in the directory.
- **Tier 2: Premium with Do-Follow SEO Backlink ($137 one-time):**
  - Mode: `payment`
  - 24-hour review queue + verified do-follow high-authority link to the tool repo/domain.
- **Tier 3: Featured Ultimate Placement ($197/month recurring):**
  - Mode: `subscription`
  - Pinned category placement, header banner rotation, weekly newsletter feature.

## 2. Stripe Checkout Session Architecture
- Backend creates Stripe Checkout session:
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: `OpenSource Hub — ${tierName}`,
        description: `Verified listing for ${repoSlug}`,
      },
      unit_amount: priceInCents,
      ...(isRecurring ? { recurring: { interval: 'month' } } : {}),
    },
    quantity: 1,
  }],
  mode: isRecurring ? 'subscription' : 'payment',
  metadata: { repoSlug, submitterEmail, tierId },
  success_url: `${origin}/submit/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/submit?canceled=true`,
});
```

## 3. Webhook Handling (`/api/webhooks/stripe`)
- Verify raw signature with `stripe.webhooks.constructEvent(payload, sig, endpointSecret)`.
- On `checkout.session.completed`:
  1. Extract `metadata.repoSlug` and `metadata.tierId`.
  2. Validate repo via GitHub API (check existence, stars, license).
  3. Mark submission record as `"status": "paid_verified"` and enqueue for automatic listing build.
