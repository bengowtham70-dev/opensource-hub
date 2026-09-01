import Byte from "./Byte";

export function CardSkeleton() {
  return (
    <div className="card-elevated p-5 flex flex-col gap-4" aria-hidden="true">
      <div className="flex justify-between gap-3">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton size-9 rounded-full" />
      </div>
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="flex items-center gap-3">
        <div className="skeleton h-[30px] w-[120px]" />
        <div className="skeleton h-8 w-24" />
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-8 w-full" />
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Empty states must never be dead ends (PRD section 10, AGENTS.md §3).
export function EmptyState({ title, body, action }) {
  return (
    <div className="card-elevated hero-wash-bg p-10 flex flex-col items-center text-center gap-4 animate-card-in">
      <Byte size={72} />
      <h3 className="font-display text-display-md text-ink">{title}</h3>
      <p className="text-sm text-dim max-w-[42ch] leading-relaxed">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card-elevated p-10 flex flex-col items-center text-center gap-4 border-caution/30" role="alert">
      <span className="tnum text-caution text-sm">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shimmer-button btn-tactile px-4 py-2 text-sm text-ink">
          Try again
        </button>
      )}
    </div>
  );
}
