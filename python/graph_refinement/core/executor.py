from abc import ABC, abstractmethod
from typing import Any, ClassVar

import structlog


class BaseExecutor(ABC):
    REQUIRED_IDENTITY: ClassVar[list[str]] = []

    @property
    @abstractmethod
    def template(self) -> str:
        pass

    async def execute(
        self,
        db: Any,
        request_list: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        logger = structlog.get_logger(__name__)

        prepared_request_list: list[dict[str, Any]] = []
        skipped_request_list: list[dict[str, Any]] = []

        for request in request_list:
            payload = request.get("payload")

            if not isinstance(payload, list):
                logger.warning(
                    "Executor skipped request: payload is not a list",
                    executor=self.__class__.__name__,
                )
                skipped_request_list.append(request)
                continue

            if not payload:
                logger.warning(
                    "Executor skipped request: payload is empty",
                    executor=self.__class__.__name__,
                )
                skipped_request_list.append(request)
                continue

            invalid_payload = any(
                not isinstance(data, dict)
                or any(
                    data.get(key) is None
                    for key in self.REQUIRED_IDENTITY
                )
                for data in payload
            )

            if invalid_payload:
                logger.warning(
                    "Executor skipped request: invalid payload identity",
                    executor=self.__class__.__name__,
                    required_identity=self.REQUIRED_IDENTITY,
                )
                skipped_request_list.append(request)
                continue

            prepared_request_list.append(
                {
                    "intentOutboxId": request["intentOutboxId"],
                    "payload": payload,
                }
            )

        if not prepared_request_list:
            return [], skipped_request_list

        try:
            execution_result = await db.execute_write_query(
                self.template,
                {"requests": prepared_request_list},
            )

            return execution_result, skipped_request_list

        except Exception:
            logger.exception(
                "Executor failed",
                executor=self.__class__.__name__,
                request_count=len(prepared_request_list),
            )
            raise
