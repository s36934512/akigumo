import type { JsonValue } from "@prisma/client/runtime/client";
import { createActor, type Snapshot } from "xstate";
import { z } from "zod";

import type { WorkflowState } from "./port/workflow-store.js";
import * as workflowRegistry from "./registry.js";

const WorkflowDataSchema = z.record(z.string(), z.unknown());

function getWorkflowData(data: unknown): Record<string, unknown> {
    const result = WorkflowDataSchema.safeParse(data);

    if (!result.success) {
        throw new Error(`Invalid Workflow data: ${result.error.message}`);
    }

    return result.data;
}

/**
 * Converts persisted snapshot payload into an XState snapshot.
 *
 * Persistence stores JSON data, while XState operates on its
 * runtime snapshot representation.
 */
function getSnapshot(snapshot: unknown): Snapshot<unknown> | undefined {
    if (snapshot === null) {
        return undefined;
    }

    if (typeof snapshot !== "object") {
        throw new Error("Invalid Workflow snapshot");
    }

    return snapshot as Snapshot<unknown>;
}

/**
 * Serializes an XState snapshot into a Prisma-compatible JSON value.
 *
 * XState's runtime snapshot type is not the same type as Prisma's
 * JsonValue, so serialization happens explicitly at the persistence
 * boundary instead of relying on a type assertion.
 */
export function serializeWorkflowSnapshot(
    snapshot: Snapshot<unknown>,
): JsonValue {
    return JSON.parse(JSON.stringify(snapshot)) as JsonValue;
}

/**
 * Reconstructs a Workflow actor from durable Workflow state.
 */
export function createWorkflowMachineFromState(workflow: WorkflowState) {
    const machine = workflowRegistry.getWorkflow(workflow.workflowType);

    const data = getWorkflowData(workflow.data);

    return createActor(machine, {
        input: { ...data },
        snapshot: getSnapshot(workflow.snapshot),
    });
}
