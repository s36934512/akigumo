export const FILE_PROCESSING_STRATEGIES = {
    ARCHIVE: {
        shouldUncompress: true,
        shouldTranscode: false,
        description: "壓縮檔",
    },
    IMAGE: {
        shouldUncompress: false,
        shouldTranscode: true,
        description: "圖片",
    },
    VIDEO: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: "影片",
    },
    DOC: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: "文件",
    },
    AUDIO: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: "音訊",
    },
    OTHERS: {
        shouldUncompress: false,
        shouldTranscode: false,
        description: "其他",
    },
} as const;
