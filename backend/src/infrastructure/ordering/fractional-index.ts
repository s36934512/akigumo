import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

export function generatePosition(
    lower: string | null,
    upper: string | null,
): string {
    return generateKeyBetween(lower, upper);
}

export function generatePositions(
    count: number,
    lower: string | null = null,
    upper: string | null = null,
): string[] {
    return generateNKeysBetween(lower, upper, count);
}
