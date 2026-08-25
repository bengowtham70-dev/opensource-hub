---
title: A self-hosting starter stack you can actually run
description: Five open-source tools — Nextcloud, Jitsi Meet, Navidrome, Bitwarden and Coolify — that replace a stack of paid subscriptions on one home server.
date: 2026-08-22
---

"Self-host everything" is great advice until you try to follow it. The realistic version: pick five services you *actually pay for*, run them on a single mini-PC, and stop renting them monthly. All five below ship official Docker images.

## The stack

1. **Files & sync** — [Nextcloud](/server) replaces Dropbox (≈$120/yr for 2TB). The Docker image is the official install path.
2. **Video calls** — [Jitsi Meet](/jitsi-meet) replaces Zoom for small-group calls; no account required for guests.
3. **Music streaming** — [Navidrome](/navidrome) is a lightweight Spotify-substitute server for music you own.
4. **Passwords** — [Bitwarden](/clients) self-hosted replaces 1Password/LastPass subscriptions, with official mobile clients.
5. **Everything else** — [Coolify](/coolify) is the Heroku-style deployment layer that makes hosting the first four dramatically easier.

## Hardware reality check

A used mini-PC with 16GB RAM and an SSD runs this entire stack comfortably. That is a one-time ~$150–250 instead of recurring fees.

## The honest difficulty curve

- Nextcloud, Navidrome: **beginner** — docker compose up and you are done.
- Bitwarden: **beginner**, but back up your vault encryption key or risk lockout.
- Jitsi: **intermediate** — needs a domain and TLS certificate.
- Coolify: **intermediate** — it manages the others, so read its docs first.

## Where to go deeper

Browse every self-hostable tool in the catalog under [Self-hosted essentials](/collections/self-hosted), and filter by [Docker](/stacks/docker) to see which projects ship container images.
