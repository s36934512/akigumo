import type { Client, Notification } from "pg";

import type { DispatchTrigger } from "#app/kernel/port/dispatch-trigger.js";

const OUTBOX_CHANNEL = "kernel_outbox_inserted";

/**
 * Starts PostgreSQL LISTEN/NOTIFY subscriber for outbox insert notifications.
 *
 * On each notification this triggers a pending-task scan as low-latency dispatch.
 */
export class PostgresOutboxListener implements DispatchTrigger {
    private running = false;

    private readonly handleNotification = (message: Notification): void => {
        if (!this.running || message.channel !== OUTBOX_CHANNEL) {
            return;
        }

        this.requestDispatch?.();
    };

    private requestDispatch?: () => void;

    public constructor(private readonly client: Client) {}

    public async start(requestDispatch: () => void): Promise<void> {
        if (this.running) {
            return;
        }

        this.requestDispatch = requestDispatch;

        this.client.on("notification", this.handleNotification);

        try {
            await this.client.query(`LISTEN ${OUTBOX_CHANNEL}`);
            this.running = true;
        } catch (error: unknown) {
            this.client.off("notification", this.handleNotification);
            this.requestDispatch = undefined;

            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (!this.running && !this.requestDispatch) {
            return;
        }

        this.running = false;

        this.client.off("notification", this.handleNotification);

        try {
            await this.client.query(`UNLISTEN ${OUTBOX_CHANNEL}`);
        } finally {
            this.requestDispatch = undefined;
        }
    }
}
