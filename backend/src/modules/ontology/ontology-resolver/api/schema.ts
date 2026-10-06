import type { z } from "@hono/zod-openapi";

import { QuerySchema } from "../contract/cypher.js";
import { CyElementSchema } from "../contract/cytoscape.js";

export const OntologyResolverSchema = QuerySchema;

export type OntologyResolver = z.infer<typeof OntologyResolverSchema>;

export const RequestSchema = OntologyResolverSchema;

export const ResponseSchema = CyElementSchema.single;
