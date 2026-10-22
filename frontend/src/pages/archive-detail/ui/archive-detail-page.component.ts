import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { map } from "rxjs";

import { ArchiveQuery } from "#app/entities/archive";
import { ArchiveDetailComponent } from "#app/widgets/archive-detail";

@Component({
    selector: "page-archive-detail",
    standalone: true,
    imports: [ArchiveDetailComponent],
    templateUrl: "./archive-detail-page.component.html",
    styleUrl: "./archive-detail-page.component.scss",
})
export class ArchiveDetailPageComponent {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly archiveQuery = inject(ArchiveQuery);

    readonly archiveId = toSignal(
        this.activatedRoute.paramMap.pipe(
            map((params) => params.get("archiveId")),
        ),
        {
            initialValue:
                this.activatedRoute.snapshot.paramMap.get("archiveId"),
        },
    );

    readonly archiveDetailQuery = injectQuery(() => {
        const archiveId = this.archiveId();

        return {
            ...this.archiveQuery.detail(archiveId ?? ""),
            enabled: !!archiveId,
        };
    });

    readonly archive = computed(() => this.archiveDetailQuery.data());

    protected onBack(): void {
        void this.router.navigate(["/explorer"]);
    }

    protected onRetry(): void {
        void this.archiveDetailQuery.refetch();
    }
}
