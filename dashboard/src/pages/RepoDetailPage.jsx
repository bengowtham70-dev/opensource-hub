import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Star,
  GitCommitHorizontal,
  Scale,
  CircleAlert,
  AlertTriangle,
  Package,
  Download,
  Check,
  ExternalLink,
  Heart,
  ShieldCheck,
  TrendingUp,

  Zap,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Code2,
  Flag,
  Globe,
  Rocket,
  Bookmark,
  Maximize2,

  Layers,
  FileText,
  Terminal,
  Users,
  MessageSquarePlus,
  Calculator,
  Image as ImageIcon,
} from "lucide-react";

import { api } from "../lib/api";
import { formatStars, formatSavings, formatBytes, formatCompact, relativeDate } from "../lib/format";
import Sparkline from "../components/Sparkline";
import BrandLogo, { repoBrand, paidBrand } from "../components/BrandLogo";
import ShareBar from "../components/ShareBar";
import Breadcrumbs from "../components/Breadcrumbs";
import { groupForCategory } from "../lib/categories";
import GiscusComments from "../components/GiscusComments";
import CommunitySection from "../components/CommunitySection";
import ReleaseNotes from "../components/ReleaseNotes";
import SimilarTools from "../components/SimilarTools";
import { useHistory } from "../stores/history";
import { getPairings } from "../lib/seed";
import LicenseBadge from "../components/LicenseBadge";
import TeamFit from "../components/TeamFit";
import DeployButtons from "../components/DeployButtons";
import TcoCalculator from "../components/TcoCalculator";
import Byte from "../components/Byte";
import EmberProgress from "../components/EmberProgress";
import { useFavorites } from "../stores/favorites";
import TechStackBadges from "../components/TechStackBadges";
import QuickFactsCard from "../components/QuickFactsCard";
import StarGrowthChart from "../components/StarGrowthChart";
import EmbedModal from "../components/EmbedModal";
import ClaimModal from "../components/ClaimModal";
import ReportModal from "../components/ReportModal";
import DockerComposeViewer from "../components/DockerComposeViewer";
import SelfHostSpecs from "../components/SelfHostSpecs";
import PrivacyScorecard from "../components/PrivacyScorecard";
import MigrationGuide from "../components/MigrationGuide";
import ContributionRadar from "../components/ContributionRadar";
import ProsConsCard from "../components/ProsConsCard";
import HomelabApps from "../components/HomelabApps";
import ReviewsSection from "../components/ReviewsSection";
import InstallBox from "../components/InstallBox";
import SelfHostHub from "../components/SelfHostHub";
import DecisionGuideHub from "../components/DecisionGuideHub";
import AccordionCard from "../components/AccordionCard";
import ExecutiveBriefModal from "../components/ExecutiveBriefModal";
import ContributorShowcase from "../components/ContributorShowcase";

export default function RepoDetailPage() {
  const { owner = "", name = "" } = useParams();
  const repo = `${owner}/${name}`;
  const [data, setData] = useState(null);
  const [release, setRelease] = useState(null);
  const [security, setSecurity] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [showParity, setShowParity] = useState(false);
  const fav = useFavorites();
  const [allPairings, setAllPairings] = useState([]);

  useEffect(() => {
    getPairings().then(setAllPairings).catch(() => {});
  }, []);

  // Parity P2 entry points — siblings sharing a goal tag or paid category.
  const compareSiblings = useMemo(() => {
    if (!data || allPairings.length === 0) return [];
    const self = data.pairing;
    const selfGoals = new Set(data.pairing.goalTags || []);
    return allPairings
      .filter(
        (p) =>
          p.alternative.repo !== self.alternative.repo &&
          (p.paidTool.category === self.paidTool.category ||
            (p.goalTags || []).some((t) => selfGoals.has(t)))
      )
      .slice(0, 3);
  }, [data, allPairings]);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    setRelease(null);
    setSecurity(null);
    setMetrics(null);
    Promise.all([
      api.repo(owner, name),
      api.releases(owner, name),
      api.security(owner, name).catch(() => null),
      api.metrics(owner, name).catch(() => null),
    ])
      .then(([d, r, s, m]) => {
        if (!alive) return;
        setData(d);
        setRelease(r);
        setSecurity(s);
        setMetrics(m);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [owner, name]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [repo]);

  // Record the visit for the "Recently viewed" strip.
  const histRecord = useHistory((s) => s.record);
  useEffect(() => {
    if (data?.pairing?.alternative) {
      histRecord(data.pairing.alternative.repo, data.pairing.alternative.name);
    }
  }, [data?.pairing?.alternative?.repo, histRecord]);

  const [showEmbed, setShowEmbed] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [activeSection, setActiveSection] = useState("install-section");
  const [savingsPeriod, setSavingsPeriod] = useState("year");

  // ScrollSpy to track active section
  useEffect(() => {
    const sections = ["install-section", "compare-section", "security-section", "community-section"];
    const handleScroll = () => {
      const scrollY = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut handler: keys 1, 2, 3, 4 jump to sections
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.metaKey || e.ctrlKey || e.altKey) return;
      const targetMap = {
        "1": "install-section",
        "2": "compare-section",
        "3": "security-section",
        "4": "community-section",
      };
      if (targetMap[e.key]) {
        const targetEl = document.getElementById(targetMap[e.key]);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth" });
          setActiveSection(targetMap[e.key]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Related paid alternatives in the same category
  const categoryPaidTools = useMemo(() => {
    if (!data || allPairings.length === 0) return [];
    const currentPaidSlug = data.pairing.paidTool.slug;
    const map = new Map();
    for (const p of allPairings) {
      if (p.paidTool.category === data.pairing.paidTool.category && p.paidTool.slug !== currentPaidSlug) {
        if (!map.has(p.paidTool.slug)) {
          map.set(p.paidTool.slug, p.paidTool);
        }
      }
    }
    return Array.from(map.values()).slice(0, 4);
  }, [data, allPairings]);

  if (error)
    return (
      <Shell>
        <p className="text-caution tnum text-sm inline-flex items-center gap-1.5">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{error}</span>
        </p>
        <Link to="/" className="shimmer-button btn-tactile mt-4 inline-flex px-4 py-2 text-sm text-ink">
          Back to trending
        </Link>
      </Shell>
    );

  if (!data)
    return (
      <Shell>
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-10 w-1/2" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-[220px] w-full rounded-2xl" />
        </div>
        <SlowFetchHint />
      </Shell>
    );

  const a = data.pairing.alternative;
  const paid = data.pairing.paidTool;
  const group = groupForCategory(paid.category);
  const live = data.live;
  const stars30 = data.stars30d;
  const isFav = fav.has(repo);

  const parityTotal = a.parity.length + a.gaps.length;
  const parityPct = parityTotal > 0 ? Math.round((a.parity.length / parityTotal) * 100) : null;

  return (
    <Shell>
      <Breadcrumbs
        trail={[
          { label: "Home", to: "/" },
          ...(group ? [{ label: group.label, to: "/categories" }] : []),
          { label: paid.category, to: "/categories" },
          { label: a.name },
        ]}
      />

      {/* ── Hero Header ── */}
      <header className="mt-2 animate-card-in space-y-3">
        {/* Row 1: Logo · Name · Verified · Trust Score Badge · Category */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="size-12 rounded-xl border border-line bg-elevated grid place-items-center shrink-0 shadow-sm">
            <BrandLogo brand={repoBrand(a.repo)} repo={a.repo} name={a.name} size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl md:text-3xl tracking-tight text-ink leading-tight">{a.name}</h1>
              
              <span
                title="Verified Open Source Project"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-line bg-surface text-ink select-none shadow-2xs"
              >
                <ShieldCheck size={12} className="text-ink" />
                Verified
              </span>

              {/* Animated Trust / Test Score Header Badge */}
              <HeaderTrustScoreBadge trust={data.trust} />

              {/* Save $X/yr Savings Badge */}
              {paid?.pricePerYearUsd > 0 && (
                <button
                  type="button"
                  onClick={() => setSavingsPeriod((p) => (p === "year" ? "month" : "year"))}
                  title={`Switching from ${paid.name} saves approximately ${formatSavings(paid.pricePerYearUsd)} per year. Click to toggle period.`}
                  className="group/save inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-line bg-surface select-none shadow-2xs transition-colors cursor-pointer"
                >
                  <Zap
                    size={11}
                    className={`transition-colors ${
                      savingsPeriod === "year"
                        ? "text-dim dark:text-white/80 group-hover/save:text-[#FF4500]"
                        : "text-faint"
                    }`}
                  />
                  <span
                    className={`transition-colors ${
                      savingsPeriod === "year"
                        ? "text-ink dark:text-white group-hover/save:text-[#FF4500]"
                        : "text-faint"
                    }`}
                  >
                    Save {savingsPeriod === "year"
                      ? `${formatSavings(paid.pricePerYearUsd)}/year`
                      : `${formatSavings(Math.round(paid.pricePerYearUsd / 12))}/mo`}
                  </span>
                </button>
              )}

              <Link
                to="/categories"
                className="px-2.5 py-0.5 rounded-full border border-line bg-surface text-dim hover:text-ink text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
              >
                {paid.category}
              </Link>
            </div>
            <p className="tnum text-xs text-faint mt-0.5">
              {repo}
              {live && (
                <>
                  {" · pushed "}
                  <span title={live.pushedAt}>{relativeDate(live.pushedAt)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Lead description */}
        <p className="text-dim text-[15px] leading-relaxed max-w-[75ch]">{a.description}</p>

        {/* "Open Source Alternative to:" section */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Open Source Alternative to:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/alternatives/${paid.slug}`}
              className="btn-tactile inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line-strong bg-surface hover:bg-elevated text-xs font-semibold text-ink shadow-2xs transition-colors"
            >
              <BrandLogo brand={paidBrand(paid.slug)} paidSlug={paid.slug} name={paid.name} size={16} />
              <span>{paid.name}</span>
            </Link>

            {categoryPaidTools.map((p) => (
              <Link
                key={p.slug}
                to={`/alternatives/${p.slug}`}
                className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface/70 hover:border-line-strong hover:bg-elevated text-xs text-dim hover:text-ink transition-colors"
              >
                <BrandLogo brand={paidBrand(p.slug)} paidSlug={p.slug} name={p.name} size={15} />
                <span>{p.name}</span>
              </Link>
            ))}

            {categoryPaidTools.length > 0 && (
              <Link
                to="/categories"
                className="text-[11.5px] text-faint hover:text-ember transition-colors ml-1 font-medium"
              >
                +more in {paid.category}
              </Link>
            )}
          </div>
        </div>

        {/* ── Unified Actions Bar: Download · Source · Visit Website ‖ Save · Decision Brief · Embed · Claim · Report ── */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
          {/* Primary CTA Buttons */}
          <a
            href={`/api/install/${repo}`}
            download
            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#121212] dark:bg-white text-white dark:text-[#121212] text-sm font-semibold shadow-sm hover:opacity-90 transition-all cursor-pointer"
            title="Download packaged installer for your OS"
          >
            <Download size={16} />
            <span>Download for Your OS</span>
          </a>

          <a
            href={`/api/source/${repo}`}
            download
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface hover:bg-elevated text-sm font-medium text-ink transition-colors cursor-pointer"
            title="Download source code zip"
          >
            <Package size={16} />
            <span>Source Code (.zip)</span>
          </a>

          <a
            href={a.demoUrl || `https://github.com/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface hover:bg-elevated text-sm font-medium text-ink transition-colors cursor-pointer"
          >
            <Globe size={16} />
            <span>Visit Website</span>
            <ExternalLink size={13} className="opacity-60" />
          </a>

          <div className="h-6 w-px bg-line/60 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => fav.toggle(repo)}
            className={`btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isFav
                ? "bg-trust/15 border-trust/40 text-trust shadow-2xs"
                : "border-line bg-surface hover:border-line-strong hover:bg-elevated text-dim hover:text-ink"
            }`}
          >
            <Bookmark size={14} fill={isFav ? "currentColor" : "none"} />
            <span>{isFav ? "Saved" : "Save Project"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBrief(true)}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface hover:border-line-strong hover:bg-elevated text-dim hover:text-ink text-xs font-semibold transition-colors cursor-pointer"
            title="Export executive decision brief and CTO migration ROI report"
          >
            <FileText size={14} />
            <span>Decision Brief</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEmbed(true)}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface hover:border-line-strong hover:bg-elevated text-dim hover:text-ink text-xs font-medium cursor-pointer"
            title="Get README badge embed code"
          >
            <Code2 size={14} />
            <span>Embed</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClaim(true)}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface hover:border-line-strong hover:bg-elevated text-dim hover:text-ink text-xs font-medium cursor-pointer"
            title="Claim and verify maintainership for this repository"
          >
            <ShieldCheck size={14} />
            <span>Claim</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-line bg-surface hover:border-line-strong hover:bg-elevated text-dim hover:text-ink text-xs font-medium cursor-pointer"
            title="Report or suggest edits"
          >
            <Flag size={14} />
            <span>Report</span>
          </button>
        </div>
      </header>

      {/* ── Main 3-Row Showcase Grid ──
           Row 1: Screenshot (left) + Star Chart (right) — equal height
           Row 2: Sponsor Ad (left, same width as screenshot) + stays aligned
      */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left: Screenshot */}
        <div className="min-h-[360px] min-w-0">
          <ScreenshotGallery screenshots={a.screenshots} name={a.name} repo={repo} />
        </div>
        {/* Right: Star Growth Chart */}
        <div className="min-h-[360px] min-w-0">
          <StarGrowthChart
            repo={repo}
            name={a.name}
            stars30={stars30}
            live={live}
            repoAgeYears={data.repoAgeYears ?? 3}
          />
        </div>
      </div>

      {/* ── Sponsor Ad — Full width under the showcase, matching the left column size ── */}
      <div className="mt-5 space-y-4">
        <SponsorAdCard name={a.name} category={paid.category} />

        {/* ── The Honest Review — Positioned directly under the Deploy & Scale affiliate banner ── */}
        {data.pairing.editorial?.length > 0 && (
          <section
            className="card-elevated p-6 space-y-3 bg-surface border border-line rounded-2xl shadow-sm animate-card-in"
            aria-label={`Editorial review of ${a.name}`}
          >
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h3 className="font-display text-lg font-bold text-ink">The Honest Review</h3>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-dim bg-elevated px-2.5 py-0.5 rounded-full border border-line">
                Independent Analysis
              </span>
            </div>
            <div className="space-y-3 pt-1">
              {data.pairing.editorial.map((para, i) => (
                <p key={i} className={`text-dim leading-relaxed text-sm ${i === 0 ? "text-ink font-medium" : ""}`}>
                  {para.body}
                </p>
              ))}
            </div>
            <p className="pt-2 text-[11.5px] text-faint border-t border-line/60">
              Hand-written editorial — independent analysis, not vendor claims. Verify against the project's official documentation.
            </p>
          </section>
        )}
      </div>

      {/* ── Sticky In-Page Sub-Navigation Bar with ScrollSpy ── */}
      <nav aria-label="Page Sections" className="mt-8 sticky top-16 z-30 py-2.5 bg-canvas/95 backdrop-blur-md border-y border-line">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <a
            href="#install-section"
            onClick={() => setActiveSection("install-section")}
            className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 inline-flex items-center gap-1.5 ${
              activeSection === "install-section"
                ? "border border-line-strong bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-xs"
                : "border border-line bg-surface hover:border-line-strong text-dim hover:text-ink"
            }`}
          >
            {activeSection === "install-section" ? (
              <span className="size-1.5 rounded-full bg-surface dark:bg-ink" />
            ) : (
              <Terminal size={13} className="text-dim" />
            )}
            <span>Install &amp; Self-Host</span>
            <kbd
              className={`hidden sm:inline-flex text-[10px] px-1 py-0.2 rounded border font-sans ${
                activeSection === "install-section"
                  ? "border-surface/20 bg-surface/10 text-surface/80 dark:border-ink/20 dark:bg-ink/10 dark:text-ink/80"
                  : "border-line bg-elevated text-faint"
              }`}
            >
              1
            </kbd>
          </a>

          <a
            href="#compare-section"
            onClick={() => setActiveSection("compare-section")}
            className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 inline-flex items-center gap-1.5 ${
              activeSection === "compare-section"
                ? "border border-line-strong bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-xs"
                : "border border-line bg-surface hover:border-line-strong text-dim hover:text-ink"
            }`}
          >
            {activeSection === "compare-section" ? (
              <span className="size-1.5 rounded-full bg-surface dark:bg-ink" />
            ) : (
              <GitCompare size={13} className="text-dim" />
            )}
            <span>Decision Guide &amp; Migration</span>
            <kbd
              className={`hidden sm:inline-flex text-[10px] px-1 py-0.2 rounded border font-sans ${
                activeSection === "compare-section"
                  ? "border-surface/20 bg-surface/10 text-surface/80 dark:border-ink/20 dark:bg-ink/10 dark:text-ink/80"
                  : "border-line bg-elevated text-faint"
              }`}
            >
              2
            </kbd>
          </a>

          <a
            href="#security-section"
            onClick={() => setActiveSection("security-section")}
            className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 inline-flex items-center gap-1.5 ${
              activeSection === "security-section"
                ? "border border-line-strong bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-xs"
                : "border border-line bg-surface hover:border-line-strong text-dim hover:text-ink"
            }`}
          >
            {activeSection === "security-section" ? (
              <span className="size-1.5 rounded-full bg-surface dark:bg-ink" />
            ) : (
              <ShieldCheck size={13} className="text-dim" />
            )}
            <span>Security &amp; Contribution Radar</span>
            <kbd
              className={`hidden sm:inline-flex text-[10px] px-1 py-0.2 rounded border font-sans ${
                activeSection === "security-section"
                  ? "border-surface/20 bg-surface/10 text-surface/80 dark:border-ink/20 dark:bg-ink/10 dark:text-ink/80"
                  : "border-line bg-elevated text-faint"
              }`}
            >
              3
            </kbd>
          </a>

          <a
            href="#community-section"
            onClick={() => setActiveSection("community-section")}
            className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 inline-flex items-center gap-1.5 ${
              activeSection === "community-section"
                ? "border border-line-strong bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-xs"
                : "border border-line bg-surface hover:border-line-strong text-dim hover:text-ink"
            }`}
          >
            {activeSection === "community-section" ? (
              <span className="size-1.5 rounded-full bg-surface dark:bg-ink" />
            ) : (
              <Users size={13} className="text-dim" />
            )}
            <span>Community &amp; Reviews</span>
            <kbd
              className={`hidden sm:inline-flex text-[10px] px-1 py-0.2 rounded border font-sans ${
                activeSection === "community-section"
                  ? "border-surface/20 bg-surface/10 text-surface/80 dark:border-ink/20 dark:bg-ink/10 dark:text-ink/80"
                  : "border-line bg-elevated text-faint"
              }`}
            >
              4
            </kbd>
          </a>
        </div>
      </nav>

      {/* ── Lower Details & Community Layout (8 cols left + 4 cols right sidebar) ── */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Detailed Content Column — Grouped into 4 Clean Sections */}
        <div className="lg:col-span-8 space-y-10 min-w-0">
          
          {/* ── SECTION 1: Installation & Self-Hosting ── */}
          <section id="install-section" className="space-y-6 scroll-mt-28">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-ink" />
                <h2 className="font-display text-lg font-bold text-ink">Installation &amp; Self-Hosting</h2>
              </div>
              <span className="text-[11px] text-faint uppercase font-semibold tracking-wider">Zero Lock-In</span>
            </div>

            {/* Simplified Self-Hosting Hub with 1-Click Download Package and Progressive Disclosure */}
            <SelfHostHub
              repo={repo}
              alternative={a}
              release={release}
              defaultBranch={data.live?.defaultBranch || "main"}
              SelfHostSpecsComponent={SelfHostSpecs}
              DownloadSectionComponent={DownloadSection}
            />
          </section>

          {/* ── SECTION 2: Decision Guide, Comparison & Migration ── */}
          <section id="compare-section" className="space-y-6 scroll-mt-28 pt-2">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <GitCompare size={16} className="text-ink" />
                <h2 className="font-display text-lg font-bold text-ink">Decision Guide &amp; Migration</h2>
              </div>
              <span className="text-[11px] text-faint uppercase font-semibold tracking-wider">Feature Parity &amp; ROI</span>
            </div>

            {/* Decision Guide Hub with 1-click expand & arrow trigger */}
            <DecisionGuideHub
              alternative={a}
              paidTool={data.pairing?.paidTool}
              compareSiblings={compareSiblings}
            />
          </section>

          {/* ── SECTION 3: Security, Governance & Contribution Radar ── */}
          <section id="security-section" className="space-y-6 scroll-mt-28 pt-2">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-ink" />
                <h2 className="font-display text-lg font-bold text-ink">Security, Audit &amp; Contribution Radar</h2>
              </div>
              <span className="text-[11px] text-faint uppercase font-semibold tracking-wider">Health Signals</span>
            </div>

            {/* 1. Good First Issues & Contribution Radar inside Accordion */}
            <AccordionCard
              icon={Activity}
              title="Good First Issues &amp; Contribution Radar"
              subtitle="Live GitHub contributor velocity, open issue breakdown &amp; mentor signals"
              badge="Health Radar"
              badgeTone="default"
              defaultOpen={false}
            >
              <ContributionRadar repo={repo} name={a.name} />
            </AccordionCard>

            {/* 3. Privacy & Data Sovereignty Scorecard inside Accordion */}
            <AccordionCard
              icon={ShieldCheck}
              title="Privacy &amp; Data Sovereignty Scorecard"
              subtitle="GDPR readiness, telemetry controls &amp; full data ownership"
              badge="Privacy Audit"
              badgeTone="default"
              defaultOpen={false}
            >
              <PrivacyScorecard alternative={a} />
            </AccordionCard>

            {/* 4. Maintainers & Contributor Velocity Showcase inside Accordion */}
            <AccordionCard
              icon={Users}
              title="Maintainers &amp; Contributor Velocity"
              subtitle="Commit frequency, active core maintainers &amp; release cadence"
              badge="Active Velocity"
              badgeTone="default"
              defaultOpen={false}
            >
              <ContributorShowcase repo={repo} trustScore={data.trust} name={a.name} />
            </AccordionCard>

            {/* 5. Team Fit & Scalability Analysis inside Accordion */}
            <AccordionCard
              icon={Layers}
              title="Team Fit &amp; Scalability Analysis"
              subtitle="Infrastructure overhead, DevOps learning curve &amp; migration effort"
              badge="DevOps Scope"
              badgeTone="default"
              defaultOpen={false}
            >
              <TeamFit selfHosted={a.platforms?.includes("self-host")} />
            </AccordionCard>
          </section>

          {/* ── SECTION 4: Community, Releases & Verified Reviews ── */}
          <section id="community-section" className="space-y-6 scroll-mt-28 pt-2">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-ink" />
                <h2 className="font-display text-lg font-bold text-ink">Community, Feedback &amp; Releases</h2>
              </div>
              <span className="text-[11px] text-faint uppercase font-semibold tracking-wider">Verified Reviews</span>
            </div>

            {/* Developer Reviews & Switcher Stories inside Accordion */}
            <AccordionCard
              icon={MessageSquarePlus}
              title="Developer Reviews &amp; Switcher Stories"
              subtitle="Real migration experiences, pros/cons &amp; ratings from developers"
              badge="Reviews"
              badgeTone="default"
              defaultOpen={false}
            >
              <ReviewsSection repo={repo} name={a.name} replaces={data.pairing?.paidTool?.name} />
            </AccordionCard>

            {/* Release Notes inside Accordion */}
            <AccordionCard
              icon={FileText}
              title="Changelog &amp; Version Release Notes"
              subtitle="Recent software updates, breaking changes &amp; security patches"
              badge="Latest Releases"
              badgeTone="default"
              defaultOpen={false}
            >
              <ReleaseNotes owner={owner} name={name} />
            </AccordionCard>

            {/* Similar Tools inside Accordion */}
            <AccordionCard
              icon={Layers}
              title="Explore Similar Tools in this Category"
              subtitle={`Other trending open-source projects in ${data.pairing?.paidTool?.category || "Tools"}`}
              badge="Alternatives"
              badgeTone="default"
              defaultOpen={false}
            >
              <SimilarTools category={data.pairing?.paidTool?.category || "Tools"} currentRepo={repo} />
            </AccordionCard>

            {/* Community Section inside Accordion */}
            <AccordionCard
              icon={Users}
              title="Live Community Q&amp;A &amp; Discussions"
              subtitle="Join the community chat, ask questions, or report bugs"
              badge="Community Hub"
              badgeTone="default"
              defaultOpen={false}
            >
              <CommunitySection repo={repo} />
            </AccordionCard>

            <GiscusComments term={repo} />
          </section>
        </div>

        {/* Right Sticky Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <QuickFactsCard
            repo={repo}
            name={a.name}
            live={live}
            stars30={stars30}
            data={data}
            pairing={data.pairing}
          />
          <DeployButtons repo={repo} alternative={a} />
        </div>
      </div>

      {/* Dialog Modals */}
      <EmbedModal
        open={showEmbed}
        onClose={() => setShowEmbed(false)}
        repo={repo}
        name={a.name}
      />
      <ClaimModal
        open={showClaim}
        onClose={() => setShowClaim(false)}
        repo={repo}
        name={a.name}
      />
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        repo={repo}
        name={a.name}
      />
      <ExecutiveBriefModal
        open={showBrief}
        onClose={() => setShowBrief(false)}
        repo={repo}
        alternative={a}
        paidTool={data.pairing?.paidTool}
        trustScore={data.trust}
      />
    </Shell>
  );
}

// Sponsor Ad Card — clean compact banner inspired by OpenAlternative.co
function SponsorAdCard({ name, category }) {
  return (
    <div className="card-elevated border border-line hover:border-line-strong bg-surface p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors group cursor-pointer relative overflow-hidden">
      {/* Ad label */}
      <Link
        to="/advertise?ref=ad"
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-elevated text-faint border border-line hover:border-line-strong transition-colors absolute top-3 right-3 sm:static sm:order-last z-10 leading-none"
      >
        Ad
      </Link>

      {/* Sponsor Content */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-12 sm:pr-0">
        <div className="size-8 rounded-lg border border-line bg-elevated grid place-items-center shrink-0">
          <Rocket size={15} className="text-ink dark:text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink leading-snug">
            Deploy &amp; Scale {name} on High-Speed Cloud Infrastructure
          </p>
          <p className="text-xs text-dim mt-0.5 leading-relaxed">
            1-click dedicated cluster · auto daily backups · team SSO · 99.99% SLA
          </p>
        </div>
      </div>

      {/* CTA */}
      <Link
        to="/advertise"
        className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink transition-colors shrink-0"
      >
        <span>Learn More</span>
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// Screenshot gallery + lightbox — Large high-res featured showcase sized to match graph exactly
function ScreenshotGallery({ screenshots, name, repo }) {
  const initialShots = Array.isArray(screenshots) && screenshots.length > 0 ? screenshots : [];
  const shots = useMemo(() => {
    if (initialShots.length > 0) return initialShots;
    if (repo) {
      return [
        {
          src: `https://opengraph.githubassets.com/1/${repo}`,
          alt: `${name} official interface preview & repository architecture`,
        },
      ];
    }
    return [];
  }, [initialShots, repo, name]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % shots.length);
      else if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + shots.length) % shots.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, shots.length]);

  if (!shots.length) return null;

  const currentShot = shots[activeIndex] || shots[0];

  return (
    <section className="h-full flex flex-col justify-between" aria-label={`${name} preview screenshot`}>
      {/* Featured Screenshot Card Matching Graph Card Frame */}
      <div className="card-elevated border border-line bg-surface rounded-2xl overflow-hidden shadow-float group flex flex-col h-full justify-between">
        {/* Browser Top Window Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line bg-elevated text-xs text-dim">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 font-mono text-[11px] text-faint truncate max-w-[240px]">
              {name.toLowerCase().replace(/\s+/g, "")}.app
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="btn-tactile inline-flex items-center gap-1 text-[11.5px] font-medium text-dim hover:text-ink transition-colors"
          >
            <Maximize2 size={13} />
            <span>Click to Expand</span>
          </button>
        </div>

        {/* Large Screenshot Showcase Container — Fills Frame Completely with No Side Gaps */}
        <div
          onClick={() => setLightboxOpen(true)}
          className="relative w-full flex-1 min-h-[260px] sm:min-h-[280px] bg-elevated grid place-items-center cursor-zoom-in overflow-hidden"
        >
          <img
            src={currentShot.src}
            alt={currentShot.alt || `${name} screenshot`}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold backdrop-blur-sm shadow-md">
              <Maximize2 size={13} />
              <span>Click to view full size</span>
            </span>
          </div>
        </div>

        {/* Bottom Thumbnail Strip / Footer Info */}
        <div className="px-4 py-2.5 border-t border-line bg-elevated flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-faint">
            <ImageIcon size={13} />
            <span>Interface Preview · Shot {activeIndex + 1} of {shots.length}</span>
          </div>

          {shots.length > 1 && (
            <div className="flex items-center gap-1.5">
              {shots.map((s, idx) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`size-2.5 rounded-full transition-all ${
                    idx === activeIndex ? "bg-accent scale-125" : "bg-line hover:bg-dim"
                  }`}
                  aria-label={`View shot ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} screenshot viewer`}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 md:p-10 animate-card-in backdrop-blur-sm"
        >
          <div
            className="relative max-w-6xl w-full rounded-2xl border border-line bg-elevated p-3 sm:p-4 shadow-float flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 text-sm text-dim">
              <p className="truncate flex-1 mr-3 text-sm font-semibold text-ink">
                {currentShot.alt || `${name} Screenshot`}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="btn-tactile p-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-dim hover:text-ink"
                aria-label="Close fullscreen view"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-black/60 flex items-center justify-center min-h-[260px] max-h-[78dvh]">
              <img
                src={currentShot.src}
                alt={currentShot.alt || `${name} screenshot`}
                className="w-full max-h-[78dvh] object-contain select-none"
              />
            </div>

            {shots.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pt-1">
                {shots.map((s, idx) => (
                  <button
                    key={s.src}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`shrink-0 size-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeIndex ? "border-accent scale-105" : "border-line opacity-50 hover:opacity-90"
                    }`}
                  >
                    <img src={s.src} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DownloadSection({ repo, release, branch }) {
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState({ pct: null, speed: "" });
  const anchorRef = useRef(null);

  const startDownload = useCallback(async () => {
    setPhase("downloading");
    setProgress({ pct: null, speed: "" });
    try {
      const res = await fetch(`/api/install/${repo}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Download failed");
      const filename =
        res.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/)?.[1] ||
        `${repo.split("/")[1]}-installer`;
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      let lastT = performance.now();
      let lastB = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const now = performance.now();
        if (now - lastT > 250) {
          const speed = ((received - lastB) / (now - lastT)) * 1000;
          setProgress({
            pct: total ? Math.round((received / total) * 100) : null,
            speed: `${formatBytes(speed)}/s`,
          });
          lastT = now;
          lastB = received;
        }
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = anchorRef.current;
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }, [repo]);

  if (!release) return null;

  const runnable = release.runnable && release.osAsset;

  return (
    <section className="mt-6 card-elevated p-6 group relative overflow-hidden" aria-label="Get this tool">
      {/* Smooth Background Raccoon Mascot Watermark */}
      <div
        className="pointer-events-none absolute -bottom-10 -right-10 w-56 h-56 sm:w-64 sm:h-64 opacity-0 group-hover:opacity-15 group-active:opacity-30 transition-all duration-500 ease-out transform translate-y-5 group-hover:translate-y-0 select-none z-0"
        aria-hidden="true"
      >
        <img
          src="/mascot-transparent.png"
          alt=""
          className="w-full h-full object-contain filter grayscale dark:invert contrast-125 pointer-events-none"
        />
      </div>
      <div className="relative z-10">
        <h2 className="font-display text-display-md mb-1">Get {repo.split("/")[1]}</h2>
      {runnable ? (
        <>
          <p className="text-sm text-dim mb-4">
            Ships a ready installer for your platform:{" "}
            <span className="tnum text-tech">{release.osAsset.name}</span>{" "}
            <span className="text-faint">({formatBytes(release.osAsset.size)})</span> — download it here, then
            double-click it like any normal app.
          </p>
          {release.checksum && (
            <p className="mb-4 tnum text-[11.5px] text-faint break-all flex items-center gap-1.5" title="Verify after download: sha256sum <file>">
              <span className="text-trust inline-flex items-center gap-1">
                <ShieldCheck size={13} className="shrink-0" />
                <span>sha256 verified</span>
              </span>
              <span>· {release.checksum.replace(/^sha256:/, "")}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startDownload}
              disabled={phase === "downloading"}
              className="btn-tactile relative inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-semibold text-base bg-gradient-to-r from-primary to-primary-hover text-white disabled:opacity-80 overflow-hidden"
            >
              {phase === "downloading" ? (
                <>
                  <Download size={17} />
                  <span className="tnum text-sm">
                    {progress.pct != null ? `${progress.pct}%` : "Downloading…"}
                    {progress.speed && ` · ${progress.speed}`}
                  </span>
                </>
              ) : phase === "done" ? (
                <>
                  <span className="grid place-items-center size-5 rounded-full bg-trust animate-card-in opacity-0">
                    <Check size={14} />
                  </span>
                  In your Downloads — double-click to install
                </>
              ) : phase === "error" ? (
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle size={15} />
                  <span>Download failed — click to retry</span>
                </span>
              ) : (
                <>
                  <Download size={17} /> Run App
                </>
              )}
            </button>
            <a ref={anchorRef} hidden aria-hidden="true">
              trigger
            </a>
            <SourceButton repo={repo} branch={branch} />
          </div>
          {phase === "downloading" && (
            <div className="mt-4">
              <EmberProgress pct={progress.pct == null ? null : progress.pct / 100} />
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-dim mb-4 max-w-[65ch]">
            This project ships source code only — no packaged installer for your platform. Download the source and
            follow its README setup steps.
          </p>
          <div className="flex flex-wrap gap-3">
            <SourceButton repo={repo} branch={branch} primary />
            {release.assets.length > 0 && (
              <span className="self-center text-[12px] text-faint tnum">
                {release.assets.length} release asset{release.assets.length === 1 ? "" : "s"} in {release.tag} — none for{" "}
                {release.platform}
              </span>
            )}
          </div>
        </>
      )}
      </div>
    </section>
  );
}

function SourceButton({ repo, branch, primary }) {
  const href = `/api/source/${repo}${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        primary
          ? "shimmer-button btn-tactile inline-flex items-center gap-2 px-5 py-3 font-semibold text-ink"
          : "btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-full border border-line text-dim hover:text-ink hover:border-line-strong"
      }
    >
      <Package size={15} /> Source <ExternalLink size={14} className="opacity-60" />
    </a>
  );
}



// Header Trust/Test Score Badge with animated SVG progress ring & count-up effect
function HeaderTrustScoreBadge({ trust }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!trust?.score) return;
    const duration = 800;
    const startTime = performance.now();
    const end = trust.score;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [trust?.score]);

  if (!trust) return null;

  const score = trust.score;
  const R = 7;
  const CIRC = 2 * Math.PI * R;
  const dash = (displayScore / 100) * CIRC;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        title={`Audit & Test Score: ${score}/100`}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-line bg-surface text-ink select-none cursor-pointer transition-all hover:border-line-strong shadow-2xs"
      >
        <div className="relative size-4 grid place-items-center shrink-0">
          <svg viewBox="0 0 20 20" className="size-full -rotate-90">
            <circle cx="10" cy="10" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" />
            <circle
              cx="10"
              cy="10"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC}`}
              className="transition-all duration-300 ease-out text-ink"
            />
          </svg>
        </div>

        <span className="tnum font-bold tracking-tight text-ink">{displayScore}% Test Score</span>
      </div>

      {/* Hover popover for health signals */}
      {hovered && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-60 p-3 rounded-xl border border-line bg-elevated/95 backdrop-blur-md shadow-float text-xs space-y-2 pointer-events-none">
          <div className="flex items-center justify-between font-semibold text-ink border-b border-line/60 pb-1.5">
            <span>Audit &amp; Health Score</span>
            <span className="tnum text-sm font-bold" style={{ color: strokeColor }}>
              {score} / 100
            </span>
          </div>
          
          <div className="space-y-1 text-dim">
            {trust.signals?.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-2">
                <span className="shrink-0">{s.label}:</span>
                <span className="font-medium text-ink text-right">{s.detail}</span>
              </div>
            ))}
          </div>
          <p className="pt-1 border-t border-line/60 text-[10px] text-faint leading-snug">{trust.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function Shell({ children }) {
  return <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-4">{children}</div>;
}

function SlowFetchHint() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 2000);
    return () => clearTimeout(t);
  }, []);
  if (!slow) return null;
  return (
    <p className="mt-4 text-[12.5px] text-faint tnum" role="status">
      Fetching live data from GitHub — first visit takes a moment, then it's cached.
    </p>
  );
}
