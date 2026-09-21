export const workflowResultMqConfig = {
    streamName: "workflow",
    consumerGroup: "workflow-engine",
    batchSize: 5,
    minIdleTime: 30_000,
    trimIntervalSeconds: 600,
};
