import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import AppStoresPage from "./AppStoresPage";

describe("AppStoresPage Component (PRD §31)", () => {
  it("renders Home-Server App Store Hub with platforms and export options", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AppStoresPage />
      </MemoryRouter>
    );

    expect(html).toContain("Self-Hosting &amp; Home-Server App Stores");
    expect(html).toContain("PRD §31 Self-Hosting &amp; Container Distribution");
    expect(html).toContain("UmbrelOS");
    expect(html).toContain("CasaOS");
    expect(html).toContain("Runtipi");
    expect(html).toContain("Unraid");
    expect(html).toContain("Run OpenSource Hub on your Home Server");
    expect(html).toContain("Download UmbrelOS Store (.zip)");
  });
});
