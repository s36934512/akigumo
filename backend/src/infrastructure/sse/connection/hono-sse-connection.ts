import type { SSEStreamingApi } from "hono/streaming";

import type { SseConnection } from "./sse-connection.js";

export class HonoSseConnection implements SseConnection {
    private closed = false;

    constructor(private readonly stream: SSEStreamingApi) {}

    async send(input: {
        id?: string;
        event?: string;
        data: string;
    }): Promise<void> {
        if (this.closed) {
            return;
        }

        await this.stream.writeSSE({
            id: input.id,
            event: input.event,
            data: input.data,
        });
    }

    async heartbeat(): Promise<void> {
        if (this.closed) {
            return;
        }

        await this.stream.write(":keepalive\n\n");
    }

    isClosed(): boolean {
        return this.closed;
    }

    close(): void {
        this.closed = true;
    }
}
