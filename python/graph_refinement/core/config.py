from pathlib import Path

from pydantic import field_validator, ConfigDict
from pydantic_settings import BaseSettings


class GraphRefinementConfig(BaseSettings):
    """Configuration for graph refinement engine."""

    # Redis configuration
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0

    redis_request_stream: str = "akigumo:graph"
    redis_result_stream: str = "akigumo:python"
    redis_consumer_group: str = "graph-refinement"

    redis_batch_size: int = 5
    redis_min_idle_time: int = 30_000
    redis_trim_interval_seconds: int = 600

    # Neo4j configuration
    neo4j_url: str
    neo4j_username: str
    neo4j_password: str

    # Resource limits
    max_text_bytes: int = 128 * 1024
    max_tags: int = 30

    # Logging
    log_level: str = "INFO"
    neo4j_log_level: str = "WARNING"

    model_config = ConfigDict(
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("redis_batch_size")
    @classmethod
    def validate_batch_size(cls, value: int) -> int:
        if value < 1 or value > 1000:
            raise ValueError(
                f'Batch size must be between 1 and 1000, got {value}')
        return value


config = GraphRefinementConfig()
