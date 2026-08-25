---
name: trust-score-security-audit
description: Algorithms and heuristic checks for computing open-source repository Trust Scores (0-100), commit decay rates, star fraud detection, and red-flag warning triggers.
---

# Trust Score & Security Audit Engine

## 1. Multi-Signal Composite Trust Score Formula (0–100)
- **Commit Recency (30% weight):**
  - Last commit < 30 days: 30 pts
  - Last commit 30–90 days: 20 pts
  - Last commit 90–180 days: 10 pts
  - Last commit > 180 days: 0 pts (Triggers Slow Maintenance amber badge)
- **Star Velocity & Community Size (25% weight):**
  - Stars > 10,000: 25 pts
  - Stars 2,000–10,000: 18 pts
  - Stars 500–2,000: 12 pts
  - Stars < 500: 6 pts
- **License Integrity (20% weight):**
  - Standard OSI License (MIT, Apache-2.0, AGPL-3.0, BSD-3-Clause, GPL-3.0): 20 pts
  - Non-commercial / Custom / Unclear: 5 pts
  - No license file: 0 pts (Triggers Red-Flag caution)
- **Issue & PR Health (15% weight):**
  - Closed issue ratio > 70%: 15 pts
  - Closed issue ratio 40–70%: 10 pts
  - Open unaddressed issues > 200 with 0 maintainer response: 2 pts
- **Release Cadence & Binaries (10% weight):**
  - Signed release in last 60 days: 10 pts
  - Release in last 180 days: 6 pts
  - No releases (raw repo only): 2 pts

## 2. Red-Flag Caution Triggers
- **Flag 1 (Abandoned):** No commit to main branch in > 12 months.
- **Flag 2 (Star Anomaly):** Sudden spike of > 5,000 stars in < 48 hours without corresponding commit activity or HN/Reddit mention.
- **Flag 3 (License Conflict):** Repo claims to be open-source but uses a proprietary/SSPL license preventing self-hosting.
