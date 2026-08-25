import { Link } from "react-router-dom";
import { History, X } from "lucide-react";
import { useHistory } from "../stores/history";

// F12 — recently viewed strip on the trending page (local-only history).
export default function HistoryStrip() {
  const history = useHistory();
  if (history.items.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] uppercase tracking-wider text-faint flex items-center gap-1.5">
          <History size={12} /> Recently viewed
        </p>
        <button
          type="button"
          onClick={() => history.clear()}
          className="btn-tactile text-[11px] text-faint hover:text-dim inline-flex items-center gap-1"
        >
          <X size={11} /> clear
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1">
        {history.items.map((h) => (
          <Link
            key={h.repo}
            to={`/repo/${h.repo}`}
            title={h.repo}
            className="btn-tactile shrink-0 px-3 py-1.5 rounded-full border border-line bg-elevated/50 text-[12.5px] text-dim hover:text-ink hover:border-primary/35"
          >
            {h.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
