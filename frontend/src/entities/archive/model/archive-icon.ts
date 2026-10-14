import type { Archive } from "./types";

const archiveIconPathMap = {
    WORK: "M7 7V6a5 5 0 0 1 10 0v1h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Zm2 0h6V6a3 3 0 1 0-6 0v1Zm0 8v3h6v-3H9Z",
    SERIES: "M12 2 2 7l10 5 10-5-10-5Zm0 9L2 16l10 5 10-5-10-5Z",
    COLLECTION: "M3 4h4v16H3V4Zm7-2h4v18h-4V2Zm7 4h4v14h-4V6Z",
    FILE_CONTAINER:
        "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2h-2V9H5v8h6v2H5a2 2 0 0 1-2-2V7Zm15 6a3 3 0 0 0-3 3v1h-1v5h8v-5h-1v-1a3 3 0 0 0-3-3Zm-1 4v-1a1 1 0 1 1 2 0v1h-2Z",
} satisfies Record<Archive["type"], string>;

export function getArchiveIconPath(type: Archive["type"]): string {
    return archiveIconPathMap[type];
}
