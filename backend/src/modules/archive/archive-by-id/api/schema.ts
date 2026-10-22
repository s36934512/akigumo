import { z } from "@hono/zod-openapi";

import { ArchiveModelSchema } from "#generated/zod/schemas/index.js";

export const ArchiveStructureItemSchema = ArchiveModelSchema.pick({
    id: true,
    name: true,
    type: true,
    publishedDate: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    currentFileId: z
        .uuid()
        .nullable()
        .openapi({ description: "檔案 ID，若無則為 null" }),
    conceptList: z
        .object({
            conceptId: z.uuid(),
            type: z.string().nullable(),
        })
        .array()
        .openapi({ description: "項目的屬性 種類:標籤UUID" }),
});

export const ResponseSchema = ArchiveStructureItemSchema;
