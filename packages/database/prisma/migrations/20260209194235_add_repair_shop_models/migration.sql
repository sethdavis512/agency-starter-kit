-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'QUOTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'CHECK', 'OTHER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vin" TEXT,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair" (
    "id" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "quoteAmount" DOUBLE PRECISION,
    "quoteDescription" TEXT,
    "quoteApprovedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "note" TEXT,
    "repairId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_userId_idx" ON "vehicle"("userId");

-- CreateIndex
CREATE INDEX "repair_userId_idx" ON "repair"("userId");

-- CreateIndex
CREATE INDEX "repair_vehicleId_idx" ON "repair"("vehicleId");

-- CreateIndex
CREATE INDEX "repair_status_idx" ON "repair"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_repairId_key" ON "transaction"("repairId");

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair" ADD CONSTRAINT "repair_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair" ADD CONSTRAINT "repair_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "repair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
