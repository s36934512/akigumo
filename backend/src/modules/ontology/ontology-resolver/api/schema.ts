import { z } from "@hono/zod-openapi";

import { extendDiscriminatedUnion } from "#app/schema/index.js";

import { QuerySchema } from "../contract/cypher.js";
import { CyElementSchema } from "../contract/cytoscape.js";

export const OntologyResolverSchema = extendDiscriminatedUnion(
    "operate",
    QuerySchema,
    {
        notifyId: z.uuid(),
    },
);

export type OntologyResolver = z.infer<typeof OntologyResolverSchema>;

export const RequestSchema = OntologyResolverSchema;

export const ResponseSchema = CyElementSchema.single;
