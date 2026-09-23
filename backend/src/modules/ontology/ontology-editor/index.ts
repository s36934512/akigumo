import { handleOntologyEditor } from "./api/handler.js";
import { ontologyEditorProcessor } from "./core/processor/editor.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [ontologyEditorProcessor],

    routes: [handleOntologyEditor],
};
