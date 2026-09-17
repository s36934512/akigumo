import {
    DecodeStreamMessageSchema,
    type RedisStreamMessage,
    type RedisStreamMessages,
    type StreamMessage,
} from "./schema/index.js";

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
