export const graphRefinementMqConfig = {
    requestStreamName: "akigumo:graph",
    resultStreamName: "akigumo:python",
    consumerGroup: "graph-refinement",
    batchSize: 5,
    minIdleTime: 30_000,
    trimIntervalSeconds: 600,
};
