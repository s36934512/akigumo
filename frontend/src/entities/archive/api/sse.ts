import { z } from "zod";

const SseEventBaseSchema = z.object({
    timestamp: z.number().int().nonnegative(),
});

export const ArchiveChangedPayloadSchema = z.object({
    id: z.uuid(),
});

export const ArchiveChangedEventSchema = SseEventBaseSchema.extend({
    type: z.literal("ARCHIVE_CHANGED"),
    payload: ArchiveChangedPayloadSchema,
});

export const ArchiveDeletedPayloadSchema = z.object({
    id: z.uuid(),
});

export const ArchiveDeletedEventSchema = SseEventBaseSchema.extend({
    type: z.literal("ARCHIVE_DELETED"),
    payload: ArchiveDeletedPayloadSchema,
});
