import type { z } from "zod";

import { kernelConfig } from "#app/config/kernel.js";
import {
    RESULT_STATUS,
    type Result,
    WORKFLOW_RESULT_VERSION,
    WorkflowResultSchema,
} from "#app/contracts/index.js";
import { prisma } from "#app/infrastructure/database/prisma.js";
import { logger } from "#app/infrastructure/logger/index.js";
import { OutboxStatus } from "#generated/prisma/enums.js";

import type { WorkflowResultPublisher } from "../port/workflow-result-publisher.js";
import type { Task } from "../task/task.js";
import { NonRetryableError } from "./error.js";
import {
    handleFatalError,
    handleRetryableError,
    normalizeError,
    serializeError,
} from "./failure.js";
import type { ProcessorDefinition } from "./processor.js";

/**
 * Type guard used to safely check for non-retryable error markers without using `any`.
 */
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
    error: unknown,
): Promise<void> {
    try {
        await sendWorkflowResult(publisher, task, {
            status: RESULT_STATUS.FAILURE,
            error,
        });
    } catch (publishError: unknown) {
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
                error: serializeError(publishError),
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
        await publishFailureResult(publisher, task, error);

        return;
    }

    await handleRetryableError(task.metadata, serializeError(error), config);
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

    try {
        await sendWorkflowResult(publisher, task, {
            status: RESULT_STATUS.SUCCESS,
            data: logicResult,
        });
    } catch (error: unknown) {
        /*
         * Processor already succeeded.
         *
         * Because result delivery is not durably separated from task
         * execution yet, retrying the task may execute the processor again.
         * This is intentional at-least-once semantics.
         */
        await handleRetryableError(
            validatedTask.metadata,
            serializeError(error),
            kernelConfig,
        );

        return;
    }

    try {
        await completeOutboxTask(validatedTask);
    } catch (error: unknown) {
        /*
         * Result was already delivered successfully, but durable task
         * completion failed. Retrying may execute the processor again.
         * Processor implementations must therefore be idempotent.
         */
        await handleRetryableError(
            validatedTask.metadata,
            serializeError(error),
            kernelConfig,
        );
    }
}

/**
 * Sends the normalized processor result through the Workflow result port.
 *
 * WorkflowResultSchema belongs to the shared contract boundary. Kernel
 * validates the message before handing it to the publisher.
 */
async function sendWorkflowResult<TPayload = unknown>(
    publisher: WorkflowResultPublisher,
    task: Task<TPayload>,
    result: Result,
): Promise<void> {
    const workflowResult = {
        version: WORKFLOW_RESULT_VERSION,
        workflowId: task.context.workflowId,
        source: {
            operation: task.context.operation,
            outboxId: task.metadata.outboxId,
        },
        result:
            result.status === RESULT_STATUS.FAILURE
                ? {
                      ...result,
                      error: normalizeError(result.error),
                  }
                : result,
    };

    const parseResult = WorkflowResultSchema.safeParse(workflowResult);

    if (!parseResult.success) {
        throw new NonRetryableError(parseResult.error.message);
    }

    await publisher.publish(parseResult.data);
}
