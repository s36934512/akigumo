import type { HttpBindings } from "@hono/node-server";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { ProcessorDefinition } from "#app/kernel/execution/processor.js";
import { registerProcessor } from "#app/kernel/index.js";
import { capability as archiveConceptCapability } from "#app/modules/archive/archive-concept/index.js";
import { capability as archiveDeleteCapability } from "#app/modules/archive/archive-delete/index.js";
import { capability as archiveIntegrationCapability } from "#app/modules/archive/archive-integration/index.js";
import { capability as graphResultCapability } from "#app/modules/graph/graph-result/index.js";
import { capability as ontologyDeleteCapability } from "#app/modules/ontology/ontology-delete/index.js";
import { capability as ontologyEditorCapability } from "#app/modules/ontology/ontology-editor/index.js";
import { capability as ontologyRegistryCapability } from "#app/modules/ontology/ontology-registry/index.js";
import { capability as ontologyResolverCapability } from "#app/modules/ontology/ontology-resolver/index.js";
import { capability as systemArchiveServeCapability } from "#app/modules/system/archive/index.js";
import {
    registerWorkflow,
    type WorkflowDefinition,
} from "#app/workflow/index.js";

type ModuleCapability = {
    workflows?: WorkflowDefinition[];
    processors?: ProcessorDefinition[];
    routes?: OpenAPIHono<{ Bindings: HttpBindings }>[];
};

const capabilityList: ModuleCapability[] = [
    archiveConceptCapability,
    archiveDeleteCapability,
    archiveIntegrationCapability,
    graphResultCapability,
    ontologyDeleteCapability,
    ontologyEditorCapability,
    ontologyRegistryCapability,
    ontologyResolverCapability,
    systemArchiveServeCapability,
];

export function registerModuleRuntime() {
    for (const capability of capabilityList) {
        for (const workflow of capability.workflows ?? []) {
            registerWorkflow(workflow);
        }

        for (const processor of capability.processors ?? []) {
            registerProcessor(processor);
        }
    }
}

export function registerModules(app: OpenAPIHono<{ Bindings: HttpBindings }>) {
    for (const capability of capabilityList) {
        for (const route of capability.routes ?? []) {
            app.route("/", route);
        }
    }
}
