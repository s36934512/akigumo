export const fuseConfig = {
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
