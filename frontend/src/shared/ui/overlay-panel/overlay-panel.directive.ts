import {
    type ConnectedPosition,
    Overlay,
    type OverlayRef,
} from "@angular/cdk/overlay";
import { ComponentPortal, TemplatePortal } from "@angular/cdk/portal";
import {
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    input,
    type TemplateRef,
    ViewContainerRef,
} from "@angular/core";
import { createActor } from "xstate";

import { OverlayCoordinatorService } from "./coordinator.service";
import { createOverlayMachine } from "./overlay.machine";
import { OverlayPanelComponent } from "./overlay-panel.component";

const POSITIONS: ConnectedPosition[] = [
    {
        originX: "end",
        originY: "center",
        overlayX: "start",
        overlayY: "center",
    },
    {
        originX: "start",
        originY: "center",
        overlayX: "end",
        overlayY: "center",
    },
];

@Directive({
    selector: "[sharedOverlayPanelDirective]",
    standalone: true,
    host: {
        "(mouseenter)": "onMouseEnter()",
        "(mouseleave)": "onMouseLeave()",
    },
})
export class OverlayPanelDirective {
    readonly contentTemplate = input.required<TemplateRef<unknown>>({
        alias: "sharedOverlayPanel",
    });

    private readonly overlay = inject(Overlay);
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly viewContainerRef = inject(ViewContainerRef);
    private readonly coordinator = inject(OverlayCoordinatorService);
    private readonly destroyRef = inject(DestroyRef);

    private overlayRef: OverlayRef | null = null;
    private removeOverlayListenerList: Array<() => void> = [];

    private readonly overlayActor = createActor(
        createOverlayMachine({
            onOpen: () => {
                this.coordinator.register(this.overlayActor);
                this.open();
            },
            onClose: () => {
                this.close();
                this.coordinator.deregister(this.overlayActor);
            },
        }),
    );

    constructor() {
        this.overlayActor.start();

        this.destroyRef.onDestroy(() => {
            this.overlayActor.stop();
            this.close();
            this.coordinator.deregister(this.overlayActor);
        });
    }

    onMouseEnter(): void {
        this.overlayActor.send({ type: "MOUSE_ENTER" });
    }

    onMouseLeave(): void {
        this.overlayActor.send({ type: "MOUSE_LEAVE" });
    }

    private open() {
        if (this.overlayRef) return;

        const positionStrategy = this.overlay
            .position()
            .flexibleConnectedTo(this.elementRef)
            .withPositions(POSITIONS)
            .withPush(true);

        const overlayRef = this.overlay.create({
            positionStrategy,
            hasBackdrop: false,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
        });

        this.overlayRef = overlayRef;

        this.removeOverlayListenerList = [
            this.listen(overlayRef.overlayElement, "mouseenter", () => {
                this.overlayActor.send({ type: "MOUSE_ENTER" });
            }),
            this.listen(overlayRef.overlayElement, "mouseleave", () => {
                this.overlayActor.send({ type: "MOUSE_LEAVE" });
            }),
        ];

        const contentPortal = new TemplatePortal(
            this.contentTemplate(),
            this.viewContainerRef,
        );

        const panelRef = overlayRef.attach(
            new ComponentPortal(OverlayPanelComponent, this.viewContainerRef),
        );

        panelRef.setInput("contentPortal", contentPortal);
    }

    private close(): void {
        for (const removeListener of this.removeOverlayListenerList) {
            removeListener();
        }

        this.removeOverlayListenerList = [];

        this.overlayRef?.dispose();
        this.overlayRef = null;
    }

    private listen(
        element: HTMLElement,
        eventName: string,
        callback: () => void,
    ): () => void {
        element.addEventListener(eventName, callback);

        return () => {
            element.removeEventListener(eventName, callback);
        };
    }
}
