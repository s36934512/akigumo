import { defineConfig } from "orval";

export default defineConfig({
    api: {
        input: {
            target: "http://localhost:3000/api/v1/doc",
        },
        output: {
            mode: "tags-split",
            target: "./src/shared/api/generated.ts",
            schemas: "./src/shared/api/model",
            client: "angular",
            mock: false,
        },
    },
});
