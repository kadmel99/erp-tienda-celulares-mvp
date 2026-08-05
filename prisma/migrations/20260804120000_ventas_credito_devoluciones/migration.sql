-- AlterEnum
ALTER TYPE "CashMovementType" ADD VALUE 'EGRESO_DEVOLUCION';

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "monto_pagado" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "sales" ADD COLUMN "saldo_pendiente" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill: las ventas existentes ya estaban completamente pagadas
UPDATE "sales" SET "monto_pagado" = "total", "saldo_pendiente" = 0;

-- CreateTable
CREATE TABLE "sale_abonos" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "PaymentMethod" NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_abonos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item_devoluciones" (
    "id" TEXT NOT NULL,
    "sale_item_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "motivo" TEXT NOT NULL,
    "reembolso" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_item_devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_sucursal_id_saldo_pendiente_idx" ON "sales"("sucursal_id", "saldo_pendiente");

-- AddForeignKey
ALTER TABLE "sale_abonos" ADD CONSTRAINT "sale_abonos_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_devoluciones" ADD CONSTRAINT "sale_item_devoluciones_sale_item_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
