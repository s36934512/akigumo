import type { Routes } from "@angular/router";

import { ArchiveDetailPageComponent } from "#app/pages/archive-detail";
import { ConceptPageComponent } from "#app/pages/concept";
import { ExplorerPageComponent } from "#app/pages/explorer";

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
                path: "ontology",
                component: ConceptPageComponent,
            },
            {
                path: "archive/:archiveId",
                component: ArchiveDetailPageComponent,
            },
            {
                path: "",
                pathMatch: "full",
                redirectTo: "explorer",
            },
        ],
    },
];
