import type { StateValue } from "xstate";

export function serializeWorkflowStatus(value: StateValue): string {
    if (typeof value === "string") {
        return value;
    }

    return Object.entries(value)
        .flatMap(([key, nestedValue]) => {
            if (typeof nestedValue === "string") {
                return [`${key}:${nestedValue}`];
            }

            return [key];
        })
        .join(":");
}
