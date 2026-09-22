import { z } from "zod";

export const MachineContextSchema = z.object({
    error: z.unknown().nullable(),
    nextIntent: z.unknown().nullable(),
});

export type MachineContext = z.infer<typeof MachineContextSchema>;

export const MachineEventSchema = z.object({
    type: z.string(),
});

export type MachineEvent = z.infer<typeof MachineEventSchema>;

export type MachineArgs = {
    context: MachineContext;
    event: MachineEvent;
};
