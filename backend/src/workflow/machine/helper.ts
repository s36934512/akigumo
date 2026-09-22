import type { MachineArgs } from "./schema.js";

export const shouldFailUnhandledEvent = ({ context, event }: MachineArgs) => {
    if (event.type.startsWith("xstate.")) {
        return false;
    }

    return context.nextIntent !== null;
};
