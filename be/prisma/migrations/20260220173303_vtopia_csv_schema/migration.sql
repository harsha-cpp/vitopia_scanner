-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('success', 'already_used', 'invalid', 'not_found', 'wrong_event', 'not_paid');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('day', 'speaker', 'distribution');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "convex_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "college" TEXT,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "convex_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" BIGINT NOT NULL,
    "venue" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "access_token" TEXT,
    "category" "EventCategory" NOT NULL DEFAULT 'day',
    "scan_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "convex_id" TEXT,
    "order_id" TEXT NOT NULL,
    "receipt_id" TEXT,
    "product_meta" TEXT,
    "invoice_number" TEXT,
    "source_event_code" INTEGER,
    "registration_id" TEXT,
    "field_values" JSONB,
    "access_tokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tshirt_eligible" BOOLEAN NOT NULL DEFAULT false,
    "tshirt_size" TEXT,
    "tshirt_color" TEXT,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "checked_in" BOOLEAN NOT NULL,
    "checked_in_at" BIGINT,
    "checked_in_by" TEXT,
    "checked_in_gate" TEXT,
    "created_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" UUID NOT NULL,
    "convex_id" TEXT,
    "order_id" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "scan_result" "ScanResult" NOT NULL,
    "scanned_by" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" BIGINT NOT NULL,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gates" (
    "id" UUID NOT NULL,
    "convex_id" TEXT,
    "gate_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "gates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_convex_id_key" ON "users"("convex_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_convex_id_key" ON "events"("convex_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_access_token_key" ON "events"("access_token");

-- CreateIndex
CREATE INDEX "events_is_active_idx" ON "events"("is_active");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_scan_order_idx" ON "events"("scan_order");

-- CreateIndex
CREATE UNIQUE INDEX "orders_convex_id_key" ON "orders"("convex_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_id_key" ON "orders"("order_id");

-- CreateIndex
CREATE INDEX "orders_event_id_idx" ON "orders"("event_id");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_event_id_checked_in_idx" ON "orders"("event_id", "checked_in");

-- CreateIndex
CREATE INDEX "orders_receipt_id_idx" ON "orders"("receipt_id");

-- CreateIndex
CREATE INDEX "orders_invoice_number_idx" ON "orders"("invoice_number");

-- CreateIndex
CREATE INDEX "orders_registration_id_idx" ON "orders"("registration_id");

-- CreateIndex
CREATE INDEX "orders_access_tokens_idx" ON "orders" USING GIN ("access_tokens");

-- CreateIndex
CREATE UNIQUE INDEX "scan_logs_convex_id_key" ON "scan_logs"("convex_id");

-- CreateIndex
CREATE INDEX "scan_logs_order_id_idx" ON "scan_logs"("order_id");

-- CreateIndex
CREATE INDEX "scan_logs_event_id_idx" ON "scan_logs"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "gates_convex_id_key" ON "gates"("convex_id");

-- CreateIndex
CREATE UNIQUE INDEX "gates_gate_id_key" ON "gates"("gate_id");

-- CreateIndex
CREATE INDEX "gates_event_id_idx" ON "gates"("event_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gates" ADD CONSTRAINT "gates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
