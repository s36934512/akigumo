from typing import Any

import structlog
from neo4j import AsyncDriver, AsyncGraphDatabase

from graph_refinement.core.config import config


class Neo4jClient:
    """Async Neo4j client used by graph refinement."""

    def __init__(self) -> None:
        self.logger = structlog.get_logger(__name__)
        self.driver: AsyncDriver | None = None
        self._connected = False

    async def connect(self) -> None:
        if self._connected:
            return

        try:
            self.driver = AsyncGraphDatabase.driver(
                config.neo4j_uri,
                auth=(
                    config.neo4j_username,
                    config.neo4j_password,
                ),
                max_connection_pool_size=10,
                connection_timeout=30,
            )

            await self.verify_connectivity()
            self._connected = True

            self.logger.info("Connected to Neo4j")

        except Exception as error:
            if self.driver:
                await self.driver.close()
                self.driver = None

            raise ConnectionError(
                f"Failed to connect to Neo4j: {error}"
            ) from error

    async def close(self) -> None:
        if self.driver is not None:
            await self.driver.close()
            self.driver = None
            self._connected = False

            self.logger.info("Disconnected from Neo4j")

    async def verify_connectivity(self) -> bool:
        if self.driver is None:
            return False

        try:
            async with self.driver.session() as session:
                result = await session.run("RETURN 1 AS test")
                record = await result.single()

                return record is not None and record["test"] == 1

        except Exception:
            self.logger.exception(
                "Neo4j connectivity check failed",
            )
            return False

    async def execute_write_query(
        self,
        query: str,
        parameters: dict[str, Any] | None = None,
    ) -> int:
        if self.driver is None:
            await self.connect()

        if self.driver is None:
            raise RuntimeError("Neo4j driver is not initialized")

        try:
            async with self.driver.session() as session:
                result = await session.run(
                    query,
                    parameters or {},
                )
                summary = await result.consume()

                counters = summary.counters

                return (
                    counters.nodes_created
                    + counters.nodes_deleted
                    + counters.relationships_created
                    + counters.relationships_deleted
                )

        except Exception:
            self.logger.exception(
                "Neo4j write query failed",
                query=query,
            )
            raise
