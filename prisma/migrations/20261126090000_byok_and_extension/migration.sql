-- CreateEnum
CREATE TYPE "public"."AIProvider" AS ENUM ('GOOGLE', 'OPENAI', 'ANTHROPIC');

-- AlterEnum
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'SAVED';

-- AlterTable
ALTER TABLE "public"."applications" ADD COLUMN     "jobUrl" VARCHAR(500),
ADD COLUMN     "location" VARCHAR(150);

-- AlterTable
ALTER TABLE "public"."ai_analyses" ADD COLUMN     "model" VARCHAR(80),
ADD COLUMN     "tokensUsed" INTEGER;

-- CreateTable
CREATE TABLE "public"."ai_provider_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."AIProvider" NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyHint" VARCHAR(16) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastStatus" VARCHAR(120),
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "prefix" VARCHAR(16) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_keys_userId_provider_key" ON "public"."ai_provider_keys"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_tokenHash_key" ON "public"."api_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "api_tokens_userId_idx" ON "public"."api_tokens"("userId");

-- AddForeignKey
ALTER TABLE "public"."ai_provider_keys" ADD CONSTRAINT "ai_provider_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_tokens" ADD CONSTRAINT "api_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

