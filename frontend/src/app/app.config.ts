import { provideHttpClient } from "@angular/common/http";
import {
    type ApplicationConfig,
    provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideOptimus } from "@openng/optimus-ui/config";
import {
    provideTanStackQuery,
    QueryClient,
} from "@tanstack/angular-query-experimental";

import { routes } from "./app.routes";
import { AkigumoPreset } from "./shared/styles/akigumo.preset";

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(),
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideTanStackQuery(new QueryClient()),
        provideOptimus({
            theme: {
                preset: AkigumoPreset,
            },
        }),
    ],
};
