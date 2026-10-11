import { Injectable } from "@angular/core";
import type { AnyActorRef } from "xstate";

@Injectable()
export class OverlayCoordinatorService {
    private activeActor: AnyActorRef | null = null;

    register(actor: AnyActorRef): void {
        if (this.activeActor === actor) {
            return;
        }

        this.activeActor?.send({ type: "FORCE_CLOSE" });
        this.activeActor = actor;
    }

    deregister(actor: AnyActorRef): void {
        if (this.activeActor === actor) {
            this.activeActor = null;
        }
    }
}
