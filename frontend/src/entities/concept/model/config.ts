import type { IFuseOptions } from "fuse.js";

import type { Concept } from "./concept";

export const fuseConfig: IFuseOptions<Concept> = {
    keys: [
        { name: "name", weight: 2 },
        { name: "description", weight: 1 },
    ],
    threshold: 0.4,
    distance: 0,
    ignoreLocation: true,
    useExtendedSearch: true,
    minMatchCharLength: 1,
};
