import { Component, inject, signal } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { DefaultService } from "#app/shared/api";

@Component({
    selector: "feature-search",
    standalone: true,
    templateUrl: "./search.component.html",
})
export class SearchComponent {
    private readonly defaultService = inject(DefaultService);

    protected readonly queryText = signal("");
    protected readonly searchType = signal<"archive" | "concept">("archive");

    protected readonly searchQuery = injectQuery(() => ({
        queryKey: ["search", this.searchType(), this.queryText()],
        enabled: this.queryText().trim().length > 0,
        queryFn: () =>
            this.defaultService.getApiV1Search({
                q: this.queryText(),
                type: this.searchType(),
                limit: 20,
                offset: 0,
            }),
    }));
}
