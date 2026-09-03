import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  DollarSign,
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Lightbulb,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  Check,
  X,
  Flame,
  ShieldAlert,
  Server,
  CloudOff,
  Cpu,
} from "lucide-react";
import { api } from "../lib/api";
import Markdown from "../lib/markdown";
import Breadcrumbs from "../components/Breadcrumbs";

const PAIN_POINTS = [
  {
    id: "tax",
    title: "The Compounding Per-Seat Tax",
    tag: "Financial Trap",
    icon: DollarSign,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    headline: "You rent software monthly, but never own a single byte.",
    statNumber: "$15–$45",
    statLabel: "per user every month",
    problemSummary:
      "Closed SaaS charges a recurring tax per teammate. When your team doubles, your bill quadruples. If cash gets tight and you cancel, you lose immediate access to your team's historical data.",
    saasTrapPoints: [
      "Per-seat pricing compounds indefinitely as your organization grows.",
      "Cancellation means total eviction and immediate workflow shutdown.",
      "Sudden price increases (e.g. 20–40% yearly renewals) with zero recourse.",
    ],
    openSourceFixPoints: [
      "100% free software license forever ($0.00 perpetual ownership).",
      "Unlimited team members with zero per-seat licensing penalties.",
      "Install once on desktop or standard $5/mo server for the whole company.",
    ],
    topSwaps: [
      { paid: "1Password ($36/yr/user)", swap: "Bitwarden", repo: "bitwarden/server", slug: "1password" },
      { paid: "Slack ($105/yr/user)", swap: "Mattermost", repo: "mattermost/mattermost", slug: "slack" },
      { paid: "Notion ($120/yr/user)", swap: "AppFlowy", repo: "AppFlowy-IO/AppFlowy", slug: "notion" },
    ],
  },
  {
    id: "privacy",
    title: "AI Scraping & Cloud Surveillance",
    tag: "Data Ownership",
    icon: Lock,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    headline: "Proprietary vendors rewrite Terms to feed your data to AI.",
    statNumber: "100%",
    statLabel: "cloud stored & third-party exposed",
    problemSummary:
      "When you store customer documents, strategic roadmaps, or financial records in centralized clouds, you are subject to silent Terms of Service updates that permit AI training on your private files.",
    saasTrapPoints: [
      "Silent terms changes allowing vendors to train LLMs on your internal data.",
      "Vulnerability to third-party cloud breaches and unauthorized employee snooping.",
      "Regulatory & compliance headaches under strict GDPR, HIPAA, or SOC2 standards.",
    ],
    openSourceFixPoints: [
      "Self-hosted or local-first: your files never leave your private machine or server.",
      "End-to-end cryptographic control: you hold the master encryption keys.",
      "Zero telemetry, zero forced AI training, and complete auditability of all code.",
    ],
    topSwaps: [
      { paid: "Google Drive ($144/yr)", swap: "Nextcloud", repo: "nextcloud/server", slug: "google-drive" },
      { paid: "Google Photos ($120/yr)", swap: "Immich", repo: "immich-app/immich", slug: "google-photos" },
      { paid: "Firebase ($300+/mo)", swap: "Supabase", repo: "supabase/supabase", slug: "firebase" },
    ],
  },
  {
    id: "lockin",
    title: "Hostage Formats & Vendor Lock-in",
    tag: "Freedom & Portability",
    icon: ShieldAlert,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    headline: "Proprietary formats prevent you from leaving.",
    statNumber: "0",
    statLabel: "native exit options in closed formats",
    problemSummary:
      "Closed vendors store your information in non-standard black boxes (like proprietary canvas schemas or database nodes). Export buttons deliver broken PDFs or flat CSVs that strip all formulas and relational links.",
    saasTrapPoints: [
      "Exporting destroys relationship schemas, linked tables, and version histories.",
      "If the vendor discontinues a feature, you have no way to restore it.",
      "Forced workflow changes whenever a vendor redesigns their UI or pricing tiers.",
    ],
    openSourceFixPoints: [
      "Data stored in universal open standards: SQLite, Markdown, JSON, PostgreSQL, SVG.",
      "Full database export and migration in standard SQL anytime in 1 click.",
      "Zero vendor dependency: if a company disappears, your software keeps running.",
    ],
    topSwaps: [
      { paid: "Figma ($180/yr/seat)", swap: "Penpot", repo: "penpot/penpot", slug: "figma" },
      { paid: "Airtable ($240/yr/seat)", swap: "NocoDB", repo: "nocodb/nocodb", slug: "airtable" },
      { paid: "Google Analytics (Ad-tracked)", swap: "Plausible", repo: "plausible/analytics", slug: "google-analytics-360" },
    ],
  },
  {
    id: "bloat",
    title: "Cloud Bloat & Downtime Paralysis",
    tag: "Performance & Reliability",
    icon: Zap,
    color: "text-trust",
    bgColor: "bg-trust/10",
    borderColor: "border-trust/30",
    headline: "Heavy tracking scripts and outage fragility.",
    statNumber: "40+",
    statLabel: "trackers loaded in common SaaS apps",
    problemSummary:
      "Modern SaaS web applications are bloated with dozens of tracking beacons, analytics scripts, and heavy DOM trees. When AWS or the SaaS vendor experiences an outage, your entire business comes to a standstill.",
    saasTrapPoints: [
      "Heavy RAM and CPU usage slowing down laptops and mobile devices.",
      "Zero offline support: no internet connection means zero productivity.",
      "External outages (AWS, Cloudflare, Azure, vendor down) freeze operations.",
    ],
    openSourceFixPoints: [
      "Blazing native performance built in Rust, Go, C++, or Flutter with zero tracking scripts.",
      "100% offline-first architecture: edit, search, and work without Wi-Fi.",
      "Independent uptime: run on your local disk or private resilient servers.",
    ],
    topSwaps: [
      { paid: "Postman ($168/yr/user)", swap: "Bruno", repo: "usebruno/bruno", slug: "postman" },
      { paid: "Pingdom ($180/yr)", swap: "Uptime Kuma", repo: "louislam/uptime-kuma", slug: "pingdom" },
      { paid: "AutoCAD ($1,975/yr)", swap: "FreeCAD", repo: "FreeCAD/FreeCAD", slug: "autocad" },
    ],
  },
];

const POPULAR_TOOLS = [
  { id: "slack", name: "Slack", category: "Chat", price: 8.75, swap: "Mattermost", swapSlug: "slack" },
  { id: "notion", name: "Notion", category: "Docs", price: 10.0, swap: "AppFlowy", swapSlug: "notion" },
  { id: "1password", name: "1Password", category: "Security", price: 3.5, swap: "Bitwarden", swapSlug: "1password" },
  { id: "figma", name: "Figma", category: "Design", price: 15.0, swap: "Penpot", swapSlug: "figma" },
  { id: "jira", name: "Jira", category: "Project Mgmt", price: 8.5, swap: "Plane", swapSlug: "jira" },
  { id: "airtable", name: "Airtable", category: "Database", price: 20.0, swap: "NocoDB", swapSlug: "airtable" },
  { id: "calendly", name: "Calendly", category: "Scheduling", price: 12.0, swap: "Cal.com", swapSlug: "calendly" },
  { id: "google-drive", name: "Google Workspace", category: "Files", price: 12.0, swap: "Nextcloud", swapSlug: "google-drive" },
  { id: "zoom", name: "Zoom", category: "Meetings", price: 13.33, swap: "Jitsi Meet", swapSlug: "zoom" },
  { id: "datadog", name: "Datadog", category: "Monitoring", price: 15.0, swap: "SigNoz", swapSlug: "datadog" },
];

const MYTHS = [
  {
    q: "Do I need to be a software developer or use black terminal screens?",
    a: "Not at all. The modern open-source revolution is focused on consumer-grade visual design. Today's top open-source alternatives (Bitwarden, AppFlowy, Penpot, Nextcloud) provide one-click graphical installers for Windows (.exe), Mac (.dmg), Linux, iOS, and Android. They look, feel, and install just like Spotify, Slack, or Notion.",
  },
  {
    q: "Is open-source software less secure than paid enterprise software?",
    a: "The exact opposite. Proprietary SaaS is 'security through obscurity' — a closed black box where security bugs and data leaks can remain hidden for months or years. Open-source code is publicly inspected by thousands of ethical security researchers worldwide. When vulnerabilities exist, they are audited and patched within hours.",
  },
  {
    q: "If the software is free, how do these projects survive and pay developers?",
    a: "Leading open-source software is backed by sustainable 'Open Core' venture-backed companies (such as Supabase, Mattermost, Cal.com, PostHog). They provide 100% of the core software for free to individuals and self-hosters, while earning revenue from massive enterprise cloud clusters, SLA compliance, and support contracts from Fortune 500 corporations.",
  },
  {
    q: "Can my company legally use open-source tools for commercial business?",
    a: "Yes, 100%. Open-source software distributed under standard permissive licenses (like MIT, Apache 2.0, BSD, or AGPL-3.0) explicitly permits full commercial use, business operations, and internal modification without paying royalties or licensing fees.",
  },
  {
    q: "What happens if a creator stops maintaining an open-source tool?",
    a: "With closed SaaS, if a vendor goes bankrupt or discontinues a product, the software dies and your data vanishes overnight. With open source, the source code belongs to humanity forever. Anyone in the global community can fork the repository, maintain updates, and ensure the tool lives on permanently.",
  },
];

export function LearnListPage() {
  const [articles, setArticles] = useState(null);
  const [activeTab, setActiveTab] = useState("diagnostic"); // "diagnostic" | "calculator" | "myths" | "readiness" | "articles"
  const [selectedPainId, setSelectedPainId] = useState("tax");

  // Calculator State
  const [teamSize, setTeamSize] = useState(5);
  const [selectedToolIds, setSelectedToolIds] = useState(["slack", "notion", "1password", "figma", "jira"]);

  // Myths State
  const [openMythIndex, setOpenMythIndex] = useState(0);

  // Readiness State
  const [quizAnswers, setQuizAnswers] = useState({
    hosting: "desktop",
    priority: "cost",
    scale: "small",
  });

  useEffect(() => {
    api.learnList().then(setArticles).catch(() => setArticles([]));
  }, []);

  const activePain = useMemo(
    () => PAIN_POINTS.find((p) => p.id === selectedPainId) || PAIN_POINTS[0],
    [selectedPainId]
  );

  // Calculator calculations
  const totalPerUserMonthly = useMemo(() => {
    return selectedToolIds.reduce((sum, id) => {
      const tool = POPULAR_TOOLS.find((t) => t.id === id);
      return sum + (tool ? tool.price : 0);
    }, 0);
  }, [selectedToolIds]);

  const monthlyCost = totalPerUserMonthly * teamSize;
  const yearlyCost = monthlyCost * 12;
  const fiveYearCost = yearlyCost * 5;

  const toggleTool = (id) => {
    setSelectedToolIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectPreset = (presetType) => {
    if (presetType === "solo") {
      setTeamSize(1);
      setSelectedToolIds(["notion", "1password", "figma", "google-drive", "calendly"]);
    } else if (presetType === "team5") {
      setTeamSize(5);
      setSelectedToolIds(["slack", "notion", "1password", "figma", "jira"]);
    } else if (presetType === "team20") {
      setTeamSize(20);
      setSelectedToolIds(["slack", "jira", "notion", "airtable", "google-drive", "datadog"]);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-10 space-y-10">
      <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Learn & Decision Tools" }]} />

      {/* Hero Header */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-trust/30 bg-trust/10 text-trust text-xs font-semibold shadow-2xs">
          <Lightbulb size={13} />
          <span>Software Decision Intelligence & Problem Grasping Tool</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink">
          Grasp the Problem: The True Cost of Closed SaaS
        </h1>
        <p className="text-dim text-sm sm:text-base max-w-[75ch] leading-relaxed">
          Why software subscriptions silently drain your budget, lock away your data in hostage formats, and how free
          open-source software solves each trap permanently — explained without jargon.
        </p>

        {/* Interactive Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto pb-1 border-b border-line">
          <button
            type="button"
            onClick={() => setActiveTab("diagnostic")}
            className={`btn-tactile px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "diagnostic"
                ? "bg-ink text-surface shadow-xs"
                : "text-dim hover:text-ink hover:bg-surface"
            }`}
          >
            <AlertTriangle size={15} />
            <span>1. SaaS Pain Points</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`btn-tactile px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "calculator"
                ? "bg-ink text-surface shadow-xs"
                : "text-dim hover:text-ink hover:bg-surface"
            }`}
          >
            <Calculator size={15} />
            <span>2. Waste Calculator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("myths")}
            className={`btn-tactile px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "myths"
                ? "bg-ink text-surface shadow-xs"
                : "text-dim hover:text-ink hover:bg-surface"
            }`}
          >
            <ShieldCheck size={15} />
            <span>3. Myths Busted</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("readiness")}
            className={`btn-tactile px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "readiness"
                ? "bg-ink text-surface shadow-xs"
                : "text-dim hover:text-ink hover:bg-surface"
            }`}
          >
            <Zap size={15} />
            <span>4. Migration Quiz</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("articles")}
            className={`btn-tactile px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "articles"
                ? "bg-ink text-surface shadow-xs"
                : "text-dim hover:text-ink hover:bg-surface"
            }`}
          >
            <BookOpen size={15} />
            <span>5. Primer Guides ({articles ? articles.length : 4})</span>
          </button>
        </div>
      </header>

      {/* ── TAB 1: PAIN POINT DIAGNOSTIC ── */}
      {activeTab === "diagnostic" && (
        <section className="space-y-6 animate-card-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PAIN_POINTS.map((point) => {
              const Icon = point.icon;
              const isSelected = selectedPainId === point.id;
              return (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setSelectedPainId(point.id)}
                  className={`btn-tactile p-3.5 sm:p-4 text-left border rounded-[var(--radius-card,12px)] transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "border-ink bg-surface shadow-card ring-1 ring-ink"
                      : "border-line bg-surface/60 hover:bg-surface hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid place-items-center size-8 rounded-lg ${point.bgColor} ${point.color}`}>
                      <Icon size={16} />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-faint px-1.5 py-0.5 rounded bg-canvas border border-line">
                      {point.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-ink leading-snug">{point.title}</h3>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Diagnosis Card */}
          <div className="card-elevated p-6 sm:p-8 space-y-6 border border-line bg-surface rounded-[var(--radius-card,16px)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-line">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                  <Flame size={14} />
                  <span>Deep Diagnostic</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-ink">{activePain.headline}</h2>
                <p className="text-dim text-sm max-w-[60ch]">{activePain.problemSummary}</p>
              </div>

              <div className="shrink-0 p-4 rounded-[var(--radius-card,12px)] bg-canvas border border-line text-center min-w-[140px]">
                <div className="font-display text-2xl font-bold text-ink tnum">{activePain.statNumber}</div>
                <div className="text-[11px] text-faint mt-0.5">{activePain.statLabel}</div>
              </div>
            </div>

            {/* Side by side: The SaaS Trap vs The Open Source Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SaaS Trap */}
              <div className="p-5 rounded-[var(--radius-card,12px)] bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle size={15} />
                  <span>The Closed SaaS Trap</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-dim">
                  {activePain.saasTrapPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <X size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Open Source Breakthrough */}
              <div className="p-5 rounded-[var(--radius-card,12px)] bg-trust/5 border border-trust/20 space-y-3">
                <div className="flex items-center gap-2 text-trust font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={15} />
                  <span>The Open Source Breakthrough</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-dim">
                  {activePain.openSourceFixPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="text-trust shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Swaps for this Pain Point */}
            <div className="pt-4 border-t border-line space-y-3">
              <span className="text-xs font-semibold text-faint uppercase tracking-wider">
                Vetted Open-Source Swaps to Escape This Trap
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activePain.topSwaps.map((item) => (
                  <Link
                    key={item.repo}
                    to={`/repo/${item.repo}`}
                    className="p-3.5 rounded-[var(--radius-control,8px)] border border-line bg-surface hover:bg-elevated hover:border-line-strong transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-faint line-through truncate">{item.paid}</div>
                      <div className="font-semibold text-sm text-ink group-hover:text-ember transition-colors truncate">
                        {item.swap}
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-faint group-hover:text-ember transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TAB 2: SAAS WASTE & SAVINGS CALCULATOR ── */}
      {activeTab === "calculator" && (
        <section className="card-elevated p-6 sm:p-8 space-y-8 border border-line bg-surface rounded-[var(--radius-card,16px)] animate-card-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent mb-1">
                <Calculator size={14} />
                <span>Interactive Cost & Trap Simulator</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">What Is Your SaaS Tax Over 5 Years?</h2>
              <p className="text-dim text-sm max-w-[65ch]">
                Select the software subscriptions your organization pays for to see cumulative leakage and the $0
                open-source replacement stack.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => selectPreset("solo")}
                className="btn-tactile px-2.5 py-1.5 rounded-md border border-line bg-canvas text-xs font-medium text-dim hover:text-ink cursor-pointer"
              >
                Solo Stack
              </button>
              <button
                type="button"
                onClick={() => selectPreset("team5")}
                className="btn-tactile px-2.5 py-1.5 rounded-md border border-line bg-canvas text-xs font-medium text-dim hover:text-ink cursor-pointer"
              >
                Team of 5
              </button>
              <button
                type="button"
                onClick={() => selectPreset("team20")}
                className="btn-tactile px-2.5 py-1.5 rounded-md border border-line bg-canvas text-xs font-medium text-dim hover:text-ink cursor-pointer"
              >
                Team of 20
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Tool Selection & Team Size Slider */}
            <div className="lg:col-span-7 space-y-6">
              {/* Team Size Slider */}
              <div className="p-4 rounded-[var(--radius-card,12px)] bg-canvas border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="team-slider" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Users size={14} className="text-faint" /> Team Size (Users / Seats):
                  </label>
                  <span className="font-display font-bold text-base text-ember tnum bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
                    {teamSize} {teamSize === 1 ? "person" : "people"}
                  </span>
                </div>
                <input
                  id="team-slider"
                  type="range"
                  min="1"
                  max="100"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                  className="w-full accent-accent cursor-pointer h-2 bg-line rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-faint tnum">
                  <span>1 (Solo)</span>
                  <span>10</span>
                  <span>25</span>
                  <span>50</span>
                  <span>100+ seats</span>
                </div>
              </div>

              {/* Tools Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-dim">
                  <span className="font-semibold text-ink">Paid Subscriptions Currently Used:</span>
                  <span>{selectedToolIds.length} selected</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_TOOLS.map((tool) => {
                    const isChecked = selectedToolIds.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => toggleTool(tool.id)}
                        className={`btn-tactile p-3 rounded-[var(--radius-control,8px)] border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isChecked
                            ? "border-accent bg-accent/5 ring-1 ring-accent/40"
                            : "border-line bg-surface hover:border-line-strong hover:bg-canvas/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-ink">{tool.name}</span>
                            <span className="text-[10px] text-faint">({tool.category})</span>
                          </div>
                          <div className="text-[11px] text-dim tnum mt-0.5">
                            ${tool.price.toFixed(2)}/seat/mo → <span className="text-trust font-medium">{tool.swap}</span>
                          </div>
                        </div>

                        <div
                          className={`size-5 rounded grid place-items-center shrink-0 border ${
                            isChecked ? "bg-accent border-accent text-white" : "border-line bg-canvas text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Live Calculation & Savings Dashboard */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-[var(--radius-card,16px)] bg-ink text-surface space-y-6 shadow-float">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface/15">
                  <span className="text-xs font-semibold uppercase tracking-wider text-surface/70">
                    SaaS Expense vs Open Source
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-trust/20 text-trust font-semibold border border-trust/30">
                    100% Free Forever
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-surface/75">Monthly SaaS Bill:</span>
                    <span className="font-display text-xl font-bold tnum text-surface">
                      ${Math.round(monthlyCost).toLocaleString()}/mo
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-surface/75">1-Year Closed SaaS Cost:</span>
                    <span className="font-display text-xl font-bold tnum text-rose-400">
                      ${Math.round(yearlyCost).toLocaleString()}/yr
                    </span>
                  </div>

                  <div className="pt-2 border-t border-surface/15 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-surface">5-Year Cumulative Tax:</span>
                    <span className="font-display text-2xl font-bold tnum text-rose-400">
                      ${Math.round(fiveYearCost).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Open Source Contrast */}
                <div className="p-4 rounded-[var(--radius-card,12px)] bg-surface/10 border border-surface/15 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-surface">Open-Source Software Cost:</span>
                    <span className="font-mono text-base font-bold text-trust">$0.00 / seat</span>
                  </div>
                  <p className="text-[11px] text-surface/75 leading-relaxed">
                    By switching to open-source software, you eliminate recurring licensing seats entirely. Keep 100% of
                    your data on your own terms.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-surface/15">
                <Link
                  to="/stack-audit"
                  className="btn-tactile w-full py-3 rounded-[var(--radius-control,8px)] bg-accent hover:bg-accent/90 text-white font-semibold text-xs sm:text-sm text-center inline-flex items-center justify-center gap-2 shadow-xs"
                >
                  <FileText size={15} />
                  <span>Generate Full Stack Cost Audit</span>
                </Link>
                <p className="text-[10px] text-center text-surface/60">
                  Runs locally in your browser. Zero tracking or registration required.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TAB 3: MYTHS BUSTED ── */}
      {activeTab === "myths" && (
        <section className="space-y-4 animate-card-in">
          <div className="p-5 rounded-[var(--radius-card,16px)] border border-line bg-surface space-y-1">
            <h2 className="font-display text-xl font-bold text-ink">5 Big Misconceptions About Open Source</h2>
            <p className="text-dim text-xs sm:text-sm">
              Clear answers to the most common questions people ask before switching away from closed subscriptions.
            </p>
          </div>

          <div className="space-y-3">
            {MYTHS.map((myth, idx) => {
              const isOpen = openMythIndex === idx;
              return (
                <div
                  key={idx}
                  className="card-elevated border border-line bg-surface rounded-[var(--radius-card,12px)] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenMythIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-6 rounded-full bg-trust/15 text-trust font-bold text-xs grid place-items-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm sm:text-base text-ink">{myth.q}</span>
                    </div>
                    <span className="text-faint shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-line text-xs sm:text-sm text-dim leading-relaxed bg-canvas/40 animate-card-in">
                      <p>{myth.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TAB 4: MIGRATION READINESS QUIZ ── */}
      {activeTab === "readiness" && (
        <section className="card-elevated p-6 sm:p-8 space-y-6 border border-line bg-surface rounded-[var(--radius-card,16px)] animate-card-in">
          <div className="space-y-1 pb-4 border-b border-line">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-trust">
              <Zap size={14} />
              <span>3-Question Transition Guide</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-ink">Find Your Ideal Starting Point</h2>
            <p className="text-dim text-sm">
              Answer 3 quick questions to get the lowest-effort, highest-reward open-source path for your situation.
            </p>
          </div>

          <div className="space-y-6">
            {/* Question 1: Hosting */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-faint">
                1. Where do you want the software to run?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "desktop", title: "Standalone Desktop App", desc: "No servers. Install .exe or .dmg like Spotify." },
                  { id: "cloud", title: "1-Click Cloud VPS", desc: "Run for your team on a cheap $5/mo digital server." },
                  { id: "hybrid", title: "Hybrid Local-First", desc: "Fast offline apps that sync when connected." },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, hosting: opt.id }))}
                    className={`btn-tactile p-3.5 rounded-[var(--radius-control,8px)] border text-left transition-all cursor-pointer ${
                      quizAnswers.hosting === opt.id
                        ? "border-ink bg-ink text-surface shadow-xs"
                        : "border-line bg-surface text-ink hover:border-line-strong hover:bg-canvas"
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">{opt.title}</div>
                    <div className={`text-[11px] ${quizAnswers.hosting === opt.id ? "text-surface/80" : "text-faint"}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Priority */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-faint">
                2. What is your #1 reason to switch?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "cost", title: "Stop Paying Monthly Seats", desc: "Cut $500–$5,000/yr in recurring subscriptions." },
                  { id: "privacy", title: "Complete Privacy & Sovereignty", desc: "Prevent cloud vendors & AI from scraping data." },
                  { id: "speed", title: "Speed & Offline Access", desc: "Fast native apps without browser tab bloat." },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, priority: opt.id }))}
                    className={`btn-tactile p-3.5 rounded-[var(--radius-control,8px)] border text-left transition-all cursor-pointer ${
                      quizAnswers.priority === opt.id
                        ? "border-ink bg-ink text-surface shadow-xs"
                        : "border-line bg-surface text-ink hover:border-line-strong hover:bg-canvas"
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1">{opt.title}</div>
                    <div className={`text-[11px] ${quizAnswers.priority === opt.id ? "text-surface/80" : "text-faint"}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendation Output */}
            <div className="p-6 rounded-[var(--radius-card,12px)] bg-trust/10 border border-trust/30 space-y-4">
              <div className="flex items-center gap-2 text-trust font-semibold text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>Your Recommended 3-Step Action Plan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-[var(--radius-control,8px)] bg-surface border border-line space-y-1">
                  <div className="text-[10px] font-bold text-accent uppercase">Step 1: Password Safety</div>
                  <div className="font-semibold text-sm text-ink">Swap to Bitwarden</div>
                  <p className="text-[11px] text-faint">
                    Zero-effort 1-click import from 1Password/LastPass. Free mobile & browser extensions.
                  </p>
                </div>

                <div className="p-3.5 rounded-[var(--radius-control,8px)] bg-surface border border-line space-y-1">
                  <div className="text-[10px] font-bold text-accent uppercase">Step 2: Notes & Docs</div>
                  <div className="font-semibold text-sm text-ink">Swap to AppFlowy / Logseq</div>
                  <p className="text-[11px] text-faint">
                    Instant local offline desktop app. Import Notion markdown pages in seconds.
                  </p>
                </div>

                <div className="p-3.5 rounded-[var(--radius-control,8px)] bg-surface border border-line space-y-1">
                  <div className="text-[10px] font-bold text-accent uppercase">Step 3: Team Comms</div>
                  <div className="font-semibold text-sm text-ink">Swap to Mattermost / Zulip</div>
                  <p className="text-[11px] text-faint">
                    Deploy on a $5/mo VPS for unlimited teammates with zero per-user seat tax.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-xs text-dim">
                  Ready to explore all 100+ audited open-source replacements for your favorite tools?
                </p>
                <Link
                  to="/alternatives"
                  className="btn-tactile px-4 py-2 rounded-[var(--radius-control,6px)] bg-ink text-surface text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Browse Full Alternatives Catalog</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TAB 5: PRIMER ARTICLES ── */}
      {activeTab === "articles" && (
        <section className="space-y-4 animate-card-in">
          <div className="p-5 rounded-[var(--radius-card,16px)] border border-line bg-surface space-y-1">
            <h2 className="font-display text-xl font-bold text-ink">Plain-Language Primers & Guides</h2>
            <p className="text-dim text-xs sm:text-sm">
              5-minute reads explaining GitHub, open-source licenses, installs, and data formats without tech jargon.
            </p>
          </div>

          {!articles && (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 w-full rounded-[var(--radius-card,12px)]" />
              ))}
            </div>
          )}

          <div className="grid gap-3">
            {articles &&
              articles.map((a, i) => (
                <Link
                  key={a.slug}
                  to={`/learn/${a.slug}`}
                  className="card-elevated p-5 flex items-center gap-4 group animate-card-in rounded-[var(--radius-card,12px)] border border-line bg-surface hover:bg-elevated transition-all"
                  style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
                >
                  <span className="tnum font-mono text-faint text-sm font-bold bg-canvas size-8 rounded-full border border-line grid place-items-center shrink-0">
                    {String(a.order).padStart(2, "0")}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display text-base sm:text-lg font-bold text-ink group-hover:text-ember transition-colors">
                      {a.title}
                    </span>
                    {a.description && (
                      <span className="block text-xs sm:text-sm text-faint mt-0.5 truncate">{a.description}</span>
                    )}
                  </span>
                  <ArrowRight size={16} className="text-faint group-hover:text-ember transition-colors shrink-0" />
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function LearnArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setArticle(null);
    api.learnArticle(slug).then(setArticle).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (error)
    return (
      <div className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <p className="text-caution tnum text-sm mb-4">{error}</p>
        <Link to="/learn" className="shimmer-button btn-tactile inline-flex px-4 py-2 text-sm text-ink">
          Back to Learn & Decision Tools
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-[760px] px-4 md:px-6 py-10">
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile mb-6">
        <ArrowLeft size={15} /> All Decision Guides & Articles
      </Link>

      {!article ? (
        <div className="mt-6 space-y-3">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      ) : (
        <article className="mt-6 animate-card-in opacity-0 card-elevated p-6 sm:p-10 border border-line bg-surface rounded-[var(--radius-card,16px)]">
          {article.description && <p className="text-dim italic -mt-2 mb-6">{article.description}</p>}
          <Markdown source={article.body} />
        </article>
      )}
    </div>
  );
}
