import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    DATABASE_URL: z.url(),

    REDIS_URL: z.url().default("redis://redis:6379"),
    REDIS_CACHE_URL: z.url().default("redis://redis-cache:6379"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    nodeEnv: parsedEnv.NODE_ENV,
    databaseUrl: parsedEnv.DATABASE_URL,

    redis: {
        url: parsedEnv.REDIS_URL,
        cacheUrl: parsedEnv.REDIS_CACHE_URL,
    },
};
