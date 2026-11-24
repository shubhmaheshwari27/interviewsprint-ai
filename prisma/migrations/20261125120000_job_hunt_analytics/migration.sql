-- CreateEnum
CREATE TYPE "public"."ApplicationChannel" AS ENUM ('PORTAL', 'EMAIL', 'REFERRAL', 'OTHER');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."applications" ADD COLUMN     "channel" "public"."ApplicationChannel" NOT NULL DEFAULT 'PORTAL',
ADD COLUMN     "externalKey" VARCHAR(200),
ADD COLUMN     "portal" VARCHAR(50),
ADD COLUMN     "source" VARCHAR(20) NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "public"."ai_analyses" ADD COLUMN     "source" VARCHAR(20) NOT NULL DEFAULT 'AI';

-- CreateTable
CREATE TABLE "public"."market_signals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "portal" VARCHAR(50) NOT NULL,
    "company" VARCHAR(100),
    "roleTitle" VARCHAR(150) NOT NULL,
    "expBand" VARCHAR(20) NOT NULL,
    "decision" VARCHAR(20) NOT NULL,
    "blocker" VARCHAR(40) NOT NULL,
    "skills" TEXT[],
    "externalKey" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_signals_userId_date_idx" ON "public"."market_signals"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "market_signals_userId_externalKey_key" ON "public"."market_signals"("userId", "externalKey");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_externalKey_key" ON "public"."applications"("userId", "externalKey");

-- AddForeignKey
ALTER TABLE "public"."market_signals" ADD CONSTRAINT "market_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

