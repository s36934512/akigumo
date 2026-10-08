export const FILE_PROCESSING_STRATEGIES = {
    ARCHIVE: {
        shouldUncompress: true,
        shouldTranscode: false,
    },
    IMAGE: {
        shouldUncompress: false,
        shouldTranscode: true,
    },
    DEFAULT: {
        shouldUncompress: false,
        shouldTranscode: false,
    },
} as const;

export type FileProcessingStrategyKey = keyof typeof FILE_PROCESSING_STRATEGIES;

const EXTENSION_STRATEGY_MAP: Record<string, FileProcessingStrategyKey> = {
    // Archive
    zip: "ARCHIVE",
    rar: "ARCHIVE",
    "7z": "ARCHIVE",
    tar: "ARCHIVE",
    gz: "ARCHIVE",
    bz2: "ARCHIVE",
    xz: "ARCHIVE",

    // Image
    jpg: "IMAGE",
    jpeg: "IMAGE",
    png: "IMAGE",
    gif: "IMAGE",
    webp: "IMAGE",
    bmp: "IMAGE",
    tif: "IMAGE",
    tiff: "IMAGE",
    avif: "IMAGE",
    heic: "IMAGE",
    heif: "IMAGE",
};

export function resolveFileProcessingStrategy(extensionCode: string | null) {
    if (!extensionCode) {
        return FILE_PROCESSING_STRATEGIES.DEFAULT;
    }

    const strategyKey = EXTENSION_STRATEGY_MAP[extensionCode.toLowerCase()];

    return strategyKey
        ? FILE_PROCESSING_STRATEGIES[strategyKey]
        : FILE_PROCESSING_STRATEGIES.DEFAULT;
}
