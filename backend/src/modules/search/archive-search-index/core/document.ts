import type { Archive } from "#app/generated/prisma/client.js";

export type ArchiveSearchDocument = {
    id: string;
    name: string;
    description: string | null;
    type: Archive["type"];
    status: Archive["status"];
    publishedDate: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ArchiveSearchSource = Pick<
    Archive,
    | "id"
    | "name"
    | "description"
    | "type"
    | "status"
    | "publishedDate"
    | "createdAt"
    | "updatedAt"
>;

export function toArchiveSearchDocument(
    archive: ArchiveSearchSource,
): ArchiveSearchDocument {
    return {
        id: archive.id,
        name: archive.name,
        description: archive.description,
        type: archive.type,
        status: archive.status,
        publishedDate: archive.publishedDate?.toISOString() ?? null,
        createdAt: archive.createdAt.toISOString(),
        updatedAt: archive.updatedAt.toISOString(),
    };
}
