import { z } from "zod";

const SseEventBaseSchema = z.object({
    timestamp: z.number().int().nonnegative(),
});

export const ArchiveChangedEventSchema = SseEventBaseSchema.extend({
    type: z.literal("ARCHIVE_CHANGED"),
    payload: z.object({
        id: z.uuid(),
    }),
});

export const ArchiveDeletedEventSchema = SseEventBaseSchema.extend({
    type: z.literal("ARCHIVE_DELETED"),
    payload: z.object({
        id: z.uuid(),
    }),
});

export const ConceptDeletedEventSchema = SseEventBaseSchema.extend({
    type: z.literal("CONCEPT_DELETED"),
    payload: z.object({
        id: z.uuid(),
    }),
});

export const SseEventSchema = z.discriminatedUnion("type", [
    ArchiveChangedEventSchema,
    ArchiveDeletedEventSchema,
    ConceptDeletedEventSchema,
]);

export type SseEvent = z.infer<typeof SseEventSchema>;
