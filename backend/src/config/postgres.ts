import { env } from "./env.js";

export const postgresConfig = {
    connectionString: env.databaseUrl,
};
