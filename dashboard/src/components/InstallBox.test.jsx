import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InstallBox from "./InstallBox";

describe("InstallBox Component", () => {
  it("renders multi-OS tabs and copyable docker command", () => {
    const html = renderToStaticMarkup(
      <InstallBox
        repo="toeverything/AFFiNE"
        alternative={{
          name: "AFFiNE",
          language: "TypeScript",
          ecosystems: { docker: "toeverything/affine:stable" },
        }}
      />
    );

    expect(html).toContain("Run &amp; Install AFFiNE");
    expect(html).toContain("Docker");
    expect(html).toContain("Homebrew");
    expect(html).toContain("Winget");
    expect(html).toContain("NPM");
    expect(html).toContain("docker run");
  });
});
