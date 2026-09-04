import test from "node:test";
import assert from "node:assert/strict";
import { parseSubscriptionsText } from "../dashboard/src/lib/subscriptions.js";

const mockPairings = [
  {
    paidTool: { name: "Notion", slug: "notion", pricePerYearUsd: 120 },
    alternative: { name: "AFFiNE", repo: "toeverything/affine" },
  },
  {
    paidTool: { name: "Slack", slug: "slack", pricePerYearUsd: 96 },
    alternative: { name: "Mattermost", repo: "mattermost/mattermost" },
  },
  {
    paidTool: { name: "Airtable", slug: "airtable", pricePerYearUsd: 240 },
    alternative: { name: "NocoDB", repo: "nocodb/nocodb" },
  },
];

test("parseSubscriptionsText cleans messy inputs and matches tools", () => {
  const input = `
    - Notion ($10/mo)
    • Slack (5 seats)
    https://airtable.com
    UnknownCustomToolXYZ
  `;

  const res = parseSubscriptionsText(input, mockPairings);
  assert.equal(res.matched.length, 3);
  assert.equal(res.unmatched.length, 1);
  assert.ok(res.unmatched[0].includes("UnknownCustomToolXYZ"));
  assert.equal(res.totalAnnualSavings, 120 + 96 + 240);
  assert.deepEqual(res.composeCandidateRepos, [
    "toeverything/affine",
    "mattermost/mattermost",
    "nocodb/nocodb",
  ]);
});

test("parseSubscriptionsText handles empty input safely", () => {
  const res = parseSubscriptionsText("", mockPairings);
  assert.equal(res.matched.length, 0);
  assert.equal(res.totalAnnualSavings, 0);
  assert.equal(res.totalCount, 0);
});

test("parseSubscriptionsText extracts custom user prices and computes net savings", () => {
  const input = `
    Notion $25/mo
    Slack $200/year
  `;
  const res = parseSubscriptionsText(input, mockPairings);
  assert.equal(res.matched.length, 2);
  // Notion: $25 * 12 = 300
  // Slack: $200/year = 200
  assert.equal(res.grossAnnualSavings, 500);
  assert.equal(res.totalAnnualSavings, 500);
  // Net savings with self-host baseline ($60/yr)
  assert.equal(res.netAnnualSavings, 500);
});

