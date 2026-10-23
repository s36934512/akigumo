import {
    Component,
    computed,
    type ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild,
} from "@angular/core";
import {
    PanzoomAction,
    type PanzoomInstance,
} from "@fancyapps/ui/dist/panzoom";
import { DialogService } from "@openng/optimus-ui/dynamicdialog";

import type { Archive } from "#app/entities/archive";
import { AddArchiveConceptComponent } from "#app/features/archive-concept";
import { AddArchiveConceptPairComponent } from "#app/features/archive-concept-pair";
import { ArchiveInfoComponent } from "#app/features/archive-info";
import { PanzoomDirective } from "#app/shared/lib/panzoom";

type ArchiveDetailSection = "info" | "content";

@Component({
    selector: "widget-archive-detail",
    standalone: true,
    imports: [ArchiveInfoComponent, PanzoomDirective],
    providers: [DialogService],
    templateUrl: "./archive-detail.component.html",
    styleUrl: "./archive-detail.component.scss",
})
export class ArchiveDetailComponent {
    private readonly dialogService = inject(DialogService);

    readonly archive = input.required<Archive>();
    readonly back = output<void>();

    readonly activeSection = signal<ArchiveDetailSection>("info");
    readonly imageLoaded = signal(false);
    readonly imageError = signal(false);

    private panzoomInstance?: PanzoomInstance;
    private minimapDrag?: {
        pointerId: number;
        lastX: number;
        lastY: number;
    };

    private readonly minimapContainer =
        viewChild<ElementRef<HTMLDivElement>>("minimapContainer");

    private readonly minimapImage =
        viewChild<ElementRef<HTMLImageElement>>("minimapImage");

    private readonly minimapBox =
        viewChild<ElementRef<HTMLDivElement>>("minimapBox");

    readonly fileUrl = computed(() => {
        const fileId = this.archive().currentFileId;

        return fileId ? `/api/v1/raw/${encodeURIComponent(fileId)}` : null;
    });

    protected setSection(section: ArchiveDetailSection): void {
        this.activeSection.set(section);
    }

    protected onBack(): void {
        this.back.emit();
    }

    protected onImageLoad(): void {
        this.imageLoaded.set(true);
        this.imageError.set(false);
    }

    protected onImageError(): void {
        this.imageLoaded.set(false);
        this.imageError.set(true);
    }

    protected onAddConcept(): void {
        this.dialogService.open(AddArchiveConceptComponent, {
            header: "新增 Concept",
            width: "40rem",
            modal: true,
            inputValues: {
                archiveId: this.archive().id,
            },
        });
    }

    protected onAddConceptPair(): void {
        this.dialogService.open(AddArchiveConceptPairComponent, {
            header: "新增 Concept Pair",
            width: "40rem",
            modal: true,
            inputValues: {
                archiveId: this.archive().id,
            },
        });
    }

    protected onPanzoomChange(instance: PanzoomInstance): void {
        if (this.panzoomInstance === instance) {
            return;
        }

        this.panzoomInstance = instance;

        instance.on("render", () => {
            this.updateMinimap(instance);
        });

        instance.on("ready", () => {
            this.updateMinimap(instance);
        });

        this.updateMinimap(instance);
    }

    protected onMinimapPointerDown(event: PointerEvent): void {
        const miniContainer = this.minimapContainer()?.nativeElement;
        const miniBox = this.minimapBox()?.nativeElement;

        if (!miniContainer || !miniBox || !this.panzoomInstance) {
            return;
        }

        event.preventDefault();

        const isDraggingBox = miniBox.contains(event.target as Node);

        if (isDraggingBox) {
            this.minimapDrag = {
                pointerId: event.pointerId,
                lastX: event.clientX,
                lastY: event.clientY,
            };

            miniContainer.setPointerCapture(event.pointerId);
            return;
        }

        // 點擊小地圖：將紅框中心移到點擊位置。
        const containerRect = miniContainer.getBoundingClientRect();
        const boxRect = miniBox.getBoundingClientRect();

        const clickX = event.clientX - containerRect.left;
        const clickY = event.clientY - containerRect.top;

        const boxCenterX =
            boxRect.left - containerRect.left + boxRect.width / 2;
        const boxCenterY = boxRect.top - containerRect.top + boxRect.height / 2;

        this.panPanzoomByMinimapDelta(clickX - boxCenterX, clickY - boxCenterY);
    }

    protected onMinimapPointerMove(event: PointerEvent): void {
        const drag = this.minimapDrag;

        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();

        const deltaX = event.clientX - drag.lastX;
        const deltaY = event.clientY - drag.lastY;

        drag.lastX = event.clientX;
        drag.lastY = event.clientY;

        this.panPanzoomByMinimapDelta(deltaX, deltaY);
    }

    protected onMinimapPointerUp(event: PointerEvent): void {
        if (this.minimapDrag?.pointerId !== event.pointerId) {
            return;
        }

        this.minimapDrag = undefined;

        const miniContainer = this.minimapContainer()?.nativeElement;

        if (miniContainer?.hasPointerCapture(event.pointerId)) {
            miniContainer.releasePointerCapture(event.pointerId);
        }
    }

    private updateMinimap(panzoom: PanzoomInstance | undefined): void {
        const miniContainerRef = this.minimapContainer();
        const miniBoxRef = this.minimapBox();
        const miniImage = this.minimapImage()?.nativeElement;

        if (
            !panzoom ||
            !miniContainerRef ||
            !miniBoxRef ||
            !miniImage?.naturalWidth ||
            !miniImage.naturalHeight
        ) {
            return;
        }

        const container = panzoom.getContainer();
        const content = panzoom.getContent();

        if (!container || !content) {
            return;
        }

        const miniContainer = miniContainerRef.nativeElement;
        const miniBox = miniBoxRef.nativeElement;

        const containerRect = container.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();

        const miniWidth = miniContainer.clientWidth;
        const miniHeight = miniContainer.clientHeight;

        if (
            !miniWidth ||
            !miniHeight ||
            !containerRect.width ||
            !containerRect.height ||
            !contentRect.width ||
            !contentRect.height
        ) {
            return;
        }

        // 計算縮圖中圖片實際顯示的尺寸，對應 object-fit: contain。
        const imageRatio = miniImage.naturalWidth / miniImage.naturalHeight;
        const miniRatio = miniWidth / miniHeight;

        let imageWidth: number;
        let imageHeight: number;

        if (imageRatio > miniRatio) {
            imageWidth = miniWidth;
            imageHeight = miniWidth / imageRatio;
        } else {
            imageHeight = miniHeight;
            imageWidth = miniHeight * imageRatio;
        }

        // 圖片在小地圖中的起始位置，排除 contain 產生的留白。
        const imageLeft = (miniWidth - imageWidth) / 2;
        const imageTop = (miniHeight - imageHeight) / 2;

        // 將大圖目前的實際顯示尺寸映射到小地圖。
        const scaleX = imageWidth / contentRect.width;
        const scaleY = imageHeight / contentRect.height;

        // 紅框代表大圖容器目前看得到的範圍。
        // 限制紅框不超出圖片實際顯示區域。
        const boxWidth = Math.min(imageWidth, containerRect.width * scaleX);
        const boxHeight = Math.min(imageHeight, containerRect.height * scaleY);

        // 取得大圖內容相對於可視容器的位置。
        const contentLeft = contentRect.left - containerRect.left;
        const contentTop = contentRect.top - containerRect.top;

        // 將大圖內容位置換算成小地圖上的紅框位置。
        const boxLeft = imageLeft - contentLeft * scaleX;
        const boxTop = imageTop - contentTop * scaleY;

        // 確保紅框始終位於圖片範圍內。
        const minLeft = imageLeft;
        const maxLeft = imageLeft + imageWidth - boxWidth;
        const minTop = imageTop;
        const maxTop = imageTop + imageHeight - boxHeight;

        miniBox.style.width = `${boxWidth}px`;
        miniBox.style.height = `${boxHeight}px`;
        miniBox.style.left = `${Math.max(minLeft, Math.min(boxLeft, maxLeft))}px`;
        miniBox.style.top = `${Math.max(minTop, Math.min(boxTop, maxTop))}px`;
    }

    private panPanzoomByMinimapDelta(deltaX: number, deltaY: number): void {
        const panzoom = this.panzoomInstance;
        const miniContainer = this.minimapContainer()?.nativeElement;
        const miniImage = this.minimapImage()?.nativeElement;

        if (
            !panzoom ||
            !miniContainer ||
            !miniImage?.naturalWidth ||
            !miniImage.naturalHeight
        ) {
            return;
        }

        const container = panzoom.getContainer();
        const content = panzoom.getContent();

        if (!container || !content) {
            return;
        }

        const contentRect = content.getBoundingClientRect();
        const miniWidth = miniContainer.clientWidth;
        const miniHeight = miniContainer.clientHeight;

        if (
            !miniWidth ||
            !miniHeight ||
            !contentRect.width ||
            !contentRect.height
        ) {
            return;
        }

        // 計算小地圖中圖片實際顯示的尺寸。
        const imageRatio = miniImage.naturalWidth / miniImage.naturalHeight;
        const miniRatio = miniWidth / miniHeight;

        let imageWidth: number;
        let imageHeight: number;

        if (imageRatio > miniRatio) {
            imageWidth = miniWidth;
            imageHeight = miniWidth / imageRatio;
        } else {
            imageHeight = miniHeight;
            imageWidth = miniHeight * imageRatio;
        }

        // 小地圖與目前大圖顯示尺寸之間的比例。
        const scaleX = imageWidth / contentRect.width;
        const scaleY = imageHeight / contentRect.height;

        if (!scaleX || !scaleY) {
            return;
        }

        // 紅框往右移，代表大圖內容需要往左移，反之亦然。
        panzoom.execute(PanzoomAction.Move, {
            deltaX: -deltaX / scaleX,
            deltaY: -deltaY / scaleY,
        });
    }
}
