import { useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";

export default function FilterDrawer({
  pairings = [],
  selectedAlternative = "",
  selectedCategory = "",
  selectedLanguage = "",
  selectedLicense = "",
  onSelectAlternative,
  onSelectCategory,
  onSelectLanguage,
  onSelectLicense,
  onClearAll,
}) {
  const [altSearch, setAltSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [stackSearch, setStackSearch] = useState("");
  const [licSearch, setLicSearch] = useState("");

  // Sets for multi-selection checking
  const altSet = useMemo(
    () => new Set(selectedAlternative.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)),
    [selectedAlternative]
  );
  const catSet = useMemo(
    () => new Set(selectedCategory.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)),
    [selectedCategory]
  );
  const stackSet = useMemo(
    () => new Set(selectedLanguage.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)),
    [selectedLanguage]
  );
  const licSet = useMemo(
    () => new Set(selectedLicense.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)),
    [selectedLicense]
  );

  const toggleFilter = (currentValue, itemSlug, onSelect) => {
    const list = currentValue.split(",").map((s) => s.trim()).filter(Boolean);
    const index = list.findIndex((s) => s.toLowerCase() === itemSlug.toLowerCase());
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(itemSlug);
    }
    onSelect(list.join(","));
  };

  // 1. Alternatives with counts
  const alternativesList = useMemo(() => {
    const counts = new Map();
    for (const p of pairings) {
      const name = p.paidTool?.name;
      const slug = p.paidTool?.slug;
      if (name && slug) {
        if (!counts.has(slug)) counts.set(slug, { name, slug, count: 0 });
        counts.get(slug).count += 1;
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pairings]);

  // 2. Categories with counts
  const categoriesList = useMemo(() => {
    const counts = new Map();
    for (const p of pairings) {
      const cat = p.paidTool?.category;
      if (cat) counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pairings]);

  // 3. Tech Stack / Languages with counts
  const stackList = useMemo(() => {
    const counts = new Map();
    for (const p of pairings) {
      const lang = p.alternative?.language;
      if (lang) counts.set(lang, (counts.get(lang) || 0) + 1);
      for (const tag of p.alternative?.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pairings]);

  // 4. Licenses with counts
  const licensesList = useMemo(() => {
    const counts = new Map();
    for (const p of pairings) {
      const spdx = p.alternative?.license?.spdx;
      if (spdx) counts.set(spdx, (counts.get(spdx) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pairings]);

  // Search filtered lists
  const filteredAlts = alternativesList.filter((a) =>
    a.name.toLowerCase().includes(altSearch.toLowerCase())
  );
  const filteredCats = categoriesList.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredStack = stackList.filter((s) =>
    s.name.toLowerCase().includes(stackSearch.toLowerCase())
  );
  const filteredLics = licensesList.filter((l) =>
    l.name.toLowerCase().includes(licSearch.toLowerCase())
  );

  const totalSelectedCount = altSet.size + catSet.size + stackSet.size + licSet.size;

  return (
    <div className="p-4 rounded-2xl border border-line bg-surface shadow-float space-y-3 animate-card-in">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
            Filter Tools by Facet (Multi-Select)
          </span>
          {totalSelectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold tnum">
              {totalSelectedCount} selected
            </span>
          )}
        </div>
        {totalSelectedCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-caution hover:text-accent font-medium inline-flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Column 1: Alternative */}
        <div className="p-2.5 rounded-xl border border-line bg-elevated/40 space-y-2 flex flex-col h-60">
          <span className="font-semibold text-ink text-[11.5px]">Alternative ({alternativesList.length})</span>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              placeholder="Search alternative..."
              value={altSearch}
              onChange={(e) => setAltSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded-lg border border-line bg-surface text-ink placeholder:text-faint text-xs outline-none focus:border-line-strong"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {filteredAlts.map((a) => {
              const isChecked = altSet.has(a.slug.toLowerCase());
              return (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => toggleFilter(selectedAlternative, a.slug, onSelectAlternative)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isChecked
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-dim hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-3.5 rounded border grid place-items-center shrink-0 transition-colors ${
                        isChecked ? "bg-accent border-accent text-white" : "border-line-strong bg-surface"
                      }`}
                    >
                      {isChecked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{a.name}</span>
                  </div>
                  <span className="tnum text-[11px] text-faint ml-2 shrink-0">{a.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Category */}
        <div className="p-2.5 rounded-xl border border-line bg-elevated/40 space-y-2 flex flex-col h-60">
          <span className="font-semibold text-ink text-[11.5px]">Category ({categoriesList.length})</span>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              placeholder="Search category..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded-lg border border-line bg-surface text-ink placeholder:text-faint text-xs outline-none focus:border-line-strong"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {filteredCats.map((c) => {
              const isChecked = catSet.has(c.name.toLowerCase());
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleFilter(selectedCategory, c.name, onSelectCategory)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isChecked
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-dim hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-3.5 rounded border grid place-items-center shrink-0 transition-colors ${
                        isChecked ? "bg-accent border-accent text-white" : "border-line-strong bg-surface"
                      }`}
                    >
                      {isChecked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{c.name}</span>
                  </div>
                  <span className="tnum text-[11px] text-faint ml-2 shrink-0">{c.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 3: Tech Stack / Language */}
        <div className="p-2.5 rounded-xl border border-line bg-elevated/40 space-y-2 flex flex-col h-60">
          <span className="font-semibold text-ink text-[11.5px]">Stack & Language ({stackList.length})</span>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              placeholder="Search stack..."
              value={stackSearch}
              onChange={(e) => setStackSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded-lg border border-line bg-surface text-ink placeholder:text-faint text-xs outline-none focus:border-line-strong"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {filteredStack.map((s) => {
              const isChecked = stackSet.has(s.name.toLowerCase());
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => toggleFilter(selectedLanguage, s.name, onSelectLanguage)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isChecked
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-dim hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-3.5 rounded border grid place-items-center shrink-0 transition-colors ${
                        isChecked ? "bg-accent border-accent text-white" : "border-line-strong bg-surface"
                      }`}
                    >
                      {isChecked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{s.name}</span>
                  </div>
                  <span className="tnum text-[11px] text-faint ml-2 shrink-0">{s.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 4: License */}
        <div className="p-2.5 rounded-xl border border-line bg-elevated/40 space-y-2 flex flex-col h-60">
          <span className="font-semibold text-ink text-[11.5px]">License ({licensesList.length})</span>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              placeholder="Search license..."
              value={licSearch}
              onChange={(e) => setLicSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded-lg border border-line bg-surface text-ink placeholder:text-faint text-xs outline-none focus:border-line-strong"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {filteredLics.map((l) => {
              const isChecked = licSet.has(l.name.toLowerCase());
              return (
                <button
                  key={l.name}
                  type="button"
                  onClick={() => toggleFilter(selectedLicense, l.name, onSelectLicense)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                    isChecked
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-dim hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-3.5 rounded border grid place-items-center shrink-0 transition-colors ${
                        isChecked ? "bg-accent border-accent text-white" : "border-line-strong bg-surface"
                      }`}
                    >
                      {isChecked && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate">{l.name}</span>
                  </div>
                  <span className="tnum text-[11px] text-faint ml-2 shrink-0">{l.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
