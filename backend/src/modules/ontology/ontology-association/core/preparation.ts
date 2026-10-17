import _ from "lodash";
import { v5 as uuidv5, v7 as uuidv7 } from "uuid";

import { ONTOLOGY_NAMESPACE } from "#app/modules/ontology/constants.js";

import type { OntologyAssociation } from "../api/schema.js";
import type {
    ConceptRegistryWithId,
    ConceptRegistryWithTempId,
} from "./schema.js";

// ==========================================
// 1. 補全與標準化階段 (Normalizer)
// ==========================================
function normalizeInput(input: OntologyAssociation["array"]) {
    return input.map((item) => ({
        targetId: item.targetId,
        conceptIdList: item.conceptIdList,
        newConceptList: item.newConceptList.map((concept) => {
            const _tempId = uuidv7();

            return { ...concept, _tempId };
        }),
    }));
}

// ==========================================
// 2. 去重與建立索引階段 (Registry / Indexer)
// ==========================================
type NormalizedInput = ReturnType<typeof normalizeInput>;

function buildConceptPool(normalizedInput: NormalizedInput) {
    const conceptPool: ConceptRegistryWithId[] = [];
    const officialIdByHash = new Map<string, string>(); // hash -> 正式 uuidv7
    const officialIdByTempId = new Map<string, string>(); // _tempId -> 正式 uuidv7

    // 輔助函式：將單一物件進行去重與推入 pool
    const registerConcept = (concept: ConceptRegistryWithTempId) => {
        // 移除臨時的 _tempId 後計算雜湊
        const conceptDataWithoutId = _.omit(concept, ["_tempId"]);
        const hash = uuidv5(
            JSON.stringify(sortObjectKeys(conceptDataWithoutId)),
            ONTOLOGY_NAMESPACE,
        );

        const existingOfficialId = officialIdByHash.get(hash);
        if (existingOfficialId) {
            const matched = conceptPool.find(
                (p) => p.id === existingOfficialId,
            );

            if (
                matched &&
                !_.isEqual(_.omit(matched, ["id"]), conceptDataWithoutId)
            ) {
                throw new Error("內容相同，但結構不同");
            }

            officialIdByTempId.set(concept._tempId, existingOfficialId);
        } else {
            const officialId = uuidv7();

            conceptPool.push({
                id: officialId,
                ...conceptDataWithoutId,
            } as ConceptRegistryWithId);

            officialIdByHash.set(hash, officialId);
            officialIdByTempId.set(concept._tempId, officialId);
        }
    };

    for (const item of normalizedInput) {
        for (const concept of item.newConceptList) {
            registerConcept(concept);
        }
    }

    return { conceptPool, officialIdByTempId };
}

// ==========================================
// 3. 最終組裝階段 (Assembler)
// ==========================================
function assembleOutput(
    normalizedInput: NormalizedInput,
    conceptPool: ConceptRegistryWithId[],
    officialIdByTempId: Map<string, string>,
) {
    const associationList = normalizedInput.map((item) => {
        const newConceptIdList = item.newConceptList.map((concept) => {
            const officialId = officialIdByTempId.get(concept._tempId);

            if (!officialId) {
                throw new Error("Missing official ID for temporary Concept ID");
            }

            return officialId;
        });

        return {
            targetId: item.targetId,
            conceptIdList: newConceptIdList.concat(item.conceptIdList),
        };
    });

    return { conceptPool, associationList };
}

// ==========================================
// 主流程進入點 (Pipeline Entry)
// ==========================================
export function prepareConceptAssociation(input: OntologyAssociation["array"]) {
    const normalized = normalizeInput(input);

    const { conceptPool, officialIdByTempId } = buildConceptPool(normalized);

    return assembleOutput(normalized, conceptPool, officialIdByTempId);
}

// ==========================================
// 工具函式 (Helper Functions)
// ==========================================
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortObjectKeys(obj: unknown): unknown {
    if (typeof obj === "string") return obj.trim().toLowerCase();
    if (Array.isArray(obj)) return obj.map(sortObjectKeys);
    if (isPlainObject(obj)) {
        return Object.keys(obj)
            .sort()
            .reduce((result: Record<string, unknown>, key: string) => {
                result[key] = sortObjectKeys(obj[key]);
                return result;
            }, {});
    }
    return obj;
}
