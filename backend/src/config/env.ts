import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    DATABASE_URL: z.string().url(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    nodeEnv: parsedEnv.NODE_ENV,
    databaseUrl: parsedEnv.DATABASE_URL,
};
