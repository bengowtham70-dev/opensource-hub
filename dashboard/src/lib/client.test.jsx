import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { buildSparklinePath, buildSparklineAreaPath, getSparklinePoints } from "./sparkline";
import Markdown from "./markdown";
import RepoCard from "../components/RepoCard";
import Header from "../components/Header";
import { formatStars, formatSavings, formatBytes, formatCompact, relativeDate } from "./format";

describe("buildSparklinePath", () => {
  const history = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, "0")}`,
    stars: 1000 + i * 10,
  }));

  it("starts with M and has 29 L segments", () => {
    const d = buildSparklinePath(history);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("L").length).toBe(30); // 1 M + 29 L segments
  });

  it("returns empty string for empty history", () => {
    expect(buildSparklinePath([])).toBe("");
  });

  it("handles flat data without divide-by-zero", () => {
    const flat = history.map((h) => ({ ...h, stars: 500 }));
    const d = buildSparklinePath(flat);
    expect(d).toContain(",");
  });

  it("buildSparklineAreaPath creates closed path with Z", () => {
    const area = buildSparklineAreaPath(history, 100, 30);
    expect(area.endsWith("Z")).toBe(true);
    expect(area.startsWith("M")).toBe(true);
    expect(buildSparklineAreaPath([])).toBe("");
  });

  it("getSparklinePoints returns array of coordinate objects", () => {
    const points = getSparklinePoints(history, 100, 30);
    expect(points.length).toBe(30);
    expect(points[0]).toHaveProperty("x");
    expect(points[0]).toHaveProperty("y");
    expect(points[0]).toHaveProperty("stars");
    expect(getSparklinePoints([])).toEqual([]);
  });
});

describe("format utils", () => {
  it("formats stars compactly", () => {
    expect(formatStars(99500)).toBe("99,500");
    expect(formatStars(35400)).toBe("35,400");
    expect(formatStars(950)).toBe("950");
  });

  it("formats savings with thousands separators", () => {
    expect(formatSavings(1440)).toBe("$1,440");
    expect(formatSavings(96)).toBe("$96");
  });

  it("formats byte sizes", () => {
    expect(formatBytes(123737656)).toBe("118 MB");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("relative dates", () => {
    expect(relativeDate(new Date(Date.now() - 86400000).toISOString())).toBe("yesterday");
    expect(relativeDate(null)).toBe("");
  });
});

describe("Markdown renderer", () => {
  it("renders headings, bold, code and lists safely", () => {
    const html = renderToStaticMarkup(
      <Markdown source={"# Title\n\nSome **bold** and `code`.\n\n- one\n- two"} />
    );
    expect(html).toContain("<h1");
    expect(html).toContain("<strong");
    expect(html).toContain("<code");
    expect(html).toContain("<ul");
    expect(html).not.toContain("**bold**");
  });

  it("does not inject raw HTML", () => {
    const html = renderToStaticMarkup(<Markdown source={"<img src=x onerror=alert(1)>"} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("formatCompact", () => {
  it("scales downloads into compact mono units", () => {
    expect(formatCompact(2_100_000)).toBe("2.1M");
    expect(formatCompact(9_500_000)).toBe("9.5M");
    expect(formatCompact(42_000)).toBe("42k");
    expect(formatCompact(1500)).toBe("1.5k");
    expect(formatCompact(999)).toBe("999");
  });
});

describe("RepoCard P5 surfaces (PRD §35/§38)", () => {
  const pairing = {
    paidTool: { name: "Postman", planName: "Team", pricePerYearUsd: 240 },
    alternative: {
      name: "Bruno",
      repo: "usebruno/bruno",
      language: "JavaScript",
      tags: ["api", "http"],
      description: "A fast, git-friendly API client.",
    },
    relationship: "direct",
    goalTags: [],
  };
  const renderCard = (props) =>
    renderToStaticMarkup(
      <MemoryRouter>
        <RepoCard pairing={pairing} stars30d={null} index={0} {...props} />
      </MemoryRouter>
    );

  it("hides freshness pill and metrics row on seed data (never fabricated)", () => {
    const html = renderCard({});
    expect(html).not.toContain("npm/mo");
    expect(html).not.toContain("pulls");
    expect(html).not.toContain("last push");
  });

  it("renders the mono downloads row from the weekly snapshot sample", () => {
    const html = renderCard({
      downloads: { npm: 2_100_000, docker: 840_000, sampledAt: "2026-08-20" },
    });
    expect(html).toContain("2.1M npm/mo");
    expect(html).toContain("840k pulls");
    expect(html).toContain("weekly sample 2026-08-20");
  });

  it("freshness pill tones follow the <90d / >180d bands", () => {
    const fresh = new Date(Date.now() - 3 * 86400000).toISOString();
    const stale = new Date(Date.now() - 200 * 86400000).toISOString();
    const htmlFresh = renderCard({ freshness: { pushedAt: fresh, days: 3, tone: "trust" } });
    expect(htmlFresh).toContain("border-trust/30");
    expect(htmlFresh).toContain("3d ago");
    const htmlStale = renderCard({ freshness: { pushedAt: stale, days: 200, tone: "caution" } });
    expect(htmlStale).toContain("border-caution/30");
  });

  it("maintenance pill renders PRD section 2.2 statuses and hides when unknown", () => {
    const abandoned = renderCard({ maintenance: { status: "abandoned" } });
    expect(abandoned).toContain("abandoned");
    expect(abandoned).toContain("#dc2626"); // TrustMeter high-risk (AA-tuned Sentinel semantic)
    const active = renderCard({ maintenance: { status: "active" } });
    expect(active).toContain("var(--color-trust-strong)"); // AA trust text on white (small badge)
    expect(renderCard({})).not.toContain("Maintenance status");
  });
});

describe("Header regression (mobile nav icons)", () => {
  it("renders without ReferenceError — Menu/X imported from lucide-react", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(html).toContain('aria-controls="mobile-nav"');
  });
});
