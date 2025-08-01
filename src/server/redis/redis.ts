import { env } from "~/env";
import Redis from "ioredis";
import { createHash } from "node:crypto";

export const redis = new Redis(env.REDIS_URL);

const DEFAULT_CACHE_EXPIRY_SECONDS = 60 * 60 * 6; // 6 hours
const CACHE_KEY_SEPARATOR = ":";

/**
 * Utility to create a stable hash from a string
 */
export const createStableHash = (input: string): string => {
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const cacheWithRedis = <TFunc extends (...args: any[]) => Promise<any>>(
  keyPrefix: string,
  fn: TFunc,
  options?: {
    // Dynamic cache duration based on content type
    getDuration?: (...args: Parameters<TFunc>) => number;
    // Function to determine if cache should be skipped
    shouldSkipCache?: (...args: Parameters<TFunc>) => boolean;
    // Custom cache key generator (if not provided, uses JSON.stringify of args)
    generateCacheKey?: (...args: Parameters<TFunc>) => string;
  }
): TFunc => {
  return (async (...args: Parameters<TFunc>) => {
    const skipCache = options?.shouldSkipCache?.(...args);
    
    // Use custom key generator or default to JSON.stringify
    const cacheKeySuffix = options?.generateCacheKey 
      ? options.generateCacheKey(...args)
      : JSON.stringify(args);
    
    const key = `${keyPrefix}${CACHE_KEY_SEPARATOR}${cacheKeySuffix}`;
    
    if (!skipCache) {
      const cachedResult = await redis.get(key);
      if (cachedResult) {
        console.log(`✅ Cache HIT for ${keyPrefix} - key: ${key.substring(0, 80)}...`);
        return JSON.parse(cachedResult);
      }
      console.log(`❌ Cache MISS for ${keyPrefix} - key: ${key.substring(0, 80)}...`);
    } else {
      console.log(`⏭️  Cache SKIPPED for ${keyPrefix} (forceRefresh=true)`);
    }

    const result = await fn(...args);
    const duration = options?.getDuration ? options.getDuration(...args) : DEFAULT_CACHE_EXPIRY_SECONDS;
    await redis.set(key, JSON.stringify(result), "EX", duration);
    console.log(`💾 Cache SET for ${keyPrefix} - ${duration}s duration`);
    return result;
  }) as TFunc;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
