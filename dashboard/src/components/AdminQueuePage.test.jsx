import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import AdminQueuePage from "../pages/AdminQueuePage";

describe("AdminQueuePage Component", () => {
  it("renders moderation queue title and tabs", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminQueuePage />
      </MemoryRouter>
    );

    expect(html).toContain("Admin Submissions &amp; Moderation Queue");
    expect(html).toContain("Pending (0)");
    expect(html).toContain("Processed (0)");
  });
});
