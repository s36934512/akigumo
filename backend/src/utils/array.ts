export function uniqueArray<T>(items: T[]): T[] {
    return [...new Set(items)];
}
