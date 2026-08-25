// PRD §20 — "Stack audit" mode (plans/PLAN_FEATURES.md batch 2).
// Paste a list of paid tools → report of matched alternatives + honest totals.
// Pure logic here; route + UI are thin.

function normalize(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function words(s) {
  return normalize(s).split(" ").filter((w) => w.length > 1);
}

// Match one user-entered tool name against the catalog's paid tools.
// Order: exact slug → exact normalized name → name containment → word overlap.
export function matchTool(input, pairings) {
  const q = normalize(input);
  if (!q) return null;

  let best = null;
  for (const p of pairings) {
    const slug = normalize(p.paidTool.slug);
    const name = normalize(p.paidTool.name);
    if (slug === q || name === q) return { pairing: p, confidence: "exact" };
    if (name.includes(q) || q.includes(name)) {
      best = best || { pairing: p, confidence: "likely" };
    }
  }
  if (best) return best;

  const qw = new Set(words(input));
  let bestOverlap = 0;
  for (const p of pairings) {
    const overlap = words(p.paidTool.name).filter((w) => qw.has(w)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = { pairing: p, confidence: "fuzzy" };
    }
  }
  return best;
}

export function auditStack(input, pairings) {
  const lines = String(input || "")
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const matched = [];
  const unmatched = [];
  const seen = new Set();

  for (const line of lines) {
    const m = matchTool(line, pairings);
    if (!m) {
      unmatched.push(line);
      continue;
    }
    const slug = m.pairing.paidTool.slug;
    if (seen.has(slug)) continue; // duplicate tool in the pasted list
    seen.add(slug);
    matched.push({
      paidTool: {
        name: m.pairing.paidTool.name,
        planName: m.pairing.paidTool.planName,
        pricePerYearUsd: m.pairing.paidTool.pricePerYearUsd,
      },
      alternative: {
        name: m.pairing.alternative.name,
        repo: m.pairing.alternative.repo,
        language: m.pairing.alternative.language,
        license: m.pairing.alternative.license ?? null,
      },
      matchConfidence: m.confidence,
      savingsPerYearUsd: m.pairing.paidTool.pricePerYearUsd,
    });
  }

  const totalSavings = matched.reduce((sum, m) => sum + m.savingsPerYearUsd, 0);
  return {
    matched,
    unmatched,
    totals: {
      tools: matched.length,
      savingsPerYearUsd: totalSavings,
      disclaimer:
        "Estimates from typical list prices. Self-hosted alternatives may add hosting costs — check each tool's True cost check.",
    },
  };
}

// PRD §20 — exportable report, same CSV discipline as trust audits.
export function stackAuditToCsv(report) {
  const esc = (v) => {
    const s = String(v ?? "");
    return `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["paid_tool", "plan", "paid_per_year_usd", "free_alternative", "repo", "license", "match"],
    ...report.matched.map((m) => [
      m.paidTool.name,
      m.paidTool.planName,
      m.paidTool.pricePerYearUsd,
      m.alternative.name,
      m.alternative.repo,
      m.alternative.license?.spdx || "",
      m.matchConfidence,
    ]),
    [],
    ["tools_matched", report.totals.tools],
    ["total_savings_per_year_usd", report.totals.savingsPerYearUsd],
    ["disclaimer", report.totals.disclaimer],
  ];
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
