import { z } from "zod";

type EventDefinition = {
    code: string;
    dataSchema: z.ZodType;
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
            dataSchema: infer TDataSchema extends z.ZodType;
        }
            ? z.ZodObject<{
                  type: z.ZodLiteral<`${TProcessor}_${TCode}`>;
                  data: TDataSchema;
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
    const schemaList = definitionList.map(({ code, dataSchema }) =>
        z.object({
            type: z.literal(`${processorName}_${code}`),
            data: dataSchema,
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
            dataSchema: z.unknown(),
        },
        {
            code: "FAILED",
            dataSchema: z.object({
                reason: z.string(),
            }),
        },
    ],
);

export const PythonEvents = createEventCodes("PYTHON", [
    {
        code: "SUCCEEDED",
        dataSchema: z.unknown(),
    },
    {
        code: "FAILED",
        dataSchema: z.object({
            reason: z.string(),
        }),
    },
]);
