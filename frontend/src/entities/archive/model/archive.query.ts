import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";

import { ArchiveApi } from "../api/archive.api";
import { ArchiveDeletionSummarySchema } from "./archive-deletion";
import { type Archive, ArchiveSchema } from "./types";

export const archiveQueryKey = ["archive"] as const;

export const archiveListQueryKey = [...archiveQueryKey, "list"] as const;

export const archiveReferenceQueryKey = (conceptId: string) =>
    [...archiveQueryKey, "reference", conceptId] as const;

export const archiveDetailQueryKey = (archiveId: string) =>
    [...archiveQueryKey, "detail", archiveId] as const;

export const archiveChildrenQueryKey = (archiveId: string) =>
    [...archiveQueryKey, "children", archiveId] as const;

export const archiveTrashQueryKey = (parentId?: string) =>
    parentId
        ? ([...archiveQueryKey, "trash", parentId] as const)
        : ([...archiveQueryKey, "trash"] as const);

@Service()
export class ArchiveQuery {
    private readonly archiveApi = inject(ArchiveApi);

    public list() {
        return queryOptions({
            queryKey: archiveListQueryKey,
            queryFn: async (): Promise<Archive[]> => {
                const response = await this.archiveApi.getList();

                const archiveList: Archive[] = [];

                for (const item of response) {
                    const result = ArchiveSchema.safeParse(item);

                    if (!result.success) {
                        continue;
                    }

                    archiveList.push(result.data);
                }

                return archiveList;
            },
        });
    }

    public children(archiveId: string) {
        return queryOptions({
            queryKey: archiveChildrenQueryKey(archiveId),
            queryFn: async (): Promise<Archive[]> => {
                const response = await this.archiveApi.getChildren(archiveId);

                const archiveList: Archive[] = [];

                for (const item of response) {
                    const result = ArchiveSchema.safeParse(item);

                    if (!result.success) {
                        continue;
                    }

                    archiveList.push(result.data);
                }

                return archiveList;
            },
        });
    }

    public referenceByConcept(conceptId: string) {
        return queryOptions({
            queryKey: archiveReferenceQueryKey(conceptId),
            queryFn: () => this.archiveApi.getReferenceByConcept(conceptId),
        });
    }

    public detail(archiveId: string) {
        return queryOptions({
            queryKey: archiveDetailQueryKey(archiveId),
            queryFn: async (): Promise<Archive> => {
                const response = await this.archiveApi.getById(archiveId);

                return ArchiveSchema.parse(response);
            },
        });
    }

    public trash(parentId?: string) {
        return queryOptions({
            queryKey: archiveTrashQueryKey(parentId),
            queryFn: async () => {
                const response = await this.archiveApi.getTrash(parentId);

                if (response.type === "trash") {
                    return {
                        ...response,
                        deletionList: response.deletionList.map((deletion) =>
                            ArchiveDeletionSummarySchema.parse(deletion),
                        ),
                    };
                }

                return {
                    ...response,
                    archiveList: response.archiveList.map((archive) =>
                        ArchiveSchema.parse(archive),
                    ),
                };
            },
        });
    }
}
