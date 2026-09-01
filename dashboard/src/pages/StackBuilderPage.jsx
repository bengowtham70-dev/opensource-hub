import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layers, Plus, Trash2, Copy, Check, Share2, DollarSign, Download, Sparkles, Terminal, FileCode } from "lucide-react";
import { getPairings } from "../lib/seed";
import { formatSavings } from "../lib/format";
import BrandLogo, { paidBrand } from "../components/BrandLogo";

export default function StackBuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCompose, setCopiedCompose] = useState(false);

  useEffect(() => {
    getPairings()
      .then((items) => {
        setCatalog(items);
        const toolsParam = searchParams.get("tools");
        if (toolsParam) {
          const slugs = toolsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          setSelectedSlugs(slugs);
        } else {
          // Default initial starter stack (Supabase, Penpot, NocoDB)
          setSelectedSlugs(["supabase/supabase", "penpot/penpot", "nocodb/nocodb"]);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const selectedItems = selectedSlugs
    .map((slug) =>
      catalog.find(
        (p) =>
          p.alternative.repo.toLowerCase() === slug ||
          p.alternative.name.toLowerCase() === slug ||
          p.alternative.repo.split("/")[1]?.toLowerCase() === slug
      )
    )
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

  // Generate combined multi-service docker-compose.yml
  const generateCompose = () => {
    let yaml = `version: "3.8"\n\nservices:\n`;
    for (const item of selectedItems) {
      const sName = (item.alternative.repo.split("/")[1] || item.alternative.name).toLowerCase().replace(/[^a-z0-9]/g, "-");
      yaml += `  ${sName}:\n`;
      yaml += `    image: ${item.alternative.repo.toLowerCase()}:latest\n`;
      yaml += `    restart: unless-stopped\n`;
      yaml += `    environment:\n`;
      yaml += `      - NODE_ENV=production\n`;
      yaml += `    ports:\n`;
      yaml += `      - "8080:8080"\n\n`;
    }
    return yaml;
  };

  const copyComposeYaml = async () => {
    try {
      await navigator.clipboard.writeText(generateCompose());
      setCopiedCompose(true);
      setTimeout(() => setCopiedCompose(false), 2000);
    } catch {}
  };

  const filteredCatalog = catalog.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.alternative.name.toLowerCase().includes(q) ||
      p.alternative.repo.toLowerCase().includes(q) ||
      p.paidTool.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-ember font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            <span>Interactive Stack Architect</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Build &amp; Share Your Open-Source Stack
          </h1>
          <p className="text-sm text-dim mt-1 max-w-2xl">
            Choose your replacements for commercial SaaS. Compute total annual savings, generate a unified Docker Compose config, and share your stack with your team.
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
            className="btn-tactile px-4 py-2 rounded-lg bg-ink text-white dark:bg-white dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            {copiedLink ? <Check size={14} className="text-trust" /> : <Share2 size={14} />}
            <span>{copiedLink ? "Link Copied!" : "Share Stack"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Selected Stack List & Docker Compose */}
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
              Your custom stack is empty! Select tools from the catalog browser to start building.
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

          {/* Unified Docker Compose Snippet */}
          {selectedItems.length > 0 && (
            <div className="card-elevated p-6 bg-surface border border-line rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-ink">
                  <FileCode size={16} className="text-ember" />
                  <span>Unified Docker Compose Stack</span>
                </div>
                <button
                  type="button"
                  onClick={copyComposeYaml}
                  className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs font-medium inline-flex items-center gap-1.5"
                >
                  {copiedCompose ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                  <span>{copiedCompose ? "Copied" : "Copy YAML"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-elevated border border-line text-xs font-mono text-dim overflow-x-auto">
                {generateCompose()}
              </pre>
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
                    {isSelected ? "✓" : "+"}
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
