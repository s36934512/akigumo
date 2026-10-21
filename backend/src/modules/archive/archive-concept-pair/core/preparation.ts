import _ from "lodash";
import { v5 as uuidv5, v7 as uuidv7 } from "uuid";

import { ONTOLOGY_NAMESPACE } from "#app/modules/ontology/constants.js";
import { normalizeValue } from "#app/utils/object.js";

import type { ArchiveConceptPair } from "../api/schema.js";
import type {
    ConceptRegistryWithId,
    ConceptRegistryWithTempId,
    IdObject,
} from "./schema.js";

// ==========================================
// 1. 補全與標準化階段 (Normalizer)
// ==========================================
function normalizeInput(input: ArchiveConceptPair["array"]) {
    return input.map((item) => ({
        targetId: item.targetId,
        pairList: item.pairList.map(({ statement, value }) => {
            let normalizedStatement: ConceptRegistryWithTempId | IdObject;

            if ("name" in statement) {
                normalizedStatement = { ...statement, _tempId: uuidv7() };
            } else if (statement.id) {
                normalizedStatement = { id: statement.id };
            } else {
                throw new Error("無效的 Key 結構");
            }

            const normalizedValue = value.map(
                (v): ConceptRegistryWithTempId | IdObject => {
                    if ("name" in v) {
                        return { ...v, _tempId: uuidv7() };
                    }

                    if ("id" in v && v.id) {
                        return { id: v.id };
                    }

                    throw new Error("無效的 Value 結構");
                },
            );

            return { statement: normalizedStatement, value: normalizedValue };
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
            JSON.stringify(normalizeValue(conceptDataWithoutId)),
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
        for (const pair of item.pairList) {
            if (!("id" in pair.statement)) {
                registerConcept(pair.statement);
            }
            for (const v of pair.value) {
                if (!("id" in v)) registerConcept(v);
            }
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
    const pairAssociationList = normalizedInput.map((item) => {
        const pairList = item.pairList.map(({ statement, value }) => {
            let statementId: string;

            if ("id" in statement) {
                statementId = statement.id;
            } else {
                const officialId = officialIdByTempId.get(statement._tempId);

                if (!officialId)
                    throw new Error(
                        "Missing official ID for statement temporary Concept ID",
                    );

                statementId = officialId;
            }

            const valueId = value.map((v) => {
                if ("id" in v) return v.id;

                const officialId = officialIdByTempId.get(v._tempId);
                if (!officialId)
                    throw new Error(
                        "Missing official ID for value temporary Concept ID",
                    );

                return officialId;
            });

            return {
                statement: statementId,
                value: valueId,
            };
        });

        return {
            targetId: item.targetId,
            conceptPairList: pairList,
        };
    });

    return { conceptPool, pairAssociationList };
}

// ==========================================
// 主流程進入點 (Pipeline Entry)
// ==========================================
export function prepareArchiveConceptPair(input: ArchiveConceptPair["array"]) {
    // 第一步：乾淨的資料標準化（補齊 key id 與將 value 結構一致化）
    const normalized = normalizeInput(input);

    // 第二步：收集、去重並產出正式的知識庫 Pool 與 ID 映射表
    const { conceptPool, officialIdByTempId } = buildConceptPool(normalized);

    // 第三步：依據映射表快速拍平輸出
    return assembleOutput(normalized, conceptPool, officialIdByTempId);
}
