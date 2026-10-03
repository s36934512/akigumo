export const queueConfig = {
    kernel: {
        queueName: "sys_kernel_tasks",
        workerConcurrency: 5,
    },

    archiveUploadFinished: {
        queueName: "archive-upload-finished",
    },
};
