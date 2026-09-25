import KeyvRedis from "@keyv/redis";
import { type Cache, createCache } from "cache-manager";
import { CacheableMemory } from "cacheable";
import { Keyv } from "keyv";
import { z } from "zod";

import { env } from "#app/config/env.js";

const DEFAULT_MEMORY_TTL_MS = 60_000;
const DEFAULT_MEMORY_LRU_SIZE = 5_000;
const DEFAULT_CACHE_TTL_MS = 3_600_000;

const CACHE_PREFIX = "akigumo";
const DELETE_CHUNK_SIZE = 50;

const CacheParamSchema = z.object({
    module: z.string().min(1),
    key: z.string().min(1),
    ttl: z.number().default(DEFAULT_CACHE_TTL_MS),
});

type CacheParam = z.input<typeof CacheParamSchema>;

const InvalidateSchema = z.union([
    CacheParamSchema,
    z.array(CacheParamSchema),
    z.object({
        module: z.string().min(1),
        keys: z.array(z.string().min(1)),
    }),
]);

type InvalidateInput = z.input<typeof InvalidateSchema>;

const memoryStore = new Keyv({
    store: new CacheableMemory({
        ttl: DEFAULT_MEMORY_TTL_MS,
        lruSize: DEFAULT_MEMORY_LRU_SIZE,
    }),
});

const redisStore = new Keyv({
    store: new KeyvRedis(env.redis.cacheUrl),
});

redisStore.on("error", (error) => {
    console.error(`[Cache] Redis error: ${error.message}`);
});

const cache: Cache = createCache({
    stores: [memoryStore, redisStore],
});

function getFullKey(module: string, key: string): string {
    return `${CACHE_PREFIX}:${module}:${key}`;
}

async function executeBatchDelete(fullKeys: string[]): Promise<void> {
    const uniqueKeys = Array.from(new Set(fullKeys));

    for (let i = 0; i < uniqueKeys.length; i += DELETE_CHUNK_SIZE) {
        const chunk = uniqueKeys.slice(i, i + DELETE_CHUNK_SIZE);

        await Promise.all(chunk.map((key) => cache.del(key)));
    }
}

export const cacheService = {
    async getOrSet<T>(
        param: CacheParam,
        fetchFn: () => Promise<T>,
    ): Promise<T> {
        const validated = CacheParamSchema.parse(param);
        const fullKey = getFullKey(validated.module, validated.key);

        try {
            return await cache.wrap(fullKey, fetchFn, validated.ttl);
        } catch (error) {
            console.warn(`[Cache] getOrSet fallback: ${fullKey}`, error);

            return await fetchFn();
        }
    },

    async get<T>(param: CacheParam): Promise<T | undefined> {
        const validated = CacheParamSchema.parse(param);

        return (
            (await cache.get<T>(getFullKey(validated.module, validated.key))) ??
            undefined
        );
    },

    async set<T>(param: CacheParam, value: T): Promise<void> {
        const validated = CacheParamSchema.parse(param);

        await cache.set(
            getFullKey(validated.module, validated.key),
            value,
            validated.ttl,
        );
    },

    async invalidate(params: CacheParam | CacheParam[]): Promise<void> {
        const items = Array.isArray(params) ? params : [params];

        const fullKeys = items.map((param) => {
            const validated = CacheParamSchema.parse(param);

            return getFullKey(validated.module, validated.key);
        });

        await executeBatchDelete(fullKeys);
    },

    async invalidateMany(input: InvalidateInput): Promise<void> {
        const parsed = InvalidateSchema.parse(input);

        if (Array.isArray(parsed)) {
            const fullKeys = parsed.map((param) =>
                getFullKey(param.module, param.key),
            );

            await executeBatchDelete(fullKeys);

            return;
        }

        if ("keys" in parsed) {
            const fullKeys = parsed.keys.map((key) =>
                getFullKey(parsed.module, key),
            );

            await executeBatchDelete(fullKeys);

            return;
        }

        await executeBatchDelete([getFullKey(parsed.module, parsed.key)]);
    },
};
