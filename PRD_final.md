# Product Requirements Document
## Open Source Hub — Complete Spec

---

## 1. What this is

A **terminal-installed developer tool**. The website's only job is a clean landing page — it shows the install command in a copy-able box; users never visit npm's own website at all. One command in their terminal, and the app runs locally on their machine with a browser dashboard. Three things happen there:

1. **Find a free alternative to paid software you're already paying for** — many established, paid tools (project management, design, analytics, note-taking, etc.) have free, open-source equivalents on GitHub that most people never hear about. This app surfaces them, with a real dollar-savings estimate.
2. **Trust what you're downloading** — every listed repo gets a plain-language trust/health signal, so "free alternative" doesn't mean "unverified risk."
3. **Discover and learn generally** — trending repos, what open source means, one-click download.

No GitHub account, no API key, no signed installer, and no npm website visit required.

### 1a. The three real problems (every feature must serve one of these)

Everything in this document exists to solve exactly three validated user problems — ranked by how much pain real users express on Reddit, Hacker News, and in competitor audits. This is the anti-feature-creep rule: **any new feature idea must name which problem it deepens; if it names none, it is deferred by default.**

1. **"I'm paying for software — is there a free alternative that actually works for me?"**
   Served by: alternative finder (2.1), feature-parity checklist (2.1), relationship typing — direct/partial/fork (38), goal-first browsing (38), live demo links (35), TCO calculator (3), team-size fit guidance (3a), AI Tool Finder (21).
2. **"Is this repo safe to install — and will it still be maintained next year?"**
   Served by: Trust Score + red flags (2.2), OSV.dev vulnerability badge (29), release checksums/Sigstore (29), freshness pills + monthly health diffs (38), bus-factor & backing signals (38), successor/fork pointers (38), typosquat warnings (29).
3. **"Can I actually switch without breaking my workflow?"**
   Served by: guided migration plans (38), migration notes (2.1), self-hosting difficulty badge + Docker badge (3, 3a), "Can I run this?" hardware calculator (38), compose generator (38), trial-sprint suggestion (3a), one-click deploy buttons + managed hosting (3, 36).

---

## 2. Core features

### 2.1 Paid-tool alternative finder (the core hook)
- Search or browse by the **paid tool name** you already use ("Notion," "Postman," "Figma," etc.).
- Each match shows: the free/open-source alternative, an estimated **annual savings** (paid tool's typical price − $0), and a plain-language feature comparison.
- **Feature-parity checklist** — does the free alternative cover the core things people actually use the paid tool for, or is it missing key pieces? Community-editable, not just your own claim.
- **Migration notes** — short guidance on moving data from the paid tool to its free alternative, where available.

### 2.2 Trust & health signals (new, from research)
Real problem, confirmed by current reporting: malicious repos disguised as legitimate projects are a large and growing issue, and star count alone doesn't indicate whether a project is safe or still maintained. Every repo gets:

- **Maintenance status** — Active / Slowing / Abandoned, computed from the star-snapshot and last-commit data you're already tracking.
- **Trust Score** — a composite signal from commit recency, contributor count, presence of a security policy, license clarity, and issue-response activity.
- **Red-flag check** — surfaces common warning signs (no README, obfuscated install scripts, suspiciously sudden star spikes on a brand-new account) as a visible caution badge, not a silent block — the user always decides.
- **Where these signals surface (mandatory, not optional):** every repo detail page shows an animated circular Trust Score meter (0–100, color-shifting emerald → teal → amber → red as score drops) with an expandable per-signal breakdown and an honest "heuristic, not a security audit" disclaimer; every comparison card carries a color-coded maintenance pill (green Active / amber Slowing / red Abandoned); red flags render as an amber glass banner, never a silent block. All signals are computed server-side purely from metadata already returned by the single per-repo GitHub lookup — zero extra API quota cost.
- **Implementation status (2026-08-24):** scoring engine (`src/server/trust.js`: commit recency 30pts, archived flag 15, license clarity 15, issue hygiene 15, community traction 15, project maturity 10), `trust` field wired onto `/api/repo/:owner/:name`, unit tests (`test/trust.test.js`), and the animated `TrustMeter` component exist. Remaining: maintenance-pill integration into RepoCard + client-side tests.
- This directly addresses the "stars don't tell you if it's safe" gap that dedicated commercial tools (Snyk, Sonatype, and similar) already charge companies real money to solve — see monetization in section 6.

### 2.3 Trending views
Four views, all star-driven: Today's trending, Yesterday's trending, Least trending (established repos with smallest 7-day growth), All-time most starred. Requires a daily star-snapshot table.

### 2.4 Favorites
Local, one-click, no login required. Dedicated view, most recent first.

### 2.5 Comments & ratings
Public per-repo thread, visible to all users, powered by giscus/GitHub Discussions — see section 5. Comment moderation: GitHub Discussions has its own reporting tools built in (delete, lock, mark as spam) usable by anyone with repo access — this substitutes for a custom moderation system at $0 cost, though it isn't pre-publish moderation like AlternativeTo's (see the honest reconciliation note in section 3b).

**Ratings, adapted to fit the $0 architecture:** true 1-5 star ratings would need a custom backend to store and tally them, which breaks the no-server architecture. Instead, use **GitHub Discussion reactions** (👍) as the popularity/approval signal — natively free, already built into giscus, and functionally the same role as AlternativeTo's own "likes" signal (section 3b confirms their ranking already treats likes as just one input, not a full star system, so this isn't actually a downgrade in practice — it's the same mechanism they use).

### 2.6 Download
One-click via GitHub's own public zip URL. Repos with a packaged release (`.exe`/`.dmg`/`.apk`) get a "Run it" button; everything else gets "Download source" plus an auto-generated "how to run this" note.

### 2.6a "Download & Run" for non-technical users — what's actually possible
Important constraint, confirmed and worth stating plainly: **no website can silently download and run software on someone's computer with zero clicks** — every browser and operating system blocks this on purpose, as basic malware protection. This is true for every website that exists, not a limitation specific to this app.

What *is* achievable, and fully covers "a non-technical person never has to see a terminal":
- One click downloads a file (a real `.exe` or `.dmg`, only for repos that ship one as a GitHub Release).
- The user double-clicks that one file — identical to installing any normal app (Spotify, Zoom, etc.). No typing, no command line, no terminal, ever.
- This only works for repos with a packaged release attached. Plain source-code repos (the majority) cannot skip a build/setup step no matter how they're delivered — that limitation is about the code itself, not about web vs. desktop or any hosting choice.
- The app must clearly distinguish these two cases so non-technical users only ever attempt the ones that will actually work for them.

### 2.7 Learn section
Plain-language articles on GitHub, open source, licenses, and why source code needs a build step.

### 2.8 Search & filters
By paid-tool name, keyword, language, category, **platform** (Mac/Windows/Linux/Web/Android/iOS — computed from repo topics/README signals since GitHub doesn't expose this directly), and **license type** (Free/Open Source/Proprietary-with-source).

### 2.9 Screenshots
Each listing shows a small screenshot gallery pulled from the repo's own README images where available (most well-maintained projects already embed one) — answers "what does this look like" instantly, no extra data source needed beyond what's already in the repo.

### 2.10 Public curated lists
Beyond personal favorites (section 2.4, private/local), users can publish a named public list of repos (e.g. "Best self-hosted alternatives to Notion") that others can browse and follow. Implementation stays $0: a public list is just a GitHub Discussion thread (via giscus) with a structured format, or a simple JSON file submitted via pull request and rendered by the same sync job that builds section 5's data files.

---

## 3. Additional features for broader usefulness

Beyond the core loop, these extend who the app is useful to and how often people come back:

- **Watchlist/alerts** — follow a paid tool you use; get notified when a new or better free alternative appears, or when an existing one's trust score changes.
- **Total cost of ownership calculator** — the free alternative isn't always $0 in practice (self-hosting has server costs). A simple calculator estimates real all-in cost (e.g. "$5/mo hosting" vs. "$240/yr for the paid tool") so the savings claim stays honest.
- **Self-hosting difficulty badge** — "one-click deploy," "needs Docker knowledge," "needs a sysadmin" — sets expectations before someone commits to switching.
- **One-click deploy buttons** — for repos that support it, a direct "Deploy to Railway/Render/Vercel" button (these platforms provide these buttons natively) — removes the single biggest barrier between "download" and "actually using it."
- **Comparison pages** ("X vs Y free alternatives") — strong for organic search traffic.
- **Curated collections** ("Free alternatives to every tool in a startup's stack") — shareable, good for reach.
- **"Claim this repo" for maintainers** — verified maintainers can respond to comments and correct feature-parity claims, improving data quality and trust.
- **License compliance flag** — clearly shows if a license restricts commercial use, so switching doesn't create legal risk for a business user.
- **Team/company mode (later)** — a company could plug in their current paid-software stack and get a report of viable free alternatives across the board. This is the same idea as the individual finder, aimed at a buyer with a budget instead of an individual — see monetization.

## 3a. Features validated by direct competitors (worth matching or beating)

Pulled directly from what opensourcealternatives.to, openalternative.co, and AlternativeTo actually offer today — these aren't guesses, they're proof the feature is expected by users in this space:

- **Multi-filter browsing** — filter results by category, license type, programming language, star count, and date added, all at once, not just a single search box. Competitors treat this as baseline, not a bonus.
- **License certification badge, specifically** — competitors distinguish OSI-certified open source (AGPL, MIT, etc.) from "source-available but not truly open" licenses (like ASAL), and flag licenses such as BSL that restrict competing hosted services. This is more precise than a generic "license shown" feature — it directly serves the compliance-conscious business user your alternative-finder is aimed at.
- **Objective inclusion criteria, stated publicly** — top competitor roundups only include tools with active development in the last 90 days, an official Docker image, and documented real-world production use. Publishing your own version of this bar (tied to your Trust Score) makes your curation feel rigorous, not arbitrary.
- **Official Docker image badge** — a direct, binary signal of self-hosting readiness, more concrete than a general "difficulty" label.
- **Per-plan cost comparison, not just a flat number** — competitors show real numbers like "Auth0 B2B Essentials at $800/month = $9,600/year, vs. self-hosted at $12–24/month" — naming the actual paid plan tier being compared, not a vague "expensive." Your Total Cost of Ownership calculator (section 3) should follow this same specificity.
- **Team-size fit guidance** — explicit advice like "under 10 people: any option works; 10–50: you need access-control features; 50+: self-hosting infrastructure becomes the deciding factor." Turns a feature-parity checklist into an actual recommendation.
- **"Trial sprint" suggestion** — competitors explicitly recommend running a tool for a real project for two weeks before fully migrating, rather than committing cold. Cheap to add as a tip, reduces regret, builds trust.
- **Free weekly digest email** — validated by opensourcealternatives.to as their retention mechanism; matches the "weekly trending digest" already planned in section 3, worth prioritizing since a direct competitor treats it as core, not optional.
- **Daily data refresh, explicitly stated to users** — competitors tell users their data is "updated from GitHub once per day" as a trust signal. Worth surfacing your own sync timestamp in the UI the same way, not just computing it silently.
- **SEO-driven blog/roundup content** ("Best Self-Hosted Apps in 2026," "9 Best Notion Alternatives") — this is a major traffic driver for competitors and ties directly into the growth plan in section 11; worth treating as a content workstream, not an afterthought.

---

## 3b. Features validated by AlternativeTo specifically (the largest direct competitor)

Real, confirmed features from AlternativeTo's live product, not guesses:

- **Star ratings (1-5), alongside comments** — reconciled with the $0 architecture in section 2.5: giscus/GitHub Discussions doesn't support true star ratings without a custom backend, so this is adapted to use GitHub Discussion reactions (👍) as the approval signal instead — same functional role, zero extra infrastructure.
- **Platform filter** — filter results by Mac, Windows, Linux, Online/web, Android, iPhone, etc., in addition to the language filter already planned. Matters a lot for anyone checking whether a self-hosted tool actually runs on their setup before they invest time in it.
- **License-type filter** — Free / Open Source / Proprietary as a first-class filter, not just a badge shown after the fact.
- **Screenshot gallery per listing** — several images per tool showing what it actually looks like. Text and stats alone don't answer "what does this look like" the way a screenshot does instantly.
- **Public, shareable curated lists** — beyond personal favorites, lists other users can browse and follow (e.g. "privacy tools," "self-hosted alternatives to X"). Personal favorites are private by nature; public lists are the social, discoverable version of the same idea.
- **Pre-publish comment/review moderation** — reconciled with the $0 architecture: giscus/GitHub Discussions doesn't support pre-publish review, only after-the-fact moderation (delete/lock/mark spam, available natively to repo maintainers at no cost). This is a real trade-off versus AlternativeTo's stricter pre-publish system, accepted here to keep the $0 architecture — worth revisiting only if spam becomes an actual problem in practice, not before.
- **Visible safety warning banner, reactive and community-driven** — when a user reports a security or privacy issue with a listing, a warning banner appears directly on that listing's page. This is distinct from and complements the automated Trust Score (section 2.2): Trust Score is computed/passive, this banner is user-reported/immediate, and both together cover more ground than either alone.
- **Explicit, publicly stated inclusion bar** — a listed alternative must genuinely solve a similar problem, not just be loosely related, and must meet a basic quality/language bar. Stating your own version of this publicly (tied to the objective inclusion criteria already in section 3a) builds curation trust.
- **Anti-manipulation ranking design** — ranking isn't sorted by raw votes/likes alone; multiple signals feed into it, and part of the exact algorithm is deliberately kept private specifically to resist gaming. Worth adopting directly — nothing in the current PRD addresses vote/star manipulation resistance yet, and it's a real risk once Trust Score and community voting both exist.

**Deliberately not adopting (for now):** AlternativeTo also runs a browser extension and a full news/editorial section. Both are separate ongoing products to build and maintain — a second codebase and a content team, respectively — not v1 features. Revisit once there's real traction, not before.

## 3c. Features validated specifically by OpenAlternative.co (Deep Competitive Audit)

Extracted directly from an architectural analysis of openalternative.co ($6,700+/mo revenue, 1M+ monthly visits):

- **30-Day Star Momentum & SVG Sparkline Graph** — displays not just a flat star count, but a 30-day trajectory curve and percentage growth indicator (e.g., `+1,009 (+1.4%) in 30 days`). Visually communicates whether a repository is gaining rapid traction or stagnating.
- **Tech Stack & Architecture Deep Tags** — automatically categorizes tools by their underlying frameworks and infrastructure (e.g., Docker, TypeScript, Rust, Electron, SQLite, CRDT, Tailwind, React, etc.), allowing developers to filter by self-hosting stack compatibility.
- **Curated Micro-Collections** — dedicated high-interest collections:
  - `/collections/self-hosted` — software ready for Docker / single-node home servers.
  - `/collections/ai-native` — open-source tools with built-in LLM / local AI workflows.
  - `/collections/graveyard` — memorial/archive of shut-down proprietary SaaS products and their viable open-source replacements.
  - `/collections/coming-soon` — emerging, high-potential open-source tools in active pre-release development.
  - `/discounts` — deals and hosting credits negotiated for open-source builders.
- **Dynamic OpenGraph (OG) Image Generation (`/api/og`)** — programmatically generates rich social share preview images showing real-time star count, repo favicon, and compared proprietary tool name for maximum click-throughs on X/Twitter, Reddit, and Discord.
- **Maintainer GitHub Sponsor Integration** — one-click direct sponsor button (`github.com/sponsors/...`) on every tool page, establishing community goodwill with open-source maintainers.
- **Sticky Email Capture & Weekly Digest Newsletter** — embedded newsletter capture ("Join 12K subscribers getting our weekly digest"), creating an owned audience insulated from third-party algorithm shifts.
- **Full RSS Feed Infrastructure** — syndicates new tools, alternatives, and articles across `/rss/tools.xml`, `/rss/alternatives.xml`, and `/rss/posts.xml`.
- **Programmatic SEO Architecture** — crawlable URL structure (`/alternatives/[paid-tool]` and `/[tool-name]`) designed to capture high-intent Google search traffic.

## 3d. OpenAlternative.co full-site deep audit (Aug 2026)

Every page was fetched and inspected live on 2026-08-25: homepage, tool detail (`/novu`), alternatives hub (`/alternatives/notion`), head-to-head compare (`/compare/dittofeed/vs/novu`), `/stacks`, and `/about`. Findings below are corrected against our own codebase so already-built surfaces are not re-flagged by future audits.

### Already built locally (verified — do not rebuild)

Tool profile pages (`web-dist/[slug].html`); alternatives hub pages per paid tool (`web-dist/alternatives/*.html`); category/tag/license/stack taxonomy indexes + detail pages; collections + discounts pages; submit/advertise/blog scaffolding; sitemap.xml + RSS suite + robots.txt; OG image generation; newsletter embed in layout footer; sponsor buttons; animated sparklines; maintenance/freshness pills; JSON-LD structured data; pagination on `/alternatives`.

### Tier 1 — major product gaps (validated live, missing here)

1. **Head-to-head compare engine (`/compare/[a]-vs-[b]`).** The competitor generates pairwise pages between alternatives *for the same paid tool*, declaring a winner per dimension: Community & Popularity, Growth Momentum, Development Activity, Technology Stack, Project Maturity, Licensing, Use Cases, Hosting & Deployment — all programmatic from metadata we already snapshot. Strong programmatic-SEO play ("X vs Y" queries) that directly serves problems #1 and #3. **Phase 2 — implemented in this audit round.**
2. **Repo age + latest version metadata.** Their tool sidebar shows "Repository age: 5 years" and "Version: v3.19.0" next to stars and last-commit. We already fetch `created_at` (`src/server/github.js` `getRepo`) and have a cached `getLatestRelease` client, but neither is surfaced in the `/api/repo` response or on web profiles. Pure wiring work. **Phase 2 — shipped in this round.**
3. **Public ranking methodology page.** Their `/about` discloses the exact formula (stars + forks equally weighted, adjusted for project age, exponential penalty for inactivity, small bonus for maintainer-verified listings). Publishing ours — including Trust Score inputs from `src/server/trust.js` and the honest heuristic disclaimer — converts "trust us" into "verify us." Also pairs naturally with the appeals-process requirement (section 15). **Phase 2 — shipped in this round.**
4. **E-E-A-T bylines.** Every competitor hub article carries a named author with avatar and a "Last updated" date. Google rewards dated, attributed comparison content; undated programmatic pages decay. Ours injects "OpenSource Hub Team · Last updated [sync date]" from feed state. **Phase 2 — shipped in this round.**
5. **Share bar.** Copy-link plus one-click share intents (X, Reddit, Hacker News, LinkedIn) on tool, hub, and compare pages. Static URLs, zero JS dependency beyond clipboard copy. **Phase 2 — shipped in this round.**
6. **Categorized tech-stack directory.** Competitor groups stacks by kind (AI, Language, Framework, Database, Cloud, Auth, ORM, CI/CD…) with per-group counts and dedicated pages. Our `/stacks` is flat; regrouping is presentation-only over existing taxonomy data. **Phase 2 (cheap regroup), richer per-stack pages later.**
7. **Multi-forge support** (GitHub plus GitLab, Codeberg, Bitbucket, Gitee). Widens the catalog beyond GitHub-only repos; a data-layer change touching sync, slug derivation, and trust inputs. **Phase 3 — only once the schema has stabilized.**
8. **Outbound click-tracker redirect** (`go.[domain]` style). Required infrastructure once affiliate links carry real volume (6.1a): clean attribution, honest conversion data, and link rot protection. **Phase 3 — lands with affiliate wiring, not before.**

### Tier 2 — smaller UI/SEO gaps (scheduled, not urgent)

- Sort dropdown ("Order by": trending / newest / stars) on directory indexes — **Phase 2**.
- Category growth % badges (+9.7% style) computed from existing star snapshots — **Phase 2**.
- Alternative-count badges on hub cards ("Notion — 20 alternatives") — **Phase 2**.
- Similar-projects module on tool profiles (same-category cross-links) — **Phase 2**.
- Per-card AI-native badge (distinct from the ai-native collection) — **Phase 3**, needs a detection field in the catalog first.
- "People are looking for alternatives to…" demand-side module — deferred until anonymous search logging exists (section 16); surfacing demand without collecting it is impossible honestly.
- Press / "as featured on" strip on the landing page — post-first-launch, when there is something real to show.
- Verified-listing ranking bonus (maintainer claims, section 3) — **Phase 3** with claim verification.
- Contextual managed-hosting ads on tool pages — already covered by section 36 rev-share placements; **Phase 3**.

### Anti-goals confirmed by this audit

The competitor runs user accounts (GitHub OAuth sign-in). During the audit their sign-in returned a visible failure state (`?error=state_mismatch`) — live evidence that auth adds fragility without serving any of our three core problems. **Do not adopt accounts.** Our no-login local-first architecture stays.

## 4. Explicit non-goals

- No code execution inside the app.
- No private repository support.
- No implication that every free alternative is a perfect drop-in replacement — feature-parity checklists exist specifically so users see the gaps, not just the pitch.
- No silent/automatic downloads without a user click.

---

## 5. Architecture (final)

- **Distribution:** the app itself is published to npm (free, public registry — same one real developer tools like OmniRoute use). **Users never visit npmjs.com.** Your own website is the only thing they see — it displays one command in a copy-to-clipboard box (`npm install -g opensource-hub`), they paste it into their terminal, that's the entire interaction. npm's site is invisible to the end user; it's just the file server working behind the scenes.
- **Website:** a simple static landing page (hosted free on GitHub Pages) — what the app does, a screenshot of the dashboard, and the one-line copy-able install command front and center. This is documentation/marketing, not the app itself.
- **After install:** user types one word (`opensource-hub`) to start it. This launches a small local server on their own machine and opens their default browser automatically, pointed at that local dashboard — trending, favorites, download, comments.
- **GitHub data sync:** each user's local install reads trending/snapshot data from static JSON files (built daily by a free GitHub Actions cron job in the project repo and served via GitHub Pages/jsDelivr — see Section 28.2), so the app never depends on one shared API budget. Live per-repo detail lookups hit GitHub's public API directly from the user's own machine — unauthenticated, 60 req/hr per IP, kept well inside budget with ETag conditional requests (`304 Not Modified` responses don't consume quota).
- **Comments:** giscus/GitHub Discussions, works the same whether the page is served locally or from a website — free either way.
- **Favorites:** stored locally on the user's own machine.
- **Download mechanism:** unchanged — direct link to GitHub's own archive URL, redirects through codeload.github.com, works with zero authentication for any public repo.
- **"Download & Run" detection:** unchanged — repos with an attached installer (.exe/.dmg/.apk) on their GitHub Releases get a distinct one-click-then-double-click button; everything else gets plain source download plus a setup note.

### 5b. Dual-Tier Architecture: CLI Engine (Priority 1 — Built First) + Public Web Directory

To combine local execution power with global organic discoverability:

1. **The CLI Local Engine (Priority 1 — Foundational Execution Layer):**
   - **Why CLI First:** A pure web browser is sandbox-restricted and cannot manage local file systems, run background download daemons, execute local build scripts, or trigger one-click local app launches. The local Node CLI (`npm install -g opensource-hub` / `npx opensource-hub`) runs a lightweight local server and serves the local browser UI at `localhost:3000`.
   - **Automated 1-Click Downloads & Execution:** When a user clicks "Download" or "Run" in the local dashboard, the local Node server directly fetches the appropriate GitHub release binary (`.exe`, `.dmg`, `.AppImage`, `.zip`) into the user's local Downloads directory or launches the installer, delivering true one-click frictionless setup that no sandboxed website can achieve.
   - **Zero Shared Infrastructure Cost:** Static snapshot data (built by a free GitHub Actions cron job, see Section 28.2) is fetched client-side; local SQLite/JSON storage; zero central server operating costs. Direct GitHub API calls happen per-user from their own machine within its unauthenticated budget (60 req/hr per IP — ETag caching keeps live lookups well inside it); bulk trending/snapshot data comes from GH Archive and OSS Insight instead of GitHub's API.

2. **The Public Web Directory (Public Companion & SEO Portal):**
   - **Crawlable Web Surface:** A static/SSR public web directory hosted on GitHub Pages or Vercel with clean URL routing (`/alternatives/notion`, `/affine`) to capture organic Google search traffic and drive users toward the local CLI tool.
   - **Live Previews & Paid Submissions:** Lets web visitors search, view Trust Scores, read comparisons, and enables founders to submit tools via the paid listing portal.

---

## 6. Monetization

### 6.1 Core three (unchanged, still the base layer)
1. **Donations** — GitHub Sponsors, Ko-fi, Buy Me a Coffee, Liberapay, in-app.
2. **Affiliate links** — hosting/deployment platforms in the "how to run this" and "one-click deploy" flows. Full program details and real math in section 6.1a.
3. **Sponsored placement** — clearly labeled, doesn't affect ranking, only once real traffic exists.

### 6.1a Affiliate program details (deep-checked, real numbers)

**Why affiliate is the priority lever, not just one of three:** the app's "how to run this" / "one-click deploy" moment (section 3) is high-intent placement — it reaches someone at the exact point they've already decided to run a project and need somewhere to host it. That converts meaningfully better than a generic ad impression, because it's not interrupting anything; it's answering the question the user already has.

**Confirmed real programs and payouts, checked directly:**

| Program | Payout structure |
|---|---|
| DigitalOcean | Flat $25 per new customer who spends $25 on the platform, uncapped, $10 minimum payout threshold |
| Vercel | $100 per Pro subscriber referred |
| Railway | $5-25 per referral, depending on the referred user's plan |
| Supabase | 10-20% recurring commission on referred users' spend |

**The honest math — this doesn't remove the traffic requirement, it just pays better per conversion once you have it:**
Blending these programs at roughly $30-50 average per successful paid conversion, hitting the $6,000/month target (section on "$200/day math," now folded in here) requires **roughly 150-200 successful paid conversions a month.** Working through realistic funnel rates — maybe 2-3% of visitors click a "deploy this" affiliate link, and 5-15% of those actually become a paying customer on the other end — that's still on the order of **50,000-70,000 monthly visitors.** Affiliate is the right lever to prioritize *building*, but it is not a shortcut around needing real traffic; nothing in this monetization section is.

**Concrete action items, in order:**
1. **Apply to all four programs now, before Phase 1 even has traffic.** Affiliate approval isn't instant, and there's no cost or downside to having accounts ready before you need them.
2. **Wire the approved affiliate links into the existing "how to run this" note and "one-click deploy" buttons** (section 3) once approved — this is a small edit to code that already exists, not a new feature to build.
3. **Track which program converts best for your specific audience** once there's real traffic — the blended $30-50 average above is a planning estimate, not a promise; your actual mix may skew toward Vercel (higher per-conversion payout, likely closer fit if your audience skews toward web/JS projects) or DigitalOcean (broader applicability, lower payout, easier bar to clear at $25 spend).

### 6.2 New: Trust Score as an actual paid tier
This is the strongest monetization addition from this round of research, because it mirrors a proven, funded business model (Snyk, Sonatype, and similar tools already charge companies for exactly this):

- **Free:** basic maintenance status (Active/Slowing/Abandoned) and the red-flag caution badge.
- **Pro (paid):** full Trust Score breakdown, historical trend of a repo's health, and the Total Cost of Ownership calculator with saved comparisons.
- **Team/Company tier (later):** the "plug in our whole software stack, show us viable free alternatives" report — this is a B2B sale to a company with an actual budget, not a consumer micropayment, and is where the real revenue ceiling is highest.

### 6.2a AI Tool Finder — the clearest paid-tier justification (section 21)
Unlike Trust Score Pro, which sells "more depth on data you can already see for free," the AI Tool Finder sells a genuinely new capability: describe your task in plain language, get a researched shortlist back. It's also the one feature with a real, recurring cost to you (AI API calls), which makes it the most natural candidate to actually require a subscription rather than a nice-to-have upsell. See section 21 for the full design and the honest cost caveat.

### 6.3 Sequencing, still honest
Donations and affiliate links from day one — cheap, passive, and affiliate applications specifically should go in *before* Phase 1 traffic exists, per 6.1a. Trust Score free tier ships alongside the core product, since it's cheap to compute from data you already have. The **paid** Trust Score tier, AI Tool Finder, and sponsored placement all wait until there's a real user base to sell to — and AI Tool Finder specifically shouldn't launch until you can afford to eat the API cost of a free-tier allowance (section 21.5) without it threatening the $0 operating cost of everything else.

### 6.4 Paid Submissions & Featured Placements (The Founder Revenue Engine)

Validated directly by openalternative.co's core high-margin revenue model ($97–$197/mo from SaaS & OSS creators):

1. **Standard Submission ($97 one-time):**
   - 48-hour review turnaround & permanent verified directory listing.
   - Self-serve submission pipeline with automated GitHub repository validation.
2. **Premium Submission with Do-Follow SEO Backlink ($137 one-time):**
   - 24-hour expedited review.
   - High-authority **Do-Follow Backlink** directly to the tool's repo/domain (high demand from developers and startup founders looking to boost their own domain authority).
3. **Ultimate Featured Listing ($197/month recurring):**
   - 12-hour instant queue priority.
   - Pinned featured badge on top of category pages and product comparison pages.
   - Social media blast across X/Twitter and inclusion in the weekly newsletter digest.
4. **Direct Directory Advertising (Sponsorships):**
   - **Silver Slot ($147/month):** Native banner ad in the directory feed with transparent click and impression tracking.
   - **Platinum Exclusive Slot ($597/month):** Top sticky header sponsor banner across all product and alternative comparison pages.

---

## 7. Data model

**Local CLI Engine:** `repos` (now carrying `repo_age_years`, `latest_version`), `repo_snapshots`, `favorites`, `trust_scores`, `local_downloads`, `cached_sparklines`, `demo_links`, `secondary_metrics`, `vulnerability_cache`, `suggestion_queue`, `health_snapshots`, `successor_map`, `companion_links`, `migration_plans`, `compare_pages`, `outbound_clicks`.
**Public Web & Directory Layer:** `categories`, `subcategories`, `stacks` (grouped by kind), `collections`, `submissions` (paid tiers & Stripe checkout records), `sponsors`, `newsletter_subscribers`, `editorial_content`.
**Not self-hosted:** comments live in this project's GitHub Discussions via giscus — no database or server for you to run or back up.

---

## 8. Legal & liability

- **Disclaimer on every comparison and feature-parity checklist:** "Community-reported, not guaranteed" — since telling someone a free tool "replaces" a paid one carries real risk if they switch and hit a missing feature.
- **Using paid tools' names for comparison is standard practice** (referencing a trademark to describe what your product does is generally accepted "nominative use," and existing sites like opensourcealternatives.to do this without issue) — not risk-free, but not a reason to avoid the core feature either.
- **Terms of Service and Privacy Policy** — required before public launch, especially once comments store user-submitted data and once any payment is involved. Not written yet.

## 9. Security

- **No centrally-hosted server to secure.** The landing page is static (GitHub Pages); the app itself runs a local server on each user's own machine after install (section 5), so there's no shared backend of yours that could be attacked. The remaining surface is giscus/GitHub Discussions for comments, which inherits GitHub's own account security rather than anything custom-built.
- **Trust Score gaming resistance:** same way stars can be inflated, Trust Score inputs (commits, contributors) can be faked. Needs basic anomaly detection (e.g. sudden unnatural spikes) built in from the start rather than retrofitted after abuse happens.
- **Comment spam/bot protection:** rate limiting per IP/user on posting, in addition to the moderation flag/report system already planned.

## 10. Product gaps to close before launch

- **Feature-parity checklist edit history:** since it's crowd-editable, it needs a revert option and visible edit history — otherwise one bad-faith edit stands unchallenged, like an unprotected wiki page.
- **Favorites sync across devices:** currently local-only; depends on whether an optional login gets added (tied to the open comments-identity question).
- **"Last verified" date** on each trust score and feature-parity comparison, so users know if the data is fresh or stale.
- **Accessibility:** keyboard navigation and screen-reader support for the dashboard — not yet specified despite the "very clean" design goal.
- **Onboarding and empty states:** first-run experience, and clear empty-state messaging for a new favorites list, a search with no results, and a repo with no comments yet.

## 11. Growth plan (not a feature, but required for the whole model to work)

- **Launch channels:** Product Hunt, Hacker News, relevant subreddits (r/opensource, r/selfhosted), developer social media — none of the monetization levers in section 6 work without real traffic first.
- **SEO for comparison pages:** these only earn organic traffic if built with real titles, meta descriptions, and enough content depth to rank — not just a bare comparison table.

## 12. Operations

- **Schema migrations between versions:** local data (favorites, cache) must survive an `npm update -g` without wiping the user's saved data.
- **Backup plan for comments:** since comments live in GitHub Discussions rather than a database you run, this is GitHub's responsibility, not yours — worth confirming in the ToS/privacy policy that comment history depends on GitHub's own platform staying available, rather than promising a backup you don't actually control.
- **Support channel:** an email address or Discord for bug reports and questions, needed before taking any payment from anyone.

## 13. Launch checklist

- [x] Comment moderation: on from day one
- [x] Payment/premium tier: deferred at launch, Trust Score Pro tier is the eventual paid feature
- [x] Trust/health signals: included at launch (free tier), addresses a validated, current problem
- [x] Comments identity: resolved by architecture — giscus requires GitHub sign-in, which fits since the audience already has GitHub accounts
- [x] Hosting/distribution: resolved — landing page on GitHub Pages, app itself distributed via npm, users never visit npm's site, see section 5
- [x] Language scope: English-only for v1 and for the foreseeable future — standard for this category, revisit only if real non-English traffic emerges
- [x] Terms of Service / Privacy Policy — drafted, see legal/terms-of-service.md and legal/privacy-policy.md. Fill in the bracketed placeholders (date, contact email, payment provider specifics) before publishing.
- [x] Node.js prerequisite decision — resolved: stated plainly on the landing page with a link to nodejs.org, accepting this app is built for people already comfortable in a terminal
- [ ] Trust Score appeals process (section 15) — **must exist before Trust Score goes live publicly**, given the reputational-harm risk to flagged maintainers
- [ ] NLnet grant application prepared before the Sep 3 – Nov 3, 2026 call window closes (section 36)

## 14. CLI distribution gaps — new, specific to the npm/local-install model

The move to a terminal-installed tool (section 5) introduces problems the earlier plain-website version didn't have:

- **Node.js is a hidden prerequisite.** `npm install -g opensource-hub` only works if the user already has Node.js installed. This directly conflicts with the earlier goal of "non-technical people never need to touch a terminal" — needs a conscious decision: either accept this app is really for developers (who already have Node), or add a visible "don't have Node? Install it first" step on the landing page linking to nodejs.org. The full fix — single-binary distribution channels that remove the Node requirement entirely — is planned in section 30.
- **`sudo` and PATH issues.** Global npm installs commonly need `sudo` on Mac/Linux, and Windows PATH problems are one of the most common real-world complaints with CLI tools. Needs testing on all three platforms and a troubleshooting section on the landing page, not just the one-line happy path.
- **Local port conflicts.** The app starts a server on the user's own machine; if the default port is already in use by something else, it fails with a confusing error unless the app automatically falls back to another port.
- **No update notifications.** npm doesn't proactively tell a user a new version exists — without an in-app "update available" check, most users silently stay on an old version forever.
- **Uninstall isn't documented.** `npm uninstall -g opensource-hub` should be listed on the landing page alongside the install command, not just assumed.

## 15. Trust Score fairness

- **No appeals process yet.** If the automated Trust Score or red-flag check wrongly flags a legitimate, well-maintained project, its maintainer currently has no way to contest it. This is a real reputational-harm risk to someone else's project, not just a nice-to-have — needs a simple "dispute this flag" path before Trust Score goes live publicly.
- **Stale listing pruning.** Repos get deleted, renamed, or made private after being listed. The sync job needs to detect and remove or flag dead links, not just add new data on top of old.

## 16. Growth measurement — currently nothing planned

- **No analytics at all today.** Without some form of privacy-respecting, disclosed usage measurement (e.g. anonymous install/run counts), there's no way to show a future sponsor real traffic numbers, and no way to know if anyone is actually using the app.
- **npm's own public download counts** are a free, already-built-in growth metric (visible on the npmjs.com package page) that isn't currently planned to be tracked or displayed anywhere in the product itself.

## 17. Community & data

- **No code of conduct.** Comments and public lists (sections 2.5, 2.10) need a community code of conduct, separate from the legal Terms of Service — standard practice anywhere users post public content.
- **No data export.** There's currently no way for a user to export their own favorites or public lists if they want their data out — worth a simple "export as JSON" option given everything is already stored as local/portable data anyway.

## 18. Open questions remaining

1. Do you want to write the Learn section content, or should starter drafts be provided?
2. For the paid-tool alternative finder — do you want to seed the first batch of tool↔alternative pairings yourself, or should a starter list be drafted (e.g. Notion→AFFiNE, Postman→Bruno, Figma→Penpot) to launch with real content instead of an empty directory?

## 19. Phased launch plan (replaces open-ended feature accumulation)

This PRD has grown to 22 sections of features, gaps, and competitor comparisons. That's valuable as a reference, but none of it ships if it's all attempted at once. This plan sets a concrete build order.

### Phase 1 — v1 launch (ship this first, nothing else)
- Landing page with copy-able npm install command (built)
- CLI install → local server → browser dashboard (built)
- Trending views: today/yesterday/least/all-time (built)
- Search + language filter (built)
- Favorites, local only (built)
- Download via GitHub zip URL + "Run it" vs "Download source" split (built)
- Comments via giscus, with GitHub Discussion reactions as the like/rating signal
- Learn section, starter articles
- Terms of Service / Privacy Policy written
- Node.js prerequisite clearly stated on the landing page, with a link to install it
- 20-30 tool→alternative pairings seeded manually so the app isn't empty on day one
- README.md in repo root (install / uninstall / troubleshooting) — a launch blocker, not documentation polish: it ships in the npm package `files` field and IS the product's storefront on npmjs.com. A missing README makes `npx opensource-hub` look abandoned before anyone even runs it.
- Dashboard first-run hero: headline with one-line value prop, copy-able install-command pill (so early users can share it), and a search-first input prompting "Search the paid tool you already pay for" — new users must understand the core interaction within 3 seconds of the dashboard opening, without reading anything
- Apply to DigitalOcean, Vercel, Railway, and Supabase affiliate programs now (section 6.1a) — approval takes time, so start before Phase 1 traffic even exists
- JSON-LD `SoftwareApplication` structured data on all public pages (section 33)
- Prepare NLnet grant application ahead of the Sep 3 – Nov 3, 2026 call window (section 36)

**Explicitly deferred out of v1:** Trust Score, paid tiers, sponsored placement, platform/license filters, screenshots, public lists, team/company mode, browser extension, analytics.

### Phase 2 — after v1 has real users (weeks, not months, once Phase 1 is live and used)
- Platform filter, license-type filter
- Screenshot gallery per listing (validated by selfh.st and AlternativeTo as standard in this space)
- Public curated lists, following the pattern of individually-curated lists with stated inclusion criteria seen across this category
- Trust Score (free tier): maintenance status + red-flag check, with an appeals process built in from the start — release-tracking data (validated as selfh.st's actual core mechanism) feeds directly into this
- Surface the full trust signal set on every listing card and detail page per the section 2.2 surfacing mandate (maintenance pills on cards, animated meter on detail pages)
- Catalog expansion: grow the seed pairings from 20–30 to 60+ verified entries, prioritized by logged zero-result searches; every new pairing must be human-fact-checked before merge (repo exists and matches description, savings estimate is realistic, license/maintenance claims accurate) — AI may draft candidates but a human owns verification, since one hallucinated repo destroys trust in the whole directory
- Basic anonymous usage analytics, disclosed in the privacy policy
- Update-check notification in the CLI tool
- Live demo links on listings where projects host official demo instances (section 35)
- OSV.dev known-vulnerability badge + release SHA256 checksum display (section 29)
- Secondary popularity metrics — npm downloads, PyPI downloads, Docker Hub pulls (section 35)
- Suggest-an-alternative request queue + Yes/No suitability votes per pairing (section 34)
- Crowd tags + "report something wrong" field flags (section 34)
- Single-file binaries + Homebrew/Scoop distribution channels (section 30)
- Freshness pills + monthly public health-snapshot diff (section 38)
- Goal-first browsing mode ("Replace Google Photos" entry points) (section 38)
- Relationship typing per pairing — direct / partial / fork (section 38)
- Bus-factor & foundation/backing signals added to Trust Score inputs (section 38)
- Per-tool stable-release RSS feeds (section 38)
- Head-to-head compare pages generated for alternatives sharing a paid tool (section 3d) — shipped Aug 2026
- Repo age + latest release version surfaced on `/api/repo` responses and web profiles (section 3d) — shipped Aug 2026
- Public about/methodology page disclosing the ranking formula and Trust Score inputs (section 3d) — shipped Aug 2026
- E-E-A-T bylines ("last updated" from sync state) + share bar across tool/hub/compare pages (section 3d) — shipped Aug 2026
- Category growth % badges + alternative-count badges on directory surfaces (section 3d)
- Similar-projects cross-links on tool profiles; sort dropdown on indexes (section 3d)

### Phase 3 — once there's traffic worth monetizing
- Trust Score Pro (paid tier)
- AI Tool Finder, free tier (limited searches) + paid tier (unlimited, deeper research) — see section 21
- Additional paid-tier features: historical data access, unlimited saved audits, priority sync, custom alerts, verified maintainer badge, white-label reports — see section 22
- Referral program (free AI Tool Finder credits, opt-in) — see section 24, built after AI Tool Finder is live and its real per-query cost is known
- Sponsored placement, clearly labeled
- Affiliate links in the "how to run this" flow
- Total cost of ownership calculator
- Weekly digest email (validated as a real retention driver by opensourcealternatives.to and selfh.st's "This Week in Self-Hosted" format)
- Team/company mode (B2B)
- winget / .deb / .rpm / curl-installer distribution channels (section 30)
- Umbrel/Runtipi/CasaOS community app-store publishing + official ghcr.io Docker image (section 31)
- Local MCP server endpoint (`opensource-hub --mcp`) for AI agent clients (section 32)
- Managed-hosting revenue-share placements in the deploy flow — Elestio/PikaPods (section 36)
- Savings tracker + paste-your-subscriptions matcher (section 37)
- Quarterly re-verification cycle for claimed maintainer listings (section 34)
- Typosquatting/impersonation warnings on lookalike repo names (section 29)
- "Can I run this?" hardware-fit calculator with ARM/x86 readout (section 38)
- docker-compose generator from multi-select (section 38)
- Successor/fork pointers on archived or stale listings (section 38)
- Companions discovery section (section 38)
- Guided migration plan generator with progress tracking + Markdown export (section 38)
- Multi-forge catalog support beyond GitHub: GitLab, Codeberg, Bitbucket, Gitee (section 3d)
- Outbound click-tracker redirect domain for affiliate attribution (section 3d)
- AI-native per-card badge; demand-side "people are looking for" module once anonymous search logging exists (section 3d)
- Verified-listing ranking bonus tied to maintainer claims (sections 3d, 34)

### Explicitly not scheduled (revisit only if users specifically ask)
- Browser extension
- News/editorial content section
- Native mobile access to the dashboard

## 20. Business/team features (deep-checked against real vendor-assessment practices)

Anyone can use the free version of this app individually, but a business user evaluating a switch away from paid software has different, higher-stakes needs than an individual browsing for a personal project. These are grounded in real compliance/procurement checklists, not guesses:

- **OpenSSF Scorecard integration.** A free, established, automated security-risk scoring tool for open-source dependencies — plugging this into the Trust Score (section 2.2) gives it real, industry-standard backing instead of a fully home-grown metric, and it's credible to a compliance reviewer in a way a custom score alone isn't. Shortcut verified live: Google's free deps.dev API already serves precomputed Scorecard results for packaged software, so most of this integration is a read, not a build (section 29).
- **Compliance certification tracking per listing** — does the free alternative (or the company behind it, if it offers paid hosting) support SOC 2, ISO 27001, GDPR, or HIPAA needs, shown clearly on its listing. Directly answers the first thing a real procurement checklist asks.
- **Data portability notes** — a plain-language note per tool: can you export your data if you ever switch away from this too, and in what format. Addresses the vendor lock-in risk category identified in real assessment practices.
- **Exportable comparison report (PDF/CSV)** — a business user often needs to *document* that an evaluation happened, for an internal approval process or a future audit, not just make a personal choice. A one-click "export this comparison as a report" turns your existing feature-parity checklist and Trust Score into something they can actually attach to a procurement ticket.
- **"Stack audit" mode** — the team/company mode already sketched in section 3 ("plug in your whole software stack, get a report of viable free alternatives"), made concrete: upload or paste a list of currently-paid tools, get back a report across all of them at once, exportable in the same format as the single-tool comparison above.
- **Shared team lists** — an extension of the public curated lists (section 2.10): a team can maintain a private, shared "these are our internally approved alternatives" list, visible only to their org, distinct from the fully public lists anyone can browse.
- **Audit trail on team decisions** — who on the team reviewed or approved a given alternative, and when — relevant specifically because <cite index="32-1">organizations are sometimes subject to external compliance assessments that specifically check their process for evaluating open-source usage,</cite> not just the outcome.

**Sequencing:** all of this is Phase 3 territory (section 19) — it depends on Trust Score and team accounts already existing first, and it's aimed at organizations with a real budget, which is exactly the B2B monetization angle already identified in section 6.2. Nothing here should be attempted before Phase 1 and Phase 2 are live and working for individual users.

## 21. AI Tool Finder (premium feature)

### 21.1 What it is
A natural-language search: instead of the user already knowing what to search for, they describe the job they're trying to get done ("I need something to manage client invoicing for my agency"), and the app finds and ranks real open-source options for it.

### 21.2 How it works
1. User types a plain-language description of their task — no keyword guessing required.
2. An AI model interprets the description into real search intent (category, must-have features, likely scale).
3. It searches two sources: the app's own curated tool→alternative database first (fast, free, already-vetted), then GitHub's live search API for anything not yet catalogued.
4. Results are synthesized into a short ranked list, each with a plain-language "why this one" reasoning that pulls in data the app already computes — Trust Score, license, self-hosting difficulty — not just a raw list of repo names.

### 21.3 Why this is worth building
None of the direct competitors covered in sections 3a/3b (AlternativeTo, opensourcealternatives.to) offer this — they all require the user to already know roughly what category or tool name to search for. Describing a job in plain language and getting back a reasoned shortlist is a genuine step beyond keyword search, not just a feature checkbox.

### 21.4 The honest cost caveat — this is the first feature that breaks the $0 architecture
Every part of the app built so far (sections 5, 5a) runs at genuinely zero cost — static hosting, free GitHub API calls, free comment/discussion infrastructure. AI model calls are different: each query costs real money, small per-call (fractions of a cent to a few cents with an efficient model) but real and recurring as usage grows. This is exactly why gating it behind a paid tier is the right call, not just a monetization add-on — subscription revenue is what covers the ongoing AI cost, not pure profit stacked on a free feature.

### 21.5 Tier structure
- **Free tier:** a small number of AI searches per month (e.g. 3-5), enough to try it and see the value, not enough to rely on daily.
- **Pro tier (paid):** unlimited AI searches, plus deeper multi-source research (checking more than just the top few GitHub results, cross-referencing Trust Score data more thoroughly).
- This becomes the app's flagship paid-tier justification — clearer and more tangible to a paying user than "removes ads," since it's a capability, not just an absence of annoyance.

### 21.6 Technical note
Because this needs to call an AI API with a secret key, it can't run purely client-side or purely as a static GitHub Pages site the way the rest of the app does — it needs a small serverless function (e.g. a free-tier Cloudflare Workers or Vercel function) to hold the API key securely and proxy the request. This is the one piece of real, ongoing infrastructure in an otherwise $0 architecture, and it should be built and cost-tested only once Phase 1 and 2 are live with real users — not before, per the phased plan in section 19.

## 22. Additional paid-tier features (validated against proven SaaS monetization patterns)

Beyond Trust Score Pro (6.2) and AI Tool Finder (21), these give the paid tier more depth and, in two cases, open a second revenue source entirely separate from end users:

- **Historical data access.** Free users see the rolling 14-day trending window already planned in section 5. Paid users get full history — 90 days, a year — so questions like "show me this repo's Trust Score trend since last year" become answerable. Cheap to store since the data's already being collected; the only change is how much of it a free vs. paid user can see.
- **Unlimited saved comparisons/audits.** Free tier: one saved "stack audit" (section 20) at a time. Paid: unlimited, revisitable over time. A standard, easy-to-explain freemium cap — the free version proves the value, the paid version removes the ceiling.
- **Priority sync speed.** Free users get the hourly refresh already planned. Paid users get a much faster refresh (every few minutes) — genuinely useful for anyone actively tracking a specific tool's health or a fast-moving trending category, not just a speed bump for its own sake.
- **Custom alerts.** "Notify me if this repo's Trust Score drops" or "notify me when a new alternative to X appears." This is what turns the app from something someone visits occasionally into something that actively works for them in the background — the kind of ongoing value that justifies a recurring charge rather than a one-time visit.
- **Verified maintainer badge (paid) — a second revenue source, not from end users.** The free "claim this repo" feature (section 3) lets a maintainer respond to comments and correct data. A small paid tier on top — a "verified" badge plus basic analytics on their own listing (views, click-throughs to their repo) — charges the *project*, not the person browsing. This mirrors how job boards and many directories monetize both sides of a marketplace instead of relying on one.
- **White-label/branded reports.** The exportable PDF/CSV comparison report (section 20) could offer a paid option to swap in the exporter's own logo instead of the app's — low effort to build, and directly useful to a specific paying segment: consultants and IT advisors using the app on behalf of clients.

**Deliberately excluded from this round:** public API access to the curated dataset. Worth revisiting later, but it's a meaningfully bigger build (usage metering, API key management, rate limiting, documentation) than anything else in this section, and it targets other developers rather than the app's actual end users — a different audience with different expectations. Better suited to its own dedicated planning pass once the core paid tiers above are already proven to convert.

## 23. Appendix — what's already been built, and what's superseded

Several code prototypes were built earlier in this planning process, before some architecture decisions were finalized. Listed here so it's clear what matches the current plan (section 5) versus what was an earlier direction that got replaced:

**Matches the current architecture — usable as a starting point:**
- `opensource-hub/` — Node/Express local server + browser dashboard, matches the npm-install-and-run model in section 5.
- `landing-page/index.html` — matches section 5a exactly: one command, one copy button, nothing else.
- `content/learn-articles.md` and `content/alternatives.json` — current Learn section and tool→alternative seed data (section 19, Phase 1).

**Superseded — earlier directions, kept for reference only, not the current plan:**
- `opensource-hub-static/` — an earlier GitHub Pages + GitHub Actions-only version, before the pivot to the npm CLI/local-server model. Don't build on this one; section 5 supersedes it.
- `mmb-bot/` — the very first prototype, a Discord bot, from before the product direction moved to a standalone app. Not part of the current plan at all.
- `PRD_desktop_app.md` and the original `PRD.md` — earlier drafts, both superseded by this document (`PRD_final.md`), which is the single current source of truth.

If development starts from these files rather than from scratch, start from `opensource-hub/` and `landing-page/`, not the other two code folders.

## 24. Referral program (free credits, opt-in)

### 24.1 What it is
Users can optionally refer others to the app. When someone signs up using a referral link, **both** the referrer and the new user get free AI Tool Finder credits (section 21) added to their account — not cash, not a discount code, just extra uses of the one feature that actually costs you money per use.

### 24.2 Why credits instead of cash
This is a deliberately good fit for the $0-cost philosophy running through this whole plan:
- **Self-limiting cost.** A cash referral bonus is an open-ended liability — the more it works, the more you owe. A credit bonus is capped by definition: giving someone 5 extra AI searches costs you, at most, a few cents (per the cost caveat in 21.4), regardless of how many people refer each other.
- **Drives usage of the paid feature, not just signups.** Cash rewards optimize for referral volume. Credits specifically nudge people toward trying the AI Tool Finder — the feature most likely to convert them into an actual paying subscriber once their free credits run out.
- **No payment processor involvement.** Paying out real referral cash means dealing with fraud, minimum payout thresholds, and potentially tax reporting depending on amounts and jurisdictions. Crediting an in-app feature avoids all of that.

### 24.3 Opt-in, not forced
The referral program is entirely optional. Someone can use every free feature of the app — trending, favorites, comments, download, Learn section — without ever generating or using a referral link. It only intersects with the AI Tool Finder (a Phase 3, paid-tier feature to begin with), so it never gates any of the core free experience.

### 24.4 What still needs deciding before this is buildable
- **Credit amount per referral** — needs a real number (e.g. "+5 searches per successful referral, both sides") once the actual per-query AI cost is known from real Phase 3 usage, not guessed in advance.
- **Fraud prevention.** Referral programs are a known target for abuse (self-referring with multiple accounts). Needs a basic safeguard — e.g. requiring the referred account to actually use at least one AI search before either side's credit is granted, rather than crediting on signup alone.
- **Credit expiration** — do referral credits expire, or last forever? Worth deciding since it affects both fraud risk and how generous the program actually is in practice.
- **Where the referral link lives** — likely inside the local dashboard itself (section 5), shown near the AI Tool Finder feature specifically, so it's contextual rather than a separate "invite friends" page nobody visits.

### 24.5 Sequencing
This depends entirely on the AI Tool Finder (section 21) existing first, since credits are meaningless without something to spend them on — so it's Phase 3, and specifically *after* AI Tool Finder has shipped and you know its real per-query cost, not alongside it.

---

## 25. Programmatic SEO & Dynamic OpenGraph Engine

Learned directly from OpenAlternative's 1M+ monthly organic traffic model:

### 25.1 URL Routing Hierarchy for High-Intent Organic Traffic
1. **Alternative Target Hubs:** `/alternatives/[paid-tool]` (e.g. `/alternatives/notion`, `/alternatives/figma`, `/alternatives/jira`, `/alternatives/slack`).
   - Title: `Best Open Source Alternatives to [Paid Tool] in 2026`
   - Content: Comparison matrix, annual cost savings calculator, feature-parity checklist, community ratings, and migration notes.
2. **Individual Tool Pages:** `/[tool-slug]` (e.g. `/affine`, `/penpot`, `/cal-com`, `/appflowy`).
   - Title: `[Tool Name]: Open Source Alternative to [Target Tool 1], [Target Tool 2]`
   - Content: 30-day star trajectory sparkline graph, release download links, maintainer GitHub sponsor button, tech stack badges, and community reviews.
3. **Taxonomy Pages:**
   - `/categories/[category]/[subcategory]`
   - `/stacks/[tech-slug]` (e.g. `/stacks/docker`, `/stacks/rust`, `/stacks/sqlite`, `/stacks/crdt`)
   - `/licenses/[license-slug]` (e.g. `/licenses/mit`, `/licenses/agpl-3.0`, `/licenses/apache-2.0`)

### 25.2 Dynamic OpenGraph (OG) Image Generation (`/api/og`)
When any page or comparison is shared across social media (X/Twitter, Reddit, LinkedIn, Discord), an edge function dynamically renders an SVG/PNG card:
- Displays tool icon + target proprietary icon side-by-side.
- Shows live GitHub star count with `+X% (30d)` momentum badge.
- Displays license type and Trust Score badge.

---

## 26. Discovery Taxonomy, Tech Stacks & Curated Collections

### 26.1 High-Interest Curated Collections
Beyond general category search, users can browse purpose-built themed collections:
- **Self-Hosted Essentials (`/collections/self-hosted`):** Projects with verified Docker Compose scripts and single-node deployment readiness.
- **AI-Native Open Source (`/collections/ai-native`):** Tools with built-in local LLM support, Ollama compatibility, or AI assisted workflows.
- **The SaaS Graveyard (`/collections/graveyard`):** Proprietary tools that shutdown, pivoted to enterprise-only, or had controversial pricing hikes (e.g. Heroku free tier, Docker Desktop changes), paired with their best OSS drop-in successors.
- **Coming Soon / Fast Rising (`/collections/coming-soon`):** High-velocity pre-v1 repos with rapid commit frequency and surging star momentum.
- **Community Discounts (`/discounts`):** Exclusive hosting and cloud deployment credits for running open-source stacks.

### 26.2 Tech Stack Deep Tagging
Every repository automatically indexes its framework, runtime, and architecture components:
- **Languages:** TypeScript, Rust, Go, Python, C++, Elixir, Swift, Kotlin.
- **Architectures & Runtimes:** Docker, Tauri, Electron, CRDT, WebAssembly, SQLite, PostgreSQL, Redis, Kubernetes.
- **UI Frameworks:** React, Vue, Svelte, Tailwind CSS, Flutter, Solid.

---

## 27. Maintainer Engagement & Email Growth Flywheel

### 27.1 Maintainer Goodwill & Verification Loop
- **Direct GitHub Sponsors Integration:** Every tool page displays a prominent "Sponsor [Maintainer] on GitHub" button that deep-links directly to their official funding endpoint, incentivizing maintainers to keep their listing updated.
- **Maintainer Claims:** Verified repo owners can claim their tool page for free to verify feature parity, update documentation, and reply to community feedback.

### 27.2 Sticky Newsletter Capture & Retention
- **High-Converting Email Capture:** Clean, unobtrusive newsletter bar across all web directory pages ("Join 12,000+ developers discovering fresh open-source tools every Tuesday").
- **Weekly Digest Edition:** Automated roundup of top 5 trending repos, newest paid-tool alternatives, and security trust score alerts, maintaining high repeat engagement.

---

## 28. Direct CLI Local Automation Engine (Priority 1 Core)

The local CLI tool (`opensource-hub`) is built first as the foundational execution powerhouse:

### 28.1 Why CLI Priority 1 Wins Over Plain Web
- **Bypasses Browser Sandboxing:** Browsers cannot access the local filesystem, manage installation directories, or launch native apps. The local Node.js daemon running at `localhost:3000` has full local OS capabilities.
- **One-Click Automated Binary Downloads:** The CLI server inspects GitHub release assets for the user's current OS (Windows `.exe`/`.msi`, macOS `.dmg`/`.pkg`, Linux `.AppImage`/`.deb`), downloads the file directly into the local system with progress feedback, and prompts single-click launch.
- **Offline & Zero Cloud Cost:** Caches repo metadata, trust calculations, and favorites locally on SQLite/JSON. 100% free — but NOT via raw unauthenticated GitHub API calls for bulk data (that's only 60 req/hr per IP, verified live against `api.github.com`: `X-RateLimit-Limit: 60`). Bulk data comes from the layered free pipeline in Section 28.2; unauthenticated GitHub API is used only for on-demand per-repo detail lookups from each user's own machine.

### 28.2 Layered Free Data Pipeline (rate-limit-proof, $0/month)

The trending views (Section 2.3), star snapshots, and Trust Score inputs cannot be sourced by hammering GitHub's API unauthenticated (60 req/hr per IP = max ~1,440 calls/day even running 24/7). Instead, three independent free layers stack:

1. **GH Archive (primary source for trending/star history — zero GitHub API calls).** Every public GitHub event since 2011, including `WatchEvent` (stars), as free hourly dumps at `https://data.gharchive.org/{date}-{hour}.json.gz`, plus a BigQuery public dataset updated hourly with **1 TB/month of query processing free**. One SQL query computes "top repos by stars gained today" across all of GitHub.
2. **OSS Insight Public API (`https://api.ossinsight.io/v1` — no auth required, 600 req/hr per IP, verified from official docs).** Ready-made endpoints: `repos/trending` (open alternative to GitHub Trends), stargazers history (powers animated sparklines), rankings by stars/PRs/issues.
3. **GitHub Actions scheduled workflow (our own snapshots, runs on GitHub's machines free).** Actions are free for public repositories. A daily cron workflow uses one **GraphQL batch query to fetch ~100 repos' stars/last-commit/license/security-policy per request**, so snapshotting a 1,000-repo catalog costs ~10 API calls/day against the workflow's auto-provided `GITHUB_TOKEN` (1,000 pts/hr) or an optional PAT secret (5,000 pts/hr). ETag conditional requests make re-polls of unchanged repos cost zero budget.

The workflow commits the resulting `snapshots.json` back to the repo and it's served free forever via GitHub Pages / jsDelivr CDN. The local CLI app reads that static file; only live detail views hit GitHub's API, from each user's own IP budget. Three independent sources = no single point of failure: if OSS Insight dies, GH Archive + our Actions job still run; if GH Archive shuts down, snapshots are still ours; if a user exhausts their 60/hr budget, cached static JSON serves most views anyway.

## 29. Trust-signal upgrades — vulnerability & supply-chain data (all free, no API keys)

Deep-checked against what's actually available at zero cost today; every source below was verified live before being written down. These stack on top of the existing Trust Score (section 2.2) rather than replacing it.

- **OSV.dev known-vulnerability badge.** Google's OSV.dev is an open vulnerability database aggregating GitHub Security Advisories, RustSec, PyPA advisories and more, with a free unauthenticated API (`https://api.osv.dev/v1/query`) that accepts a repo tag or commit hash. Each listing gets a plain-language badge: "no known vulnerabilities" (calm), "N known — check fixed versions" (amber), never silently hidden. This closes the biggest remaining gap in the trust story: maintenance status says whether a project is alive, but not whether its current release has a known hole in it. Costs nothing and fits the $0 architecture exactly like existing GitHub API usage.
- **deps.dev precomputed OpenSSF Scorecard.** Section 20 plans an OpenSSF Scorecard integration; the verified shortcut is Google's deps.dev API — free, unauthenticated, no registration — which already serves computed Scorecard results plus advisory impact, licenses, and dependency graphs for ~50 million package versions across npm, PyPI, Go, Maven, and Cargo. For anything packaged in those ecosystems, read the score instead of computing it: industry-standard backing for the Trust Score at near-zero build effort.
- **Release integrity block.** Every download/"Run it" listing shows the release asset's SHA256 checksum (published on GitHub Releases) with one-click copy, and a signed-release badge when a project publishes Sigstore signatures. This makes the app's download flow *more* verifiable than downloading blind from GitHub itself — a genuine differentiator for the trust positioning.
- **Typosquatting/impersonation warning.** Extends the red-flag check (section 2.2): if a listed repo's name is suspiciously similar to a famous project (`notion-alternativ`, `figrna`), surface a caution banner. A cheap string-similarity pass over the catalog during the daily sync job.

**Sequencing:** OSV badge + checksum display ship in Phase 2 alongside the Trust Score free tier (section 19); typosquat warnings in Phase 3 — similarity checks only mean something once the catalog is large enough to compare against.

## 30. Multi-channel CLI distribution — killing the Node.js prerequisite

Section 14 honestly documents that `npm install -g opensource-hub` requires Node.js, which conflicts with the non-technical-user goal. Deep-checking how real projects solved this in 2026 surfaces a proven pattern (verified from Supabase CLI's public distribution ADR and Cline CLI's docs):

1. **Single-file executables via Bun `--compile`.** The entire CLI + local server compiles into one self-contained binary per platform (darwin/linux/windows × arm64/x64) with the runtime embedded — users need nothing preinstalled. ~30–60MB per binary is normal for this shape.
2. **npm stays, as one channel among several.** Platform binaries ship either as npm `optionalDependencies` platform packages (the Supabase pattern — npm resolves only the current platform) or stay separate on GitHub Releases; either way the existing `npm install` path keeps working unchanged.
3. **Native channel wrappers around the same binaries:** Homebrew tap (`brew tap` + `brew install opensource-hub`), Scoop bucket and/or winget manifest for Windows, `.deb`/`.rpm`/`.apk` built with nfpm from the same Release assets, and a `curl ... | sh` installer script. All bumped automatically by the same release workflow.
4. **Landing page impact:** the install box gains simple tabs or OS detection (npm / Homebrew / Windows / Linux), and section 14's "hidden prerequisite" mostly evaporates — Node becomes one of four ways in, not the only way.

**Sequencing:** npm-first stays Phase 1 (already built). Binaries + Homebrew + Scoop land Phase 2. winget/deb/rpm/curl Phase 3 — each is small, but they're polish, and binaries + brew + scoop cover nearly all of the friction.

## 31. Self-hosting platform app stores + container distribution

Verified directly against Umbrel's and Runtipi's documented third-party app-store mechanisms — both accept external app stores that are literally git repositories of Docker Compose templates:

- **Publish the catalog as a Community App Store** for UmbrelOS, Runtipi, and CasaOS's equivalent. The daily sync job (28.2) already produces structured data about which tools ship official Docker images; generating per-app compose files + metadata folders for the qualifying subset turns the directory from "tells you about tools" into "installs tools" on home-server platforms — a distribution channel no direct competitor has.
- **Official container image of the dashboard itself** (`ghcr.io/…/opensource-hub`) so `docker run` replaces the npm step for Docker-comfortable users. Trivial given the architecture, and it removes the Node prerequisite for that audience too.

**Sequencing:** Phase 3. Needs the tool→image mapping to be reliable first, and each platform has its own manifest format to generate; worth doing only once the catalog format stabilizes through Phase 2.

## 32. Local MCP server endpoint

A flag on the existing CLI (`opensource-hub --mcp`) exposes the catalog as Model Context Protocol tools, so Claude Code, Cursor, and other agent clients can query "alternatives to X," Trust Scores, and trending data programmatically.

Why this earns a section: the MCP ecosystem crossed ~18k–23k indexed servers across registries in mid-2026 (verified across Glama/PulseMCP/mcp.so trackers), directories are the discovery layer agents actually consult — and no OSS-alternatives directory ships an MCP server yet. It costs essentially nothing to run: it reads the same static JSON files the dashboard reads, on the user's own machine, zero central infrastructure. It also puts the product in front of the fastest-growing developer segment there is, at the exact moment agents start choosing tools on someone's behalf.

**Sequencing:** Phase 3, after the catalog schema stabilizes — an MCP server is a promise to other people's software, and changing tool shapes breaks clients.

## 33. Search-engine & AI-crawler extras (one cheap win, one deliberate rejection)

- **JSON-LD `SoftwareApplication` structured data** on every public tool and comparison page (name, applicationCategory, license, operatingSystem, offers.price = 0). Standard schema.org markup that helps rich results; smaller competitors in this space already ship it. Phase 1 — it rides along with the public directory pages (5b).
- **llms.txt — deliberately not investing, with receipts.** Checked hard because it dominates 2026 SEO advice. The evidence is uniformly negative: Ahrefs found 97% of published llms.txt files receive zero requests; GPTBot fetched one six times in twelve weeks across 83 instrumented sites while fetching robots.txt 3,990 times; Google's May 2026 AI Search guide formally lists llms.txt among tactics that can be ignored. Verdict recorded here so nobody re-proposes it without reading this: the real levers are server-rendered pages, complete sitemaps (AI crawlers hit sitemap XML tens of thousands of times per month), and a robots.txt that explicitly allows GPTBot/ClaudeBot/PerplexityBot rather than blocking them by accident.

## 34. Community contribution mechanics (validated further against AlternativeTo and SaaSHub)

These fill real gaps the current comment/reaction design doesn't cover, all implementable on giscus/GitHub Discussions infrastructure to preserve the $0 architecture:

- **Suggest-an-alternative request queue.** Users propose pairings that don't exist yet ("nothing listed for Linear yet"); others upvote requests. Highest-voted requests say exactly what to seed next — solves cold-start beyond the initial 20–30 hand-seeded pairings. This is AlternativeTo's core submission mechanic adapted to Discussions.
- **Yes/No suitability vote per pairing.** Distinct from the 👍 reaction signal (2.5): a structured "does this actually replace [paid tool]? Yes/No" vote on each comparison. AlternativeTo runs exactly this, and mass "No" votes trigger human review of the pairing — a concrete garbage-detection mechanism feeding the anti-manipulation design (3b).
- **Crowd tags.** User-added descriptive tags ("beginner-friendly," "privacy-focused," "heavy") shown as filterable pills. Validated by AlternativeTo's tag system.
- **"Report something wrong" field flags.** Any visitor can flag a specific claim on a listing (wrong price, dead demo link, wrong license). Routes into the same Discussions thread and gives the edit-history requirement (section 10) something concrete to act on.
- **Quarterly re-verification for claimed maintainers.** SaaSHub re-verifies its badges every 3 months; without a cycle, "verified" decays into "was verified once." Claimed listings get a re-confirm prompt; lapsed ones visibly drop the badge.
- **Per-tool Q&A threads.** A "questions before you switch" tab per listing, distinct from comments. SaaSHub's Q&A threads drive long-tail SEO — question-shaped pages rank for question-shaped searches.

**Sequencing:** suggest queue + Yes/No votes Phase 2 (they improve seed-data quality early); crowd tags + report flags late Phase 2; re-verification cycles + Q&A tabs Phase 3 once maintainer claims exist.

## 35. Listing content upgrades

- **Live demo links.** Many cataloged projects host official demo instances. Where a repo's README/site declares one, listings get a "Try the live demo" button next to Download — the instant answer to "what does this feel like?" requiring zero installation, and arguably the strongest conversion lever for non-technical visitors anywhere in this PRD. URLs come from README parsing plus manual curation during seeding; community-hosted demos get labeled "unofficial."
- **Popularity beyond stars.** Stars measure attention; downloads measure use. Verified free keyless endpoints: npm downloads (`api.npmjs.org/downloads`, supports bulk queries — also useful since our own CLI lives on npm), PyPI stats (`pypistats.org/api`), Docker Hub pull counts (`hub.docker.com/v2/repositories/{org}/{repo}` returns `pull_count`). Listings show "X stars · Y downloads/mo · Z pulls" where applicable. Also feeds anti-manipulation ranking (3b): gaming stars is easier than gaming three independent registries.
- **Inline latest-release feed.** Last release version + date + short changelog excerpt per tool page, from the same sync job. Answers "is this moving?" more concretely than a commit date.

**Sequencing:** live demos and popularity metrics Phase 2 (a data field, not a system); release feeds ride along with existing sync work in Phase 2.

## 36. Non-dilutive funding + managed-hosting revenue (extends section 6)

Two paths deep-checked and missing from the monetization plan, both unusually compatible with the $0-cost philosophy:

- **Public-interest grants.** Open-source tooling discovery with security signals fits established programs exactly:
  - **NLnet Foundation** (successor NGI programmes): €5k–50k per project, individuals eligible, no equity, no exclusivity. Verified timing: current calls closed; **new Open Internet Stack calls reopen September 3, 2026 with a November 3, 2026 deadline** — a real calendar date to prepare for, and the form is deliberately short.
  - **GitHub Accelerator**: $40,000 non-dilutive via Sponsors plus ~$350k in Microsoft/Azure/OpenAI credits and mentorship for selected cohort projects (10 per cohort; recent cohorts were AI-themed — fit uncertain, but applying costs almost nothing).
  - Grants won't pay recurring bills, but they can fund specific chunks (Trust Score engine, accessibility work, MCP endpoint) without touching the paid-tier roadmap or giving up anything.
- **Managed-hosting revenue share.** An entire category pays open-source projects *recurring* revenue for hosting referrals: Elestio shares **30% of hosting revenue** with referenced projects, PikaPods **20%** — both verified on live project documentation (e.g., Rallly publicly lists both as "revenue sharing providers"). This slots into the affiliate lever (6.1a) as its highest-quality placement: the "don't want to self-host this yourself?" moment right after the self-hosting difficulty badge (section 3). Recurring commission beats the one-time payouts currently tabled there, and the placement is honest — the user genuinely wants this option at exactly that moment.

**Sequencing:** grant applications are calendar-driven — prepare now, before Phase 1 traffic exists, same logic as 6.1a's affiliate applications. Managed-hosting placement joins the affiliate wiring in Phase 3 (needs traffic to convert), but program applications go in early regardless.

## 37. Individual retention features (pre-team-mode versions of B2B ideas)

Two features giving individual users a reason to return weekly, using only data already in the app:

- **Savings tracker.** Favorites already exist locally (2.4). When a favorite's paid-tool counterpart has a known price, a small persistent counter accrues estimated savings ("~$240/yr avoided across 4 switches"). Same honesty rules as the TCO calculator (section 3): estimates labeled as estimates, hosting costs included. Turns an abstract pitch into a personal number — a retention hook with zero accounts and zero servers.
- **Paste-your-subscriptions matcher.** A lightweight, individual-scale version of the stack audit (section 20): paste or type the paid tools you currently pay for; get back matched alternatives with combined estimated savings. No upload, no account — text stays on the machine. Deliberately scoped *below* team mode so it can ship much earlier.

**Sequencing:** both Phase 3 — the tracker shares price data with the TCO calculator, and the matcher shares matching logic with team-mode groundwork.

## 38. Community-requested features (Reddit/HN/selfh.st/degoogling validation round)

Every item below was found by deep-checking what actual users of r/selfhosted, r/opensource, Hacker News, and the degoogling community complain about or build themselves — several exist only because someone got frustrated enough to hand-roll them on top of existing directories. That frustration is free product validation.

- **Goal-first browsing mode.** Validated by CanIHost (a frontend someone built over awesome-selfhosted precisely because "nobody wakes up wanting 'a Feed Reader' — they want to *replace Google Reader*"): browse from ~20–30 plain-language goals ("Replace Google Photos," "Run my own Netflix," "Block ads network-wide") instead of tech categories. Our seeded tool→alternative pairings already contain this mapping — this is a presentation layer over data that exists, nearly free.
- **Freshness pill + monthly public health snapshot.** An independent directory (os-alt) ran a freshness audit across 118 recommended self-host alternatives and found ~11% stale or dead — none flagged on the competitor sites listing them. Their fix, which we adopt: every card shows an alive/stale/dead pill (color-coded like selfh.st's green/yellow/red activity system), and a monthly snapshot diff gets published — "which alternatives flipped state this month" being a louder trust signal than any static badge. Extends the maintenance status (2.2) into something visible and dated.
- **Successor/fork pointer.** When a repo goes archived or stale, the project often lives on elsewhere (Focalboard → community forks, Gitea → Forgejo, Libreddit → Redlib). Listings get a "project continues at [successor]" pointer once staleness is detected — initially curated, later semi-automated via fork-network analysis. No direct competitor does this today; os-alt explicitly lists it as their own unshipped v2.
- **Bus-factor & backing signals in Trust Score.** From a widely-shared OSS-durability framework (OpenInstead): contributor-graph *shape* matters more than raw counts — bus factor 1 is risk regardless of stars; spiky single-person graphs are warning signs; steady distributed recent contribution is health. Also detect foundation backing (Apache/CNCF/Linux Foundation) and funded-company status, both strong survival predictors. Feeds directly into the existing composite score inputs (2.2) using data we already sync.
- **Relationship typing per pairing.** Validated by Unclouded (a privacy-alternatives finder built out of frustration with AlternativeTo): not all alternatives are equal — distinguish **direct alternative / partial replacement / fork-of-origin**, so a business user knows "covers 60% of the use case" before switching, not after. One new field on each pairing, rendered as a badge next to the feature-parity checklist.
- **Guided migration plan generator.** DeGoogler and long-form migration guides (alexi.sh's Google exit guide) validate the pattern: a switch isn't one download, it's a sequence (export data → set up → import → cut over → verify). Each pairing can carry an optional step-by-step migration plan with checkboxes, difficulty rating per step, progress tracking, and Markdown export — local-only, consistent with the $0 architecture. Upgrades the static "migration notes" (2.1) into an interactive checklist people actually follow.
- **Per-tool stable-release RSS feeds.** selfh.st's most-praised feature: each app exposes its own feed filtered to stable releases only (no betas/RCs), pluggable into FreshRSS/Miniflux. Extends the site-wide feeds (3c) down to per-repo level — trivially generated by the same sync job.
- **Companions section.** selfh.st validates a "companions" discovery axis: tools that extend or manage other self-hosted tools (exporters, mobile clients, dashboards). Each tool page can list "works well alongside" entries. New discovery surface, same catalog data.
- **"Can I run this?" hardware-fit calculator.** The single most common r/selfhosted question before adopting: will my box handle it? Select candidate apps → estimated combined RAM/CPU footprint with headroom, ARM-vs-x86 compatibility readout, and a relatable verdict ("a Pi 5 / 8GB mini-PC handles this"). Heuristic estimates labeled honestly as estimates (CanIHost labels every guess). Pairs naturally with favorites and the compose generator below.
- **docker-compose generator from multi-select.** Pick several apps → generated starter `compose.yaml` with per-service blocks, port-conflict resolution, and clearly-marked guesses. Shares machinery with the app-store publishing pipeline (31) but serves the individual user directly.

**Sequencing:** freshness pills + snapshot diffs, goal-first browsing, relationship typing, bus-factor signals, and per-tool RSS land in Phase 2 — they ride existing sync jobs and seeded data. Hardware calculator, compose generator, successor pointers, companions, and migration plans are Phase 3 — each needs either accumulated data or machinery built earlier.

## 39. Consumer pricing — what users can actually be charged (market-anchored)

Deep-checked against live 2026 benchmarks so these are evidence-based numbers, not guesses. Two structural facts frame everything: **end users never pay for discovery itself** (that stays free forever — it's the traffic engine), and individual developers comfortably pay **$10–20/month** for tools they use daily (verified anchors: GitHub Copilot Pro $10, Cursor/Claude Pro/Codex $20, power tiers $39–100). Self-serve freemium converts **2–5%** typically, with developer-tool audiences skewing toward the top of that range (OpenView/ChartMogul 2026).

### 39.1 The three consumer tiers

| Tier | Price | What's included | Why this price |
|---|---|---|---|
| **Free** | $0 forever | Everything core: discovery, trending, goal browsing, search/filters, favorites, basic trust status + red flags, downloads, live demos, comments, migration plans, hardware calculator | Permanent free IS the growth strategy — it feeds affiliate/revshare conversions (36) and keeps the directory credible |
| **Pro** | **$5/mo or $39/yr** | Full Trust Score breakdown + history, OSV vulnerability alerts, custom alerts ("notify me if Trust drops"), unlimited saved comparisons/stack audits, TCO calculator with saved scenarios, priority sync, quarterly personal **savings report** (auto-generated PDF of what you've avoided paying), price-hike alerts on watched paid tools | Below the $10 Copilot anchor = impulse-purchase zone; annual $39 matches homelab-community comfort with one-time/lifetime purchases (Unraid/Plex precedent); the value is "depth + alerts," not gated core features |
| **Pro+** | **$12/mo or $99/yr** | Everything in Pro + **unlimited AI Tool Finder** (21) with deep multi-source research, white-label report export (22), earliest access to MCP endpoint features | Priced under the $17–20/mo Claude Pro/Cursor anchor; it's justified by a *capability with real marginal cost* (21.4), not by removing annoyances |

**Early-launch lever: $149 lifetime deal** for the first cohort (Pro+ equivalent, forever). Lifetime pricing works demonstrably well in exactly this audience (Unraid licenses, Plex Pass); it converts goodwill into launch cash and testimonials when monthly revenue doesn't exist yet. Cap it by count or time window.

### 39.2 The honest revenue math

At a healthy 3% freemium conversion (top of typical range, plausible for a dev audience):

| Active installs | Paid @ 3% | Blended ~$7/mo avg | Monthly consumer revenue |
|---|---|---|---|
| 1,000 | 30 | $7 | ~$210/mo |
| 10,000 | 300 | $7 | ~$2,100/mo |
| 50,000 | 1,500 | $7 | ~$10,500/mo |

Read plainly: **consumer subscriptions alone don't reach meaningful income until tens of thousands of installs.** This is why §6.3 sequences paid tiers last and why the maintainer-side money (§6.4: $97–$197 submissions, sponsorships) plus affiliate/revshare (36) remain the primary revenue engines — those earn from day one of having traffic, while consumer tiers compound slowly. Consumer pricing exists to eventually diversify, not to carry the business.

Two small new features introduced with Pro (both serve problem #1 directly): **price-hike alerts** — watch a paid tool; get notified when its price rises, with your matched alternatives attached (highly shareable moment); and the **quarterly savings report** — the savings tracker (37) rendered as an exportable PDF, giving Pro a tangible periodic deliverable instead of only "more data visible."

**Sequencing:** prices are decided now so the tier boundaries can shape architecture (feature flags per tier), but checkout goes live in Phase 3 per §6.3 — after real usage proves what people actually value. Revisit price points against real conversion data, not before.
