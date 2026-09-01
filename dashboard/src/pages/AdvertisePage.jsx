import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, Send, ShieldCheck, Zap, Mail, ArrowRight } from "lucide-react";
import { getPairings } from "../lib/seed";
import Breadcrumbs from "../components/Breadcrumbs";

const TIERS = [
  {
    name: "Silver",
    price: 147,
    popular: false,
    blurb: "Standard rotation across the directory with click tracking.",
    perks: [
      "Directory-wide banner rotation",
      "Click + impression analytics",
      "1× impression weight",
      "Featured badge on project listing",
    ],
  },
  {
    name: "Gold",
    price: 297,
    popular: true,
    blurb: "Higher visibility rotation plus the homepage sponsor logo.",
    perks: [
      "Everything in Silver",
      "Homepage sponsor logo showcase",
      "2.5× impression weight",
      "Top placement in category searches",
    ],
  },
  {
    name: "Platinum",
    price: 597,
    popular: false,
    blurb: "Maximum visibility with exclusive placements and newsletter feature.",
    perks: [
      "Everything in Gold",
      "Exclusive hero spotlight placement",
      "5× impression weight",
      "Featured spotlight in weekly roundup",
    ],
  },
];

export default function AdvertisePage() {
  const [pairingsCount, setPairingsCount] = useState(0);

  useEffect(() => {
    getPairings().then((p) => setPairingsCount(p.length)).catch(() => {});
  }, []);

  const contactSubject = (tierName) => `OpenSource Hub Sponsorship — ${tierName} Tier`;
  const contactUrl = (tierName) =>
    `mailto:hello@opensource-hub.org?subject=${encodeURIComponent(contactSubject(tierName))}&body=${encodeURIComponent(
      "Hi OpenSource Hub team,\n\nWe'd like to sponsor OpenSource Hub on the " + tierName + " tier.\n\nProject Name:\nWebsite / URL:\nTarget Audience:\n\nThanks!"
    )}`;

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-10">
      <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Advertise" }]} />

      <header className="mt-4 mb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
          <Sparkles size={13} className="text-accent" />
          <span>Ethical Developer Sponsorships</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Advertise on OpenSource Hub
        </h1>

        <p className="text-sm md:text-base text-dim leading-relaxed max-w-2xl">
          Reach developers, technical leads, and founders actively choosing their next software stack — the high-intent audience that builds and deploys open-source solutions.
        </p>

        {/* Directory Stats Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-6 text-sm text-dim">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-ink tnum">
              {pairingsCount || 20}+
            </span>
            <span className="text-xs text-faint">Verified Tools</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-ink tnum">100%</span>
            <span className="text-xs text-faint">Open Source</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-accent tnum">$0</span>
            <span className="text-xs text-faint">Free Directory Forever</span>
          </div>
        </div>
      </header>

      {/* Sponsorship Tiers */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink">Sponsorship Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`card-elevated p-6 flex flex-col justify-between gap-4 relative transition-all duration-150 ${
                tier.popular ? "border-ink shadow-md" : "hover:border-line-strong"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-ink text-surface text-[11px] font-bold uppercase tracking-wider">
                  Most popular
                </span>
              )}

              <div className="space-y-3">
                <header>
                  <h3 className="font-display text-xl font-bold text-ink">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display text-3xl font-bold text-ink tnum">
                      ${tier.price}
                    </span>
                    <span className="text-xs text-faint">/month</span>
                  </div>
                  <p className="text-xs text-dim mt-2 leading-relaxed">{tier.blurb}</p>
                </header>

                <ul className="space-y-2 border-t border-line/60 pt-3 text-xs text-dim">
                  {tier.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check size={14} className="text-trust shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={contactUrl(tier.name)}
                className={`btn-tactile w-full py-2.5 rounded-xl text-xs font-semibold text-center inline-flex items-center justify-center gap-1.5 transition-opacity ${
                  tier.popular
                    ? "bg-ink text-surface hover:opacity-90 shadow-sm"
                    : "border border-line bg-surface hover:bg-elevated hover:border-line-strong text-ink"
                }`}
              >
                <Mail size={13} />
                <span>Get started with {tier.name}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Ethics & Guarantee Statement */}
      <footer className="mt-10 p-6 rounded-2xl border border-line bg-surface space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold text-sm">
          <ShieldCheck size={18} className="text-trust" />
          <span>Our Advertising Ethics Policy</span>
        </div>
        <p className="text-xs text-dim leading-relaxed">
          OpenSource Hub maintains strict editorial independence. Sponsored placements are always clearly labeled with a visible <strong>"Sponsored"</strong> tag. Paid sponsorships never influence Trust Scores, maintenance ratings, algorithm rankings, or reviews.
        </p>
      </footer>
    </div>
  );
}
