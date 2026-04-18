-- CreateTable
CREATE TABLE "account_balance_history" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "changeAmount" DOUBLE PRECISION NOT NULL,
    "changeType" TEXT NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_balance_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_balance_history_accountId_idx" ON "account_balance_history"("accountId");

-- CreateIndex
CREATE INDEX "account_balance_history_createdAt_idx" ON "account_balance_history"("createdAt");

-- CreateIndex
CREATE INDEX "account_balance_history_changeType_idx" ON "account_balance_history"("changeType");

-- AddForeignKey
ALTER TABLE "account_balance_history" ADD CONSTRAINT "account_balance_history_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
