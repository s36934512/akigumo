from collections import defaultdict
from typing import Any

import structlog

from graph_refinement.executors import load_executors
from infrastructure.message_queue.job import JobDict
from infrastructure.message_queue.publisher import ResultPublisher
from infrastructure.database.neo4j import Neo4jClient


GRAPH_OPERATION_REQUEST_VERSION = "1.0.0"
PYTHON_JOB_RESULT_VERSION = "1.0.0"


class BatchProcessor:
    """Processes batches of graph refinement tasks."""

    def __init__(
        self,
        neo4j_client: Neo4jClient,
        result_publisher: ResultPublisher
    ):
        self.logger = structlog.get_logger(__name__)
        self.neo4j_client = neo4j_client
        self.result_publisher = result_publisher
        self.executors = load_executors()
        self.logger.debug(
            self.executors,
        )

    async def process_batch(self, jobs: list[JobDict]) -> None:
        """Process a batch of tasks using executor-based handling."""
        if not jobs:
            return

        valid_request_list = []
        invalid_request_list = []

        for job in jobs:
            request = job["data"]

            if self._is_valid_request(request):
                valid_request_list.append(request)
            else:
                invalid_request_list.append(request)

        await self._publish_results(
            self._build_failure_results(
                invalid_request_list,
                ValueError("Invalid graph refinement request"),
            )
        )

        await self._process_with_executors(valid_request_list)

        self.logger.debug(
            "Batch processed successfully",
            batch_size=len(valid_request_list),
        )

    async def _process_with_executors(
        self,
        request_list: list[dict[str, Any]],
    ) -> None:
        """Process requests using the corresponding executors."""
        request_group_map: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for request in request_list:
            request_group_map[request["operation"]].append(request)

        for operation, grouped_request_list in request_group_map.items():
            executor = self.executors.get(operation)

            if executor is None:
                self.logger.warning(
                    "No executor found for operation",
                    operation=operation,
                )

                error = ValueError(
                    f"No executor found for operation: {operation}"
                )

                await self._publish_results(
                    self._build_failure_results(
                        grouped_request_list,
                        error,
                    )
                )
                continue

            executor_request_list = [
                {
                    "workflowId": request["workflowId"],
                    "intentOutboxId": request["intentOutboxId"],
                    "payload": request["payload"],
                }
                for request in request_list
            ]

            try:
                execution_result, skipped_request_list = (
                    await executor.execute(
                        self.neo4j_client,
                        executor_request_list,
                    )
                )

                skipped_id_set = {
                    request["intentOutboxId"]
                    for request in skipped_request_list
                }

                executed_request_list = [
                    request
                    for request in grouped_request_list
                    if request["intentOutboxId"] not in skipped_id_set
                ]

                result_list = self._build_success_results(
                    executed_request_list,
                    execution_result,
                )

                result_list.extend(
                    self._build_failure_results(
                        skipped_request_list,
                        ValueError("Request cannot be executed by executor"),
                    )
                )

            except Exception as error:
                self.logger.exception(
                    "Graph refinement execution failed",
                    operation=operation,
                )

                result_list = self._build_failure_results(
                    grouped_request_list,
                    error,
                )

            await self._publish_results(result_list)

    async def _publish_results(
        self,
        result_list: list[dict[str, Any]],
    ) -> None:
        """Publish execution results."""
        for result in result_list:
            await self.result_publisher.publish(result)

    @staticmethod
    def _is_valid_request(
        request: dict[str, Any],
    ) -> bool:
        """Validate the required graph refinement request fields."""
        required_key_list = [
            "version",
            "workflowId",
            "intentOutboxId",
            "operation",
            "payload",
        ]

        return (
            all(request.get(key) is not None for key in required_key_list)
            and request["version"] == GRAPH_OPERATION_REQUEST_VERSION
        )

    @staticmethod
    def _build_success_results(
        request_list: list[dict[str, Any]],
        execution_result: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Build execution results for successfully executed requests."""
        records_by_intent: dict[Any, list[dict[str, Any]]] = defaultdict(list)

        for record in execution_result:
            intent_outbox_id = record.get("intentOutboxId")

            if intent_outbox_id is not None:
                records_by_intent[intent_outbox_id].append(record)

        return [
            {
                "version": PYTHON_JOB_RESULT_VERSION,
                "workflowId": request["workflowId"],
                "intentOutboxId": request["intentOutboxId"],
                "status": "SUCCESS",
                "execution": {
                    "records": records_by_intent.get(
                        request["intentOutboxId"],
                        [],
                    ),
                },
            }
            for request in request_list
        ]

    @staticmethod
    def _build_failure_results(
        request_list: list[dict[str, Any]],
        error: Exception,
    ) -> list[dict[str, Any]]:
        """Build execution results for failed requests."""
        return [
            BatchProcessor._build_failure_result(request, error)
            for request in request_list
        ]

    @staticmethod
    def _build_failure_result(
        request: dict[str, Any],
        error: Exception,
    ) -> dict[str, Any]:
        """Build a FAILURE result for a single request."""
        return {
            "version": PYTHON_JOB_RESULT_VERSION,
            "workflowId": request.get("workflowId"),
            "intentOutboxId": request.get("intentOutboxId"),
            "status": "FAILURE",
            "error": {
                "code": type(error).__name__,
                "message": str(error),
            },
        }
