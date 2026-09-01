import { Users, Timer } from "lucide-react";

// PRD §3a — team-size fit guidance + trial-sprint suggestion (F3).
// Honest, generic guidance; self-host listings get the stronger infrastructure caveat.
const ROWS = [
  { size: "Under 10 people", verdict: "Any option works", tone: "text-trust", note: "Pick on features and polish — hosting is optional at this scale." },
  { size: "10–50 people", verdict: "Check access controls", tone: "text-dim", note: "SSO, roles and permissions become the deciding features, not the price." },
  { size: "50+ people", verdict: "Self-hosting decides", tone: "text-caution", note: "Infrastructure, backups and an admin owner matter more than the license." },
];

export default function TeamFit({ selfHosted = false }) {
  return (
    <section className="mt-6 card-elevated p-6" aria-label="Team fit guidance">
      <h2 className="font-display text-display-md mb-1 flex items-center gap-2.5">
        <Users size={20} className="text-dim" /> Will it fit your team?
      </h2>
      <p className="text-[12.5px] text-faint mb-4">
        Generic guidance, not a procurement checklist{selfHosted ? " — this tool is self-hosted, so infrastructure is yours to run." : "."}
      </p>

      <div className="space-y-2.5">
        {ROWS.map((r) => (
          <div key={r.size} className="grid sm:grid-cols-[160px_190px_1fr] gap-x-4 gap-y-1 items-baseline p-3 rounded-xl border border-line bg-primary/5">
            <span className="tnum text-[13px] text-ink">{r.size}</span>
            <span className={`text-[13px] font-semibold ${r.tone}`}>{r.verdict}</span>
            <span className="text-[12.5px] text-dim leading-relaxed">{r.note}</span>
          </div>
        ))}
      </div>

      {selfHosted && (
        <p className="mt-3 text-[12.5px] text-caution/90 flex items-start gap-2">
          
          Self-hosting adds real work: updates, backups, uptime. Factor that into the switch — see the
          cost calculator below before committing.
        </p>
      )}

      {/* PRD §3a trial-sprint suggestion — cheap, reduces regret, builds trust. */}
      <div className="mt-4 flex items-start gap-3 p-4 rounded-xl border border-trust/20 bg-trust/5">
        <Timer size={16} className="text-trust shrink-0 mt-0.5" />
        <p className="text-[13px] text-dim leading-relaxed">
          <span className="text-trust font-semibold">Trial sprint: </span>
          run this tool on one real project for two weeks before migrating anything. Cheap to try,
          and you'll know within a fortnight whether the parity gaps above actually bite you.
        </p>
      </div>
    </section>
  );
}
