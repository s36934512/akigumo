from redis.asyncio import Redis


class RedisConnection:
    def __init__(
        self,
        host: str,
        port: int,
        db: int = 0,
    ):
        self.redis = Redis.from_url(
            f"redis://{host}:{port}/{db}",
            decode_responses=True,
        )

    def get(self) -> Redis:
        return self.redis

    async def close(self):
        await self.redis.aclose()
