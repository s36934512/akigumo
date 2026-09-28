import type { z } from "zod";

import { kernelConfig } from "#app/config/kernel.js";
import {
    RESULT_STATUS,
    type Result,
    WORKFLOW_RESULT_VERSION,
    type WorkflowResult,
    WorkflowResultSchema,
} from "#app/contracts/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/index.js";
import { OutboxStatus } from "#generated/prisma/enums.js";

import type { WorkflowResultPublisher } from "../port/workflow-result-publisher.js";
import type { Task } from "../task/task.js";
import { NonRetryableError } from "./error.js";
import { toErrorDetail } from "./error-detail.js";
import { handleFatalError, handleRetryableError } from "./failure.js";
import type { ProcessorDefinition } from "./processor.js";

function isNonRetryable(error: unknown): error is NonRetryableError {
    return error instanceof NonRetryableError;
}

/**
 * Marks the currently owned Outbox row as completed.
 *
 * The processingId acts as the execution ownership token. A stale or
 * duplicate worker therefore cannot complete a newer execution.
 */
async function completeOutboxTask(task: Task<unknown>): Promise<void> {
    const result = await prisma.outbox.updateMany({
        where: {
            id: task.metadata.outboxId,
            processingId: task.metadata.processingId,
            status: OutboxStatus.PROCESSING,
        },
        data: {
            status: OutboxStatus.COMPLETED,
            processingStartedAt: null,
            processingId: null,
        },
    });

    if (result.count === 0) {
        logger.warn(
            {
                outboxId: task.metadata.outboxId,
                processingId: task.metadata.processingId,
            },
            "Kernel task lost execution ownership before completion",
        );
    }
}

/**
 * Publishes a processor failure result to the Workflow runtime.
 *
 * The Outbox row has already been marked FAILED before this function is
 * called. Therefore failure-result delivery is currently best-effort.
 */
async function publishFailureResult(
    publisher: WorkflowResultPublisher,
    task: Task<unknown>,
    result: Result,
): Promise<void> {
    const workflowResult = createWorkflowResult(task, result);

    try {
        await publisher.publish(workflowResult);
    } catch (error: unknown) {
        /*
         * The task has already been marked FAILED.
         *
         * Without durable result state, retrying this task would execute
         * the processor again even though the processor is non-retryable.
         *
         * Therefore failure-result delivery is currently best-effort.
         * A durable result/recovery mechanism would be required if this
         * notification must be guaranteed.
         */
        logger.error(
            {
                outboxId: task.metadata.outboxId,
                workflowId: task.context.workflowId,
                err: error,
            },
            "Failed to publish workflow failure result",
        );
    }
}

/**
 * Handles an error thrown by a processor.
 *
 * NonRetryableError is an explicit execution signal from the processor:
 * the current task must be failed without another processor execution.
 *
 * All other errors use the Kernel retry policy.
 */
async function handleProcessorFailure(
    task: Task<unknown>,
    publisher: WorkflowResultPublisher,
    error: unknown,
    config: typeof kernelConfig,
): Promise<void> {
    if (isNonRetryable(error)) {
        await handleFatalError(task.metadata, error.message);
        await publishFailureResult(publisher, task, {
            status: RESULT_STATUS.FAILURE,
            error: toErrorDetail(error),
        });

        return;
    }

    await handleRetryableError(task.metadata, error, config);
}

/**
 * Creates and validates a WorkflowResult.
 *
 * Result is already the exact payload of WorkflowResult.result.
 * Contract validation is performed before the result reaches the publisher.
 */
function createWorkflowResult<TPayload>(
    task: Task<TPayload>,
    result: Result,
): WorkflowResult {
    const workflowResult = {
        version: WORKFLOW_RESULT_VERSION,
        workflowId: task.context.workflowId,
        source: {
            operation: task.context.operation,
            outboxId: task.metadata.outboxId,
        },
        result,
    };

    return WorkflowResultSchema.parse(workflowResult);
}

/**
 * Executes a Kernel task using at-least-once execution semantics.
 *
 * Lifecycle:
 *
 *   validate
 *      ↓
 *   execute processor
 *      ↓
 *   publish workflow result
 *      ↓
 *   complete outbox
 *
 * A task may be executed more than once when a later stage fails.
 * Processor implementations must therefore tolerate duplicate execution.
 *
 * A non-retryable processor failure transitions the task to FAILED and
 * does not retry the processor. Failure-result delivery is currently
 * best-effort because Kernel does not persist a separate result-pending state.
 */
export async function executeKernelTask<TSchema extends z.ZodType>(
    processor: ProcessorDefinition<TSchema>,
    task: Task<unknown>,
    publisher: WorkflowResultPublisher,
): Promise<void> {
    const validationResult = processor.inputSchema.safeParse(task.payload);

    if (!validationResult.success) {
        await handleFatalError(task.metadata, validationResult.error.message);

        return;
    }

    const validatedTask: Task<z.output<TSchema>> = {
        ...task,
        payload: validationResult.data,
    };

    let logicResult: Awaited<ReturnType<ProcessorDefinition<TSchema>["logic"]>>;

    try {
        logicResult = await processor.logic(validatedTask);
    } catch (error: unknown) {
        await handleProcessorFailure(
            validatedTask,
            publisher,
            error,
            kernelConfig,
        );

        return;
    }

    /*
     * WorkflowResult construction and validation happen before entering
     * the delivery try/catch.
     *
     * Therefore errors thrown here are contract/construction errors,
     * not delivery failures, and are not treated as retryable transport
     * failures.
     */
    const workflowResult = createWorkflowResult(validatedTask, {
        status: RESULT_STATUS.SUCCESS,
        data: logicResult,
    });

    try {
        /*
         * At this point the WorkflowResult has already been validated.
         *
         * A failure here represents result delivery failure and can be
         * retried. Retrying may execute the processor again, which is
         * intentional under at-least-once semantics.
         */
        await publisher.publish(workflowResult);
    } catch (error: unknown) {
        await handleRetryableError(validatedTask.metadata, error, kernelConfig);
        return;
    }

    try {
        /*
         * The WorkflowResult has already been delivered successfully, but
         * durable task completion failed. Retrying may execute the
         * processor again, so processors must be idempotent.
         */
        await completeOutboxTask(validatedTask);
    } catch (error: unknown) {
        await handleRetryableError(validatedTask.metadata, error, kernelConfig);
    }
}
