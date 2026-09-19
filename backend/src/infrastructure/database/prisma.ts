import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "#app/config/env.js";
import { postgresConfig } from "#app/config/postgres.js";
import { type Prisma, PrismaClient } from "#generated/prisma/client.js";

const pool = new Pool({
    connectionString: postgresConfig.connectionString,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
    log:
        env.nodeEnv === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
});

export const verifyDbConnection = async (): Promise<void> => {
    await prisma.$connect();
    console.log("PostgreSQL connected via Prisma");
};

export type { Prisma as PrismaTypes };
