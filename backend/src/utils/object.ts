export function isPlainObject(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeValue(value: unknown): unknown {
    if (typeof value === "string") {
        return value.trim().toLowerCase();
    }

    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }

    if (isPlainObject(value)) {
        return Object.keys(value)
            .sort()
            .reduce<Record<string, unknown>>((result, key) => {
                result[key] = normalizeValue(value[key]);
                return result;
            }, {});
    }

    return value;
}
