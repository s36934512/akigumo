import { Component, input } from "@angular/core";
import { ChipModule } from "@openng/optimus-ui/chip";

import type { Concept } from "../model/concept";

@Component({
    selector: "entity-concept-chip",
    standalone: true,
    imports: [ChipModule],
    templateUrl: "./concept-chip.component.html",
})
export class ConceptChipComponent {
    readonly concept = input.required<Concept>();
}
