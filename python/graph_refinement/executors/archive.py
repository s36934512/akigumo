from graph_refinement.executors.base import GenericNodeBase


class ArchiveDeleteExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ("archiveId",)

    @property
    def template(self) -> str:
        return """
        UNWIND $requests AS request

        UNWIND request.payload AS data

        MATCH (i:Archive {id: data.archiveId})
        SET i:Delete

        RETURN DISTINCT request.intentOutboxId AS intentOutboxId
        """
