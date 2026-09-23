import { z } from "zod";

import { WorkflowResponseSchema } from "#app/api/response.js";
import {
    createFlexibleSchema,
    type InferFlexible,
} from "#app/shared/contracts/index.js";

export const OntologyDeleteSchema = createFlexibleSchema(
    z.object({
        notifyId: z.uuid(),
        idList: z.uuid().array(),
    }),
);

export type OntologyDelete = InferFlexible<typeof OntologyDeleteSchema>;

export const RequestSchema = OntologyDeleteSchema.single;

export const ResponseSchema = WorkflowResponseSchema;
