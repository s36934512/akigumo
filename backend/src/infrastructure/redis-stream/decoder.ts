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
const RedisStreamMessageSchema = z.tuple([z.string(), z.array(z.string())]);

const RedisStreamMessagesSchema = RedisStreamMessageSchema.array();

type RedisStreamMessage = z.infer<typeof RedisStreamMessageSchema>;

type RedisStreamMessages = z.infer<typeof RedisStreamMessagesSchema>;

/**
 * Stream message 的 application-level representation。
 *
 * data 保持 unknown，
 * 由上層 contract / schema 決定實際型別。
 */
const StreamMessageSchema = z.object({
    id: z.string(),
    payload: z.unknown(),
});

type StreamMessage = z.infer<typeof StreamMessageSchema>;

/**
 * RedisStream raw message decoder。
 *
 * 目前 Producer 固定使用：
 *
 * ["payload", json]
 */
const DecodeStreamMessageSchema = RedisStreamMessageSchema.transform(
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

/**
 * 將單筆 Redis Stream raw message
 *
 * [id, ["payload", json]]
 *
 * 解碼成：
 *
 * {
 *   id,
 *   payload
 * }
 *
 * Decode failure 會直接 throw。
 *
 * 是否 ACK / retry 由 Worker 決定。
 */
export function decodeStreamMessage(
    message: RedisStreamMessage,
): StreamMessage {
    return DecodeStreamMessageSchema.parse(message);
}

/**
 * 將 Redis Stream raw messages
 *
 * [
 *   [id, ["payload", json]],
 *   ...
 * ]
 *
 * 解碼成 StreamMessage[]。
 *
 * 任一 message decode failure 都會 throw。
 * Worker 若需要逐筆處理 decode failure，
 * 應使用 decodeStreamMessage()。
 */
export function decodeStreamMessages(
    messages: RedisStreamMessages,
): StreamMessage[] {
    const streamMessageList: StreamMessage[] = [];

    for (const message of messages) {
        streamMessageList.push(decodeStreamMessage(message));
    }

    return streamMessageList;
}
