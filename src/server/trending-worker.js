// Automated 10-Minute Trending Synchronization Worker
// Refreshes GitHub trending repositories, star metrics, and releases every 10 minutes.

const DEFAULT_SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

let syncTimer = null;
let lastSyncTime = null;
let cachedTrendingData = null;

export function startTrendingWorker({ gh, intervalMs = DEFAULT_SYNC_INTERVAL_MS, onSync } = {}) {
  if (syncTimer) return;

  async function syncTrending() {
    try {
      if (!gh) return;
      const res = await gh.getLiveTrending({
        timeframe: "today",
        limit: 30,
      });

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        lastSyncTime = new Date().toISOString();
        cachedTrendingData = {
          syncedAt: lastSyncTime,
          items: res.items,
        };
        if (typeof onSync === "function") {
          onSync(cachedTrendingData);
        }
      }
    } catch (err) {
      console.error("[TrendingWorker] Background 10-minute sync failed:", err.message);
    }
  }

  // Initial sync on startup
  syncTrending();

  // Recurring 10-minute background interval
  syncTimer = setInterval(syncTrending, intervalMs);
  if (syncTimer.unref) syncTimer.unref();

  return {
    getLastSyncTime() {
      return lastSyncTime;
    },
    getCachedTrending() {
      return cachedTrendingData;
    },
    stop() {
      if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
    },
  };
}
