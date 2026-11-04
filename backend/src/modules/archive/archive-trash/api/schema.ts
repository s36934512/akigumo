import { z } from "@hono/zod-openapi";

import {
    ArchiveModelSchema,
    ArchiveTypeSchema,
} from "#generated/zod/schemas/index.js";

export const ConceptItemSchema = z.object({
    conceptId: z.uuid(),
    type: z.string().nullable(),
});

export const ConceptListSchema = ConceptItemSchema.array();

const ArchiveStructureBaseSchema = ArchiveModelSchema.omit({
    type: true,
}).extend({
    currentFileId: z.uuid().nullable(),
    conceptList: ConceptListSchema,
});

export const ArchiveStructureItemSchema = z.discriminatedUnion("type", [
    ArchiveStructureBaseSchema.extend({
        type: z.literal(ArchiveTypeSchema.enum.FILE_CONTAINER),
    }),
    ArchiveStructureBaseSchema.extend({
        type: z.literal(ArchiveTypeSchema.enum.WORK),
        count: z.number().int(),
    }),
    ArchiveStructureBaseSchema.extend({
        type: z.literal(ArchiveTypeSchema.enum.SERIES),
        count: z.number().int(),
    }),
    ArchiveStructureBaseSchema.extend({
        type: z.literal(ArchiveTypeSchema.enum.COLLECTION),
        count: z.number().int(),
    }),
]);

export const ArchiveDeletionSummarySchema = z.object({
    id: z.uuid(),
    rootArchiveId: z.uuid(),
    deletedAt: z.date(),
    archive: ArchiveStructureItemSchema.optional(),
    archiveCount: z.number().int(),
});

export const GetArchiveStructureSchema = z.object({
    parentId: z
        .uuid()
        .optional()
        .openapi({ description: "父節點 ID，省略則為頂層" }),
});

export const RequestSchema = GetArchiveStructureSchema;

export const ResponseSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("trash"),
        deletionList: ArchiveDeletionSummarySchema.array(),
    }),
    z.object({
        type: z.literal("children"),
        archiveList: ArchiveStructureItemSchema.array(),
    }),
]);
