import { provideHttpClient } from "@angular/common/http";
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideTanStackQuery, QueryClient } from "@tanstack/angular-query-experimental";

import { routes } from "./app.routes";
import { provideOptimus } from "@openng/optimus-ui/config";
import Aura from "@openng/optimus-ui-themes/aura";

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(),
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideClientHydration(),
        provideTanStackQuery(new QueryClient()),
        provideOptimus({ theme: { preset: Aura } }),
    ],
};
