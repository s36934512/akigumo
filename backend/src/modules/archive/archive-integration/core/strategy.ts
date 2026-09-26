import type { FILE_PROCESSING_STRATEGIES } from "../constants.js";

export function resolveStrategyKey(
    categoryCode: string | undefined,
): keyof typeof FILE_PROCESSING_STRATEGIES {
    const normalized = (categoryCode ?? "").trim().toUpperCase();

    if (normalized === "IMAGE") return "IMAGE";
    if (normalized === "ARCHIVE") return "ARCHIVE";
    if (normalized === "VIDEO") return "VIDEO";
    if (normalized === "AUDIO") return "AUDIO";
    if (normalized === "DOCUMENT" || normalized === "DOC") return "DOC";
    if (normalized === "OTHER" || normalized === "OTHERS") return "OTHERS";

    return "OTHERS";
}
