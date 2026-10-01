import { createRedisClient } from "../redis/redis.js";
import { SseBroker } from "./broker/sse-broker.js";
import { SseLiveBus } from "./live-bus/sse-live-bus.js";
import { SseEventPublisher } from "./publisher/sse-event-publisher.js";
import { SseStream } from "./stream/sse-stream.js";

const redis = createRedisClient();

export const sseStream = new SseStream(redis);
export const sseLiveBus = new SseLiveBus();

export const sseBroker = new SseBroker(sseStream, sseLiveBus);

export const sseEventPublisher = new SseEventPublisher(redis, sseStream);
