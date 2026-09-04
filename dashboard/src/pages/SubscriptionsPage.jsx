import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Copy,
  Check,
  Server,
  TrendingDown,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { getPairings } from "../lib/seed";
import { formatSavings } from "../lib/format";
import {
  parseSubscriptionsText,
  getParityPercent,
  SAMPLE_PRESET_STACKS,
} from "../lib/subscriptions";
import BrandLogo from "../components/BrandLogo";

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [pairings, setPairings] = useState([]);
  const [loadingPairings, setLoadingPairings] = useState(true);
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // Load pairings catalog
  useEffect(() => {
    getPairings()
      .then((data) => {
        setPairings(data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingPairings(false));

    // Restore from localStorage if present
    try {
      const saved = localStorage.getItem("osh_subscriptions_audit");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.text) setInputText(parsed.text);
      } else {
        // Default to Startup preset for instant delight
        setInputText(SAMPLE_PRESET_STACKS[0].text);
      }
    } catch {
      setInputText(SAMPLE_PRESET_STACKS[0].text);
    }
  }, []);

  // Compute live match
  const results = useMemo(() => {
    return parseSubscriptionsText(inputText, pairings);
  }, [inputText, pairings]);

  const handleSaveLocally = () => {
    try {
      localStorage.setItem(
        "osh_subscriptions_audit",
        JSON.stringify({
          text: inputText,
          savedAt: new Date().toISOString(),
          netSavings: results.netAnnualSavings,
          matchedCount: results.matched.length,
        })
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {}
  };

  const handleSendToCompose = () => {
    if (results.composeCandidateRepos.length > 0) {
      navigate(`/stacks?repos=${encodeURIComponent(results.composeCandidateRepos.join(","))}`);
    }
  };

  const handleCopySummary = async () => {
    const lines = [
      `OpenSource Hub Subscriptions Audit Summary`,
      `===========================================`,
      `Total Annual SaaS Spend Avoided: $${results.grossAnnualSavings.toLocaleString()}/yr`,
      `Estimated Self-Hosting Infrastructure: -$${results.estimatedSelfHostCost}/yr`,
      `Net Projected Annual ROI: $${results.netAnnualSavings.toLocaleString()}/yr`,
      `Average Feature Parity: ${results.averageParity}%`,
      ``,
      `Matched Open-Source Alternatives:`,
      ...results.matched.map(
        (m) =>
          `- ${m.pairing.paidTool?.name} ($${m.annualSavings}/yr) -> ${m.pairing.alternative?.name} (${m.pairing.alternative?.repo})`
      ),
      ``,
      `Audited with OpenSource Hub (https://opensource-hub.com)`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 md:py-12 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-line bg-surface text-dim text-xs font-semibold mb-2 shadow-2xs">
            <Wallet size={13} className="text-ember" />
            <span>PRD §37 &amp; §39.1 Personal Savings Studio</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-normal text-ink tracking-tight">
            Subscriptions &amp; Stack Matcher
          </h1>
          <p className="text-sm text-dim mt-1.5 max-w-2xl leading-relaxed">
            Paste your monthly SaaS bills, invoices, or team subscriptions. We match them against verified open-source alternatives, calculate your net annual ROI, and prepare your self-hosted migration stack.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveLocally}
            className="btn-tactile px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-elevated text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {savedSuccess ? <Check size={14} className="text-trust" /> : <Wallet size={14} className="text-ember" />}
            <span>{savedSuccess ? "Saved to Machine" : "Save Audit Locally"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="btn-tactile px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-elevated text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {copied ? <Check size={14} className="text-trust" /> : <Copy size={14} />}
            <span>{copied ? "Copied Summary" : "Copy Summary"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-tactile px-3.5 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
          >
            <Printer size={14} />
            <span>Print Executive Brief</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input & Presets */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card-elevated p-5 md:p-6 rounded-2xl bg-surface border border-line space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-ink uppercase tracking-wider">Paste Subscriptions or Tools</span>
              <button
                type="button"
                onClick={() => setInputText("")}
                className="text-[11px] text-faint hover:text-dim inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={11} /> Clear
              </button>
            </div>

            {/* Presets Strip */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-faint block">Try a sample preset stack:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PRESET_STACKS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setInputText(preset.text)}
                    className={`btn-tactile px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      inputText.trim() === preset.text.trim()
                        ? "bg-ink text-surface border-ink dark:bg-surface dark:text-ink"
                        : "bg-elevated border-line text-dim hover:text-ink hover:border-line-heavy"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={9}
                placeholder="Type or paste tools, invoices, or prices (one per line):&#10;Slack ($12/mo)&#10;Notion ($10/mo)&#10;Figma $15/mo&#10;Postman&#10;Datadog $65/mo"
                className="w-full p-3.5 rounded-xl border border-line bg-elevated text-xs font-mono text-ink placeholder:text-faint outline-none focus:border-ember leading-relaxed resize-y"
              />
              <span className="absolute right-3 bottom-3 text-[10.5px] text-faint bg-surface/80 px-1.5 py-0.5 rounded border border-line">
                {inputText.split("\n").filter((l) => l.trim()).length} lines
              </span>
            </div>

            <div className="text-[11px] text-faint leading-relaxed space-y-1 bg-elevated/60 p-3 rounded-xl border border-line/60">
              <p className="font-semibold text-dim">Supported formatting patterns:</p>
              <p>• Plain names: <code className="text-ink">Notion, Slack, Figma</code></p>
              <p>• Monthly rates: <code className="text-ink">Datadog ($65/mo)</code> or <code className="text-ink">Figma $15/month</code></p>
              <p>• Annual figures: <code className="text-ink">Postman $240/yr</code></p>
              <p className="text-[10px] text-trust pt-1">✓ Processed locally in your browser — zero tracking.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Savings Metrics & Matched Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Gross Savings */}
            <div className="card-elevated p-4 rounded-xl bg-surface border border-line shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-faint uppercase tracking-wider">Gross Spend Avoided</span>
              <div className="font-display text-2xl font-bold text-ink tnum">
                ${results.grossAnnualSavings.toLocaleString()}
                <span className="text-xs font-normal text-dim">/yr</span>
              </div>
              <span className="text-[11px] text-trust block">From {results.matched.length} matched tools</span>
            </div>

            {/* Metric 2: Estimated Self-Hosting */}
            <div className="card-elevated p-4 rounded-xl bg-surface border border-line shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-faint uppercase tracking-wider">Server Infrastructure</span>
              <div className="font-display text-2xl font-bold text-amber-700 dark:text-amber-300 tnum">
                -${results.estimatedSelfHostCost}
                <span className="text-xs font-normal text-dim">/yr</span>
              </div>
              <span className="text-[11px] text-faint block">Honest ~$5/mo VPS cluster baseline</span>
            </div>

            {/* Metric 3: Net Annual ROI */}
            <div className="card-elevated p-4 rounded-xl bg-surface border border-line shadow-2xs space-y-1 bg-gradient-to-br from-trust/5 to-transparent border-trust/30">
              <span className="text-[11px] font-semibold text-trust uppercase tracking-wider">Net Annual ROI</span>
              <div className="font-display text-2xl font-bold text-trust tnum">
                ${results.netAnnualSavings.toLocaleString()}
                <span className="text-xs font-normal text-dim">/yr</span>
              </div>
              <span className="text-[11px] text-faint block">{results.averageParity}% avg feature parity</span>
            </div>
          </div>

          {/* Compose Stack CTA Bar */}
          {results.composeCandidateRepos.length > 0 && (
            <div className="card-elevated p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-ember/5 to-transparent border-ember/20">
              <div className="flex items-center gap-2.5">
                <Layers size={18} className="text-ember shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-ink">
                    Ready to spin up your replacement stack?
                  </h4>
                  <p className="text-[11px] text-dim">
                    Send these {results.matched.length} tools to our Docker Compose builder with zero port conflicts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendToCompose}
                className="btn-tactile px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer hover:opacity-90 self-start sm:self-auto"
              >
                <span>Launch in Compose Builder</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Matched Alternatives List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                <span>Matched Replacements</span>
                <span className="text-xs font-normal text-dim">({results.matched.length})</span>
              </h3>
              <span className="text-[11px] text-faint">Ranked by estimated savings</span>
            </div>

            {results.matched.length === 0 && (
              <div className="card-elevated p-8 rounded-2xl bg-surface border border-dashed border-line text-center space-y-2">
                <p className="text-sm text-dim">No tools matched yet.</p>
                <p className="text-xs text-faint">
                  Type software names like <code className="text-ink">Notion, Slack, Postman, Airtable</code> on the left.
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              {results.matched.map(({ inputLine, pairing, annualSavings, enteredPrice }) => (
                <div
                  key={pairing.alternative.repo}
                  className="card-elevated p-4 rounded-xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-line-heavy shadow-2xs"
                >
                  {/* Pair Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <BrandLogo
                      name={pairing.alternative.name}
                      category={pairing.paidTool.category}
                      className="size-9 rounded-xl border border-line shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs line-through text-faint">
                          {pairing.paidTool.name}
                        </span>
                        <ArrowRight size={12} className="text-faint shrink-0" />
                        <Link
                          to={`/repo/${pairing.alternative.repo}`}
                          className="font-bold text-sm text-ink hover:text-ember transition-colors truncate"
                        >
                          {pairing.alternative.name}
                        </Link>
                        {pairing.alternative.selfHosted && (
                          <span className="px-1.5 py-0.2 rounded-md bg-elevated border border-line text-[10px] text-dim font-medium">
                            Self-Hostable
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-faint truncate mt-0.5">
                        {pairing.alternative.description || `High-parity replacement for ${pairing.paidTool.name}`}
                      </p>
                    </div>
                  </div>

                  {/* Savings & Parity Badges */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-line/60 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-trust tnum block">
                        Save ${annualSavings.toLocaleString()}/yr
                      </span>
                      <span className="text-[10.5px] text-faint block">
                        {enteredPrice
                          ? `custom ($${enteredPrice.amount}/${enteredPrice.period})`
                          : `catalog default ($${pairing.paidTool?.pricePerMonth || 10}/mo)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-1 rounded-lg bg-trust/10 text-trust text-xs font-bold border border-trust/20 tnum">
                        {getParityPercent(pairing)}% Parity
                      </span>
                      <Link
                        to={`/repo/${pairing.alternative.repo}`}
                        className="btn-tactile p-1.5 rounded-lg border border-line bg-elevated hover:text-ink text-dim text-xs"
                        title="View Full Repo & Trust Score"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unmatched Items Section */}
          {results.unmatched.length > 0 && (
            <div className="card-elevated p-4 rounded-xl bg-surface border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-500 shrink-0" />
                  <span className="font-semibold text-xs text-ink">
                    Unmatched Items ({results.unmatched.length})
                  </span>
                </div>
                <span className="text-[11px] text-faint">Not in catalog yet</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {results.unmatched.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-elevated text-xs text-dim"
                  >
                    <span>{item}</span>
                    <Link
                      to={`/requests?q=${encodeURIComponent(item)}`}
                      className="text-ember hover:underline text-[11px] font-semibold"
                      title="Request alternative in community queue"
                    >
                      Request
                    </Link>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
