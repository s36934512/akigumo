import { z } from "zod";

export const ErrorDetailSchema = z.object({
    code: z.string(), // 例如: 'UPLOAD_TIMEOUT', 'UNSUPPORTED_MIME'

    message: z.preprocess((val) => {
        return JSON.parse(val as string);
    }, z.string()), // 給開發者看的詳細訊息

    displayMessage: z.string(), // 給用戶看的友好訊息 (i18n 鍵值)

    timestamp: z.iso.datetime(),
    path: z.string().optional(), // 發生在哪個階段 (e.g., 'TUS_UPLOAD')

    originalError: z.any().optional(), // 原始錯誤（可選，通常在開發環境紀錄）
});
