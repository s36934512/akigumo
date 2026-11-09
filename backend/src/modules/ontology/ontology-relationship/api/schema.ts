import { z } from "@hono/zod-openapi";

const EntityTypeSchema = z.enum(["CONCEPT", "ARCHIVE"]);

export const EntityReferenceSchema = z.object({
    id: z.string(),
    entityType: EntityTypeSchema,
});

export const StatementSchema = z.object({
    id: z.string(),
    type: z.string(),
    keyConceptId: z.string().nullable(),
    subject: EntityReferenceSchema,
    values: EntityReferenceSchema.array(),
});

export const RelationshipSchema = z.object({
    id: z.string(),
    type: z.string(),
    source: EntityReferenceSchema,
    target: EntityReferenceSchema,
    properties: z.record(z.string(), z.unknown()),
});

const EntitySchema = z
    .object({
        id: z.string(),
        name: z.string().optional(),
        title: z.string().optional(),
    })
    .catchall(z.unknown());

export const QuerySchema = z.object({
    conceptId: z.string(),
});

export type QueryInput = z.infer<typeof QuerySchema>;

export const OntologyRelationshipSchema = QuerySchema;

export type OntologyRelationship = z.infer<typeof OntologyRelationshipSchema>;

export const RequestSchema = OntologyRelationshipSchema;

export const ResponseSchema = z.object({
    concepts: EntitySchema.array(),
    archives: EntitySchema.array(),
    statements: StatementSchema.array(),
    relationships: RelationshipSchema.array(),
});

export type OntologyRelationshipResponse = z.infer<typeof ResponseSchema>;
