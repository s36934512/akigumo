import { z } from "zod";

type EventDefinition = {
    code: string;
    resultSchema: z.ZodType;
};

type EventCodes<
    TProcessor extends string,
    TDefinitions extends readonly EventDefinition[],
> = {
    [TDefinition in TDefinitions[number] as TDefinition["code"]]: `${TProcessor}_${TDefinition["code"]}`;
} & {
    schemaList: {
        [K in keyof TDefinitions]: TDefinitions[K] extends {
            code: infer TCode extends string;
            resultSchema: infer TResultSchema extends z.ZodType;
        }
            ? z.ZodObject<{
                  type: z.ZodLiteral<`${TProcessor}_${TCode}`>;
                  result: TResultSchema;
              }>
            : never;
    };
};

export function createEventCodes<
    const TProcessor extends string,
    const TDefinitions extends readonly [EventDefinition, ...EventDefinition[]],
>(
    processorName: TProcessor,
    definitionList: TDefinitions,
): EventCodes<TProcessor, TDefinitions> {
    const schemaList = definitionList.map(({ code, resultSchema }) =>
        z.object({
            type: z.literal(`${processorName}_${code}`),
            result: resultSchema,
        }),
    ) as EventCodes<TProcessor, TDefinitions>["schemaList"];

    const eventCodes = Object.fromEntries(
        definitionList.map(({ code }) => [code, `${processorName}_${code}`]),
    );

    return {
        ...eventCodes,
        schemaList,
    } as EventCodes<TProcessor, TDefinitions>;
}

export const GraphIntentCreatedEvents = createEventCodes(
    "GRAPH_INTENT_CREATED",
    [
        {
            code: "SUCCEEDED",
            resultSchema: z.unknown(),
        },
        {
            code: "FAILED",
            resultSchema: z.object({
                reason: z.string(),
            }),
        },
    ],
);

export const PythonEvents = createEventCodes("PYTHON", [
    {
        code: "SUCCEEDED",
        resultSchema: z.unknown(),
    },
    {
        code: "FAILED",
        resultSchema: z.object({
            reason: z.string(),
        }),
    },
]);
