import { z } from "zod";

export const TypeConstrainedRecordSchema = z.record(
    z.string(),
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()), // 頂多允許標籤(Tags)這類型的字串陣列
    ]),
);
export type TypeConstrainedRecord = z.infer<typeof TypeConstrainedRecordSchema>;
