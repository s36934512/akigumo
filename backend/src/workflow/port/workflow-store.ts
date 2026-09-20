export interface WorkflowState {
    id: string;
    workflowType: string;
    data: unknown;
    snapshot: unknown;
}

export interface WorkflowTransaction {
    /**
     * Claims the Workflow Result source Outbox.
     *
     * Returns false when the result has already been processed.
     */
    claimWorkflowResult(outboxId: bigint): Promise<boolean>;

    /**
     * Loads and locks the current durable Workflow state.
     *
     * The lock serializes concurrent transitions targeting the same
     * Workflow instance.
     */
    findWorkflowState(workflowId: string): Promise<WorkflowState | null>;

    /**
     * Persists the result of a Workflow state transition.
     */
    updateWorkflowState(input: {
        workflowId: string;
        status: string;
        snapshot: unknown;
    }): Promise<void>;

    /**
     * Records a fatal Workflow execution error without changing
     * the current Workflow state.
     */
    recordWorkflowError(input: {
        workflowId: string;
        error: string;
    }): Promise<void>;

    /**
     * Creates the next durable Kernel task through the Outbox.
     */
    createOutbox(input: {
        workflowId: string;
        operation: string;
        payload: unknown;
        priority?: number;
        scheduledAt?: Date | null;
    }): Promise<void>;
}

export interface WorkflowStore {
    /**
     * Executes Workflow persistence operations in one transaction.
     *
     * Implementations own the underlying database transaction.
     */
    transaction<T>(
        callback: (tx: WorkflowTransaction) => Promise<T>,
    ): Promise<T>;
}
