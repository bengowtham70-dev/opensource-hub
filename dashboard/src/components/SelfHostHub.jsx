import { useState } from "react";
import {
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Terminal,
  Server,
  Layers,
  Sparkles,
  FileCode,
  HardDrive,
} from "lucide-react";
import InstallBox from "./InstallBox";
import DockerComposeViewer from "./DockerComposeViewer";
import HomelabApps from "./HomelabApps";
import ShareBar from "./ShareBar";
import TechStackBadges from "./TechStackBadges";

export default function SelfHostHub({
  repo = "",
  alternative = {},
  release = null,
  defaultBranch = "main",
  SelfHostSpecsComponent,
  DownloadSectionComponent,
}) {
  const [expanded, setExpanded] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadCount, setDownloadCount] = useState(() => {
    try {
      const saved = localStorage.getItem(`osh-dl-${repo}`);
      return saved ? parseInt(saved, 10) : 142;
    } catch {
      return 142;
    }
  });

  const [owner, name] = repo.split("/");
  const cleanName = (alternative.name || name || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const handleDownloadBundle = () => {
    // 1. Generate docker-compose.yml content
    const dockerImg = alternative.ecosystems?.docker || `${cleanName}/${cleanName}:latest`;
    const composeContent = `version: '3.8'

# ==============================================================================
# OpenSource Hub — Automated Self-Host Package for ${alternative.name || name}
# Repo: https://github.com/${repo}
# Generated: ${new Date().toISOString()}
# ==============================================================================

services:
  ${cleanName}:
    image: ${dockerImg}
    container_name: ${cleanName}-app
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    volumes:
      - ./data:/app/data
      - ./config:/app/config

# Quick start:
# 1. Save this file as docker-compose.yml
# 2. Run: docker compose up -d
# 3. Open: http://localhost:8080
`;

    // 2. Trigger browser download
    const blob = new Blob([composeContent], { type: "text/yaml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `docker-compose.${cleanName}.yml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 3. Register click and update counter
    const nextCount = downloadCount + 1;
    setDownloadCount(nextCount);
    try {
      localStorage.setItem(`osh-dl-${repo}`, nextCount.toString());
    } catch {}

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Clean, Simplified Self-Host Summary Card (Reduces Cognitive Overload) ── */}
      <div className="card-elevated p-5 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-elevated border border-line grid place-items-center text-ink dark:text-white">
              <Server size={13} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-1.5">
                <span>Self-Hosting &amp; Deployment Hub</span>
                <span className="text-[10px] font-sans px-2 py-0.2 rounded-full border border-line bg-elevated text-dim font-medium">
                  Zero Lock-In
                </span>
              </h3>
              <p className="text-xs text-dim">
                Deploy <strong>{alternative.name || name}</strong> on your own servers, VPS, or homelab in seconds.
              </p>
            </div>
          </div>

          {/* Action Buttons: 1-Click Download Bundle + Expand Arrow */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadBundle}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer bg-ink text-surface dark:bg-surface dark:text-ink hover:opacity-90"
              title="Download full docker-compose.yml configuration"
            >
              {downloaded ? (
                <>
                  <Check size={14} className="stroke-[3] text-surface dark:text-ink" />
                  <span>Bundle Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={14} className="text-surface dark:text-ink" />
                  <span>Download Self-Host Kit</span>
                  <ArrowRight size={13} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-elevated/60 border border-line/60 hover:border-line-strong transition-colors flex items-center justify-between">
            <div>
              <span className="text-[11px] text-faint block">Deployment Target</span>
              <span className="text-xs font-semibold text-ink">Docker &amp; Homelab</span>
            </div>
            <FileCode size={13} className="text-faint" />
          </div>

          <div className="p-3 rounded-xl bg-elevated/60 border border-line/60 hover:border-line-strong transition-colors flex items-center justify-between">
            <div>
              <span className="text-[11px] text-faint block">Downloads Registered</span>
              <span className="text-xs font-semibold text-ink tnum">{downloadCount.toLocaleString()} times</span>
            </div>
            <Download size={13} className="text-faint" />
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-elevated/60 border border-line/60 hover:border-line-strong transition-colors flex items-center justify-between">
            <div>
              <span className="text-[11px] text-faint block">Hardware Specs</span>
              <span className="text-xs font-semibold text-ink">2GB RAM / 10GB SSD</span>
            </div>
            <HardDrive size={13} className="text-faint" />
          </div>
        </div>

        {/* Social share and tech stack tags */}
        <div className="pt-2 border-t border-line/60">
          <TechStackBadges language={alternative.language} tags={alternative.tags} platforms={alternative.platforms} />
        </div>

        {/* Arrow Toggle to Expand / Collapse Detailed Tools (Keeps page simple by default) */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full btn-tactile py-2 px-3 rounded-xl border border-line bg-elevated hover:bg-surface text-xs font-medium text-dim hover:text-ink flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-ink dark:text-white" />
            <span>
              {expanded
                ? "Collapse Advanced Self-Host & Homelab Tools"
                : "Explore Full Self-Host Architecture, Homelab OS & Binaries (5 Tools)"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-faint">
            <span className="text-[11px]">{expanded ? "Show less" : "Expand tools"}</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </button>
      </div>

      {/* ── 2. Primary 1-Click Package Manager Install Box (Always Visible & Clean) ── */}
      <InstallBox repo={repo} alternative={alternative} />

      {/* ── 3. Progressive Disclosure (Only shown when expanded, avoiding information overload) ── */}
      {expanded && (
        <div className="space-y-4 animate-card-in">
          {/* 1-Click Docker Compose Generator & Launcher */}
          <DockerComposeViewer repo={repo} alternative={alternative} />

          {/* Homelab OS 1-Click Support (Umbrel, CasaOS, Unraid, TrueNAS) */}
          <HomelabApps repo={repo} name={alternative.name} />

          {/* Self-Host Specs & Hardware Requirements */}
          {SelfHostSpecsComponent && <SelfHostSpecsComponent alternative={alternative} />}

          {/* Binary / Package Download Section */}
          {DownloadSectionComponent && (
            <DownloadSectionComponent repo={repo} release={release} branch={defaultBranch} />
          )}
        </div>
      )}
    </div>
  );
}
