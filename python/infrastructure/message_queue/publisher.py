import json
from typing import Any

from redis.asyncio import Redis


class ResultPublisher:
    def __init__(
        self,
        redis: Redis,
        stream_name: str,
    ):
        self.redis = redis
        self.stream_name = stream_name

    async def publish(self, result: dict[str, Any]) -> str:
        return await self.redis.xadd(
            self.stream_name,
            {
                "payload": json.dumps(result),
            },
        )
