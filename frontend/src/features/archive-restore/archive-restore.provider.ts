import { ArchiveRestoreApi } from "./api/archive-restore.api";
import { ArchiveRestoreMutation } from "./api/archive-restore.mutation";

export const archiveRestoreProviders = [
    ArchiveRestoreApi,
    ArchiveRestoreMutation,
];
