import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useWatchlist } from "../stores/watchlist";
import { Link } from "react-router-dom";

// F6 — amber alert banner for watched repos whose trust score dropped.
export default function AlertsBanner() {
  const watchlist = useWatchlist();
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    if (watchlist.count() === 0) return;
    let alive = true;
    watchlist
      .check()
      .then((json) => alive && setAlerts(json.alerts || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!alerts.length) return null;
  const visible = alerts.filter((a) => !dismissed.has(a.repo));
  if (!visible.length) return null;

  const dismiss = (a) => {
    setDismissed((s) => new Set(s).add(a.repo));
    watchlist.markSeen(a.repo, a.to); // reset baseline — alert acknowledged
  };

  return (
    <div className="space-y-2 mb-5" role="alert">
      {visible.map((a) => (
        <div
          key={a.repo}
          className="card-glass p-4 flex items-start gap-3 border-caution/35 bg-caution/5"
        >
          <BellRing size={17} className="text-caution shrink-0 mt-0.5" />
          <p className="text-[13.5px] text-caution/95 leading-relaxed flex-1 min-w-0">
            <Link to={`/repo/${a.repo}`} className="tnum underline decoration-dotted hover:text-caution">
              {a.repo}
            </Link>{" "}
            — {a.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(a)}
            aria-label={`Dismiss alert for ${a.repo}`}
            className="btn-tactile text-faint hover:text-dim shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
