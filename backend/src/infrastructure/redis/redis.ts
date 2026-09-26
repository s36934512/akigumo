import { Redis } from "ioredis";

import { env } from "#app/config/env.js";

export const createRedisClient = () =>
    new Redis(env.redis.url, {
        maxRetriesPerRequest: null,
    });

export const createSubscriber = () => new Redis(env.redis.url);
