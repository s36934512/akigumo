import { provideHttpClient } from "@angular/common/http";
import {
    type ApplicationConfig,
    provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideOptimus } from "@openng/optimus-ui/config";
import Aura from "@openng/optimus-ui-themes/aura";
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
        provideClientHydration(),
        provideTanStackQuery(new QueryClient()),
        provideOptimus({
            theme: {
                preset: AkigumoPreset,
            },
        }),
    ],
};
