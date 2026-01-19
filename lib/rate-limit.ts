/**
 * Simple in-memory rate limiter
 * For production with multiple instances, use Redis or Upstash
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart - fine for MVP)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;  // Seconds until reset
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    cleanupOldEntries(now);
  }

  // No entry or expired window - create new
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }

  // Within window - check if over limit
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment and allow
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

function cleanupOldEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Pre-configured rate limiters for different endpoints
export const RATE_LIMITS = {
  // AI endpoints - more restrictive
  ai: {
    maxRequests: 30,      // 30 requests
    windowMs: 60 * 1000,  // per minute
  },
  // Compile endpoint - moderate
  compile: {
    maxRequests: 60,      // 60 requests
    windowMs: 60 * 1000,  // per minute
  },
  // Auth endpoints - strict to prevent brute force
  auth: {
    maxRequests: 10,      // 10 requests
    windowMs: 60 * 1000,  // per minute
  },
} as const;

// Helper to get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  // Use first IP if forwarded contains multiple
  const ip = cfIp || realIp || (forwarded?.split(',')[0].trim()) || 'unknown';
  
  return ip;
}

// Rate limit response helper
export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
      retryAfter: result.resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetIn.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
      },
    }
  );
}
