import {
    SearchSyncEntityType,
    type SearchSyncOperation,
} from "#app/generated/prisma/enums.js";
import { prisma } from "#app/infrastructure/database/prisma.js";

import { toArchiveSearchDocument } from "../../archive-search-index/core/document.js";
import {
    deleteArchiveSearchDocument,
    upsertArchiveSearchDocument,
} from "../../archive-search-index/core/service.js";
import { toConceptSearchDocument } from "../../ontology-search-index/core/document.js";
import {
    deleteConceptSearchDocument,
    upsertConceptSearchDocument,
} from "../../ontology-search-index/core/service.js";

export type SearchSyncRecord = {
    id: bigint;
    entityType: SearchSyncEntityType;
    entityId: string;
    operation: SearchSyncOperation;
    processingId: string;
};

async function syncArchive(record: SearchSyncRecord): Promise<void> {
    if (record.operation === "DELETE") {
        await deleteArchiveSearchDocument(record.entityId);
        return;
    }

    const archive = await prisma.archive.findUnique({
        where: {
            id: record.entityId,
        },
    });

    if (!archive || archive.deletedAt !== null) {
        await deleteArchiveSearchDocument(record.entityId);
        return;
    }

    const document = toArchiveSearchDocument(archive);

    await upsertArchiveSearchDocument(document);
}

async function syncConcept(record: SearchSyncRecord): Promise<void> {
    if (record.operation === "DELETE") {
        await deleteConceptSearchDocument(record.entityId);
        return;
    }

    const concept = await prisma.concept.findUnique({
        where: {
            id: record.entityId,
        },
    });

    if (!concept || concept.deletedAt !== null) {
        await deleteConceptSearchDocument(record.entityId);
        return;
    }

    const document = toConceptSearchDocument(concept);

    await upsertConceptSearchDocument(document);
}

export async function syncSearchEntity(
    record: SearchSyncRecord,
): Promise<void> {
    switch (record.entityType) {
        case SearchSyncEntityType.ARCHIVE:
            return syncArchive(record);

        case SearchSyncEntityType.CONCEPT:
            return syncConcept(record);
    }
}
