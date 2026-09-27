from collections import defaultdict
from typing import Any

import structlog

from graph_refinement.executors import load_executors
from infrastructure.message_queue.job import JobDict
from infrastructure.database.neo4j import Neo4jClient


class BatchProcessor:
    """Processes batches of graph refinement tasks."""

    def __init__(self, neo4j_client: Neo4jClient):
        self.logger = structlog.get_logger(__name__)
        self.neo4j_client = neo4j_client

        self.executors = load_executors()
        self.logger.debug(
            self.executors,
        )

    async def process_batch(self, jobs: list[JobDict]) -> None:
        """Process a batch of tasks using executor-based handling."""
        if not jobs:
            return

        requests = [job["data"] for job in jobs]
        valid_requests = self.validate_requests(requests)

        if not valid_requests:
            self.logger.debug("No valid requests to process")
            return

        await self._process_with_executors(valid_requests)

        self.logger.debug(
            "Batch processed successfully",
            batch_size=len(valid_requests),
        )

    async def _process_with_executors(
        self,
        requests: list[dict[str, Any]],
    ) -> None:
        """Process requests using the corresponding executors."""
        request_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for request in requests:
            operation = request["operation"]
            payload = request["payload"]

            if isinstance(payload, list):
                request_groups[operation].extend(payload)
            else:
                request_groups[operation].append(payload)

        for operation, payload_list in request_groups.items():
            executor = self.executors.get(operation)

            if executor is None:
                self.logger.warning(
                    "No executor found for operation",
                    operation=operation,
                )
                continue

            await executor.execute(
                self.neo4j_client,
                payload_list,
            )

    def validate_requests(
        self,
        requests: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Validate graph refinement requests."""
        valid_requests = []

        for request in requests:
            if self._is_valid_request(request):
                valid_requests.append(request)
            else:
                self.logger.warning(
                    "Invalid graph refinement request",
                    request=request,
                )

        return valid_requests

    @staticmethod
    def _is_valid_request(
        request: dict[str, Any],
    ) -> bool:
        """Validate the required graph refinement request fields."""
        required = [
            "version",
            "workflowId",
            "intentOutboxId",
            "operation",
            "payload",
        ]

        if not all(request.get(key) is not None for key in required):
            return False

        return request["version"] == "1.0.0"
