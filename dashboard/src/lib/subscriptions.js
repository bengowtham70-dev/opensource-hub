// PRD §37 & §39.1 — "Paste-your-subscriptions" instant matcher & Savings Studio
// Parses messy user input (invoices, CSVs, bulleted lists) into matched OSS alternatives and annual savings.

export const SAMPLE_PRESET_STACKS = [
  {
    id: "startup",
    name: "Modern Startup",
    description: "Team collaboration, design, observability, and dev tools",
    text: "Slack ($12/mo)\nNotion ($10/mo)\nFigma ($15/mo)\nDatadog ($65/mo)\nPostman ($14/mo)\nGoogle Analytics",
  },
  {
    id: "creator",
    name: "Freelance Creator",
    description: "Database spreadsheets, screen recording, automation, and forms",
    text: "Airtable ($20/mo)\nLoom ($10/mo)\nZapier ($29/mo)\nTypeform ($25/mo)\nWebflow ($29/mo)",
  },
  {
    id: "agency",
    name: "Dev Agency",
    description: "Project management, error tracking, auth, and analytics",
    text: "Jira ($8/mo)\nSentry ($26/mo)\nAuth0 ($35/mo)\nSegment ($120/mo)\nGitHub Enterprise",
  },
  {
    id: "homelab",
    name: "Homelab / Privacy",
    description: "Passwords, media, personal cloud, and notes",
    text: "1Password ($3/mo)\nSpotify ($11/mo)\nGoogle Photos ($2/mo)\nDropbox ($10/mo)\nTrello ($5/mo)",
  },
];

export function extractPriceFromLine(raw = "") {
  const line = String(raw || "");
  // Ignore pure seats or user counts like '5 seats', '10 users' without currency
  const stripped = line.replace(/\(?\d+\s*(?:seats?|users?|licenses?|members?)\)?/gi, "");

  // Match currency and amount like $15, $15.50, 15 USD, 240/yr, 10/month, $10/mo
  const match =
    stripped.match(/(?:[\$€£]|USD|EUR|GBP)\s*(\d+(?:\.\d{1,2})?)(?:\s*(?:\/|\s*(?:per|a)\s*)?(mo|month|yr|year|annual))?/i) ||
    stripped.match(/(\d+(?:\.\d{1,2})?)\s*(?:[\$€£]|USD|EUR|GBP)(?:\s*(?:\/|\s*(?:per|a)\s*)?(mo|month|yr|year|annual))?/i) ||
    stripped.match(/(\d+(?:\.\d{1,2})?)\s*(?:\/|\s*(?:per|a)\s*)(mo|month|yr|year|annual)/i);

  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;

  const freq = match[2] ? match[2].toLowerCase() : "mo";
  const isAnnual = freq === "yr" || freq === "year" || freq === "annual";

  return {
    rawMatch: match[0],
    amount: num,
    period: isAnnual ? "year" : "month",
    annualEquivalent: isAnnual ? Math.round(num) : Math.round(num * 12),
  };
}

function cleanLine(raw = "") {
  return String(raw || "")
    // remove markdown bullet prefixes like - or * or numbers like 1.
    .replace(/^[\s*•\-–\d.)]+/, "")
    // remove price notes like ($15/mo, $240/yr, €12/month, 15 USD)
    .replace(/\(?[\$€£]?\s*\d+[\d,.]*\s*(?:\/|\s*(?:per|a)\s*)?(?:mo|month|yr|year|user|seat)?\)?/gi, "")
    // remove quantity notes like (5 seats, 10 licenses)
    .replace(/\(?\d+\s*(?:seats?|users?|licenses?|members?)\)?/gi, "")
    // remove web domains like .com, .io
    .replace(/https?:\/\//gi, "")
    .replace(/\.(?:com|io|org|net|co|ai|app)\b/gi, "")
    .trim();
}

function normalize(s = "") {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getParityPercent(pairing) {
  if (!pairing) return 90;
  if (typeof pairing.parity === "number") return pairing.parity;
  const a = pairing.alternative;
  if (typeof a?.parity === "number") return a.parity;
  const parityList = Array.isArray(a?.parity) ? a.parity : [];
  const gapsList = Array.isArray(a?.gaps) ? a.gaps : [];
  const total = parityList.length + gapsList.length;
  return total > 0 ? Math.round((parityList.length / total) * 100) : 90;
}

export function parseSubscriptionsText(input = "", pairings = []) {
  if (!input || !input.trim()) {
    return {
      matched: [],
      unmatched: [],
      totalAnnualSavings: 0,
      grossAnnualSavings: 0,
      estimatedSelfHostCost: 0,
      netAnnualSavings: 0,
      totalCount: 0,
      averageParity: 0,
      composeCandidateRepos: [],
    };
  }

  // Split lines by newline, comma, semicolon, bullet
  const rawSegments = input
    .split(/[\n;•|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const matched = [];
  const unmatched = [];
  const seenPairings = new Set();

  for (const raw of rawSegments) {
    const extractedPrice = extractPriceFromLine(raw);
    const cleaned = cleanLine(raw);
    const q = normalize(cleaned);
    if (!q) continue;

    let bestPairing = null;
    let bestConfidence = null;

    for (const p of pairings) {
      const paidName = normalize(p.paidTool?.name);
      const paidSlug = normalize(p.paidTool?.slug);
      const altName = normalize(p.alternative?.name);

      if (paidName === q || paidSlug === q) {
        bestPairing = p;
        bestConfidence = "exact";
        break;
      }

      if (paidName && (paidName.includes(q) || q.includes(paidName))) {
        bestPairing = p;
        bestConfidence = "likely";
      } else if (altName && (altName === q || altName.includes(q))) {
        bestPairing = p;
        bestConfidence = "alternative-match";
      }
    }

    if (bestPairing) {
      const pKey = bestPairing.alternative.repo.toLowerCase();
      if (!seenPairings.has(pKey)) {
        seenPairings.add(pKey);

        // Determine annual savings: honor user-entered price if valid, else fallback to catalog
        const defaultCatalogAnnual =
          bestPairing.paidTool?.pricePerYearUsd ||
          (bestPairing.paidTool?.pricePerMonth ? bestPairing.paidTool.pricePerMonth * 12 : 0) ||
          (bestPairing.savings?.yearly || 0);

        const annualSavings =
          extractedPrice && extractedPrice.annualEquivalent > 0
            ? extractedPrice.annualEquivalent
            : defaultCatalogAnnual;

        matched.push({
          inputLine: raw,
          cleanedQuery: cleaned,
          pairing: bestPairing,
          annualSavings,
          enteredPrice: extractedPrice,
          confidence: bestConfidence,
        });
      }
    } else {
      if (!unmatched.includes(cleaned || raw)) {
        unmatched.push(cleaned || raw);
      }
    }
  }


  const grossAnnualSavings = matched.reduce((acc, m) => acc + (m.annualSavings || 0), 0);
  
  // Honest baseline self-hosting cost: $5/mo ($60/yr) per active cluster
  const hasSelfHosted = matched.some(
    (m) =>
      m.pairing.alternative?.selfHosted ||
      m.pairing.alternative?.platforms?.includes("self-host")
  );
  const estimatedSelfHostCost = hasSelfHosted && matched.length > 0 ? 60 : 0;
  const netAnnualSavings = Math.max(0, grossAnnualSavings - estimatedSelfHostCost);

  // Calculate average feature parity across matches
  const parities = matched.map((m) => getParityPercent(m.pairing));
  const averageParity =
    parities.length > 0 ? Math.round(parities.reduce((a, b) => a + b, 0) / parities.length) : 0;

  const composeCandidateRepos = matched.map((m) => m.pairing.alternative.repo);

  return {
    matched,
    unmatched,
    totalAnnualSavings: grossAnnualSavings,
    grossAnnualSavings,
    estimatedSelfHostCost,
    netAnnualSavings,
    totalCount: matched.length,
    averageParity,
    composeCandidateRepos,
  };
}
