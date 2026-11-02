import { z } from "@hono/zod-openapi";

import { ArchiveModelSchema } from "#generated/zod/schemas/index.js";

export const ConceptItemSchema = z.object({
    conceptId: z.uuid(),
    type: z.string().nullable(),
});

export const ConceptListSchema = ConceptItemSchema.array();

export const ArchiveSummarySchema = ArchiveModelSchema.pick({
    id: true,
    name: true,
    type: true,
    publishedDate: true,
    createdAt: true,
    updatedAt: true,
});

export const ArchiveStructureItemSchema = ArchiveSummarySchema.extend({
    currentFileId: z.uuid().nullable(),
    conceptList: z
        .object({
            conceptId: z.uuid(),
            type: z.string().nullable(),
        })
        .array(),
});

export const ArchiveDeletionSummarySchema = z.object({
    id: z.uuid(),
    rootArchiveId: z.uuid(),
    deletedAt: z.date(),
    archive: ArchiveSummarySchema.nullable(),
    archiveCount: z.number().int(),
});

export const GetArchiveStructureSchema = z.object({
    parentId: z
        .uuid()
        .optional()
        .openapi({ description: "父節點 ID，省略則為頂層" }),
});

export const RequestSchema = GetArchiveStructureSchema;

export const ResponseSchema = z.union([
    ArchiveDeletionSummarySchema.array(),
    ArchiveStructureItemSchema.array(),
]);
