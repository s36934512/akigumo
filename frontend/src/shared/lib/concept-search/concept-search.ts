import Fuse from "fuse.js";

import { fuseConfig } from "./config";

export function searchConcept<
    T extends {
        name: string;
        description?: string | null;
    },
>(conceptList: T[], keyword: string): T[] {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
        return conceptList;
    }

    const fuse = new Fuse(conceptList, fuseConfig);

    return fuse.search(normalizedKeyword).map(({ item }) => item);
}
