-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "kiwify_plan_id" TEXT,
ADD COLUMN     "kiwify_product_id" TEXT;

-- CreateTable
CREATE TABLE "platform_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("key")
);
