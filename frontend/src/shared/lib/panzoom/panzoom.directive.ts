import {
    afterNextRender,
    DestroyRef,
    Directive,
    ElementRef,
    effect,
    Injector,
    inject,
    input,
    output,
} from "@angular/core";
import {
    Panzoom,
    type PanzoomInstance,
    type PanzoomOptions,
} from "@fancyapps/ui/dist/panzoom";

@Directive({
    selector: "[sharedpanzoom]",
    standalone: true,
})
export class PanzoomDirective {
    private readonly el = inject(ElementRef<HTMLElement>);
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);

    private panzoomInstance?: PanzoomInstance;

    readonly enabled = input(false);
    readonly options = input<Partial<PanzoomOptions>>({});
    readonly panzoomChange = output<PanzoomInstance>();

    constructor() {
        effect(() => {
            if (!this.enabled() || this.panzoomInstance) {
                return;
            }

            afterNextRender(
                () => {
                    if (!this.enabled() || this.panzoomInstance) {
                        return;
                    }

                    this.panzoomInstance = Panzoom(
                        this.el.nativeElement,
                        this.options(),
                    ).init();

                    this.panzoomChange.emit(this.panzoomInstance);
                },
                { injector: this.injector },
            );
        });

        this.destroyRef.onDestroy(() => {
            this.panzoomInstance?.destroy();
        });
    }
}
