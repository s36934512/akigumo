import type { OntologyRelationship } from "../api/schema.js";
import * as service from "./service.js";

export async function ontologyRelationshipProcessor(
    input: OntologyRelationship,
) {
    const structure = await service.getConceptStructure(input);

    const { concepts, archives } = await service.findEntities(structure);

    return {
        concepts,
        archives,
        statements: structure.statementList,
        relationships: structure.relationshipList,
    };
}
