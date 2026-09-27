import asyncio
import signal

import structlog

from graph_refinement.core.config import config
from graph_refinement.batch_processor import BatchProcessor
from infrastructure.database.neo4j import Neo4jClient
from infrastructure.message_queue.redis import RedisConnection
from infrastructure.message_queue.worker import BatchWorker
from infrastructure.message_queue.publisher import ResultPublisher


class GraphRefinementWorker:
    """Worker for graph refinement tasks."""

    def __init__(self) -> None:
        self.logger = structlog.get_logger(__name__)

        self.running = False
        self.shutdown_event = asyncio.Event()

        self.redis_connection = RedisConnection(
            host=config.redis_host,
            port=config.redis_port,
            db=config.redis_db,
        )

        self.stream_worker = BatchWorker(
            name=config.redis_request_stream,
            group=config.redis_consumer_group,
            connection=self.redis_connection,
            trim_interval_seconds=config.redis_trim_interval_seconds,
            batch_size=config.redis_batch_size,
            min_idle_time=config.redis_min_idle_time,
        )

        self.neo4j_client = Neo4jClient()
        self.result_publisher = ResultPublisher(
            redis=self.redis_connection.get(),
            stream_name=config.redis_result_stream,
        )

        self.batch_processor = BatchProcessor(
            self.neo4j_client, self.result_publisher
        )

    async def start(self) -> int:
        """Start the graph refinement worker."""
        self._setup_signal_handlers()
        self.running = True

        self.logger.info(
            "Starting graph refinement worker",
            stream=config.redis_request_stream,
            group=config.redis_consumer_group,
            batch_size=config.redis_batch_size,
        )

        try:
            await self.neo4j_client.connect()

            await self.stream_worker.run(
                self.batch_processor.process_batch,
            )

            return 0

        except asyncio.CancelledError:
            self.logger.info("Graph refinement worker cancelled")
            return 0

        except Exception:
            self.logger.exception(
                "Graph refinement worker failed",
            )
            return 1

        finally:
            await self.stop()

    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""

        def signal_handler(signum: int, frame: object) -> None:
            self.logger.info(
                "Received shutdown signal",
                signal=signum,
            )
            self.shutdown_event.set()
            asyncio.create_task(self.stream_worker.stop())

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    async def stop(self) -> None:
        """Stop the worker and release resources."""
        if not self.running:
            return

        self.running = False

        await self.stream_worker.stop()
        await self.neo4j_client.close()
        await self.redis_connection.close()

        self.logger.info("Graph refinement worker stopped")
