import { serve } from "@hono/node-server";

import { bootstrap } from "./app/bootstrap.js";
import { logger } from "./infrastructure/logger/index.js";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const runtime = await bootstrap();

const server = serve({
    fetch: runtime.app.fetch,
    port: 3000,
    hostname: "0.0.0.0",
});

logger.info({ label: "Akigumo" }, "Core Modules Loaded");

let shutdownPromise: Promise<void> | undefined;

const shutdown = (): Promise<void> => {
    if (shutdownPromise) {
        return shutdownPromise;
    }

    shutdownPromise = (async () => {
        const errorList: unknown[] = [];

        try {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        } catch (error: unknown) {
            errorList.push(error);
        }

        try {
            await runtime.stop();
        } catch (error: unknown) {
            errorList.push(error);
        }

        if (errorList.length > 0) {
            throw new AggregateError(errorList, "應用程式停止時發生錯誤");
        }
    })();

    return shutdownPromise;
};

void runtime.failure
    .then((error: unknown) => {
        logger.fatal(
            { err: error },
            "背景工作失敗，正在關閉 HTTP server 與 runtime",
        );

        return shutdown();
    })
    .catch((error: unknown) => {
        logger.error({ err: error }, "背景工作失敗後的關閉流程未能完整完成");
    });

const handleSignal = (signal: NodeJS.Signals): void => {
    logger.info({ label: "Shutdown", signal }, "收到關閉訊號");

    void shutdown().catch((error: unknown) => {
        logger.error({ label: "Shutdown", err: error }, "應用程式關閉失敗");
        process.exitCode = 1;
    });
};

process.once("SIGINT", () => handleSignal("SIGINT"));
process.once("SIGTERM", () => handleSignal("SIGTERM"));
