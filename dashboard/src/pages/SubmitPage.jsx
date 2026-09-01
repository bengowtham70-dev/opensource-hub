import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle2, ShieldCheck, Sparkles, Copy, Check, ExternalLink, ArrowRight } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";

const FEEDBACK_REPO = "opensource-hub/opensource-hub";

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    name: "",
    repo: "",
    replaces: "",
    category: "Developer Tools",
    license: "MIT",
    website: "",
    description: "",
  });
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const issueTitle = `[Submission] ${formData.name || "New Tool"} → ${formData.replaces || "Paid Tool"} alternative`;
  const issueBody = `## Open Source Tool Submission

- **Tool Name:** ${formData.name || "N/A"}
- **GitHub Repository:** ${formData.repo || "N/A"}
- **Replaces (Proprietary / SaaS Tool):** ${formData.replaces || "N/A"}
- **Category:** ${formData.category || "N/A"}
- **License:** ${formData.license || "N/A"}
- **Website / Demo:** ${formData.website || "N/A"}

### Why it's a great alternative:
${formData.description || "N/A"}

_Submitted via the OpenSource Hub web app._`;

  const githubSubmitUrl = `https://github.com/${FEEDBACK_REPO}/issues/new?title=${encodeURIComponent(
    issueTitle
  )}&body=${encodeURIComponent(issueBody)}`;

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(issueBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    window.open(githubSubmitUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 md:px-6 py-10">
      <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Submit Tool" }]} />

      <header className="mt-4 mb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
          <Send size={13} className="text-accent" />
          <span>Community Submissions</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Submit an Open Source <br className="hidden sm:inline" />
          <span className="text-accent">Tool or Alternative</span>
        </h1>

        <p className="text-sm md:text-base text-dim leading-relaxed max-w-2xl">
          Help build the most comprehensive catalog of verified, trustworthy open-source software. Submissions are reviewed transparently on GitHub and permanently free.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Submission Form (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
              <Sparkles size={18} className="text-accent" /> Tool Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appflowy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                  GitHub Repository *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AppFlowy-IO/AppFlowy"
                  value={formData.repo}
                  onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                  Replaces (Paid Tool) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Notion, Airtable"
                  value={formData.replaces}
                  onChange={(e) => setFormData({ ...formData, replaces: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink outline-none focus:border-line-strong shadow-2xs transition-colors"
                >
                  <option value="Developer Tools">Developer Tools</option>
                  <option value="Productivity & Notes">Productivity & Notes</option>
                  <option value="Design & Creative">Design & Creative</option>
                  <option value="Communication & Chat">Communication & Chat</option>
                  <option value="Security & Auth">Security & Auth</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Finance & CRM">Finance & CRM</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                  License
                </label>
                <input
                  type="text"
                  placeholder="e.g. AGPL-3.0, MIT, Apache-2.0"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                  Website / Demo Link
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                Why is this a great alternative?
              </label>
              <textarea
                rows={3}
                placeholder="Describe key features, self-hosting ease, feature parity, or why teams should switch..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs resize-none transition-colors"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line/60">
              <button
                type="button"
                onClick={copyTemplate}
                className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line bg-surface hover:border-line-strong text-xs font-medium text-dim hover:text-ink transition-colors"
              >
                {copied ? <Check size={14} className="text-trust" /> : <Copy size={14} />}
                <span>{copied ? "Copied to clipboard!" : "Copy markdown issue"}</span>
              </button>

              <button
                type="submit"
                className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-surface hover:opacity-90 text-xs font-semibold shadow-sm transition-opacity"
              >
                <Send size={14} />
                <span>Submit on GitHub</span>
                <ExternalLink size={12} className="opacity-70" />
              </button>
            </div>

            {submitted && (
              <div className="p-3 rounded-xl bg-trust/10 border border-trust/30 text-trust text-xs flex items-center gap-2 animate-card-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>A new GitHub issue tab was opened with your pre-filled submission. Hit "Submit new issue" on GitHub to finalize!</span>
              </div>
            )}
          </form>
        </div>

        {/* Right: Requirements & Inclusion Criteria (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-elevated p-6 space-y-3.5">
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <ShieldCheck size={18} className="text-trust" /> Listing Criteria
            </h2>
            <p className="text-xs text-dim leading-relaxed">
              We uphold strict standards to ensure only legitimate, safe, and active software is listed.
            </p>

            <ul className="space-y-2.5 text-xs text-dim">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-trust shrink-0 mt-0.5" />
                <span><strong>OSI-Approved License:</strong> Must be genuine open source (MIT, Apache, GPL, AGPL, BSD, etc.).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-trust shrink-0 mt-0.5" />
                <span><strong>Public GitHub Repository:</strong> Must have public code repository with reproducible build steps.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-trust shrink-0 mt-0.5" />
                <span><strong>Active Maintenance:</strong> Recent commit history (not archived, abandoned, or dead forks).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-trust shrink-0 mt-0.5" />
                <span><strong>Direct Alternative:</strong> Clear functional overlap with a recognized paid tool.</span>
              </li>
            </ul>
          </div>

          <div className="card-elevated p-6 space-y-3">
            <h3 className="font-display text-base font-bold text-ink">
              Looking for inspiration?
            </h3>
            <p className="text-xs text-dim leading-relaxed">
              Check out existing replacement hubs to see how comparisons, parity gauges, and pricing formulas are formatted.
            </p>
            <Link
              to="/alternatives"
              className="btn-tactile inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              <span>Browse existing alternative hubs</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
