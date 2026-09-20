import type { Client } from "pg";

import type { DispatchTrigger } from "#app/kernel/port/dispatch-trigger.js";

const OUTBOX_CHANNEL = "kernel_outbox_inserted";

/**
 * Starts PostgreSQL LISTEN/NOTIFY subscriber for outbox insert notifications.
 *
 * On each notification this triggers a pending-task scan as low-latency dispatch.
 */
export class PostgresOutboxListener implements DispatchTrigger {
    public constructor(private readonly client: Client) {}

    public async start(requestDispatch: () => void): Promise<void> {
        this.client.on("notification", (message) => {
            if (message.channel !== OUTBOX_CHANNEL) {
                return;
            }

            requestDispatch();
        });

        await this.client.query(`LISTEN ${OUTBOX_CHANNEL}`);
    }

    public async stop(): Promise<void> {
        await this.client.query(`UNLISTEN ${OUTBOX_CHANNEL}`);
    }
}
