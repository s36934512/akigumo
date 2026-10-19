import { defineEventContract } from "#app/contracts/index.js";
import { WORKFLOW_BOOTSTRAP } from "#app/modules/system/workflow-bootstrap/index.js";

import { ArchiveConceptRemoveSchema } from "../../api/schema.js";

export const ARCHIVE_CONCEPT_REMOVE = "ARCHIVE_CONCEPT_REMOVE";

export const ArchiveConceptRemoveEvent = defineEventContract(
    WORKFLOW_BOOTSTRAP,
    [
        {
            code: "SUCCEEDED",
            dataSchema: ArchiveConceptRemoveSchema.array,
        },
    ],
);
