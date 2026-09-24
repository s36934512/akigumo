type WorkflowFailureEvent<T extends { type: string }> = Extract<
    T,
    { type: `${string}_FAILED` }
>;

export function isWorkflowFailureEvent<T extends { type: string }>(
    event: T,
): event is WorkflowFailureEvent<T> {
    return event.type.endsWith("_FAILED");
}
