import { z } from "zod";

export function extendDiscriminatedUnion<
    Discriminator extends string,
    Options extends [
        z.ZodObject<z.ZodRawShape>,
        ...z.ZodObject<z.ZodRawShape>[],
    ],
    Shape extends z.ZodRawShape,
>(
    discriminator: Discriminator,
    baseUnion: z.ZodDiscriminatedUnion<Options>,
    extension: Shape,
) {
    const extendedOptions = baseUnion.options.map((schema) =>
        schema.extend(extension),
    ) as unknown as {
        [K in keyof Options]: Options[K] extends z.ZodObject<
            infer RawShape,
            infer Config
        >
            ? z.ZodObject<RawShape & Shape, Config>
            : Options[K] extends z.ZodObject<infer RawShape>
              ? z.ZodObject<RawShape & Shape>
              : never;
    };

    return z.discriminatedUnion(discriminator, extendedOptions);
}

export function extendObjectDiscriminatedUnion<
    Discriminator extends string,
    Options extends [
        z.ZodObject<z.ZodRawShape>,
        ...z.ZodObject<z.ZodRawShape>[],
    ],
    ExtensionShape extends z.ZodRawShape,
>(
    discriminator: Discriminator,
    baseUnion: z.ZodDiscriminatedUnion<Options>,
    extensionSchema: z.ZodObject<ExtensionShape>,
) {
    return extendDiscriminatedUnion(
        discriminator,
        baseUnion,
        extensionSchema.shape,
    );
}
