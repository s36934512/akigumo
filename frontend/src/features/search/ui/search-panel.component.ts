import { Component, inject, output, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { debounceTime, distinctUntilChanged } from "rxjs";

import { SearchApi } from "../api/search.api";

@Component({
    selector: "feature-search-panel",
    standalone: true,
    templateUrl: "./search-panel.component.html",
})
export class SearchPanelComponent {
    private readonly router = inject(Router);
    private readonly searchApi = inject(SearchApi);

    readonly close = output<void>();

    protected readonly queryText = signal("");

    private readonly debouncedQueryText = toSignal(
        toObservable(this.queryText).pipe(
            debounceTime(300),
            distinctUntilChanged(),
        ),
        { initialValue: "" },
    );

    protected readonly searchQuery = injectQuery(() => {
        const input = this.debouncedQueryText().trim();

        return {
            queryKey: ["search", input],
            enabled: input.length > 0,
            queryFn: () => this.searchApi.search(input),
        };
    });

    protected onQueryChange(value: string): void {
        this.queryText.set(value);
    }

    protected async onResultSelect(
        entityType: "archive" | "concept",
        id: string,
    ): Promise<void> {
        this.close.emit();

        if (entityType === "archive") {
            await this.router.navigate(["/archive", id]);
            return;
        }

        await this.router.navigate(["/ontology"], {
            queryParams: { conceptId: id },
        });
    }
}
