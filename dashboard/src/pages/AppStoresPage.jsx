import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Server,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  Terminal,
  Cpu,
  Package,
  FolderGit2,
  HardDrive,
  Box,
  CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api";
import BrandLogo from "../components/BrandLogo";

const PLATFORMS = [
  {
    id: "umbrel",
    name: "UmbrelOS",
    tagline: "1-Click Community App Store for Umbrel Home & Raspberry Pi",
    description: "Install open-source alternatives with one click directly from your Umbrel dashboard using our community store repository.",
    storeUrl: "https://github.com/bengowtham70-dev/opensource-hub-umbrel-store",
    docsUrl: "https://github.com/getumbrel/umbrel-community-app-store",
  },
  {
    id: "runtipi",
    name: "Runtipi",
    tagline: "Homeserver App Store with Docker Architecture",
    description: "Pre-configured Runtipi app definitions with custom form fields, persistent data volumes, and zero-conflict port allocations.",
    storeUrl: "https://github.com/bengowtham70-dev/opensource-hub-tipi-store",
    docsUrl: "https://runtipi.io/docs",
  },
  {
    id: "casaos",
    name: "CasaOS",
    tagline: "Simple & Elegant Home Cloud Dashboard",
    description: "Production-ready CasaOS JSON app manifests compatible with ZimaBoard, ZimaBlade, and Ubuntu/Debian home servers.",
    storeUrl: "https://github.com/bengowtham70-dev/opensource-hub-casaos",
    docsUrl: "https://casaos.io",
  },
  {
    id: "unraid",
    name: "Unraid",
    tagline: "Community Applications (CA) XML Templates",
    description: "Native Unraid Container XML templates with pre-configured appdata paths and WebUI port assignments.",
    storeUrl: "https://github.com/bengowtham70-dev/opensource-hub-unraid",
    docsUrl: "https://unraid.net",
  },
  {
    id: "docker",
    name: "Docker CLI",
    tagline: "Direct Container Run & Compose Snippets",
    description: "Standard docker run and docker compose definitions ready to execute on any Linux server, VPS, or homelab.",
    storeUrl: null,
    docsUrl: "https://docs.docker.com",
  },
];

export default function AppStoresPage() {
  const [activePlatform, setActivePlatform] = useState("umbrel");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);
  const [copiedDashboardCmd, setCopiedDashboardCmd] = useState(false);

  useEffect(() => {
    api
      .appStores()
      .then((data) => {
        setApps(data.apps || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentPlatform = useMemo(() => {
    return PLATFORMS.find((p) => p.id === activePlatform) || PLATFORMS[0];
  }, [activePlatform]);

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.replaces.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.image.toLowerCase().includes(q)
    );
  }, [apps, searchQuery]);

  const handleCopyStoreUrl = async () => {
    if (!currentPlatform.storeUrl) return;
    try {
      await navigator.clipboard.writeText(currentPlatform.storeUrl);
      setCopiedStoreUrl(true);
      setTimeout(() => setCopiedStoreUrl(false), 2000);
    } catch {}
  };

  const handleCopyDashboardCmd = async () => {
    const cmd = "docker run -d -p 3000:3000 --name opensource-hub --restart unless-stopped ghcr.io/bengowtham70-dev/opensource-hub:latest";
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedDashboardCmd(true);
      setTimeout(() => setCopiedDashboardCmd(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 md:py-12 space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-line bg-surface text-dim text-xs font-semibold mb-2 shadow-2xs">
            <Server size={13} className="text-ember" />
            <span>PRD §31 Self-Hosting &amp; Container Distribution</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-tight">
            Self-Hosting &amp; Home-Server App Stores
          </h1>
          <p className="text-sm text-dim mt-1.5 max-w-2xl leading-relaxed">
            Turn OpenSource Hub into an automated 1-click app store for your homelab. Download pre-compiled manifest archives for UmbrelOS, Runtipi, CasaOS, and Unraid, or run our dashboard container directly.
          </p>
        </div>

        {/* Global Download Button */}
        {activePlatform !== "docker" && (
          <a
            href={`/api/app-stores/${activePlatform}/export.zip`}
            download
            className="btn-tactile px-4 py-2.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-2 shadow-sm shrink-0 cursor-pointer hover:opacity-90 self-start md:self-auto"
          >
            <Download size={15} />
            <span>Download {currentPlatform.name} Store (.zip)</span>
          </a>
        )}
      </div>

      {/* Platform Tabs Strip */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto no-scrollbar">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePlatform(p.id)}
            className={`btn-tactile px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === p.id
                ? "bg-ink text-surface dark:bg-surface dark:text-ink shadow-sm"
                : "bg-surface text-dim border border-line hover:text-ink hover:border-line-heavy"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Active Platform Instructions & Callout Box */}
      <div className="card-elevated p-5 md:p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <HardDrive size={18} className="text-ember" />
              <span>{currentPlatform.tagline}</span>
            </h2>
            <p className="text-xs text-dim mt-1 max-w-2xl leading-relaxed">
              {currentPlatform.description}
            </p>
          </div>

          {currentPlatform.docsUrl && (
            <a
              href={currentPlatform.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 text-xs text-link hover:underline shrink-0 self-start sm:self-auto"
            >
              <span>Platform Docs</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* 1-Click Store Repository URL Box (for Umbrel/Runtipi) */}
        {currentPlatform.storeUrl && (
          <div className="p-4 rounded-xl bg-elevated border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-faint uppercase tracking-wider block">
                Custom App Store Repository URL (Paste into {currentPlatform.name} Settings)
              </span>
              <code className="text-xs font-mono text-ink font-semibold break-all">
                {currentPlatform.storeUrl}
              </code>
            </div>
            <button
              type="button"
              onClick={handleCopyStoreUrl}
              className="btn-tactile px-3.5 py-1.5 rounded-xl border border-line bg-surface hover:bg-elevated text-ink text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
            >
              {copiedStoreUrl ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
              <span>{copiedStoreUrl ? "Copied URL" : "Copy Store URL"}</span>
            </button>
          </div>
        )}

        {/* Self-Host OpenSource Hub Itself Banner */}
        <div className="p-4 rounded-xl bg-surface border border-dashed border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Box size={16} className="text-trust shrink-0" />
            <div>
              <span className="font-bold text-ink">Run OpenSource Hub on your Home Server:</span>
              <p className="text-dim">Deploy the complete OpenSource Hub dashboard as a private container.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyDashboardCmd}
            className="btn-tactile px-3 py-1.5 rounded-xl border border-line bg-elevated hover:bg-surface text-ink text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            {copiedDashboardCmd ? <Check size={13} className="text-trust" /> : <Terminal size={13} />}
            <span>{copiedDashboardCmd ? "Copied Command" : "Copy Docker Run"}</span>
          </button>
        </div>
      </div>

      {/* Filterable App Catalog Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink">
              Ready-to-Install Applications ({filteredApps.length})
            </h3>
            <span className="text-[11px] text-faint">Verified Docker Compose Specs</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps or categories..."
              className="w-full px-3 pl-8 py-1.5 rounded-xl border border-line bg-elevated text-xs text-ink placeholder:text-faint outline-none focus:border-ember"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="card-elevated p-5 rounded-2xl bg-surface border border-line shadow-2xs hover:border-line-heavy transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <BrandLogo
                      name={app.name}
                      category={app.category}
                      className="size-10 rounded-xl border border-line shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-ink">{app.name}</h4>
                      <span className="text-[11px] text-faint block">
                        Replaces <span className="font-medium text-dim">{app.replaces}</span>
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-elevated border border-line text-[10px] font-mono text-dim tnum">
                    Port {app.port}
                  </span>
                </div>

                <p className="text-xs text-dim line-clamp-2 leading-relaxed">
                  {app.description}
                </p>

                <div className="p-2.5 rounded-xl bg-elevated border border-line/60 font-mono text-[11px] text-ink truncate">
                  <span className="text-faint select-none">$ </span>
                  {app.image}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs">
                <Link
                  to={`/repo/${app.repo}`}
                  className="text-dim hover:text-ember transition-colors inline-flex items-center gap-1 font-medium"
                >
                  <span>Catalog Specs</span>
                  <ArrowRight size={11} />
                </Link>

                <div className="flex items-center gap-2">
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tactile p-1.5 rounded-lg border border-line bg-surface hover:text-ink text-faint"
                    title="View GitHub Repository"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
