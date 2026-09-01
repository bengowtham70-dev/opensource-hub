import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ExecutiveBriefModal from "./ExecutiveBriefModal";

describe("ExecutiveBriefModal Component", () => {
  it("renders financial ROI and security metrics when open", () => {
    const html = renderToStaticMarkup(
      <ExecutiveBriefModal
        open={true}
        repo="toeverything/AFFiNE"
        alternative={{
          name: "AFFiNE",
          license: { spdx: "MIT" },
          parity: ["Rich docs", "Whiteboard"],
          tco: { hostingMonthlyEstimateUsd: 5 },
        }}
        paidTool={{ name: "Notion", pricePerYearUsd: 96, category: "Notes & Docs" }}
        trustScore={{ score: 88 }}
      />
    );

    expect(html).toContain("Executive Migration Brief");
    expect(html).toContain("Notion → AFFiNE");
    expect(html).toContain("Projected Team Cost Comparison");
    expect(html).toContain("Download Markdown");
    expect(html).toContain("Print / PDF");
  });
});
