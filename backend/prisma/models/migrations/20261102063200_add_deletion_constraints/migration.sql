CREATE UNIQUE INDEX "ArchiveDeletionItem_active_archiveId_key"
ON "ArchiveDeletionItem" ("archiveId")
WHERE "resolvedAt" IS NULL;

ALTER TABLE "ArchiveDeletionItem"
ADD CONSTRAINT "ArchiveDeletionItem_resolution_check"
CHECK (
    ("resolvedAt" IS NULL AND "resolution" IS NULL)
    OR
    ("resolvedAt" IS NOT NULL AND "resolution" IS NOT NULL)
);