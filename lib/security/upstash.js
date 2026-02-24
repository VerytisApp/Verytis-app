import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// 1. Initialize Upstash Redis Client
// These must be defined in your .env.local
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 2. Create the Rate Limiter instance
// Using Sliding Window for smoother rate limiting across serverless instances.
export const globalRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(100, '60 s'), // Default: 100 requests per minute
    analytics: true,
    prefix: 'verytis_ratelimit',
});

/**
 * Helper to get a specialized rate limiter for specific routes
 * @param {number} requests 
 * @param {string} window (e.g., '10 s', '1 m', '1 h')
 */
export function createCustomLimiter(requests, window) {
    return new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
        prefix: 'verytis_custom_ratelimit',
    });
}
