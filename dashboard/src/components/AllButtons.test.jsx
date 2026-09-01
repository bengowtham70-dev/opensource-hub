import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Ensure global localStorage exists in Node environment for Vitest
if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}

describe("Comprehensive Button & Interactive Element Verification", () => {
  it("Header renders all navigation buttons, dropdowns, theme toggle, and search", async () => {
    const { default: Header } = await import("./Header");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Main links
    expect(html).toContain("Alternatives");
    expect(html).toContain("Categories");
    expect(html).toContain("Collections");
    expect(html).toContain("Tools");
    expect(html).toContain("Advertise");
    expect(html).toContain("Submit");
    expect(html).toContain("Sign In");

    // Theme toggle button
    expect(html).toContain('aria-label="Switch to dark mode"');

    // Search input
    expect(html).toContain('placeholder="Search tools..."');
  });

  it("FilterDrawer renders all multi-select facet buttons and clear all affordance", async () => {
    const { default: FilterDrawer } = await import("./FilterDrawer");
    const mockPairings = [
      {
        paidTool: { name: "Notion", slug: "notion", category: "Productivity" },
        alternative: {
          name: "AppFlowy",
          repo: "AppFlowy-IO/AppFlowy",
          language: "Flutter",
          tags: ["rust", "desktop"],
          license: { spdx: "AGPL-3.0" },
        },
      },
    ];

    const html = renderToStaticMarkup(
      <FilterDrawer
        pairings={mockPairings}
        selectedAlternative="notion"
        selectedCategory=""
        selectedLanguage=""
        selectedLicense=""
        onSelectAlternative={() => {}}
        onSelectCategory={() => {}}
        onSelectLanguage={() => {}}
        onSelectLicense={() => {}}
        onClearAll={() => {}}
      />
    );

    expect(html).toContain("Filter Tools by Facet");
    expect(html).toContain("Clear all filters");
    expect(html).toContain("Notion");
    expect(html).toContain("Productivity");
    expect(html).toContain("Flutter");
    expect(html).toContain("AGPL-3.0");
  });

  it("RepoCard renders card links, favorite heart button, and savings banner", async () => {
    const { default: RepoCard } = await import("./RepoCard");
    const pairing = {
      paidTool: { name: "Notion", slug: "notion", category: "Productivity", pricePerYearUsd: 120 },
      alternative: {
        name: "AppFlowy",
        repo: "AppFlowy-IO/AppFlowy",
        description: "Open source Notion alternative",
        license: { spdx: "AGPL-3.0" },
      },
    };

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RepoCard pairing={pairing} stars30d={{ stars: 55000, delta: 1200 }} />
      </MemoryRouter>
    );

    expect(html).toContain("AppFlowy");
    expect(html).toContain("Add AppFlowy to favorites");
    expect(html).toContain("Alternative to:");
    expect(html).toContain("Notion");
    expect(html).toContain("Save ~");
    expect(html).toContain("120");
  });

  it("ShareBar renders copy link button and social intent links", async () => {
    const { default: ShareBar } = await import("./ShareBar");
    const html = renderToStaticMarkup(
      <ShareBar repo="AppFlowy-IO/AppFlowy" name="AppFlowy" />
    );

    expect(html).toContain("Copy link");
    expect(html).toContain("https://twitter.com/intent/post");
    expect(html).toContain("https://bsky.app/intent/compose");
    expect(html).toContain("https://reddit.com/submit");
    expect(html).toContain("https://news.ycombinator.com/submitlink");
  });

  it("EmbedModal renders Markdown and HTML snippet copy buttons", async () => {
    const { default: EmbedModal } = await import("./EmbedModal");
    const html = renderToStaticMarkup(
      <EmbedModal open={true} onClose={() => {}} repo="AppFlowy-IO/AppFlowy" name="AppFlowy" />
    );

    expect(html).toContain("Embed Badge on your README");
    expect(html).toContain("Markdown (for README.md)");
    expect(html).toContain("HTML (for Websites)");
    expect(html).toContain("Copy");
  });

  it("ReportModal renders feedback reason select and submit report button", async () => {
    const { default: ReportModal } = await import("./ReportModal");
    const html = renderToStaticMarkup(
      <ReportModal open={true} onClose={() => {}} repo="AppFlowy-IO/AppFlowy" name="AppFlowy" />
    );

    expect(html).toContain("Report or Suggest Edits");
    expect(html).toContain("Outdated features / pricing / version");
    expect(html).toContain("Submit report");
    expect(html).toContain("Cancel");
  });

  it("TcoCalculator renders all hosting preset buttons and cost calculation", async () => {
    const { default: TcoCalculator } = await import("./TcoCalculator");
    const paidTool = { name: "Slack", planName: "Pro", pricePerYearUsd: 105 };
    const tco = { hostingMonthlyEstimateUsd: 5 };

    const html = renderToStaticMarkup(<TcoCalculator paidTool={paidTool} tco={tco} />);

    expect(html).toContain("True cost check");
    expect(html).toContain("Local only");
    expect(html).toContain("Budget VPS");
    expect(html).toContain("Capable VPS");
    expect(html).toContain("Managed cloud");
    expect(html).toContain("You keep");
  });

  it("TrustMeter renders score ring, appeal button, save audit button, and signals toggle", async () => {
    const { default: TrustMeter } = await import("./TrustMeter");
    const trust = {
      score: 88,
      band: "strong",
      maintenance: { status: "active", reason: "frequent commits" },
      signals: [
        { key: "commit", label: "Commit Velocity", points: 25, detail: "Active pushes" },
      ],
      redFlags: [],
      appeal: "https://github.com/bengowtham70/opensource-hub/issues/new",
      disclaimer: "Trust score based on public data",
    };

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TrustMeter trust={trust} repo="AppFlowy-IO/AppFlowy" />
      </MemoryRouter>
    );

    expect(html).toContain("88");
    expect(html).toContain("Trust Score");
    expect(html).toContain("Why this score? +");
    expect(html).toContain("Dispute this score");
    expect(html).toContain("Save audit");
  });

  it("DeployButtons renders one-click cloud deploy buttons", async () => {
    const { default: DeployButtons } = await import("./DeployButtons");
    const alternative = {
      platforms: ["self-host", "web"],
      ecosystems: { docker: "coollabsio/coolify" },
    };

    const html = renderToStaticMarkup(
      <DeployButtons repo="coollabsio/coolify" alternative={alternative} />
    );

    expect(html).toContain("Deploy on Railway");
    expect(html).toContain("Deploy on Vercel");
  });

  it("SubmitPage renders tool submission form, copy markdown button, and criteria", async () => {
    const { default: SubmitPage } = await import("./../pages/SubmitPage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SubmitPage />
      </MemoryRouter>
    );

    expect(html).toContain("Submit an Open Source");
    expect(html).toContain("Tool Details");
    expect(html).toContain("GitHub Repository *");
    expect(html).toContain("Replaces (Paid Tool) *");
    expect(html).toContain("Copy markdown issue");
    expect(html).toContain("Submit on GitHub");
    expect(html).toContain("Listing Criteria");
  });

  it("AdvertisePage renders ethical sponsorship tiers and contact CTA buttons", async () => {
    const { default: AdvertisePage } = await import("./../pages/AdvertisePage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdvertisePage />
      </MemoryRouter>
    );

    expect(html).toContain("Advertise on OpenSource Hub");
    expect(html).toContain("Sponsorship Tiers");
    expect(html).toContain("Silver");
    expect(html).toContain("Gold");
    expect(html).toContain("Platinum");
    expect(html).toContain("Get started with Gold");
    expect(html).toContain("Our Advertising Ethics Policy");
  });

  it("AlternativesPage renders search, categories, and paid tool cards", async () => {
    const { default: AlternativesPage } = await import("./../pages/AlternativesPage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AlternativesPage />
      </MemoryRouter>
    );

    expect(html).toContain("Open Source Alternatives");
    expect(html).toContain("Search by paid software");
    expect(html).toContain("All Categories");
  });

  it("BlogPages renders editorial posts listing and reader", async () => {
    const { BlogListPage } = await import("./../pages/BlogPages");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BlogListPage />
      </MemoryRouter>
    );

    expect(html).toContain("OpenSource Hub Blog");
    expect(html).toContain("Editorial &amp; Guides");
  });

  it("McpPage renders Model Context Protocol AI tools and config snippet buttons", async () => {
    const { default: McpPage } = await import("./../pages/McpPage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <McpPage />
      </MemoryRouter>
    );

    expect(html).toContain("Connect OpenSource Hub to AI Agents");
    expect(html).toContain("Claude Desktop");
    expect(html).toContain("Cursor IDE");
    expect(html).toContain("search_alternatives");
    expect(html).toContain("get_trust_score");
    expect(html).toContain("audit_stack");
  });

  it("WatchlistPage renders tracked repositories and manual health check", async () => {
    const { default: WatchlistPage } = await import("./../pages/WatchlistPage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <WatchlistPage />
      </MemoryRouter>
    );

    expect(html).toContain("Your Watchlist");
    expect(html).toContain("Health &amp; Trust Alerts");
  });

  it("StacksPage renders categorized tech stack index and tool counts", async () => {
    const { default: StacksPage } = await import("./../pages/StacksPage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <StacksPage />
      </MemoryRouter>
    );

    expect(html).toContain("Browse by Tech Stack");
    expect(html).toContain("Programming Languages");
    expect(html).toContain("Databases &amp; Storage");
  });

  it("LicensesPage renders license compliance categories and commercial use info", async () => {
    const { default: LicensesPage } = await import("./../pages/LicensesPage");
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LicensesPage />
      </MemoryRouter>
    );

    expect(html).toContain("Open Source Licenses Directory");
    expect(html).toContain("Permissive Open Source");
    expect(html).toContain("Strong Copyleft");
  });

  it("ReleaseNotes renders RSS Feed copy button", async () => {
    const { default: ReleaseNotes } = await import("./ReleaseNotes");
    const html = renderToStaticMarkup(
      <ReleaseNotes owner="usebruno" name="bruno" />
    );

    expect(html).toContain("Release notes");
  });

  it("DockerComposeViewer renders 1-Click Compose generator and copy buttons", async () => {
    const { default: DockerComposeViewer } = await import("./DockerComposeViewer");
    const html = renderToStaticMarkup(
      <DockerComposeViewer repo="supabase/supabase" alternative={{ dockerImage: "supabase/postgres:latest", defaultPort: 5432 }} />
    );

    expect(html).toContain("1-Click Docker Compose");
    expect(html).toContain("Copy YAML");
    expect(html).toContain("Download .yml");
    expect(html).toContain("docker compose up -d");
  });

  it("SelfHostSpecs renders RAM, difficulty, and hardware specs", async () => {
    const { default: SelfHostSpecs } = await import("./SelfHostSpecs");
    const html = renderToStaticMarkup(
      <SelfHostSpecs alternative={{ language: "Rust", platforms: ["self-host", "linux"] }} />
    );

    expect(html).toContain("Self-Host Specs &amp; Hardware");
    expect(html).toContain("RAM Needed");
    expect(html).toContain("Target Architectures");
    expect(html).toContain("Beginner");
  });

  it("PrivacyScorecard renders 5 data sovereignty and offline signals", async () => {
    const { default: PrivacyScorecard } = await import("./PrivacyScorecard");
    const html = renderToStaticMarkup(
      <PrivacyScorecard alternative={{ licenseType: "permissive", licenseSpdx: "MIT", platforms: ["windows", "macos"] }} />
    );

    expect(html).toContain("Privacy &amp; Sovereignty Scorecard");
    expect(html).toContain("100% Data Sovereignty");
    expect(html).toContain("Zero Forced Telemetry");
    expect(html).toContain("Local-First &amp; Offline Ready");
  });

  it("MigrationGuide renders 3-step export and import workflow", async () => {
    const { default: MigrationGuide } = await import("./MigrationGuide");
    const html = renderToStaticMarkup(
      <MigrationGuide paidTool={{ name: "Postman" }} alternative={{ name: "Bruno" }} />
    );

    expect(html).toContain("Migration Assistant: Postman → Bruno");
    expect(html).toContain("Export data from Postman");
    expect(html).toContain("Import directly into Bruno");
  });

  it("ContributionRadar renders Good First Issues and Help Wanted links", async () => {
    const { default: ContributionRadar } = await import("./ContributionRadar");
    const html = renderToStaticMarkup(
      <ContributionRadar repo="usebruno/bruno" name="Bruno" />
    );

    expect(html).toContain("Contribution Radar");
    expect(html).toContain("Good First Issues");
    expect(html).toContain("Help Wanted");
    expect(html).toContain("Active Pull Requests");
  });

  it("LiveDemoModal renders Try Live Demo trigger", async () => {
    const { default: LiveDemoModal } = await import("./LiveDemoModal");
    const html = renderToStaticMarkup(
      <LiveDemoModal demoUrl="https://excalidraw.com" name="Excalidraw" repo="excalidraw/excalidraw" />
    );

    expect(html).toContain("Try Live Demo");
  });

  it("TcoCalculator renders interactive seats slider and ROI multiplier", async () => {
    const { default: TcoCalculator } = await import("./TcoCalculator");
    const html = renderToStaticMarkup(
      <TcoCalculator
        paidTool={{ name: "Notion", planName: "Plus", pricePerYearUsd: 120 }}
        tco={{ hostingMonthlyEstimateUsd: 5 }}
      />
    );

    expect(html).toContain("True cost check &amp; Team ROI");
    expect(html).toContain("Team Size (Seats)");
    expect(html).toContain("You keep");
  });

  it("ClaimModal renders maintainer claim workflow and verification snippet", async () => {
    const { default: ClaimModal } = await import("./ClaimModal");
    const html = renderToStaticMarkup(
      <ClaimModal open={true} onClose={() => {}} repo="toeverything/AFFiNE" name="AFFiNE" />
    );

    expect(html).toContain("Claim Repository Verification");
    expect(html).toContain("AFFiNE");
    expect(html).toContain(".opensource-hub.json");
    expect(html).toContain("Verify Now");
  });
});
