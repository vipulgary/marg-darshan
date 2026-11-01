-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Lang" AS ENUM ('hi', 'en');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('JYOTISH', 'VASTU', 'GEMS', 'RECTIFICATION');

-- CreateEnum
CREATE TYPE "VisitMode" AS ENUM ('ONLINE_ZOOM', 'PERSONAL_VISIT');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FULL_UPFRONT', 'SPLIT_PLAN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('DRAFT', 'HELD', 'PENDING_PAYMENT', 'PARTIALLY_PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('UPI_INTENT', 'UPI_QR', 'UPI_ID', 'NET_BANKING', 'CARD', 'WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('GEM', 'RUDRAKSHA', 'YANTRA', 'VASTU');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp_phone" TEXT,
    "preferred_lang" "Lang" NOT NULL DEFAULT 'hi',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birth_profiles" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "full_name" TEXT,
    "gender" TEXT,
    "dob" DATE,
    "tob" TIME(0),
    "is_time_unknown" BOOLEAN NOT NULL DEFAULT false,
    "is_date_unknown" BOOLEAN NOT NULL DEFAULT false,
    "approx_window_start" TIME(0),
    "approx_window_end" TIME(0),
    "place_name" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "tz_name" TEXT NOT NULL,
    "tz_offset" DECIMAL(4,2),
    "life_events_json" JSONB,
    "prashna_ts" TIMESTAMP(3),
    "prashna_lat" DECIMAL(9,6),
    "prashna_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birth_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horoscopes" (
    "id" UUID NOT NULL,
    "birth_profile_id" UUID NOT NULL,
    "input_hash" TEXT NOT NULL,
    "ayanamsa" TEXT NOT NULL DEFAULT 'LAHIRI',
    "lang" "Lang" NOT NULL DEFAULT 'hi',
    "chart_style" TEXT NOT NULL DEFAULT 'north',
    "chart_json" JSONB,
    "d1_d60_json" JSONB,
    "yogas_doshas_json" JSONB,
    "north_svg_url" TEXT,
    "south_svg_url" TEXT,
    "pdf_url" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "emailed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horoscopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rectification_scans" (
    "id" UUID NOT NULL,
    "birth_profile_id" UUID NOT NULL,
    "candidates_json" JSONB,
    "dossier_pdf_url" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rectification_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title_hi" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "default_duration" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "title_hi" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "modes" "VisitMode"[],
    "durations" INTEGER[],
    "base_price_inr" INTEGER NOT NULL,
    "split_allowed" BOOLEAN NOT NULL DEFAULT false,
    "cal_event_slug" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_hi" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "price_inr" INTEGER NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 1,
    "duration_min" INTEGER NOT NULL,
    "plan_type" "PlanType" NOT NULL DEFAULT 'FULL_UPFRONT',
    "advance_pct" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "birth_profile_id" UUID,
    "problem_id" UUID NOT NULL,
    "problem_description" TEXT,
    "service_id" UUID NOT NULL,
    "visit_mode" "VisitMode" NOT NULL,
    "duration_mins" INTEGER NOT NULL,
    "plan_type" "PlanType" NOT NULL DEFAULT 'FULL_UPFRONT',
    "slot_start" TIMESTAMP(3) NOT NULL,
    "slot_end" TIMESTAMP(3) NOT NULL,
    "cal_booking_uid" TEXT,
    "zoom_url" TEXT,
    "vastu_property_json" JSONB,
    "vastu_map_url" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'DRAFT',
    "hold_expires_at" TIMESTAMP(3),
    "session_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "plan_type" "PlanType" NOT NULL,
    "installment_no" INTEGER NOT NULL DEFAULT 1,
    "total_inr" INTEGER NOT NULL,
    "amount_inr" INTEGER NOT NULL,
    "balance_due_inr" INTEGER NOT NULL DEFAULT 0,
    "channel" "PaymentChannel",
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_link_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "raw_webhook_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "fy" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_paise" INTEGER NOT NULL,
    "taxable_paise" INTEGER NOT NULL,
    "cgst_paise" INTEGER NOT NULL DEFAULT 0,
    "sgst_paise" INTEGER NOT NULL DEFAULT 0,
    "igst_paise" INTEGER NOT NULL DEFAULT 0,
    "breakdown" JSONB NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "title_hi" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "desc_hi" TEXT NOT NULL,
    "desc_en" TEXT NOT NULL,
    "images" TEXT[],
    "price_hint" TEXT,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_enquiries" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "product_id" UUID NOT NULL,
    "problem_id" UUID,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customer_note" TEXT,
    "whatsapp_redirected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subs" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp_phone" TEXT,
    "language" "Lang" NOT NULL DEFAULT 'hi',
    "status" "SubscriberStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "entity_id" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_whatsapp_phone_idx" ON "clients"("whatsapp_phone");

-- CreateIndex
CREATE INDEX "horoscopes_input_hash_idx" ON "horoscopes"("input_hash");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_cal_booking_uid_key" ON "appointments"("cal_booking_uid");

-- CreateIndex
CREATE INDEX "appointments_status_hold_expires_at_idx" ON "appointments"("status", "hold_expires_at");

-- CreateIndex
CREATE INDEX "appointments_slot_start_idx" ON "appointments"("slot_start");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_link_id_key" ON "payments"("razorpay_link_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_appointment_id_installment_no_key" ON "payments"("appointment_id", "installment_no");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_payment_id_key" ON "invoices"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_fy_seq_key" ON "invoices"("fy", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subs_email_key" ON "newsletter_subs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subs_token_key" ON "newsletter_subs"("token");

-- CreateIndex
CREATE INDEX "notification_log_entity_id_idx" ON "notification_log"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");

-- AddForeignKey
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horoscopes" ADD CONSTRAINT "horoscopes_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rectification_scans" ADD CONSTRAINT "rectification_scans_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_birth_profile_id_fkey" FOREIGN KEY ("birth_profile_id") REFERENCES "birth_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_enquiries" ADD CONSTRAINT "shop_enquiries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_enquiries" ADD CONSTRAINT "shop_enquiries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_enquiries" ADD CONSTRAINT "shop_enquiries_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

