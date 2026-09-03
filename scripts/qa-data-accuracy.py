"""Data honesty audit: sample catalog repos vs live GitHub ground truth.
Checks: repo exists/public, not archived (else belongs in graveyard),
license SPDX matches catalog claim, primary language matches, star magnitude."""
import json
import time
import urllib.request

with open("src/data/alternatives.json", encoding="utf-8") as f:
    data = json.load(f)
pairings = data if isinstance(data, list) else data.get("pairings", data.get("entries"))
print(f"Catalog: {len(pairings)} pairings\n")

# deterministic spread + ensure marquee repos are included
step = max(1, len(pairings) // 24)
sample = pairings[::step][:26]
marquee = {"supabase/supabase", "bitwarden/clients", "zulip/zulip", "mattermost/mattermost-server",
           "toeverything/AFFiNE", "penpot/penpot", "nocodb/nocodb", "bitwarden/server"}
repos = []
for p in sample:
    repos.append(p["alternative"]["repo"])
for p in pairings:
    r = p["alternative"]["repo"]
    if r.lower() in marquee and r not in repos:
        repos.append(r)

def gh(repo):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo}",
        headers={"User-Agent": "OSH-LaunchQA", "Accept": "application/vnd.github+json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"__error": e.code}
    except Exception as e:
        return {"__error": str(e)}

by_repo = {p["alternative"]["repo"]: p for p in pairings}
issues, checked = [], 0
for repo in repos:
    live = gh(repo)
    if "__error" in live:
        issues.append(f"{repo}: GITHUB {live['__error']}")
        time.sleep(1.2)
        continue
    checked += 1
    entry = by_repo[repo]
    claimed_lic = (entry["alternative"].get("license") or {}).get("spdx", "")
    live_lic = ((live.get("license") or {}).get("spdx_id") or "NOASSERTION")
    if live.get("archived"):
        issues.append(f"{repo}: ARCHIVED upstream but catalog claims active")
    if claimed_lic and live_lic not in ("NOASSERTION", "Other") and claimed_lic.lower() != live_lic.lower():
        issues.append(f"{repo}: license drift catalog={claimed_lic} live={live_lic}")
    claimed_lang = entry["alternative"].get("language", "")
    live_lang = live.get("language") or ""
    if claimed_lang and live_lang and claimed_lang.lower() != live_lang.lower():
        issues.append(f"{repo}: language drift catalog={claimed_lang} live={live_lang}")
    stars = live.get("stargazers_count", 0)
    print(f"  {repo:42s} stars={stars:>7,}  lic={live_lic:12s} lang={live_lang or '?'}  archived={live.get('archived')}")
    time.sleep(1.2)

big = [r for r in repos if not str(r).startswith(("__",))]
print(f"\nChecked {checked}/{len(repos)} live repos")
if issues:
    print(f"\n{len(issues)} DATA ISSUE(S):")
    for i in issues:
        print("  x " + i)
else:
    print("DATA CLEAN: no archived repos, no license drift, no language drift in sample")
