/*
  Warnings:

  - You are about to drop the column `aucreatedAt` on the `budgets` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD');

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "aucreatedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" "CurrencyType" NOT NULL DEFAULT 'USD',
ALTER COLUMN "updatedAt" DROP DEFAULT;
