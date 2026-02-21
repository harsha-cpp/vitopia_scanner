-- Fix drift: Add columns that were applied via db push but missing from migrations

-- Add qr_token to orders (already exists in DB, idempotent via IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'qr_token') THEN
    ALTER TABLE "orders" ADD COLUMN "qr_token" TEXT;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_qr_token_key" ON "orders"("qr_token");

-- Add source_event_code to events (already exists in DB)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'source_event_code') THEN
    ALTER TABLE "events" ADD COLUMN "source_event_code" INTEGER;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "events_source_event_code_key" ON "events"("source_event_code");

-- DropIndex (convex_id unique constraints)
DROP INDEX IF EXISTS "users_convex_id_key";
DROP INDEX IF EXISTS "events_convex_id_key";
DROP INDEX IF EXISTS "orders_convex_id_key";
DROP INDEX IF EXISTS "scan_logs_convex_id_key";
DROP INDEX IF EXISTS "gates_convex_id_key";

-- AlterTable: Remove convex_id columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "convex_id";
ALTER TABLE "events" DROP COLUMN IF EXISTS "convex_id";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "convex_id";
ALTER TABLE "scan_logs" DROP COLUMN IF EXISTS "convex_id";
ALTER TABLE "gates" DROP COLUMN IF EXISTS "convex_id";

-- AlterTable: Change registration_id from TEXT to INTEGER
-- First drop the index, then alter, then recreate
DROP INDEX IF EXISTS "orders_registration_id_idx";
ALTER TABLE "orders" ALTER COLUMN "registration_id" TYPE INTEGER USING ("registration_id"::INTEGER);
CREATE INDEX "orders_registration_id_idx" ON "orders"("registration_id");
