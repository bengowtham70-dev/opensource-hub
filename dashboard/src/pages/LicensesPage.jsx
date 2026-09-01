import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Scale, Search, ArrowRight, ShieldCheck, AlertCircle, HelpCircle } from "lucide-react";
import seed from "../../../src/data/alternatives.json";

const LICENSE_GROUPS = [
  {
    id: "permissive",
    title: "Permissive Open Source",
    badgeTone: "border-trust/30 bg-trust/10 text-trust",
    description: "Maximum freedom with minimal restrictions. Commercial use, modification, and private distribution allowed with simple attribution.",
    matcher: (lic) => ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Unlicense"].includes(lic.spdx) || lic.type === "permissive",
  },
  {
    id: "copyleft",
    title: "Strong Copyleft (Viral Protection)",
    badgeTone: "border-accent/30 bg-accent/10 text-accent",
    description: "Ensures improvements remain open source. Network services (AGPL) or distributed binaries (GPL) must make full source code available.",
    matcher: (lic) => ["AGPL-3.0", "GPL-3.0", "GPL-2.0", "LGPL-3.0"].includes(lic.spdx) || lic.type === "copyleft" || lic.type === "copyleft-network",
  },
  {
    id: "weak-copyleft",
    title: "Weak Copyleft (File-Level)",
    badgeTone: "border-tech/30 bg-tech/10 text-tech",
    description: "Modifications to original files must be open, but larger proprietary works can link against or incorporate without opening whole project.",
    matcher: (lic) => ["MPL-2.0", "EPL-2.0", "LGPL-2.1"].includes(lic.spdx) || lic.type === "copyleft-file",
  },
  {
    id: "source-available",
    title: "Source-Available / Fair Code",
    badgeTone: "border-caution/30 bg-caution/10 text-caution",
    description: "Source code is publicly viewable and self-hostable internally, but commercial redistribution or competing hosted services are restricted.",
    matcher: (lic) => ["BSL-1.1", "SSPL-1.0", "Elastic-2.0"].includes(lic.spdx) || lic.type === "source-available",
  },
];

export default function LicensesPage() {
  const [query, setQuery] = useState("");

  const licenseData = useMemo(() => {
    const map = new Map();
    for (const p of seed.pairings) {
      const lic = p.alternative?.license;
      if (!lic?.spdx) continue;
      const spdx = lic.spdx;
      if (!map.has(spdx)) {
        map.set(spdx, {
          spdx,
          name: lic.name || spdx,
          type: lic.type || "permissive",
          osiApproved: lic.osiApproved ?? !["BSL-1.1", "SSPL-1.0", "Elastic-2.0"].includes(spdx),
          tools: [],
        });
      }
      map.get(spdx).tools.push({
        name: p.alternative.name,
        repo: p.alternative.repo,
        paidTool: p.paidTool.name,
      });
    }
    return [...map.values()].sort((a, b) => b.tools.length - a.tools.length || a.spdx.localeCompare(b.spdx));
  }, []);

  const filteredLicenses = useMemo(() => {
    if (!query) return licenseData;
    const q = query.toLowerCase();
    return licenseData.filter(
      (l) => l.spdx.toLowerCase().includes(q) || l.name.toLowerCase().includes(q) || l.tools.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [licenseData, query]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-10 space-y-10">
      {/* Header */}
      <header className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
          <Scale size={13} className="text-accent" />
          <span>License Compliance & Safety</span>
        </div>
        <h1 className="font-display text-display-lg text-ink">
          Open Source Licenses Directory
        </h1>
        <p className="text-sm md:text-base text-dim leading-relaxed">
          Verify commercial use rights, copyleft obligations, and legal compliance before adopting software for your team or enterprise.
        </p>

        {/* Search */}
        <div className="relative max-w-md pt-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search licenses (AGPL-3.0, MIT, Apache-2.0, MPL...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs"
          />
        </div>
      </header>

      {/* License Categories */}
      <div className="space-y-10">
        {LICENSE_GROUPS.map((grp) => {
          const matching = filteredLicenses.filter((l) => grp.matcher(l));
          if (matching.length === 0) return null;

          return (
            <section key={grp.id} className="space-y-4">
              <div className="border-b border-line pb-3 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-ink">
                    {grp.title}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold tnum ${grp.badgeTone}`}>
                    {matching.reduce((sum, l) => sum + l.tools.length, 0)} tools
                  </span>
                </div>
                <p className="text-xs text-dim leading-relaxed">
                  {grp.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matching.map((lic) => (
                  <div key={lic.spdx} className="card-elevated p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/?license=${encodeURIComponent(lic.spdx)}`}
                          className="font-display text-lg font-bold text-ink hover:text-link transition-colors"
                        >
                          {lic.spdx}
                        </Link>
                        {lic.osiApproved && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-trust bg-trust/10 border border-trust/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={11} /> OSI Approved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dim line-clamp-1">
                        {lic.name}
                      </p>
                      <div className="pt-2 border-t border-line/60 space-y-1">
                        <span className="text-[11px] text-faint block">Tools using this license:</span>
                        <p className="text-xs text-ink font-medium">
                          {lic.tools.slice(0, 3).map((t) => t.name).join(", ")}
                          {lic.tools.length > 3 ? ` +${lic.tools.length - 3} more` : ""}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/?license=${encodeURIComponent(lic.spdx)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-link pt-2 border-t border-line/60"
                    >
                      <span>Browse all {lic.tools.length} {lic.spdx} tools</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
