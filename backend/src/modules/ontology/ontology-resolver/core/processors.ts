import type { OntologyResolver } from "../api/schema.js";
import { CyElementSchema } from "../contract/cytoscape.js";
import * as service from "./service.js";

export async function ontologyResolverProcessor(input: OntologyResolver) {
    const { notifyId, ...obj } = input;

    const { nodeIdList, nodeList, edgeList } =
        await service.getConceptStructure(obj);

    const conceptList = await service.findConcept(nodeIdList);

    const conceptMap = new Map(conceptList.map((item) => [item.id, item]));
    const finalNodeList = nodeList.flatMap((node) => {
        const conceptDetail = conceptMap.get(node.data.id);

        if (!conceptDetail) return [];
        return [
            {
                ...node,
                data: {
                    ...node.data,
                    ...conceptDetail,
                },
            },
        ];
    });

    const result = CyElementSchema.single.safeParse({
        nodes: finalNodeList,
        edges: edgeList,
    });

    const cytoscapeElements = result.success
        ? result.data
        : { nodes: [], edges: [] };

    return cytoscapeElements;
}
