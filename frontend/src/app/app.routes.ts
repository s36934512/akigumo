import type { Routes } from "@angular/router";

import { ExplorerPageComponent } from "#app/pages/explorer/ui/explorer.component";

import { AppShellComponent } from "./layouts/app-shell/app-shell.component";

export const routes: Routes = [
    {
        path: "",
        component: AppShellComponent,
        children: [
            {
                path: "explorer",
                component: ExplorerPageComponent,
            },
            {
                path: "",
                pathMatch: "full",
                redirectTo: "explorer",
            },
        ],
    },
];
