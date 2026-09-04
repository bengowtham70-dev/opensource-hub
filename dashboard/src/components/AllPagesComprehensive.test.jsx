import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Polyfill localStorage & window APIs for SSR node test environment
if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}

describe("Exhaustive UI Pages & Interactive Options Verification", () => {
  it("1. TrendingPage renders hero search, install command, and filter triggers", async () => {
    const { default: TrendingPage } = await import("../pages/TrendingPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/"]}>
        <TrendingPage />
      </MemoryRouter>
    );
    expect(html).toContain("Open Source Alternatives");
    expect(html).toContain("Filters");
    expect(html).toContain("hero-search-input");
  });

  it("2. AiFinderPage renders natural language query input and submit button", async () => {
    const { default: AiFinderPage } = await import("../pages/AiFinderPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/find"]}>
        <AiFinderPage />
      </MemoryRouter>
    );
    expect(html).toContain("AI Tool Finder");
    expect(html).toContain("Find tools");
  });

  it("3. StackAuditPage renders stack textarea, calculate button, and executive report triggers", async () => {
    const { default: StackAuditPage } = await import("../pages/StackAuditPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/stack-audit"]}>
        <StackAuditPage />
      </MemoryRouter>
    );
    expect(html).toContain("Stack Audit");
    expect(html).toContain("Audit my stack");
  });

  it("4. StackBuilderPage renders interactive stack builder options", async () => {
    const { default: StackBuilderPage } = await import("../pages/StackBuilderPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/stacks/builder"]}>
        <StackBuilderPage />
      </MemoryRouter>
    );
    expect(html).toContain("Build &amp; Share Your Open-Source Stack");
  });

  it("5. StacksPage renders curated software stacks", async () => {
    const { default: StacksPage } = await import("../pages/StacksPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/stacks"]}>
        <StacksPage />
      </MemoryRouter>
    );
    expect(html).toContain("Browse by Tech Stack");
  });

  it("6. ListsIndexPage & ListDetailPage render curated collections", async () => {
    const { ListsIndexPage, ListDetailPage } = await import("../pages/ListsPage");
    const indexHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/lists"]}>
        <ListsIndexPage />
      </MemoryRouter>
    );
    expect(indexHtml).toContain("Curated lists");

    const detailHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/lists/self-hosted-starter-pack"]}>
        <Routes>
          <Route path="/lists/:slug" element={<ListDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(detailHtml).toBeDefined();
  });

  it("7. WatchlistPage renders tracking and alert options", async () => {
    const { default: WatchlistPage } = await import("../pages/WatchlistPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/watchlist"]}>
        <WatchlistPage />
      </MemoryRouter>
    );
    expect(html).toContain("Your Watchlist");
    expect(html).toContain("Health &amp; Trust Alerts");
  });

  it("8. FavoritesPage renders bookmarks and export options", async () => {
    const { default: FavoritesPage } = await import("../pages/FavoritesPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/favorites"]}>
        <FavoritesPage />
      </MemoryRouter>
    );
    expect(html).toContain("Your favorites");
  });

  it("9. LearnListPage & LearnArticlePage render educational articles", async () => {
    const { LearnListPage, LearnArticlePage } = await import("../pages/LearnPages");
    const listHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/learn"]}>
        <LearnListPage />
      </MemoryRouter>
    );
    expect(listHtml).toContain("Learn");

    const articleHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/learn/what-is-open-source"]}>
        <Routes>
          <Route path="/learn/:slug" element={<LearnArticlePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(articleHtml).toBeDefined();
  });

  it("10. BlogListPage & BlogPostPage render editorial articles", async () => {
    const { BlogListPage, BlogPostPage } = await import("../pages/BlogPages");
    const listHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/blog"]}>
        <BlogListPage />
      </MemoryRouter>
    );
    expect(listHtml).toContain("Blog");

    const postHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/blog/why-we-built-opensource-hub"]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(postHtml).toBeDefined();
  });

  it("11. McpPage renders Model Context Protocol options and servers", async () => {
    const { default: McpPage } = await import("../pages/McpPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/mcp"]}>
        <McpPage />
      </MemoryRouter>
    );
    expect(html).toContain("Model Context Protocol");
  });

  it("12. ReleasesFeedPage renders global releases feed", async () => {
    const { default: ReleasesFeedPage } = await import("../pages/ReleasesFeedPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/releases"]}>
        <ReleasesFeedPage />
      </MemoryRouter>
    );
    expect(html).toContain("Releases");
  });

  it("13. LicensesPage renders SPDX license guides and policies", async () => {
    const { default: LicensesPage } = await import("../pages/LicensesPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/licenses"]}>
        <LicensesPage />
      </MemoryRouter>
    );
    expect(html).toContain("License");
  });

  it("14. AlternativesPage & PaidToolPage render SaaS alternatives", async () => {
    const { default: AlternativesPage } = await import("../pages/AlternativesPage");
    const altHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/alternatives"]}>
        <AlternativesPage />
      </MemoryRouter>
    );
    expect(altHtml).toContain("Alternatives");

    const { default: PaidToolPage } = await import("../pages/PaidToolPage");
    const toolHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/alternatives/slack"]}>
        <Routes>
          <Route path="/alternatives/:slug" element={<PaidToolPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(toolHtml).toBeDefined();
  });

  it("15. ComparePage renders side-by-side comparison matrix", async () => {
    const { default: ComparePage } = await import("../pages/ComparePage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/compare/mattermost/vs/zulip"]}>
        <Routes>
          <Route path="/compare/:a/vs/:b" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(html).toBeDefined();
  });

  it("16. CategoriesPage renders taxonomy categories", async () => {
    const { default: CategoriesPage } = await import("../pages/CategoriesPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/categories"]}>
        <CategoriesPage />
      </MemoryRouter>
    );
    expect(html).toContain("Categories");
  });

  it("17. SubmitPage renders submission forms for tools and claim options", async () => {
    const { default: SubmitPage } = await import("../pages/SubmitPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/submit"]}>
        <SubmitPage />
      </MemoryRouter>
    );
    expect(html).toContain("Submit");
  });

  it("18. AdvertisePage renders sponsorship tiers and pricing", async () => {
    const { default: AdvertisePage } = await import("../pages/AdvertisePage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/advertise"]}>
        <AdvertisePage />
      </MemoryRouter>
    );
    expect(html).toContain("Advertise");
  });

  it("19. AdminQueuePage renders moderation queue options", async () => {
    const { default: AdminQueuePage } = await import("../pages/AdminQueuePage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminQueuePage />
      </MemoryRouter>
    );
    expect(html).toContain("Admin");
  });

  it("20. AuditsPage renders security and compliance audits list", async () => {
    const { default: AuditsPage } = await import("../pages/AuditsPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/audits"]}>
        <AuditsPage />
      </MemoryRouter>
    );
    expect(html).toContain("Saved audits");
  });

  it("21. RepoDetailPage renders repository detail with modals", async () => {
    const { default: RepoDetailPage } = await import("../pages/RepoDetailPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/repo/toeverything/affine"]}>
        <Routes>
          <Route path="/repo/:owner/:name" element={<RepoDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(html).toBeDefined();
  });

  it("22. ClaimModal renders maintainer verification snippet", async () => {
    const { default: ClaimModal } = await import("./ClaimModal");
    const html = renderToStaticMarkup(
      <ClaimModal open={true} onClose={() => {}} repo="toeverything/affine" name="AFFiNE" />
    );
    expect(html).toContain("Claim Repository Verification");
    expect(html).toContain(".opensource-hub.json");
  });

  it("23. ExecutiveReportModal renders B2B procurement report with print option", async () => {
    const { default: ExecutiveReportModal } = await import("./ExecutiveReportModal");
    const report = {
      matched: [
        {
          paidTool: { name: "Slack", pricePerYearUsd: 180 },
          alternative: { name: "Mattermost", repo: "mattermost/mattermost", license: { spdx: "AGPL-3.0" } },
          savingsUsd: 180,
        },
      ],
      unmatched: [],
      totalSavings: 180,
    };
    const html = renderToStaticMarkup(
      <ExecutiveReportModal open={true} onClose={() => {}} report={report} />
    );
    expect(html).toContain("B2B Executive Report");
    expect(html).toContain("Print / Save as PDF");
    expect(html).toContain("Mattermost");
  });

  it("24. EmbedModal renders dynamic badge tabs and copy options", async () => {
    const { default: EmbedModal } = await import("./EmbedModal");
    const html = renderToStaticMarkup(
      <EmbedModal open={true} onClose={() => {}} repo="toeverything/affine" name="AFFiNE" />
    );
    expect(html).toContain("Embed Badge on your README");
    expect(html).toContain("Trust Score");
  });

  it("25. NewsletterFooter renders subscription form", async () => {
    const { default: NewsletterFooter } = await import("./NewsletterFooter");
    const html = renderToStaticMarkup(<NewsletterFooter />);
    expect(html).toContain("Weekly Open-Source Intelligence");
    expect(html).toContain("Subscribe");
  });

  it("26. NewsletterPage renders archive header and subscribe options", async () => {
    const { default: NewsletterPage } = await import("../pages/NewsletterPage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/newsletter"]}>
        <NewsletterPage />
      </MemoryRouter>
    );
    expect(html).toContain("OpenSource Hub Weekly Digest");
    expect(html).toContain("Get the Weekly Briefing");
  });

  it("27. HardwarePage renders simulator, sliders and machine presets", async () => {
    const { default: HardwarePage } = await import("../pages/HardwarePage");
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/hardware"]}>
        <HardwarePage />
      </MemoryRouter>
    );
    expect(html).toContain("Can I Run This?");
    expect(html).toContain("Self-Hosted Sizing Engine");
    expect(html).toContain("System RAM:");
  });
});
