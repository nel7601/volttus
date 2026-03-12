-- CreateTable
CREATE TABLE "billing_records" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "billing_period_start" TIMESTAMP(3) NOT NULL,
    "billing_period_end" TIMESTAMP(3) NOT NULL,
    "billing_closing_day" INTEGER NOT NULL,
    "total_consumption_kwh" DOUBLE PRECISION NOT NULL,
    "monthly_invoice_amount" DOUBLE PRECISION NOT NULL,
    "common_area_split" "CommonAreaSplit" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_record_items" (
    "id" TEXT NOT NULL,
    "billing_record_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "group_type" "GroupType" NOT NULL,
    "kwh" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "to_pay" DOUBLE PRECISION,
    "tenant_name" TEXT,
    "tenant_id" TEXT,

    CONSTRAINT "billing_record_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_records_property_id_billing_period_end_key" ON "billing_records"("property_id", "billing_period_end");

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_record_items" ADD CONSTRAINT "billing_record_items_billing_record_id_fkey" FOREIGN KEY ("billing_record_id") REFERENCES "billing_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
