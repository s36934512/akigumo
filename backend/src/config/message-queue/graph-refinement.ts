export const graphRefinementMqConfig = {
    requestStreamName: "graph",
    resultStreamName: "python",
    consumerGroup: "graph-refinement",
    batchSize: 5,
    minIdleTime: 30_000,
    trimIntervalSeconds: 600,
};
