import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ParityVotingWidget from "./ParityVotingWidget";

describe("ParityVotingWidget Component (PRD §34)", () => {
  it("renders full parity consensus, 3-tier action buttons and distribution legend", () => {
    const html = renderToStaticMarkup(
      <ParityVotingWidget
        repo="supabase/supabase"
        name="Supabase"
        replaces="Firebase"
      />
    );

    expect(html).toContain("Community verdict: Parity Consensus");
    expect(html).toContain("Full Replacement");
    expect(html).toContain("Works for me");
    expect(html).toContain("Has Tradeoffs");
    expect(html).toContain("Not Viable");
    expect(html).toContain("Suitability Distribution");
    expect(html).toContain("Firebase");
  });

  it("renders compact mode for comparison grids", () => {
    const html = renderToStaticMarkup(
      <ParityVotingWidget
        repo="usebruno/bruno"
        name="Bruno"
        replaces="Postman"
        compact={true}
      />
    );

    expect(html).toContain("Community Consensus");
    expect(html).toContain("Parity");
    expect(html).toContain("Postman");
  });
});
