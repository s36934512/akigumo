import { spawn } from "node:child_process";

const required = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

const username = encodeURIComponent(process.env.POSTGRES_USER);
const password = encodeURIComponent(process.env.POSTGRES_PASSWORD);
const database = encodeURIComponent(process.env.POSTGRES_DB);

process.env.DATABASE_URL = `postgresql://${username}:${password}@postgres:5432/${database}`;

const [command, ...args] = process.argv.slice(2);

if (!command) {
    throw new Error("No command specified");
}

const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
});

for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
    console.error("Failed to start process:", error);
    process.exit(1);
});

child.on("exit", (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 1);
});
