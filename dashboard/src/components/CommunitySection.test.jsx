import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// SSR smoke for the P8 community layer. The zustand-persisted store is created
// at module scope, so the localStorage stub must land BEFORE the component
// import — hence the dynamic import below (node environment has no storage).
describe("CommunitySection SSR smoke (PRD §34)", () => {
  it("renders votes, tag composer and both GitHub deep-link flows", async () => {
    if (typeof globalThis.localStorage === "undefined") {
      globalThis.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      };
    }
    const { default: CommunitySection } = await import("./CommunitySection");
    const html = renderToStaticMarkup(<CommunitySection repo="usebruno/bruno" />);

    expect(html).toContain("Community verdict");
    expect(html).toContain("Works for me");
    expect(html).toContain("add a tag");
    expect(html).toContain("Send suggestion");
    expect(html).toContain("Report wrong data");
    // Both export flows compose prefilled GitHub issue URLs…
    const matches = html.match(/github\.com\/bengowtham70-dev\/opensource-hub\/issues\/new/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
