import { Component, computed, input, output, signal } from "@angular/core";

import { OverlayPanelDirective } from "#app/shared/ui/overlay-panel";

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
    readonly archive = input.required<Archive>();
    readonly selected = input(false);

    readonly cardClick = output<string>();
    readonly cardDoubleClick = output<string>();

    readonly imageErrorFileId = signal<string | null>(null);
    readonly previewErrorFileId = signal<string | null>(null);
    readonly previewSize = signal<PreviewSize | null>(null);

    readonly coverUrl = computed(() => {
        const fileId = this.archive().currentFileId;

        if (!fileId || this.imageErrorFileId() === fileId) {
            return null;
        }

        return `/api/v1/raw/${encodeURIComponent(fileId)}`;
    });

    readonly previewUrl = computed(() => {
        const fileId = this.archive().currentFileId;

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
