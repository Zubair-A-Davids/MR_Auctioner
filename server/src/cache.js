// Shared cache utilities for invalidating cached data across routes

// Stats cache state
export let statsCache = null;
export let statsCacheTime = 0;

// Function to invalidate stats cache
export function invalidateStatsCache() {
  statsCache = null;
  statsCacheTime = 0;
}

// Function to set stats cache
export function setStatsCache(data) {
  statsCache = data;
  statsCacheTime = Date.now();
}

// Function to get stats cache
export function getStatsCache(maxAge = 5 * 60 * 1000) {
  const now = Date.now();
  if (statsCache && now - statsCacheTime < maxAge) {
    return {
      data: statsCache,
      age: Math.floor((now - statsCacheTime) / 1000),
      hit: true
    };
  }
  return { hit: false };
}
