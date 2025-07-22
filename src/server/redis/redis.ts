import { env } from "~/env";
import Redis from "ioredis";

export const redis = new Redis(env.REDIS_URL);

const DEFAULT_CACHE_EXPIRY_SECONDS = 60 * 60 * 6; // 6 hours
const CACHE_KEY_SEPARATOR = ":";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const cacheWithRedis = <TFunc extends (...args: any[]) => Promise<any>>(
  keyPrefix: string,
  fn: TFunc,
  options?: {
    // Dynamic cache duration based on content type
    getDuration?: (...args: Parameters<TFunc>) => number;
    // Function to determine if cache should be skipped
    shouldSkipCache?: (...args: Parameters<TFunc>) => boolean;
  }
): TFunc => {
  return (async (...args: Parameters<TFunc>) => {
    const skipCache = options?.shouldSkipCache?.(...args);
    const key = `${keyPrefix}${CACHE_KEY_SEPARATOR}${JSON.stringify(args)}`;
    
    if (!skipCache) {
      const cachedResult = await redis.get(key);
      if (cachedResult) {
        console.log(`Cache hit for ${key}`);
        return JSON.parse(cachedResult);
      }
    } else {
      console.log(`Cache skipped for ${key} (forceRefresh=true)`);
    }

    const result = await fn(...args);
    const duration = options?.getDuration ? options.getDuration(...args) : DEFAULT_CACHE_EXPIRY_SECONDS;
    await redis.set(key, JSON.stringify(result), "EX", duration);
    console.log(`Cache set for ${key} with ${duration}s duration`);
    return result;
  }) as TFunc;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
