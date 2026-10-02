import { z } from "@hono/zod-openapi";

import { ArchiveModelSchema } from "#generated/zod/schemas/index.js";

export const ArchiveStructureItemSchema = ArchiveModelSchema.extend({
    conceptList: z
        .object({
            conceptId: z.uuid(),
            type: z.string(),
        })
        .array()
        .openapi({ description: "項目的屬性 種類:標籤UUID" }),
});

export const GetArchiveStructureSchema = z.object({
    parentId: z
        .uuid()
        .optional()
        .openapi({ description: "父節點 ID，省略則為頂層" }),
    showDeleted: z
        .boolean()
        .default(false)
        .openapi({ description: "是否顯示已刪除項目" }),
});

export const RequestSchema = GetArchiveStructureSchema;

export const ResponseSchema = ArchiveStructureItemSchema.array();
