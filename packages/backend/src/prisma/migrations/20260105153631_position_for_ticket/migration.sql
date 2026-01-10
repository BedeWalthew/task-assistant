-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "position" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tickets_projectId_status_position_idx" ON "tickets"("projectId", "status", "position");
