# Privacy Policy — OpenSource Hub

_Effective 2026-08-26. Contact via GitHub Issues until a dedicated support email is published._

**Effective date:** 2026-08-26 · **Contact:** https://github.com/opensource-hub/opensource-hub/issues

## The short version

The app runs on your machine. Your favorites and caches stay on your machine. We operate no
accounts and no central database of users.

## What is stored locally

- **Favorites** — a JSON file in your OS user-data directory. Never transmitted to us.
- **API cache** — temporary GitHub API responses (ETag-cached) to respect rate limits.

## What leaves your machine

- **Requests to GitHub's public API and codeload/archive endpoints** — made directly from your
  machine when you open repo details or download releases. GitHub's own privacy policy applies.
- **Static snapshot data** — fetched from GitHub Pages/jsDelivr (public, non-personal).
- **Comments** — if you use the discussion feature, you interact directly with GitHub under your
  GitHub identity.

## Analytics

**Local counters only.** The app counts how many times it has been run and stores that number
in your local user-data folder (visible in-app). The counter never leaves your machine — there
is no telemetry endpoint and no network call.

If remote, aggregate analytics are ever considered, they will be **strictly opt-in** via an
environment flag, disclosed here first, and kept non-identifying (PRD §16).

## Payments

If paid tiers launch (Trust Score Pro, AI Tool Finder), payment processing will be handled by
the processor disclosed at that time (none currently — no payments are processed); we store
only what is operationally required and disclosed before any paid tier goes live.

## Your control

Delete the app's local folder at any time to remove all local data:
`%LOCALAPPDATA%\opensource-hub` (Windows) · `~/Library/Application Support/opensource-hub`
(macOS) · `~/.config/opensource-hub` (Linux). Uninstall with
`npm uninstall -g opensource-hub`.

## Ads & Affiliate Disclosure

Some outbound hosting/deployment links on the site may be affiliate or revenue-share links. Sponsored placements are always labeled **Sponsored** and never influence rankings, Trust Scores, or catalog inclusion.
