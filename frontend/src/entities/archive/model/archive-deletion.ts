import { z } from "zod";
import { ArchiveSchema } from "./types";

export const ArchiveDeletionSummarySchema = z.object({
    id: z.uuid(),
    rootArchiveId: z.uuid(),
    deletedAt: z.coerce.date(),
    archive: ArchiveSchema.optional(),
    archiveCount: z.number().min(0),
});

export type ArchiveDeletionSummary = z.infer<
    typeof ArchiveDeletionSummarySchema
>;
