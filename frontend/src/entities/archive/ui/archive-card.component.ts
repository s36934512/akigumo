import {
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";

import { OverlayPanelDirective } from "#app/shared/ui/overlay-panel";

import { ArchiveQuery } from "../model/archive.query";
import { getArchiveIconPath } from "../model/archive-icon";
import type { Archive } from "../model/types";

@Component({
    selector: "entity-archive-card",
    standalone: true,
    imports: [OverlayPanelDirective],
    templateUrl: "./archive-card.component.html",
    styleUrl: "./archive-card.component.scss",
})
export class ArchiveCardComponent {
    private readonly archiveQuery = inject(ArchiveQuery);

    readonly archive = input.required<Archive>();
    readonly selected = input(false);

    readonly cardClick = output<string>();
    readonly cardDoubleClick = output<string>();

    readonly imageErrorFileId = signal<string | null>(null);
    readonly previewErrorFileId = signal<string | null>(null);

    readonly previewIndex = signal(0);

    readonly childrenQuery = injectQuery(() =>
        this.archiveQuery.children(this.archive().id),
    );

    readonly currentFileId = computed(() => this.archive().currentFileId);

    readonly previewChildren = computed(() =>
        (this.childrenQuery.data() ?? []).filter(
            (child) => child.currentFileId != null,
        ),
    );

    readonly hasPreviewChildren = computed(
        () => this.previewChildren().length > 0,
    );

    readonly previewFileId = computed(() => {
        const children = this.previewChildren();

        if (children.length > 0) {
            const index = this.previewIndex() % children.length;

            return children[index].currentFileId;
        }

        return this.currentFileId();
    });

    readonly previewName = computed(() => {
        const children = this.previewChildren();

        if (children.length > 0) {
            const index = this.previewIndex() % children.length;

            return children[index].name;
        }

        return this.archive().name;
    });

    readonly previewUrl = computed(() => {
        const fileId = this.previewFileId();

        if (!fileId || this.previewErrorFileId() === fileId) {
            return null;
        }

        return `/api/v1/raw/${encodeURIComponent(fileId)}`;
    });

    readonly coverUrl = computed(() => {
        const fileId = this.currentFileId();

        if (!fileId || this.imageErrorFileId() === fileId) {
            return null;
        }

        return `/api/v1/raw/${encodeURIComponent(fileId)}`;
    });

    readonly iconPath = computed(() => getArchiveIconPath(this.archive().type));

    onClick(): void {
        this.cardClick.emit(this.archive().id);
    }

    onDoubleClick(): void {
        this.cardDoubleClick.emit(this.archive().id);
    }

    protected onPreviewWheel(event: WheelEvent): void {
        const children = this.previewChildren();

        if (children.length <= 1) {
            return;
        }

        event.preventDefault();

        const delta = Math.sign(event.deltaY);

        if (delta === 0) {
            return;
        }

        this.previewIndex.update(
            (index) => (index + delta + children.length) % children.length,
        );
    }

    onImageError(): void {
        const fileId = this.currentFileId();

        if (fileId) {
            this.imageErrorFileId.set(fileId);
        }
    }

    onPreviewImageError(): void {
        const fileId = this.previewFileId();

        if (fileId) {
            this.previewErrorFileId.set(fileId);
        }
    }
}
