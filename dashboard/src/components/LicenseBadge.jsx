import { Scale, ShieldCheck, Share2, Globe2, CircleAlert } from "lucide-react";
import { Link } from "react-router-dom";

// PRD §3/§3a license compliance flags (F2, plans/PLAN_FEATURES.md).
// Derived from schema v2 `license.type` — no guessing, no legal advice framing.
const TYPES = {
  permissive: {
    tone: "border-trust/30 bg-trust/10 text-trust",
    icon: ShieldCheck,
    short: "Commercial use OK",
    detail: "Permissive license — use it in products you sell, keep the copyright notice.",
  },
  copyleft: {
    tone: "border-primary/35 bg-primary/10 text-primary",
    icon: Share2,
    short: "Copyleft",
    detail: "Share-alike: if you distribute modified versions, you must share them under the same license.",
  },
  "network-copyleft": {
    tone: "border-caution/35 bg-caution/10 text-caution",
    icon: Globe2,
    short: "Network copyleft",
    detail: "AGPL-style: running it as a hosted service counts as distribution — plan for it.",
  },
};

export default function LicenseBadge({ license, withDetail = false }) {
  if (!license?.spdx || license.spdx === "NOASSERTION") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-caution/25 bg-caution/5 text-caution text-[11.5px] font-medium"
        title="No SPDX-detected license — verify manually before commercial use."
      >
        <CircleAlert size={12} /> License unclear
      </span>
    );
  }

  const type = TYPES[license.type] || TYPES.copyleft;
  const Icon = type.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-medium ${type.tone}`}
      title={type.detail}
    >
      <Icon size={12} />
      <span className="tnum">{license.spdx}</span>
      <span className="opacity-75">· {type.short}</span>
      {withDetail && (
        <Link
          to="/learn/open-source-licenses-explained"
          className="ml-1 underline decoration-dotted opacity-70 hover:opacity-100"
          title="Read the plain-language license guide"
        >
          what's this?
        </Link>
      )}
      {withDetail && <span className="sr-only">{type.detail}</span>}
    </span>
  );
}

export { TYPES as LICENSE_TYPES };
