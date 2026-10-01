import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

import { logger } from "../logger/index.js";
import { HonoSseConnection } from "./connection/hono-sse-connection.js";
import { sseStreamRoute } from "./route.js";
import { sseBroker } from "./sse.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const sseHandler = app.openapi(sseStreamRoute, async (c) => {
    return streamSSE(c, async (stream) => {
        const connection = new HonoSseConnection(stream);

        const afterId = c.req.query("after") ?? c.req.header("Last-Event-ID");
        let cleanup: (() => void) | undefined;

        try {
            cleanup = await sseBroker.connect(connection, { afterId });

            stream.onAbort(() => {
                logger.info({ label: "SSE" }, "客戶端中斷連線");
                connection.close();
                cleanup?.();
            });

            while (!connection.isClosed()) {
                await connection.heartbeat();
                await stream.sleep(15000);
            }
        } catch (err) {
            logger.error({ label: "SSE", err }, "串流發生嚴重錯誤");
            connection.close();
            cleanup?.();
        }
    });
});
