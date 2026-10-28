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

interface PreviewSize {
    width: number;
    height: number;
}

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
    readonly previewSize = signal<PreviewSize | null>(null);
    readonly previewIndex = signal(0);

    readonly archiveListQuery = injectQuery(() => this.archiveQuery.list());

    readonly archiveList = computed(() => {
        return this.archiveListQuery.data();
    });

    readonly childrenQuery = injectQuery(() =>
        this.archiveQuery.children(this.archive().id),
    );

    readonly coverUrl = computed(() => {
        const fileId = this.archive().currentFileId;

        if (!fileId || this.imageErrorFileId() === fileId) {
            return null;
        }

        return `/api/v1/raw/${encodeURIComponent(fileId)}`;
    });

    readonly previewChildren = computed(() =>
        (this.childrenQuery.data() ?? []).filter(
            (child) => child.currentFileId != null,
        ),
    );

    readonly previewFileId = computed(
        () =>
            this.previewChildren()[this.previewIndex()]?.currentFileId ?? null,
    );

    readonly previewName = computed(
        () =>
            this.previewChildren()[this.previewIndex()]?.name ??
            this.archive().name,
    );

    readonly previewUrl = computed(() => {
        const fileId = this.previewFileId();

        if (!fileId || this.previewErrorFileId() === fileId) {
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
        event.preventDefault();

        const children = this.previewChildren();
        if (children.length <= 1) {
            return;
        }

        const delta = Math.sign(event.deltaY);
        if (delta === 0) {
            return;
        }

        this.previewIndex.update(
            (index) => (index + delta + children.length) % children.length,
        );
    }

    onImageError(): void {
        const fileId = this.archive().currentFileId;

        if (fileId) {
            this.imageErrorFileId.set(fileId);
        }
    }

    onPreviewImageLoad(event: Event): void {
        const image = event.target;

        if (!(image instanceof HTMLImageElement)) {
            return;
        }

        const { naturalWidth, naturalHeight } = image;

        if (!naturalWidth || !naturalHeight) {
            return;
        }

        const maxWidth = Math.max(1, window.innerWidth - 32);
        const maxHeight = Math.max(1, window.innerHeight - 120);

        const ratio = Math.min(
            maxWidth / naturalWidth,
            maxHeight / naturalHeight,
            1,
        );

        this.previewSize.set({
            width: Math.round(naturalWidth * ratio),
            height: Math.round(naturalHeight * ratio),
        });
    }

    onPreviewImageError(): void {
        const fileId = this.archive().currentFileId;

        if (fileId) {
            this.previewErrorFileId.set(fileId);
        }

        this.previewSize.set(null);
    }
}
