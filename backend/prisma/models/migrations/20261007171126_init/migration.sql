-- CreateEnum
CREATE TYPE "ArchiveType" AS ENUM ('WORK', 'SERIES', 'COLLECTION', 'FILE_CONTAINER');

-- CreateEnum
CREATE TYPE "ArchiveStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'UPCOMING', 'DRAFT', 'PRIVATE', 'ACTIVE', 'ARCHIVED', 'LOCKED', 'HIDDEN', 'PROCESSING', 'DELETED', 'FAILED');

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
    "extension_code" TEXT,
    "mime_type" TEXT,
    "size" BIGINT,
    "checksum" TEXT,
    "metadata" JSONB,
    "is_original" BOOLEAN NOT NULL DEFAULT false,
    "created_by_workflow_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "last_scanned_at" TIMESTAMP(3),

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" BIGSERIAL NOT NULL,
    "workflow_id" UUID,
    "source_outbox_id" BIGINT,
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
CREATE INDEX "file_extension_code_idx" ON "file"("extension_code");

-- CreateIndex
CREATE INDEX "file_mime_type_idx" ON "file"("mime_type");

-- CreateIndex
CREATE INDEX "file_checksum_idx" ON "file"("checksum");

-- CreateIndex
CREATE INDEX "file_created_by_workflow_id_idx" ON "file"("created_by_workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_source_outbox_id_key" ON "outbox"("source_outbox_id");

-- CreateIndex
CREATE INDEX "outbox_status_scheduled_at_created_at_idx" ON "outbox"("status", "scheduled_at", "created_at");

-- CreateIndex
CREATE INDEX "outbox_workflow_id_idx" ON "outbox"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_state_correlation_id_idx" ON "workflow_state"("correlation_id");
