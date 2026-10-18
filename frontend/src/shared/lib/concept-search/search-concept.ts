import Fuse from "fuse.js";

import { fuseConfig } from "./config";

export function createConceptSearcher<
    T extends {
        name: string;
        description?: string | null;
    },
>(conceptList: T[]) {
    const fuse = new Fuse(conceptList, fuseConfig);

    return (keyword: string): T[] => {
        const normalizedKeyword = keyword.trim();

        if (!normalizedKeyword) {
            return conceptList;
        }

        return fuse.search(normalizedKeyword).map(({ item }) => item);
    };
}
