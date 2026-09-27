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
    ) -> list[dict[str, Any]]:
        logger = structlog.get_logger(__name__)

        valid_request_list = [
            request
            for request in request_list
            if request.get("intentOutboxId") is not None
            and isinstance(request.get("payload"), list)
        ]

        if not valid_request_list:
            logger.debug(
                "Executor skipped invalid requests",
                executor=self.__class__.__name__,
                request_count=len(request_list),
            )
            return []

        prepared_request_list = [
            {
                "intentOutboxId": request["intentOutboxId"],
                "payload": [
                    data
                    for data in request["payload"]
                    if isinstance(data, dict)
                    and all(
                        key in data and data[key] is not None
                        for key in self.REQUIRED_IDENTITY
                    )
                ],
            }
            for request in valid_request_list
        ]

        prepared_request_list = [
            request
            for request in prepared_request_list
            if request["payload"]
        ]

        if not prepared_request_list:
            return []

        try:
            return await db.execute_write_query(
                self.template,
                {"requests": prepared_request_list},
            )

        except Exception:
            logger.exception(
                "Executor failed",
                executor=self.__class__.__name__,
                request_count=len(prepared_request_list),
            )
            raise
