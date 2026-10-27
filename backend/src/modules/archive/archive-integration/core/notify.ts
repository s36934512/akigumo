import { prisma } from "#app/infrastructure/database/prisma.js";

export const ARCHIVE_CHILD_COMPLETION_REPORTED =
    "ARCHIVE_CHILD_COMPLETION_REPORTED";

export async function notify({
    fileId,
    succeeded,
    parentWorkflowId,
}: {
    fileId: string;
    succeeded: boolean;
    parentWorkflowId: string;
}) {
    await prisma.outbox.create({
        data: {
            workflowId: parentWorkflowId,
            operation: ARCHIVE_CHILD_COMPLETION_REPORTED,
            payload: {
                fileId,
                succeeded,
            },
        },
    });
}
