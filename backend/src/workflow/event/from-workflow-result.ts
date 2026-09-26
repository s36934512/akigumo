import type { WorkflowResult } from "#app/contracts/index.js";

export function createWorkflowEvent(message: WorkflowResult) {
    return message.result.status === "SUCCESS"
        ? {
              type: `${message.source.operation}_SUCCEEDED`,
              data: message.result.data,
          }
        : {
              type: `${message.source.operation}_FAILED`,
              error: message.result.error,
          };
}
