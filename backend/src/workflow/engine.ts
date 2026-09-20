import type { WorkflowResult } from "#app/contracts/index.js";
import { logger } from "#app/infrastructure/logger/index.js";

import type { WorkflowStore } from "./port/workflow-store.js";
import {
    createWorkflowMachineFromState,
    serializeWorkflowSnapshot,
} from "./state.js";

function serializeError(error: unknown): string {
    if (error instanceof Error) {
        return error.stack ?? error.message;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

export function createWorkflowEngine(store: WorkflowStore) {
    return async function workflowEngine(
        message: WorkflowResult,
    ): Promise<void> {
        try {
            await store.transaction(async (tx) => {
                const claimed = await tx.claimWorkflowResult(
                    message.source.outboxId,
                );

                if (!claimed) {
                    logger.debug(
                        {
                            label: "WorkflowEngine",
                            workflowId: message.workflowId,
                            outboxId: message.source.outboxId.toString(),
                        },
                        "Workflow Result 已處理，略過重複訊息",
                    );

                    return;
                }

                const workflow = await tx.findWorkflowState(message.workflowId);

                if (!workflow) {
                    logger.error(
                        {
                            label: "WorkflowEngine",
                            workflowId: message.workflowId,
                            outboxId: message.source.outboxId.toString(),
                        },
                        "WorkflowState 不存在，暫無法記錄 Workflow error",
                    );

                    // TODO: 找到適合的 durable storage 後，記錄 Workflow error。

                    return;
                }
                try {
                    const actor = createWorkflowMachineFromState(workflow);

                    try {
                        actor.start();
                        actor.send(message);

                        const nextSnapshot = actor.getSnapshot();
                        const nextTask = nextSnapshot.context.nextTask;

                        await tx.updateWorkflowState({
                            workflowId: message.workflowId,
                            status: String(nextSnapshot.value),
                            snapshot: serializeWorkflowSnapshot(nextSnapshot),
                        });

                        if (nextTask) {
                            await tx.createOutbox({
                                workflowId: message.workflowId,
                                ...nextTask,
                            });
                        }
                    } finally {
                        actor.stop();
                    }
                } catch (error) {
                    await tx.recordWorkflowError({
                        workflowId: message.workflowId,
                        error: serializeError(error),
                    });

                    logger.error(
                        {
                            label: "WorkflowEngine",
                            workflowId: message.workflowId,
                            outboxId: message.source.outboxId.toString(),
                            error:
                                error instanceof Error ? error.message : error,
                        },
                        "Workflow 執行失敗，保留原有 Workflow state",
                    );
                }
            });
        } catch (error) {
            logger.error(
                {
                    label: "WorkflowEngine",
                    workflowId: message.workflowId,
                    outboxId: message.source.outboxId.toString(),
                    error: error instanceof Error ? error.message : error,
                },
                "Workflow transaction 執行失敗",
            );

            throw error;
        }
    };
}
