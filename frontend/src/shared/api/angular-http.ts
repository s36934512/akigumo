import type { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

export type AngularHttpConfig = {
    url: string;
    method: string;
    params?: Record<
        string,
        string | number | boolean | readonly (string | number | boolean)[]
    >;
    data?: unknown;
    headers?: Record<string, string>;
    responseType?: "json" | "blob" | "text" | "arraybuffer";
};

export const angularHttp = <T>(
    config: AngularHttpConfig,
    http: HttpClient,
): Promise<T> => {
    const options = {
        body: config.data,
        headers: config.headers,
        params: config.params,
        responseType: config.responseType ?? "json",
    };

    return firstValueFrom(
        http.request(config.method, config.url, options),
    ) as Promise<T>;
};

export type ErrorType<Error> = Error;
