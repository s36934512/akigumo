import {
    afterNextRender,
    Component,
    DestroyRef,
    type ElementRef,
    effect,
    inject,
    input,
    output,
    viewChild,
} from "@angular/core";
import cytoscape, {
    type ElementDefinition,
    type ElementsDefinition,
} from "cytoscape";
import cola from "cytoscape-cola";

cytoscape.use(cola);

@Component({
    selector: "widget-concept-explorer",
    standalone: true,
    templateUrl: "./concept-explorer.component.html",
    styleUrl: "./concept-explorer.component.scss",
})
export class ConceptExplorerComponent {
    readonly elements = input<ElementsDefinition>({
        nodes: [],
        edges: [],
    });

    private readonly destroyRef = inject(DestroyRef);
    private readonly cyCanvas =
        viewChild.required<ElementRef<HTMLDivElement>>("cyCanvas");

    protected readonly conceptToggle = output<string>();

    private cy?: cytoscape.Core;

    constructor() {
        afterNextRender(() => {
            this.cy = cytoscape({
                container: this.cyCanvas().nativeElement,
                elements: this.toElements(this.elements()),
                style: [
                    {
                        selector: "node",
                        style: {
                            label: "data(name)",
                            "background-color": "#29B6F6",
                            color: "#333",
                            "font-size": 12,
                            width: 48,
                            height: 48,
                            "text-valign": "bottom",
                        },
                    },
                    {
                        selector: "edge",
                        style: {
                            width: 2,
                            "line-color": "#BDBDBD",
                            "target-arrow-shape": "triangle",
                            "target-arrow-color": "#BDBDBD",
                        },
                    },
                    {
                        selector: "node:selected",
                        style: {
                            "background-color": "#4CAF50",
                            "border-width": 3,
                            "border-color": "#81C784",
                        },
                    },
                ],
                layout: {
                    name: "cola",
                },
            });

            this.bindEvents();

            this.destroyRef.onDestroy(() => {
                this.cy?.destroy();
                this.cy = undefined;
            });
        });

        effect(() => {
            const elements = this.toElements(this.elements());

            if (!this.cy) {
                return;
            }

            this.cy.elements().remove();
            this.cy.add(elements);
            this.cy.layout(this.getLayoutConfig()).run();
        });
    }

    private toElements(elements: ElementsDefinition): ElementDefinition[] {
        return [...(elements.nodes ?? []), ...(elements.edges ?? [])];
    }

    private getLayoutConfig() {
        return {
            name: "cola",
            animate: true,
            fit: true,
            padding: 40,
        };
    }

    private bindEvents(): void {
        this.cy?.on("tap", "node", (event) => {
            const node = event.target;

            this.conceptToggle.emit(node.id());
        });
    }

    zoomIn(): void {
        if (this.cy) {
            this.cy.zoom(this.cy.zoom() * 1.2);
        }
    }

    zoomOut(): void {
        if (this.cy) {
            this.cy.zoom(this.cy.zoom() / 1.2);
        }
    }

    fitGraph(): void {
        this.cy?.fit(undefined, 40);
    }

    resetGraph(): void {
        this.cy?.reset();
    }
}
