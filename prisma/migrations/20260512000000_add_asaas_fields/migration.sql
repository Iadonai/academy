-- Add asaas_customer_id to users
ALTER TABLE "users" ADD COLUMN "asaas_customer_id" TEXT;
CREATE UNIQUE INDEX "users_asaas_customer_id_key" ON "users"("asaas_customer_id");

-- Make kiwify_subscription_id nullable and add asaas_subscription_id
ALTER TABLE "subscriptions" ALTER COLUMN "kiwify_subscription_id" DROP NOT NULL;
ALTER TABLE "subscriptions" ADD COLUMN "asaas_subscription_id" TEXT;
CREATE UNIQUE INDEX "subscriptions_asaas_subscription_id_key" ON "subscriptions"("asaas_subscription_id");
