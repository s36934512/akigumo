import neo4j from "neo4j-driver";

import { env } from "#app/config/env.js";

const { url, username, password } = env.neo4j;

export const driver = neo4j.driver(url, neo4j.auth.basic(username, password));

export const verifyNeo4jConnectivity = async (): Promise<void> => {
    try {
        await driver.verifyConnectivity();

        console.log("Neo4j connection verified.");
    } catch (error) {
        console.error("Neo4j connection failed:", error);
        process.exit(1);
    }
};
