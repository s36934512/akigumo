import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import TypeAlias, cast
from uuid import uuid4

from .job import JobDict, Jobs
from .queue import MessageQueue
from .redis import RedisConnection

logger = logging.getLogger(__name__)

RedisMessage: TypeAlias = tuple[str, dict[str, str]]


class BatchWorker(MessageQueue):
    """Redis Stream 批次訊息 Worker。"""

    def __init__(
        self,
        name: str,
        group: str,
        connection: RedisConnection,
        trim_interval_seconds: int,
        batch_size: int,
        min_idle_time: int,
    ) -> None:
        super().__init__(
            name=name,
            group=group,
            connection=connection,
            trim_interval_seconds=trim_interval_seconds,
        )

        self.worker_name = f"worker-{uuid4().hex}"
        self.batch_size = batch_size
        self.min_idle_time = min_idle_time
        self.running = False

        # XAUTOCLAIM 分頁游標
        self._claim_cursor: str | bytes = "0-0"

    async def _handle_batch(
        self,
        messages: list[RedisMessage],
        handler: Callable[[list[JobDict]], Awaitable[None]],
    ) -> None:
        """處理一批訊息，成功後批次 ACK。"""
        if not messages:
            return

        try:
            jobs = Jobs(messages).get_jobs()

            # 執行業務處理
            await handler(jobs)

            # 批次 ACK
            async with self.redis.pipeline(transaction=False) as pipe:
                for job in jobs:
                    pipe.xack(
                        self.name,
                        self.group,
                        job["id"],
                    )

                await pipe.execute()

            logger.debug(
                "Successfully processed and ACKed batch of %d",
                len(jobs),
            )

        except Exception:
            # 不 ACK，保留在 PEL，等待重新領取
            logger.exception("Batch processing failed")

    async def _claim_stale_messages(
        self,
        handler: Callable[[list[JobDict]], Awaitable[None]],
    ) -> None:
        """領取並處理閒置超時的 Pending Messages。"""

        result = await self.redis.xautoclaim(
            name=self.name,
            groupname=self.group,
            consumername=self.worker_name,
            min_idle_time=self.min_idle_time,
            start_id=self._claim_cursor,
            count=self.batch_size,
        )

        next_cursor, messages, _ = result

        # 更新掃描游標，避免每次都從 0-0 開始
        self._claim_cursor = cast(str | bytes, next_cursor)

        stale_messages = cast(list[RedisMessage], messages)

        if stale_messages:
            logger.debug(
                "Claimed %d stale messages",
                len(stale_messages),
            )

            await self._handle_batch(stale_messages, handler)

    async def _consume_messages(
        self,
        handler: Callable[[list[JobDict]], Awaitable[None]],
    ) -> None:
        """讀取並處理新的 Stream Messages。"""

        response = await self.redis.xreadgroup(
            groupname=self.group,
            consumername=self.worker_name,
            streams={self.name: ">"},
            count=self.batch_size,
            block=2000,
        )

        if not response:
            return

        for _, messages in response:
            batch = cast(list[RedisMessage], messages)

            await self._handle_batch(batch, handler)

    async def run(
        self,
        handler: Callable[[list[JobDict]], Awaitable[None]],
    ) -> None:
        """啟動批次 Worker。"""

        if self.running:
            return

        await self.setup()
        self.running = True

        logger.info(
            "Batch Worker %s started (batch_size=%d)",
            self.name,
            self.batch_size,
        )

        try:
            while self.running:
                try:
                    # 1. 處理閒置的 Pending Messages
                    await self._claim_stale_messages(handler)

                    # 2. 讀取新的 Messages
                    await self._consume_messages(handler)

                except asyncio.CancelledError:
                    raise

                except Exception:
                    logger.exception("Worker Loop Error")
                    await asyncio.sleep(1)

        finally:
            self.running = False
            await self.close()

            logger.info(
                "Batch Worker %s stopped",
                self.name,
            )

    async def stop(self) -> None:
        """停止 Worker。"""
        self.running = False
        await self.close()
