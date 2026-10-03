import { z } from "zod";

export function createFlexibleSchema<T extends z.ZodTypeAny>(schema: T) {
    const arraySchema = z.array(schema);

    return {
        single: schema,
        array: arraySchema,
        either: z.union([schema, arraySchema]),
    };
}

export type InferFlexible<T extends ReturnType<typeof createFlexibleSchema>> = {
    single: z.infer<T["single"]>;
    array: z.infer<T["array"]>;
    either: z.infer<T["either"]>;
};
