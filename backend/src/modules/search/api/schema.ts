import { z } from "@hono/zod-openapi";

export const SearchQueryTypeSchema = z.enum(["archive", "concept", "all"]);

export const SearchQuerySchema = z.object({
    q: z.string().trim().min(1),
    type: SearchQueryTypeSchema,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

export const ArchiveSearchResultSchema = z.object({
    entityType: z.literal("archive"),
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string(),
    status: z.string(),
    publishedDate: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const ConceptSearchResultSchema = z.object({
    entityType: z.literal("concept"),
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const SearchResultSchema = z.discriminatedUnion("entityType", [
    ArchiveSearchResultSchema,
    ConceptSearchResultSchema,
]);

export const SearchResponseSchema = z.object({
    resultList: z.array(SearchResultSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
