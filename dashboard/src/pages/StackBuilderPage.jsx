import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  Check,
  Share2,
  DollarSign,
  Download,
  Sparkles,
  Terminal,
  FileCode,
  Rocket,
  Server,
  Cloud,
  ExternalLink,
  Table,
  Cpu,
  Globe,
  Database,
  ArrowRight,
  FolderArchive,
  FileText,
} from "lucide-react";
import { getPairings } from "../lib/seed";
import { api } from "../lib/api";
import { formatSavings } from "../lib/format";
import BrandLogo from "../components/BrandLogo";
import {
  generateMultiComposeYaml,
  allocateServicePorts,
  generateBashCommand,
  generatePowerShellCommand,
  generateCasaOsManifest,
  generateUnraidXml,
} from "../lib/compose-generator";

const STACK_PRESETS = [
  {
    id: "startup",
    title: "Modern Startup",
    icon: "🚀",
    description: "Database, Analytics, Secrets & UI Design",
    slugs: ["supabase/supabase", "umami-software/umami", "dani-garcia/vaultwarden", "penpot/penpot"],
  },
  {
    id: "privacy",
    title: "Privacy & Team",
    icon: "💬",
    description: "Chat, Cloud Storage, Video Calls & Boards",
    slugs: ["mattermost/mattermost", "nextcloud/server", "jitsi/jitsi-meet", "mattermost/focalboard"],
  },
  {
    id: "devtools",
    title: "Developer Platform",
    icon: "🛠️",
    description: "Code Forge, CI/CD Runner, Object Storage",
    slugs: ["go-gitea/gitea", "woodpecker-ci/woodpecker", "minio/minio"],
  },
  {
    id: "lowcode",
    title: "Internal Tools",
    icon: "📊",
    description: "No-Code Spreadsheets, Workflows & Scripts",
    slugs: ["nocodb/nocodb", "bram2w/baserow", "windmill-labs/windmill"],
  },
];

export default function StackBuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [catalogSearchResults, setCatalogSearchResults] = useState([]);
  const [resolvedCustomTools, setResolvedCustomTools] = useState({});
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCompose, setCopiedCompose] = useState(false);
  const [activeTab, setActiveTab] = useState("compose"); // "compose" | "bundle" | "cli" | "cloud" | "matrix" | "nas"
  const [cliOs, setCliOs] = useState("bash"); // "bash" | "powershell"
  const [nasFormat, setNasFormat] = useState("casaos"); // "casaos" | "unraid"
  const [copiedNas, setCopiedNas] = useState(false);
  const [bundleData, setBundleData] = useState(null);
  const [selectedBundleFile, setSelectedBundleFile] = useState("docker-compose.yml");
  const [copiedBundleFile, setCopiedBundleFile] = useState(false);

  useEffect(() => {
    getPairings()
      .then((items) => {
        setCatalog(items);
        const toolsParam = searchParams.get("tools");
        const addParam = searchParams.get("add");
        let initial = [];
        if (toolsParam) {
          initial = toolsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        } else {
          initial = ["supabase/supabase", "penpot/penpot", "nocodb/nocodb"];
        }
        if (addParam) {
          const toAdd = addParam.trim().toLowerCase();
          if (!initial.includes(toAdd)) {
            initial.push(toAdd);
          }
        }
        setSelectedSlugs(initial);
      })
      .catch(() => {});
  }, [searchParams]);

  // Fetch full deployment bundle when bundle tab is selected or tools change
  useEffect(() => {
    if (activeTab === "bundle" && selectedSlugs.length) {
      api.composeBundle(selectedSlugs, "my-opensource-stack")
        .then((res) => {
          if (res?.ok) setBundleData(res);
        })
        .catch(() => {});
    }
  }, [activeTab, selectedSlugs]);

  const downloadSingleBundleFile = (fileName, content) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const downloadAllBundleFiles = () => {
    if (!bundleData?.files) return;
    const entries = Object.entries(bundleData.files);
    entries.forEach(([filename, content], index) => {
      setTimeout(() => {
        downloadSingleBundleFile(filename, content);
      }, index * 250);
    });
  };

  const copyCurrentBundleFile = () => {
    const content = bundleData?.files?.[selectedBundleFile] || "";
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedBundleFile(true);
    setTimeout(() => setCopiedBundleFile(false), 2000);
  };

  // Debounced search against the 26,000+ catalog
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCatalogSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.catalog({ q: searchQuery.trim(), limit: 12 });
        if (res?.results) {
          setCatalogSearchResults(res.results);
        }
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Resolve any selected slugs that aren't in the default seed
  useEffect(() => {
    for (const slug of selectedSlugs) {
      if (
        !catalog.some((p) => p.alternative.repo.toLowerCase() === slug) &&
        !catalogSearchResults.some((p) => p.alternative.repo.toLowerCase() === slug) &&
        !resolvedCustomTools[slug]
      ) {
        api.catalog({ q: slug, limit: 1 }).then((res) => {
          if (res?.results?.[0]) {
            setResolvedCustomTools((prev) => ({ ...prev, [slug]: res.results[0] }));
          }
        }).catch(() => {});
      }
    }
  }, [selectedSlugs, catalog, catalogSearchResults, resolvedCustomTools]);

  const selectedItems = selectedSlugs
    .map((slug) => {
      const allKnown = [...catalog, ...catalogSearchResults, ...Object.values(resolvedCustomTools)];
      return allKnown.find(
        (p) =>
          p.alternative.repo.toLowerCase() === slug ||
          p.alternative.name.toLowerCase() === slug ||
          p.alternative.repo.split("/")[1]?.toLowerCase() === slug
      );
    })
    .filter(Boolean);

  const totalSavings = selectedItems.reduce(
    (sum, item) => sum + (item.paidTool?.pricePerYearUsd || 0),
    0
  );

  const toggleTool = (repo) => {
    const cleanRepo = repo.toLowerCase();
    let next;
    if (selectedSlugs.includes(cleanRepo)) {
      next = selectedSlugs.filter((s) => s !== cleanRepo);
    } else {
      if (selectedSlugs.length >= 10) return;
      next = [...selectedSlugs, cleanRepo];
    }
    setSelectedSlugs(next);
    setSearchParams(next.length > 0 ? { tools: next.join(",") } : {});
  };

  const applyPreset = (presetSlugs) => {
    setSelectedSlugs(presetSlugs);
    setSearchParams({ tools: presetSlugs.join(",") });
  };

  const shareableUrl = typeof window !== "undefined"
    ? `${window.location.origin}/stacks/share?tools=${selectedSlugs.join(",")}`
    : `https://opensource-hub.org/stacks/share?tools=${selectedSlugs.join(",")}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const composeYaml = useMemo(
    () => generateMultiComposeYaml(selectedItems),
    [selectedItems]
  );

  const allocatedServices = useMemo(
    () => allocateServicePorts(selectedItems),
    [selectedItems]
  );

  const copyComposeYaml = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(composeYaml);
      }
    } catch {}
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 2000);
  };

  const copyCliCommand = async () => {
    try {
      const yaml = generateMultiComposeYaml(selectedItems);
      const cmd = cliOs === "bash" ? generateBashCommand(yaml) : generatePowerShellCommand(yaml);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cmd);
      }
    } catch {}
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const downloadComposeYaml = () => {
    const blob = new Blob([composeYaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docker-compose.yml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const casaOsJson = useMemo(() => generateCasaOsManifest(selectedItems), [selectedItems]);
  const unraidXml = useMemo(() => generateUnraidXml(selectedItems), [selectedItems]);

  const copyNasContent = async () => {
    try {
      const content = nasFormat === "casaos" ? casaOsJson : unraidXml;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      }
    } catch {}
    setCopiedNas(true);
    setTimeout(() => setCopiedNas(false), 2000);
  };

  const downloadNasManifest = () => {
    const isCasa = nasFormat === "casaos";
    const content = isCasa ? casaOsJson : unraidXml;
    const filename = isCasa ? "casaos-app.json" : "my-stack.xml";
    const type = isCasa ? "application/json" : "application/xml";
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const seedFiltered = catalog.filter((p) => {
      if (!q) return true;
      return (
        p.alternative.name.toLowerCase().includes(q) ||
        p.alternative.repo.toLowerCase().includes(q) ||
        p.paidTool.name.toLowerCase().includes(q)
      );
    });
    const seen = new Set(seedFiltered.map((p) => p.alternative.repo.toLowerCase()));
    const extra = catalogSearchResults.filter(
      (p) => !seen.has(p.alternative?.repo?.toLowerCase())
    );
    return [...seedFiltered, ...extra];
  }, [catalog, searchQuery, catalogSearchResults]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-ember font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Interactive Stack Architect &amp; Runner</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Build &amp; Share Your Open-Source Stack
          </h1>
          <p className="text-sm text-dim mt-1 max-w-2xl">
            Choose your replacements for commercial SaaS. Compute total annual savings, generate a collision-free Docker Compose configuration, and launch your private stack in one command.
          </p>
        </div>

        {/* Stack Totals Banner */}
        <div className="bg-elevated p-4 rounded-xl border border-line flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[11px] text-faint uppercase font-semibold block">Total Estimated Savings</span>
            <span className="font-display text-3xl font-bold text-trust block">
              {formatSavings(totalSavings)}
              <span className="text-xs text-faint font-normal font-sans"> /yr</span>
            </span>
          </div>
          <button
            type="button"
            onClick={copyShareLink}
            className="btn-tactile px-4 py-2 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            {copiedLink ? <Check size={14} className="text-trust" /> : <Share2 size={14} />}
            <span>{copiedLink ? "Link Copied!" : "Share Stack"}</span>
          </button>
        </div>
      </div>

      {/* Quick-Start Presets Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-faint">
            Quick-Start Stack Presets
          </span>
          <span className="text-xs text-faint">Click to load preset</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STACK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.slugs)}
              className="btn-tactile card-elevated p-3.5 text-left rounded-xl border border-line hover:border-ink/30 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-[11px] text-faint group-hover:text-ink font-medium">Load Preset →</span>
                </div>
                <h3 className="font-semibold text-sm text-ink group-hover:text-link transition-colors">
                  {preset.title}
                </h3>
                <p className="text-xs text-dim mt-0.5 leading-snug">
                  {preset.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Selected Stack List & Interactive Sandbox */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
              <Layers size={18} className="text-ember" />
              <span>Selected Tools ({selectedItems.length}/10)</span>
            </h2>
            <span className="text-xs text-faint">Click any tool on the right to add or remove</span>
          </div>

          {selectedItems.length === 0 && (
            <div className="card-elevated p-8 text-center text-dim text-sm border-dashed">
              Your custom stack is empty! Select tools from the catalog browser or choose a preset above.
            </div>
          )}

          <div className="grid gap-3">
            {selectedItems.map((item) => (
              <div
                key={item.alternative.repo}
                className="card-elevated p-4 bg-surface border border-line rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-elevated border border-line grid place-items-center shrink-0">
                    <BrandLogo repo={item.alternative.repo} name={item.alternative.name} size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/repo/${item.alternative.repo}`} className="font-semibold text-sm text-ink hover:text-ember">
                        {item.alternative.name}
                      </Link>
                      <span className="text-[11px] text-faint">replaces {item.paidTool.name}</span>
                    </div>
                    <p className="text-xs text-dim line-clamp-1">{item.alternative.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-xs text-trust tnum">
                    Save {formatSavings(item.paidTool?.pricePerYearUsd || 0)}/yr
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleTool(item.alternative.repo)}
                    className="p-1.5 rounded-md text-faint hover:text-caution hover:bg-caution/10 transition-colors"
                    title="Remove from stack"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Stack Sandbox Tabs */}
          {selectedItems.length > 0 && (
            <div className="card-elevated p-6 bg-surface border border-line rounded-2xl space-y-4">
              {/* Tab Navigation Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("compose")}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                      activeTab === "compose"
                        ? "bg-ink text-surface font-semibold shadow-xs"
                        : "text-dim hover:text-ink bg-elevated"
                    }`}
                  >
                    <FileCode size={13} />
                    <span>docker-compose.yml</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("cli")}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                      activeTab === "cli"
                        ? "bg-ink text-surface font-semibold shadow-xs"
                        : "text-dim hover:text-ink bg-elevated"
                    }`}
                  >
                    <Terminal size={13} />
                    <span>1-Click CLI Runner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("cloud")}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                      activeTab === "cloud"
                        ? "bg-ink text-surface font-semibold shadow-xs"
                        : "text-dim hover:text-ink bg-elevated"
                    }`}
                  >
                    <Rocket size={13} />
                    <span>Cloud Deployers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("matrix")}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                      activeTab === "matrix"
                        ? "bg-ink text-surface font-semibold shadow-xs"
                        : "text-dim hover:text-ink bg-elevated"
                    }`}
                  >
                    <Table size={13} />
                    <span>Port &amp; Service Matrix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("nas")}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                      activeTab === "nas"
                        ? "bg-ink text-surface font-semibold shadow-xs"
                        : "text-dim hover:text-ink bg-elevated"
                    }`}
                  >
                    <Server size={13} />
                    <span>Homelab NAS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bundle")}
                    className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                      activeTab === "bundle"
                        ? "bg-ink text-surface font-semibold shadow-xs"
                        : "text-dim hover:text-ink bg-elevated"
                    }`}
                  >
                    <FolderArchive size={13} className="text-ember" />
                    <span>Deployment Kit (.zip / Bundle)</span>
                  </button>
                </div>

                {activeTab === "bundle" && bundleData?.files && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={downloadAllBundleFiles}
                      className="btn-tactile px-3 py-1.5 rounded-lg bg-ink dark:bg-surface text-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                      title="Download all files in deployment kit"
                    >
                      <Download size={13} />
                      <span>Download All Files</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSingleBundleFile(selectedBundleFile, bundleData.files[selectedBundleFile])}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5 hover:border-line-strong hover:bg-elevated transition-colors cursor-pointer"
                      title={`Download ${selectedBundleFile}`}
                    >
                      <Download size={13} className="text-ember" />
                      <span>Download {selectedBundleFile}</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyCurrentBundleFile}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedBundleFile ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                      <span>{copiedBundleFile ? "Copied" : "Copy File"}</span>
                    </button>
                  </div>
                )}

                {activeTab === "compose" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadComposeYaml}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5 hover:border-line-strong hover:bg-elevated transition-colors"
                      title="Download docker-compose.yml file to disk"
                    >
                      <Download size={13} className="text-ember" />
                      <span>Download .yml</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyComposeYaml}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      {copiedCompose ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                      <span>{copiedCompose ? "Copied" : "Copy YAML"}</span>
                    </button>
                  </div>
                )}

                {activeTab === "nas" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadNasManifest}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5 hover:border-line-strong hover:bg-elevated transition-colors"
                      title={nasFormat === "casaos" ? "Download casaos-app.json" : "Download my-stack.xml"}
                    >
                      <Download size={13} className="text-ember" />
                      <span>{nasFormat === "casaos" ? "Download JSON" : "Download XML"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyNasContent}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      {copiedNas ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                      <span>{copiedNas ? "Copied" : "Copy Manifest"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 0: Deployment Kit Bundle View */}
              {activeTab === "bundle" && (
                <div className="space-y-4 animate-card-in">
                  <div className="p-4 rounded-xl bg-canvas/60 border border-line flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-ink">
                          Self-Host Deployment Kit
                        </span>
                        <span className="text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-trust/10 text-trust border border-trust/20">
                          Production Ready
                        </span>
                      </div>
                      <p className="text-xs text-dim">
                        Complete multi-service configuration bundle with port isolation, randomized security secrets, and cross-platform start scripts.
                      </p>
                    </div>

                    {/* File Tabs */}
                    {bundleData?.files && (
                      <div className="flex flex-wrap items-center gap-1.5 bg-surface p-1 rounded-lg border border-line">
                        {Object.keys(bundleData.files).map((filename) => (
                          <button
                            key={filename}
                            type="button"
                            onClick={() => setSelectedBundleFile(filename)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                              selectedBundleFile === filename
                                ? "bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-2xs"
                                : "text-dim hover:text-ink hover:bg-elevated"
                            }`}
                          >
                            {filename}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {bundleData?.files ? (
                    <div className="relative">
                      <div className="absolute top-3 right-3 text-[11px] font-mono text-faint">
                        {selectedBundleFile}
                      </div>
                      <pre className="p-4 rounded-xl bg-elevated border border-line text-xs font-mono text-dim overflow-x-auto select-all leading-relaxed max-h-[500px]">
                        {bundleData.files[selectedBundleFile] || "Select a file above"}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-dim bg-canvas/40 border border-line rounded-xl">
                      Generating deployment kit files...
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: Compose YAML View */}
              {activeTab === "compose" && (
                <div className="space-y-2 animate-card-in">
                  <div className="flex items-center justify-between text-xs text-faint">
                    <span>Includes conflict-free host ports, named volumes, and isolated bridge network.</span>
                    <span className="tnum">{allocatedServices.length} Services Configured</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-elevated border border-line text-xs font-mono text-dim overflow-x-auto select-all leading-relaxed">
                    {composeYaml}
                  </pre>
                </div>
              )}

              {/* Tab 2: 1-Click Terminal Runner */}
              {activeTab === "cli" && (
                <div className="space-y-3 animate-card-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCliOs("bash")}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          cliOs === "bash"
                            ? "border-ink bg-ink text-surface font-medium"
                            : "border-line text-faint hover:text-ink bg-elevated"
                        }`}
                      >
                        Bash / macOS / Linux
                      </button>
                      <button
                        type="button"
                        onClick={() => setCliOs("powershell")}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          cliOs === "powershell"
                            ? "border-ink bg-ink text-surface font-medium"
                            : "border-line text-faint hover:text-ink bg-elevated"
                        }`}
                      >
                        Windows PowerShell
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={copyCliCommand}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      {copiedCli ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                      <span>{copiedCli ? "Copied Command!" : "Copy Command"}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-elevated border border-line text-xs font-mono text-dim overflow-x-auto select-all leading-relaxed">
                    {cliOs === "bash" ? generateBashCommand(composeYaml) : generatePowerShellCommand(composeYaml)}
                  </pre>

                  <p className="text-xs text-faint">
                    💡 Paste this snippet directly into your terminal. It will create the project folder, write the verified Docker Compose configuration, and launch all containers in detached mode.
                  </p>
                </div>
              )}

              {/* Tab 3: Cloud 1-Click Deployers */}
              {activeTab === "cloud" && (
                <div className="space-y-3 animate-card-in">
                  <p className="text-xs text-dim">
                    Prefer running in the cloud instead of a local machine? Choose a verified deployment target:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <a
                      href="https://railway.com/new"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactile p-4 rounded-xl border border-line bg-elevated/50 hover:border-ink/30 transition-all flex items-start gap-3 group"
                    >
                      <div className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                        <Rocket size={16} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-ink group-hover:text-link transition-colors">Railway</h4>
                          <ExternalLink size={12} className="text-faint" />
                        </div>
                        <p className="text-xs text-dim mt-1">1-click multi-service provisioning with instant public URLs and persistent volumes.</p>
                      </div>
                    </a>

                    <a
                      href="https://coolify.io/docs/knowledge-base/docker/compose"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactile p-4 rounded-xl border border-line bg-elevated/50 hover:border-ink/30 transition-all flex items-start gap-3 group"
                    >
                      <div className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                        <Server size={16} className="text-trust" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-ink group-hover:text-link transition-colors">Coolify (Self-Hosted)</h4>
                          <ExternalLink size={12} className="text-faint" />
                        </div>
                        <p className="text-xs text-dim mt-1">Open-source, self-hosted PaaS. Paste this compose file to host on your own VPS.</p>
                      </div>
                    </a>

                    <a
                      href="https://fly.io/docs/launch/"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-tactile p-4 rounded-xl border border-line bg-elevated/50 hover:border-ink/30 transition-all flex items-start gap-3 group"
                    >
                      <div className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                        <Cloud size={16} className="text-link" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-ink group-hover:text-link transition-colors">Fly.io</h4>
                          <ExternalLink size={12} className="text-faint" />
                        </div>
                        <p className="text-xs text-dim mt-1">Deploy containers globally on lightweight MicroVMs with automated SSL.</p>
                      </div>
                    </a>

                    <div className="p-4 rounded-xl border border-line bg-elevated/50 flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                        <Download size={16} className="text-ember" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-ink">Portainer Stack</h4>
                          <button
                            type="button"
                            onClick={downloadComposeYaml}
                            className="text-xs text-ember font-medium hover:underline inline-flex items-center gap-1"
                          >
                            Download →
                          </button>
                        </div>
                        <p className="text-xs text-dim mt-1">Download this compose file and paste into Portainer web UI under Stacks → Add Stack.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Port & Service Matrix */}
              {activeTab === "matrix" && (
                <div className="space-y-3 animate-card-in">
                  <div className="border border-line rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-elevated/60 text-faint">
                          <th className="p-3 font-semibold">Service</th>
                          <th className="p-3 font-semibold">Docker Image</th>
                          <th className="p-3 font-semibold">Port Mapping</th>
                          <th className="p-3 font-semibold">Local URL</th>
                          <th className="p-3 font-semibold">Named Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {allocatedServices.map((s) => (
                          <tr key={s.serviceName} className="hover:bg-elevated/30 transition-colors">
                            <td className="p-3 font-medium text-ink flex items-center gap-2">
                              <BrandLogo repo={s.repo} name={s.displayName} size={16} />
                              <span>{s.displayName}</span>
                            </td>
                            <td className="p-3 font-mono text-dim truncate max-w-[180px]">
                              {s.image}
                            </td>
                            <td className="p-3 font-mono tnum text-ink">
                              <span className="px-1.5 py-0.5 rounded bg-elevated border border-line font-medium">
                                {s.hostPort}:{s.containerPort}
                              </span>
                            </td>
                            <td className="p-3">
                              <a
                                href={s.accessUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-link hover:underline font-mono inline-flex items-center gap-1"
                              >
                                <span>{s.accessUrl}</span>
                                <ExternalLink size={10} />
                              </a>
                            </td>
                            <td className="p-3 font-mono text-faint">
                              {s.volumeName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-faint">
                    🛡️ Zero Port Conflicts: Host ports are automatically remapped to prevent local collisions when combining multiple apps.
                  </p>
                </div>
              )}

              {/* Tab 5: Homelab NAS Manifests */}
              {activeTab === "nas" && (
                <div className="space-y-4 animate-card-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-elevated/50 border border-line rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink">Homelab OS:</span>
                      <button
                        type="button"
                        onClick={() => setNasFormat("casaos")}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          nasFormat === "casaos"
                            ? "bg-ink text-surface font-semibold shadow-xs"
                            : "bg-surface text-dim border border-line hover:text-ink"
                        }`}
                      >
                        CasaOS App Store (JSON)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNasFormat("unraid")}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          nasFormat === "unraid"
                            ? "bg-ink text-surface font-semibold shadow-xs"
                            : "bg-surface text-dim border border-line hover:text-ink"
                        }`}
                      >
                        Unraid Template (XML)
                      </button>
                    </div>
                    <span className="text-xs text-faint">
                      {nasFormat === "casaos"
                        ? "Save as casaos-app.json or paste into Custom App Store"
                        : "Save to /boot/config/plugins/dockerMan/templates-user/my-stack.xml"}
                    </span>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-surface rounded-xl border border-line text-xs font-mono text-ink overflow-x-auto max-h-[500px] leading-relaxed select-all">
                      {nasFormat === "casaos" ? casaOsJson : unraidXml}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Catalog Search & Quick Add */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-ink">Catalog Browser</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search open-source alternatives…"
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-ember"
          />

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCatalog.map((p) => {
              const isSelected = selectedSlugs.includes(p.alternative.repo.toLowerCase());
              return (
                <div
                  key={p.alternative.repo}
                  onClick={() => toggleTool(p.alternative.repo)}
                  className={`p-3 rounded-xl border cursor-pointer select-none flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? "bg-trust/10 border-trust/40 text-ink"
                      : "bg-surface border-line hover:border-line-strong text-dim hover:text-ink"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BrandLogo repo={p.alternative.repo} name={p.alternative.name} size={22} className="shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-ink block truncate">{p.alternative.name}</span>
                      <span className="text-[10.5px] text-faint block truncate">Replaces {p.paidTool.name}</span>
                    </div>
                  </div>
                  <span
                    className={`size-6 rounded-md border grid place-items-center shrink-0 text-xs font-bold ${
                      isSelected ? "bg-trust text-white border-trust" : "border-line text-faint"
                    }`}
                  >
                    {isSelected ? <Check size={13} /> : <Plus size={13} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
