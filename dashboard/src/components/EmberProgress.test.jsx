import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import EmberProgress from "./EmberProgress";

describe("EmberProgress SSR smoke", () => {
  it("exposes determinate progress semantics", () => {
    const html = renderToStaticMarkup(<EmberProgress pct={0.42} />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="42"');
    expect(html).toContain("42 percent");
  });

  it("omits aria-valuenow when indeterminate", () => {
    const html = renderToStaticMarkup(<EmberProgress />);
    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain("aria-valuenow");
    expect(html).toContain("In progress");
  });
});
