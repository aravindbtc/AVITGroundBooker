/**
 * Simple in-memory rate limiter for development/staging.
 * For production, use Redis-based rate limiting (e.g., Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(identifier);

  // No entry or window expired - allow and create new entry
  if (!entry || now > entry.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return true;
  }

  // Within window - check if under limit
  if (entry.count < maxRequests) {
    entry.count++;
    return true;
  }

  // Over limit
  return false;
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
  identifier: string,
  maxRequests: number = 10
): number {
  const entry = requestCounts.get(identifier);
  if (!entry) return maxRequests;
  return Math.max(0, maxRequests - entry.count);
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  requestCounts.delete(identifier);
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupExpiredLimits(): void {
  const now = Date.now();
  const entriesToDelete: string[] = [];

  for (const [identifier, entry] of requestCounts) {
    if (now > entry.resetTime) {
      entriesToDelete.push(identifier);
    }
  }

  entriesToDelete.forEach((id) => requestCounts.delete(id));
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredLimits, 5 * 60 * 1000);
