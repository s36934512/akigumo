import { z } from "zod";

/**
 * Redis Stream raw message。
 *
 * Redis client 回傳：
 *
 * [
 *   messageId,
 *   ["field", "value", ...]
 * ]
 */
export const RedisStreamMessageSchema = z.tuple([
    z.string(),
    z.array(z.string()),
]);

export const RedisStreamMessagesSchema = RedisStreamMessageSchema.array();

export type RedisStreamMessage = z.infer<typeof RedisStreamMessageSchema>;

export type RedisStreamMessages = z.infer<typeof RedisStreamMessagesSchema>;

/**
 * Stream message 的 application-level representation。
 *
 * data 保持 unknown，
 * 由上層 contract / schema 決定實際型別。
 */
export const StreamMessageSchema = z.object({
    id: z.string(),
    payload: z.unknown(),
});

export type StreamMessage = z.infer<typeof StreamMessageSchema>;

/**
 * RedisStream raw message decoder。
 *
 * 目前 Producer 固定使用：
 *
 * ["payload", json]
 */
export const DecodeStreamMessageSchema = RedisStreamMessageSchema.transform(
    ([id, fields]) => {
        if (fields.length !== 2 || fields[0] !== "payload") {
            throw new Error(
                `Invalid Redis Stream message fields for message ${id}`,
            );
        }

        let payload: unknown;

        try {
            payload = JSON.parse(fields[1]);
        } catch {
            throw new Error(
                `Invalid JSON payload for Redis Stream message ${id}`,
            );
        }

        return {
            id,
            payload,
        };
    },
).pipe(StreamMessageSchema);
