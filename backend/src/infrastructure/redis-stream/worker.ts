import * as process from "node:process";
import type { Redis } from "ioredis";
import type pino from "pino";

import { logger } from "#app/infrastructure/logger/logger.js";

import { decodeStreamMessage } from "./decoder.js";
import type {
    RedisStreamMessage,
    RedisStreamMessages,
    StreamMessage,
} from "./schema/redis-stream.js";
import type { RedisStreamWorkerConfig } from "./types/redis-stream.js";

export class RedisStreamWorker {
    private readonly consumerRedis: Redis;

    private readonly streamName: string;
    private readonly consumerGroup: string;
    private readonly consumerName: string;

    private readonly batchSize: number;
    private readonly minIdleTime: number;
    private readonly trimIntervalSeconds: number;

    private running = false;

    private runPromise: Promise<void> | undefined;
    private trimPromise: Promise<void> | undefined;
    private stopPromise: Promise<void> | undefined;

    private trimTimer: NodeJS.Timeout | null = null;
    private trimTimerResolve: (() => void) | undefined;

    /**
     * XAUTOCLAIM 的掃描 cursor。
     *
     * Redis 會回傳下一個要掃描的位置，
     * 不需要每次都從 0-0 開始。
     */
    private autoClaimCursor = "0-0";

    private readonly log: pino.Logger;

    constructor(input: RedisStreamWorkerConfig) {
        this.consumerRedis = input.consumerRedis;

        this.streamName = input.streamName;
        this.consumerGroup = input.consumerGroup;
        this.consumerName = `worker-${process.pid}-${crypto.randomUUID()}`;

        this.batchSize = input.batchSize;
        this.minIdleTime = input.minIdleTime;
        this.trimIntervalSeconds = input.trimIntervalSeconds;

        this.log = logger.child({
            label: "RedisStreamWorker",
            streamName: this.streamName,
            consumerGroup: this.consumerGroup,
            consumerName: this.consumerName,
        });
    }

    /**
     * 初始化 Consumer Group。
     */
    private async setupConsumerGroup(): Promise<void> {
        try {
            await this.consumerRedis.xgroup(
                "CREATE",
                this.streamName,
                this.consumerGroup,
                "0",
                "MKSTREAM",
            );
        } catch (error) {
            if (error instanceof Error && error.message.includes("BUSYGROUP")) {
                return;
            }

            throw error;
        }
    }

    /**
     * ACK 一個 Stream message。
     */
    private async acknowledgeMessage(message: StreamMessage): Promise<void> {
        await this.consumerRedis.xack(
            this.streamName,
            this.consumerGroup,
            message.id,
        );
    }

    /**
     * ACK malformed messages。
     *
     * Decode failure 代表 Redis Stream message
     * 不符合 infrastructure wire format。
     *
     * 這種錯誤不是 handler retry 可以修復的，
     * 因此 ACK 後丟棄，避免 poison message
     * 永久留在 PEL 中反覆 XAUTOCLAIM。
     */
    private async discardMalformedMessages(
        malformedMessageList: RedisStreamMessage[],
    ): Promise<void> {
        if (malformedMessageList.length === 0) {
            return;
        }

        const pipeline = this.consumerRedis.pipeline();

        for (const [messageId] of malformedMessageList) {
            pipeline.xack(this.streamName, this.consumerGroup, messageId);
        }

        await pipeline.exec();

        this.log.error(
            `Discarded ${malformedMessageList.length} malformed Redis Stream message(s)`,
        );
    }

    /**
     * Decode raw Stream message。
     *
     * Decode failure 不交給 handler，
     * 因為 message 本身已經不符合 infrastructure wire format。
     */
    private decodeBatch(messages: RedisStreamMessages): {
        messageList: StreamMessage[];
        malformedMessageList: RedisStreamMessage[];
    } {
        const messageList: StreamMessage[] = [];
        const malformedMessageList: RedisStreamMessage[] = [];

        for (const message of messages) {
            try {
                messageList.push(decodeStreamMessage(message));
            } catch (error) {
                malformedMessageList.push(message);

                const messageId = message[0];

                this.log.error(
                    { err: error, messageId },
                    "Failed to decode Redis Stream message",
                );
            }
        }

        return {
            messageList,
            malformedMessageList,
        };
    }

    private async processMessage(
        message: StreamMessage,
        handler: (message: StreamMessage) => Promise<void>,
    ): Promise<void> {
        try {
            await handler(message);
            await this.acknowledgeMessage(message);
        } catch (error) {
            this.log.error(
                { err: error, messageId: message.id },
                "Stream message processing failed",
            );
        }
    }

    /**
     * 處理一次 Redis Stream delivery。
     *
     * 每個 message 都是獨立的 execution 單位。
     *
     * Decode failure：
     * - log
     * - ACK
     * - discard
     *
     * Handler failure：
     * - log
     * - 不 ACK
     * - message 留在 PEL
     * - 後續由 XAUTOCLAIM 重新取得
     *
     * Handler 成功：
     * - ACK
     */
    private async handleMessageBatch(
        messages: RedisStreamMessages,
        handler: (message: StreamMessage) => Promise<void>,
    ): Promise<void> {
        if (messages.length === 0) {
            return;
        }

        const { messageList, malformedMessageList } =
            this.decodeBatch(messages);

        await this.discardMalformedMessages(malformedMessageList);

        if (messageList.length === 0) {
            return;
        }

        for (const message of messageList) {
            await this.processMessage(message, handler);
        }
    }

    /**
     * 嘗試取得 stale pending messages。
     */
    private async claimPendingMessages(
        handler: (message: StreamMessage) => Promise<void>,
    ): Promise<void> {
        const result = await this.consumerRedis.xautoclaim(
            this.streamName,
            this.consumerGroup,
            this.consumerName,
            this.minIdleTime,
            this.autoClaimCursor,
            "COUNT",
            this.batchSize,
        );

        this.autoClaimCursor = result[0];

        const staleMessages = result[1];

        if (staleMessages.length > 0) {
            await this.handleMessageBatch(staleMessages, handler);
        }
    }

    /**
     * 安全修剪 Redis Stream。
     *
     * 有 pending message：
     *   保留最早 pending message 之後的資料。
     *
     * 沒有 pending message：
     *   目前不進行 trim，避免在沒有明確 retention
     *   policy 的情況下刪除資料。
     */
    private async trimStream(): Promise<void> {
        try {
            const pendingInfo = await this.consumerRedis.xpending(
                this.streamName,
                this.consumerGroup,
                "-",
                "+",
                1,
            );

            if (pendingInfo.length === 0) {
                this.log.debug("No pending messages; skip stream trimming");

                return;
            }

            const minPendingId = pendingInfo[0][0];

            await this.consumerRedis.xtrim(
                this.streamName,
                "MINID",
                "~",
                minPendingId,
            );

            this.log.debug(
                `Stream trimmed before pending message ${minPendingId}`,
            );
        } catch (error) {
            /**
             * Background maintenance 不應因單次 Redis
             * 錯誤而停止。
             */
            this.log.error({ err: error }, "Redis Stream trimming failed");
        }
    }

    /**
     * 等待下一次 trimming。
     *
     * stop() 會清除 timer 並呼叫 resolver，
     * 因此不會讓 trimPromise 卡在計時器上。
     */
    private waitForNextTrim(): Promise<void> {
        return new Promise((resolve) => {
            this.trimTimerResolve = resolve;

            this.trimTimer = setTimeout(() => {
                this.trimTimer = null;
                this.trimTimerResolve = undefined;
                resolve();
            }, this.trimIntervalSeconds * 1000);
        });
    }

    /**
     * 清除 trimming 排程，並喚醒等待中的迴圈。
     */
    private clearTrimTimer(): void {
        if (this.trimTimer !== null) {
            clearTimeout(this.trimTimer);
            this.trimTimer = null;
        }

        const resolve = this.trimTimerResolve;
        this.trimTimerResolve = undefined;

        resolve?.();
    }

    /**
     * 執行 trimming 背景迴圈。
     */
    private async runTrimLoop(): Promise<void> {
        while (this.running) {
            await this.trimStream();

            if (!this.running) {
                break;
            }

            await this.waitForNextTrim();
        }
    }

    /**
     * 啟動 trimming 背景工作並追蹤其生命週期。
     */
    private startTrimLoop(): void {
        const trimPromise = this.runTrimLoop().finally(() => {
            if (this.trimPromise === trimPromise) {
                this.trimPromise = undefined;
            }
        });

        this.trimPromise = trimPromise;
    }

    /**
     * 執行 Worker 主迴圈。
     *
     * batchSize 僅控制 Redis Stream 每次 delivery 的 message 數量。
     * Handler 與 ACK 都以單一 message 為粒度。
     */
    private async runLoop(
        handler: (message: StreamMessage) => Promise<void>,
    ): Promise<void> {
        try {
            await this.setupConsumerGroup();

            if (!this.running) {
                return;
            }

            this.startTrimLoop();

            this.log.info(`started (batchSize=${this.batchSize})`);

            while (this.running) {
                try {
                    /**
                     * 1. 優先處理 stale pending messages。
                     */
                    await this.claimPendingMessages(handler);

                    if (!this.running) {
                        break;
                    }

                    /**
                     * 2. 等待新的 Stream messages。
                     *
                     * BLOCK 發生在 consumerRedis。
                     * Producer 使用的 redis connection 不會被阻塞。
                     */
                    const response = await this.consumerRedis.xreadgroup(
                        "GROUP",
                        this.consumerGroup,
                        this.consumerName,
                        "COUNT",
                        this.batchSize,
                        "BLOCK",
                        2000,
                        "STREAMS",
                        this.streamName,
                        ">",
                    );

                    /**
                     * stop() 可能在 XREADGROUP 等待期間被呼叫。
                     * 此時不再啟動新批次的 handler。
                     */
                    if (!this.running) {
                        break;
                    }

                    if (!response) {
                        continue;
                    }

                    for (const [, messages] of response) {
                        if (!this.running) {
                            break;
                        }

                        if (messages.length === 0) {
                            continue;
                        }

                        await this.handleMessageBatch(messages, handler);
                    }
                } catch (error) {
                    if (!this.running) {
                        break;
                    }

                    this.log.error(
                        { err: error },
                        "Redis Stream worker loop failed",
                    );

                    await new Promise<void>((resolve) => {
                        setTimeout(resolve, 1000);
                    });
                }
            }
        } finally {
            this.running = false;
            this.clearTrimTimer();
        }
    }

    /**
     * 啟動 Worker。
     *
     * 同一個 Worker 不允許同時執行多個主迴圈。
     */
    public async run(
        handler: (message: StreamMessage) => Promise<void>,
    ): Promise<void> {
        if (this.running || this.runPromise || this.stopPromise) {
            return Promise.reject(
                new Error(
                    "RedisStreamWorker cannot be started in its current state",
                ),
            );
        }

        this.running = true;

        const runPromise = this.runLoop(handler).finally(() => {
            if (this.runPromise === runPromise) {
                this.runPromise = undefined;
            }
        });

        this.runPromise = runPromise;

        return runPromise;
    }

    /**
     * 停止 Worker 並關閉 Redis connection。
     *
     * 關閉順序：
     * 1. 停止接收新工作。
     * 2. 清除 trimming 排程。
     * 3. 等待主迴圈及 trimming 工作結束。
     * 4. 關閉 Redis connection。
     *
     * 即使某個步驟失敗，也會繼續執行其餘關閉步驟。
     */
    public stop(): Promise<void> {
        if (this.stopPromise) {
            return this.stopPromise;
        }

        this.running = false;
        this.clearTrimTimer();

        const runPromise = this.runPromise;
        const trimPromise = this.trimPromise;

        this.stopPromise = (async () => {
            const errorList: unknown[] = [];

            const backgroundPromiseList = [runPromise, trimPromise].filter(
                (promise): promise is Promise<void> => promise !== undefined,
            );

            const resultList = await Promise.allSettled(backgroundPromiseList);

            for (const result of resultList) {
                if (result.status === "rejected") {
                    errorList.push(result.reason);
                }
            }

            try {
                await this.consumerRedis.quit();
            } catch (error) {
                errorList.push(error);
            }

            if (errorList.length > 0) {
                throw new AggregateError(
                    errorList,
                    "RedisStreamWorker failed to stop cleanly",
                );
            }

            this.log.info("stopped");
        })();

        return this.stopPromise;
    }
}
