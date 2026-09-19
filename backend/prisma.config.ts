import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "./prisma/models/",

    migrations: {
        path: "./prisma/models/migrations",
    },

    datasource: {
        url: env("DATABASE_URL"),
    },
});
