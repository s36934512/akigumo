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
        message_id = await self.redis.xadd(
            self.stream_name,
            {
                "payload": json.dumps(result),
            },
        )
        return message_id.decode() if isinstance(message_id, bytes) else message_id
