import { useState } from "react";
import { Mail, Check, Chrome, Download, Sparkles, AlertCircle } from "lucide-react";

export default function NewsletterFooter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { ok: boolean, message: string }

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "global-footer" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Subscription failed");
      }
      setStatus({ ok: true, message: data.message });
      setEmail("");
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-line bg-surface/50 py-10 mt-12">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="card-elevated p-6 sm:p-8 bg-surface border border-line rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Newsletter Pitch */}
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2 text-ember font-semibold text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Weekly Open-Source Intelligence</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-ink">
              Discover high-growth alternatives before they go mainstream
            </h3>
            <p className="text-xs text-dim leading-relaxed">
              Join engineers, CTOs, and creators. Zero spam, free forever. Unsubscribe anytime in one click.
            </p>

            <form onSubmit={handleSubscribe} className="mt-3 flex flex-col sm:flex-row gap-2 max-w-md">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-line bg-elevated text-ink placeholder:text-faint focus:border-ember outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-tactile btn-primary px-4 py-2 text-xs font-semibold shadow-sm shrink-0 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {submitting ? "Joining…" : "Subscribe"}
              </button>
            </form>

            {status && (
              <p
                className={`text-xs mt-2 inline-flex items-center gap-1.5 font-medium ${
                  status.ok ? "text-trust" : "text-caution"
                }`}
              >
                {status.ok ? <Check size={13} /> : <AlertCircle size={13} />}
                <span>{status.message}</span>
              </p>
            )}
          </div>

          {/* Chrome Extension Download Card */}
          <div className="p-5 rounded-xl border border-line bg-elevated max-w-sm w-full space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-ember/10 text-ember grid place-items-center">
                  <Chrome size={18} />
                </div>
                <div>
                  <span className="font-bold text-xs text-ink block">Browser Extension</span>
                  <span className="text-[10.5px] text-faint">100% Free · Developer Mode</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-trust/10 text-trust-strong border border-trust/30">
                Manifest V3
              </span>
            </div>

            <p className="text-[11.5px] text-dim leading-snug">
              Instant alerts whenever you browse paid tools like Notion, Figma, Airtable, Slack, and Datadog.
            </p>

            <a
              href="/api/extension/download"
              download="opensource-hub-extension.zip"
              className="btn-tactile w-full py-2 px-3 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <Download size={13} />
              <span>Download Free Extension (.zip)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
