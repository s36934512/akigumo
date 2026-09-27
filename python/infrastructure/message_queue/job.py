import json
from typing import Any, TypedDict


class JobDict(TypedDict):
    id: str
    data: dict[str, Any]


class Jobs:
    def __init__(self, messages: list[tuple]):
        self.messages = messages

    def get_jobs(self) -> list[JobDict]:
        return [
            {
                "id": str(message_id),
                "data": self._decode_message(fields),
            }
            for message_id, fields in self.messages
        ]

    @staticmethod
    def _decode_message(fields: dict[str, str]) -> dict[str, Any]:
        payload = fields.get("payload")

        if payload is None:
            raise ValueError("Redis Stream message is missing 'payload' field")

        data = json.loads(payload)

        if not isinstance(data, dict):
            raise ValueError(
                "Redis Stream payload must be a JSON object"
            )

        return data
