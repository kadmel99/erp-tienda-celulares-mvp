-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN_GENERAL', 'OPERADOR');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NUEVO', 'USADO', 'REACONDICIONADO', 'EXHIBICION');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('IPHONE', 'IPAD', 'APPLE_WATCH', 'AIRPODS', 'FORRO', 'CARGADOR', 'VIDRIO', 'ACCESORIO');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRASLADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'MIXTO');

-- CreateEnum
CREATE TYPE "ApartadoStatus" AS ENUM ('ACTIVO', 'SALDADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('EMITIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('INGRESO_VENTA', 'INGRESO_ABONO', 'INGRESO_CAJA_MENOR', 'EGRESO_CAJA_MENOR', 'OTRO');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('RECIBIDO', 'EN_REVISION', 'EN_REPARACION', 'ENVIADO_PROVEEDOR', 'APROBADO', 'RECHAZADO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL,
    "sucursal_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "ProductCategory" NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "color" TEXT,
    "capacidad" TEXT,
    "imei" TEXT,
    "serial" TEXT,
    "condicion" "ProductCondition" NOT NULL DEFAULT 'NUEVO',
    "costo" DECIMAL(12,2) NOT NULL,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "tiene_garantia" BOOLEAN NOT NULL DEFAULT false,
    "meses_garantia" INTEGER,
    "image_url" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sucursal_id" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tipo" "InventoryMovementType" NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "motivo" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT,
    "ciudad" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "producto_interes" TEXT,
    "presupuesto" DECIMAL(12,2),
    "origen" TEXT NOT NULL DEFAULT 'QR',
    "sucursal_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "cliente_id" TEXT,
    "user_id" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "PaymentMethod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unit" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartados" (
    "id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL,
    "fecha_limite" TIMESTAMP(3),
    "status" "ApartadoStatus" NOT NULL DEFAULT 'ACTIVO',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apartados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos" (
    "id" TEXT NOT NULL,
    "apartado_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" "PaymentMethod" NOT NULL,
    "recibo_url" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartera_seguimientos" (
    "id" TEXT NOT NULL,
    "apartado_id" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "proxima_accion" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartera_seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_ins" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "imei" TEXT,
    "modelo" TEXT NOT NULL,
    "condicion" TEXT NOT NULL,
    "salud_bateria" TEXT,
    "observaciones" TEXT,
    "valor_reconocido" DECIMAL(12,2) NOT NULL,
    "producto_resultante_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'EMITIDA',
    "enviada_contadora_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_register_sessions" (
    "id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(12,2) NOT NULL,
    "saldo_final_esperado" DECIMAL(12,2),
    "saldo_final_contado" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "abierta_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),

    CONSTRAINT "cash_register_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "tipo" "CashMovementType" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "concepto" TEXT,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "diagnostico" TEXT,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'RECIBIDO',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_sucursal_id_idx" ON "usuarios"("sucursal_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_imei_key" ON "products"("imei");

-- CreateIndex
CREATE INDEX "products_sucursal_id_idx" ON "products"("sucursal_id");

-- CreateIndex
CREATE INDEX "products_imei_idx" ON "products"("imei");

-- CreateIndex
CREATE INDEX "inventory_movements_product_id_created_at_idx" ON "inventory_movements"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "prospectos_sucursal_id_idx" ON "prospectos"("sucursal_id");

-- CreateIndex
CREATE INDEX "sales_sucursal_id_created_at_idx" ON "sales"("sucursal_id", "created_at");

-- CreateIndex
CREATE INDEX "apartados_sucursal_id_status_idx" ON "apartados"("sucursal_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "trade_ins_sale_id_key" ON "trade_ins"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_sale_id_key" ON "invoices"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_sucursal_id_numero_key" ON "invoices"("sucursal_id", "numero");

-- CreateIndex
CREATE INDEX "cash_register_sessions_sucursal_id_abierta_en_idx" ON "cash_register_sessions"("sucursal_id", "abierta_en");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospectos" ADD CONSTRAINT "prospectos_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartados" ADD CONSTRAINT "apartados_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartados" ADD CONSTRAINT "apartados_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartados" ADD CONSTRAINT "apartados_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_apartado_id_fkey" FOREIGN KEY ("apartado_id") REFERENCES "apartados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartera_seguimientos" ADD CONSTRAINT "cartera_seguimientos_apartado_id_fkey" FOREIGN KEY ("apartado_id") REFERENCES "apartados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_ins" ADD CONSTRAINT "trade_ins_producto_resultante_id_fkey" FOREIGN KEY ("producto_resultante_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cash_register_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
