import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    DATABASE_URL: z.url(),

    REDIS_URL: z.url().default("redis://redis:6379"),
    REDIS_CACHE_URL: z.url().default("redis://redis-cache:6379"),

    NEO4J_URL: z.url().default("bolt://neo4j:7687"),
    NEO4J_USERNAME: z.string().default("neo4j"),
    NEO4J_PASSWORD: z.string(),

    MEILI_HOST: z.url().default("http://meilisearch:7700"),
    MEILI_MASTER_KEY: z.string().default("masterKey"),

    STORAGE_PATH: z.string().default("./storage"),
    TMP_PATH: z.string().default("./tmp"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    nodeEnv: parsedEnv.NODE_ENV,
    databaseUrl: parsedEnv.DATABASE_URL,

    redis: {
        url: parsedEnv.REDIS_URL,
        cacheUrl: parsedEnv.REDIS_CACHE_URL,
    },

    neo4j: {
        url: parsedEnv.NEO4J_URL,
        username: parsedEnv.NEO4J_USERNAME,
        password: parsedEnv.NEO4J_PASSWORD,
    },

    meilisearch: {
        host: parsedEnv.MEILI_HOST,
        apiKey: parsedEnv.MEILI_MASTER_KEY,
    },

    storage: {
        path: parsedEnv.STORAGE_PATH,
        tmpPath: parsedEnv.TMP_PATH,
    },
};
