import { provideHttpClient } from "@angular/common/http";
import {
    type ApplicationConfig,
    provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import {
    provideTanStackQuery,
    QueryClient,
} from "@tanstack/angular-query-experimental";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(),
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideClientHydration(),
        provideTanStackQuery(new QueryClient()),
    ],
};
