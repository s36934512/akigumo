import { inject, Service } from "@angular/core";
import { queryOptions } from "@tanstack/angular-query-experimental";

import { ArchiveApi } from "../api/archive.api";
import { type Archive, ArchiveSchema } from "./types";

export const archiveQueryKey = ["archive"] as const;

export const archiveListQueryKey = [...archiveQueryKey, "list"] as const;

@Service()
export class ArchiveQuery {
    private readonly archiveApi = inject(ArchiveApi);

    public list() {
        return queryOptions({
            queryKey: ["archive", "list"] as const,
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
}
