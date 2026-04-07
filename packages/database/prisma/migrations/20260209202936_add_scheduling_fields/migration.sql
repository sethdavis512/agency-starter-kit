-- AlterTable
ALTER TABLE "repair" ADD COLUMN     "estimatedCompletion" TIMESTAMP(3),
ADD COLUMN     "scheduledDropOff" TIMESTAMP(3),
ADD COLUMN     "scheduledPickup" TIMESTAMP(3);
