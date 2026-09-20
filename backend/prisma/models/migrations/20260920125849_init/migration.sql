-- CreateEnum
CREATE TYPE "ArchiveType" AS ENUM ('WORK', 'SERIES', 'COLLECTION', 'FILE_CONTAINER');

-- CreateEnum
CREATE TYPE "ArchiveStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'UPCOMING', 'DRAFT', 'PRIVATE', 'ACTIVE', 'ARCHIVED', 'LOCKED', 'HIDDEN', 'PROCESSING', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'PENDING', 'AVAILABLE', 'IN_USE', 'PROCESSING', 'SCANNING', 'LOCKED', 'FAILED', 'REJECTED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "archive" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "type" "ArchiveType" NOT NULL,
    "status" "ArchiveStatus" NOT NULL,
    "published_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "system_metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,

    CONSTRAINT "concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "original_name" TEXT,
    "system_name" TEXT,
    "physical_path" TEXT,
    "size" BIGINT,
    "checksum" TEXT,
    "is_original" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "status" "FileStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_scanned_at" TIMESTAMP(3),
    "file_extension_id" INTEGER NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_category" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "file_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_extension" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "mimeType" TEXT,
    "name" TEXT,
    "description" TEXT,
    "file_category_id" INTEGER NOT NULL,

    CONSTRAINT "file_extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" BIGSERIAL NOT NULL,
    "workflow_id" UUID,
    "operation" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "processing_started_at" TIMESTAMP(3),
    "processing_id" UUID,
    "workflow_result_processed_at" TIMESTAMP(3),

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_state" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "workflow_type" TEXT NOT NULL,
    "correlation_id" UUID,
    "status" TEXT NOT NULL,
    "data" JSONB,
    "snapshot" JSONB,
    "last_error" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "archive_type_idx" ON "archive"("type");

-- CreateIndex
CREATE INDEX "archive_status_idx" ON "archive"("status");

-- CreateIndex
CREATE INDEX "file_status_idx" ON "file"("status");

-- CreateIndex
CREATE INDEX "file_file_extension_id_idx" ON "file"("file_extension_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_category_code_key" ON "file_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "file_extension_code_key" ON "file_extension"("code");

-- CreateIndex
CREATE INDEX "outbox_status_scheduled_at_created_at_idx" ON "outbox"("status", "scheduled_at", "created_at");

-- CreateIndex
CREATE INDEX "outbox_workflow_id_idx" ON "outbox"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_state_correlation_id_idx" ON "workflow_state"("correlation_id");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_file_extension_id_fkey" FOREIGN KEY ("file_extension_id") REFERENCES "file_extension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_extension" ADD CONSTRAINT "file_extension_file_category_id_fkey" FOREIGN KEY ("file_category_id") REFERENCES "file_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
