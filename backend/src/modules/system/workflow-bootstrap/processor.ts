import { z } from "zod";

import { defineProcessor } from "#app/kernel/index.js";

export const WORKFLOW_BOOTSTRAP = "WORKFLOW_BOOTSTRAP";

const WorkflowBootstrapSchema = z.unknown();

export const workflowBootstrapProcessor = defineProcessor(
    WORKFLOW_BOOTSTRAP,
    WorkflowBootstrapSchema,
    async (input) => {
        return input.payload;
    },
);
