import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ReviewsSection from "./ReviewsSection";

describe("ReviewsSection Component", () => {
  it("renders heading, verified badge, and write review trigger", () => {
    const html = renderToStaticMarkup(
      <ReviewsSection repo="toeverything/AFFiNE" name="AFFiNE" replaces="Notion" />
    );

    expect(html).toContain("Developer Reviews &amp; Switcher Stories");
    expect(html).toContain("Verified");
    expect(html).toContain("Write a Switcher Review");
    expect(html).toContain("Based on 0");
  });
});
