import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";

import { ArchiveApi } from "../api/archive.api";
import { type Archive, ArchiveSchema } from "./types";

export const archiveQueryKey = ["archive"] as const;

export const archiveListQueryKey = [...archiveQueryKey, "list"] as const;

export const archiveReferenceQueryKey = (conceptId: string) =>
    [...archiveQueryKey, "reference", conceptId] as const;

export const archiveDetailQueryKey = (archiveId: string) =>
    [...archiveQueryKey, "detail", archiveId] as const;

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
}
