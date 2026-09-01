# GitHub Marketing Checklist — OpenSource Hub

Everything that **cannot be done from code** (GitHub UI steps) lives here.
Do them once, in this order. Each item is 1–5 minutes.

---

## 1. Push the repo & set the real slug
- [ ] Create the GitHub repo (e.g. `github.com/<you>/opensource-hub`), push `main`.
- [ ] Update `repoSlug` in `site.config.json` to `<you>/opensource-hub`
      (the README CI badges link through it — currently the placeholder
      `opensource-hub/opensource-hub`).

## 2. Repo Settings → General
- [ ] **Description:** `Find free open-source alternatives to paid software. Local dashboard, trust scores, zero accounts.`
- [ ] **Website:** your web-dist URL (or the GitHub Pages URL once `web-deploy.yml` runs).
- [ ] **Topics** (Add topics button):
      `open-source-alternatives` `self-hosted` `privacy` `cli` `trust-score`
      `dashboard` `npm-package` `react` `nodejs` `open-source`
- [ ] **Social preview:** upload `.github/social-preview.png` (1280×640, already generated).
      Settings → General → Social preview → Edit → Upload an image.
- [ ] Check "Releases" and "Issues" are enabled; Discussions already used by giscus.

## 3. Pinned repos (your profile page)
- [ ] Profile → "Customize your pins" → pin `opensource-hub` (and your best repos, max 6).

## 4. Profile README — `github.com/<you>/<you>`
Create a public repo named exactly your username with this README:

```markdown
# Hi, I'm <you> 👋

I build ◆ **OpenSource Hub** — find free open-source alternatives to the
paid software you already use. One command, local dashboard, zero accounts.

```bash
npm install -g opensource-hub
```

- 🛡️ 9-signal Trust Scores + OSV security advisories, computed on YOUR machine
- 🔒 No accounts, no tracking, no central server
- 📦 221 automated tests, CI on Windows/macOS/Linux
```

## 5. Demo GIF — ✅ DONE (`docs/demo.gif`, 13 frames, ~700 KB)
Captured the real flow: palette → type "notion" → "Free alternatives to Notion"
→ AFFiNE detail (Verified badge, Save $96/yr, star sparkline +9.4%).
Regenerate anytime:
```bash
node bin/cli.js --no-open &        # or any port; server prints it
$env:DEMO_BASE_URL = "http://localhost:3002"   # the port the server printed
python scripts/capture-demo.py
node scripts/build-demo-gif.mjs
```
`docs/dashboard.png` (static fallback) is embedded below the GIF in the README.

## 6. FUNDING.yml
- [ ] Edit `.github/FUNDING.yml` → set `github: <your-username>`.
      The Sponsor button appears on the repo instantly.

## 7. Awesome-list submissions (the competitor's actual growth engine)
Submit PRs — one list at a time, follow each list's CONTRIBUTING format exactly:
- [ ] `awesome-selfhosted/README.md` (biggest traffic)
- [ ] `awesome-open-source-alternatives`
- [ ] Niche lists per tool you cover (awesome-note-taking, awesome-password-managers…)

Pitch template: one line on what it does, one on why it fits the list criteria
(MIT, local-first, no telemetry — all true and verifiable in your README).

## 8. Ship visible releases
- [ ] Tag `v0.2.0` with a real title + notes (release.yml builds binaries
      for Win/macOS/Linux automatically). Regular releases + star momentum
      can land the repo on GitHub **Trending** — free distribution.

---

## The one rule
Never post your link in other people's issues/PRs/discussions — instant spam
flag. Everything above works because it happens on **your** surfaces or via
**invited contributions** (awesome-list PRs).
