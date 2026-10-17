import { handleOntologyAssociation } from "./api/handler.js";
import { ontologyAssociationProcessor } from "./core/processor/association.js";
import { machine, WORKFLOW_TYPE } from "./machine/machine.js";

export const capability = {
    workflows: [
        {
            workflowType: WORKFLOW_TYPE,
            machine,
        },
    ],

    processors: [ontologyAssociationProcessor],

    routes: [handleOntologyAssociation],
};
