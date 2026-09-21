type ActionDefinition = {
    code: string;
};

export function createEventCodes<
    const T extends Record<string, { readonly code: string }>,
>(actions: T) {
    type SuccessResult = {
        [K in keyof T as `${T[K]["code"]}_SUCCESS`]: `${T[K]["code"]}_SUCCESS`;
    };

    type FailureResult = {
        [K in keyof T as `${T[K]["code"]}_FAILURE`]: `${T[K]["code"]}_FAILURE`;
    };

    type ReturnType = SuccessResult & FailureResult;

    const result = {} as Record<string, string>;

    for (const key in actions) {
        const code = actions[key].code;

        const successKey = `${code}_SUCCESS` as const;
        const failureKey = `${code}_FAILURE` as const;

        result[successKey] = successKey;
        result[failureKey] = failureKey;
    }

    return result as ReturnType;
}

export type InferActionCode<T extends Record<string, ActionDefinition>> =
    T[keyof T]["code"];

export type InferEventCode<T extends Record<string, ActionDefinition>> =
    ReturnType<typeof createEventCodes<T>>[keyof ReturnType<
        typeof createEventCodes<T>
    >];
