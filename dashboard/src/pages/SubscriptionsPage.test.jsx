import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import SubscriptionsPage from "./SubscriptionsPage";

describe("SubscriptionsPage Component (PRD §37 & §39.1)", () => {
  it("renders Subscriptions & Stack Matcher headline and sample presets", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SubscriptionsPage />
      </MemoryRouter>
    );

    expect(html).toContain("Subscriptions &amp; Stack Matcher");
    expect(html).toContain("PRD §37 &amp; §39.1 Personal Savings Studio");
    expect(html).toContain("Modern Startup");
    expect(html).toContain("Freelance Creator");
    expect(html).toContain("Dev Agency");
    expect(html).toContain("Homelab / Privacy");
    expect(html).toContain("Gross Spend Avoided");
    expect(html).toContain("Server Infrastructure");
    expect(html).toContain("Net Annual ROI");
  });
});
