import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstallPill from "./InstallPill";

// PRD section 19 Phase-1 — hero carries a copy-able install command pill.
describe("InstallPill SSR smoke", () => {
  const html = renderToStaticMarkup(<InstallPill />);

  it("renders the npm command with copy affordance", () => {
    expect(html).toContain("npm install -g");
    expect(html).toContain("opensource-hub");
    expect(html).toContain("Copy install command");
  });
});
