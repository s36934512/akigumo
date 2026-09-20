import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    DATABASE_URL: z.url(),

    REDIS_HOST: z.string().default("redis"),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),

    REDIS_CACHE_HOST: z.string().default("redis-cache"),
    REDIS_CACHE_PORT: z.coerce.number().int().positive().default(6379),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    nodeEnv: parsedEnv.NODE_ENV,
    databaseUrl: parsedEnv.DATABASE_URL,

    redis: {
        host: parsedEnv.REDIS_HOST,
        port: parsedEnv.REDIS_PORT,
    },

    redisCache: {
        host: parsedEnv.REDIS_CACHE_HOST,
        port: parsedEnv.REDIS_CACHE_PORT,
    },
};
