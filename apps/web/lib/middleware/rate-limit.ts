import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

// In-memory cache for rate limiting
// In production, consider using Redis for distributed rate limiting
const tokenCache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 60000, // 1 minute
});

export function rateLimitMiddleware(options: Options = {}) {
  const {
    uniqueTokenPerInterval = 500,
    interval = 60000, // 1 minute
  } = options;

  return {
    check: (request: NextRequest, limit: number, token: string) => {
      const tokenCount = tokenCache.get(token) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, tokenCount);
      }
      tokenCount[0] += 1;

      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage >= limit;

      return {
        limit,
        remaining: isRateLimited ? 0 : limit - currentUsage,
        reset: new Date(Date.now() + interval),
        isRateLimited,
      };
    },
  };
}

// Pre-configured rate limiters for different endpoints
export const googleIntegrationRateLimit = rateLimitMiddleware({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
});

export const googleExportRateLimit = rateLimitMiddleware({
  uniqueTokenPerInterval: 100,
  interval: 60000, // 1 minute  
});

// Helper to apply rate limiting in API routes
export async function applyRateLimit(
  request: NextRequest,
  identifier: string,
  limit: number = 10,
  rateLimiter = googleIntegrationRateLimit
): Promise<NextResponse | null> {
  const result = rateLimiter.check(request, limit, identifier);

  if (result.isRateLimited) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset.getTime(),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.getTime().toString(),
        },
      }
    );
  }

  return null;
} 