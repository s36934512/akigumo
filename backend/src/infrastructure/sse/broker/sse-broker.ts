import type { SseConnection } from "../connection/sse-connection.js";
import type { SseLiveBus } from "../live-bus/sse-live-bus.js";
import type { SseStream } from "../stream/sse-stream.js";

export type SseBrokerOptions = {
    afterId?: string;
};

export class SseBroker {
    constructor(
        private readonly stream: SseStream,
        private readonly liveBus: SseLiveBus,
    ) {}

    async connect(
        connection: SseConnection,
        options: SseBrokerOptions = {},
    ): Promise<() => void> {
        let closed = false;
        let replaying = true;

        const pendingIds = new Set<string>();

        let writeChain = Promise.resolve();

        const writeEvent = async (streamId: string): Promise<void> => {
            if (closed) {
                return;
            }

            const entry = await this.stream.read(streamId);

            if (!entry || closed) {
                return;
            }

            writeChain = writeChain.then(() =>
                connection.send({
                    id: entry.streamId,
                    data: entry.message,
                }),
            );

            await writeChain;
        };

        const handleLiveEvent = (streamId: string): void => {
            if (closed) {
                return;
            }

            if (replaying) {
                pendingIds.add(streamId);
                return;
            }

            void writeEvent(streamId).catch(() => {
                cleanup();
            });
        };

        const unsubscribe = this.liveBus.onMessage(handleLiveEvent);

        const cleanup = (): void => {
            if (closed) {
                return;
            }

            closed = true;
            pendingIds.clear();
            unsubscribe();
        };

        try {
            await this.liveBus.connect();

            if (options.afterId) {
                const cursorAvailable = await this.stream.isCursorAvailable(
                    options.afterId,
                );

                if (!cursorAvailable) {
                    cleanup();
                    throw new Error("SSE cursor is no longer available");
                }

                const replayEvents = await this.stream.readAfter(
                    options.afterId,
                );

                for (const entry of replayEvents) {
                    if (closed) {
                        break;
                    }

                    writeChain = writeChain.then(() =>
                        connection.send({
                            id: entry.streamId,
                            data: entry.message,
                        }),
                    );

                    await writeChain;
                }
            }

            replaying = false;

            for (const streamId of pendingIds) {
                if (closed) {
                    break;
                }

                await writeEvent(streamId);
            }

            pendingIds.clear();

            return cleanup;
        } catch (error) {
            cleanup();
            throw error;
        }
    }
}
