import type { WorkflowResult } from "#app/contracts/workflow-result.js";

export interface WorkflowResultPublisher {
    publish(event: WorkflowResult): Promise<void>;
}
