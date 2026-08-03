-- AlterEnum
ALTER TYPE "CashMovementType" ADD VALUE 'INGRESO_SERVICIO_TECNICO';

-- CreateEnum
CREATE TYPE "ServicioTecnicoStatus" AS ENUM ('RECIBIDO', 'DIAGNOSTICO', 'COTIZADO', 'APROBADO', 'EN_REPARACION', 'ESPERANDO_REPUESTO', 'LISTO', 'ENTREGADO', 'NO_APROBADO', 'NO_REPARABLE', 'CANCELADO');

-- CreateTable
CREATE TABLE "servicios_tecnicos" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "color" TEXT,
    "imei" TEXT,
    "clave_desbloqueo" TEXT,
    "falla" TEXT NOT NULL,
    "condicion_fisica" TEXT,
    "accesorios" TEXT,
    "diagnostico" TEXT,
    "costo_estimado" DECIMAL(12,2),
    "fecha_promesa" TIMESTAMP(3),
    "costo_final" DECIMAL(12,2),
    "garantia_dias" INTEGER,
    "entregado_en" TIMESTAMP(3),
    "status" "ServicioTecnicoStatus" NOT NULL DEFAULT 'RECIBIDO',
    "tecnico_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio_tecnico_repuestos" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "product_id" TEXT,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicio_tecnico_repuestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio_tecnico_seguimientos" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicio_tecnico_seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "servicios_tecnicos_sucursal_id_status_idx" ON "servicios_tecnicos"("sucursal_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_tecnicos_sucursal_id_numero_key" ON "servicios_tecnicos"("sucursal_id", "numero");

-- AddForeignKey
ALTER TABLE "servicios_tecnicos" ADD CONSTRAINT "servicios_tecnicos_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_tecnicos" ADD CONSTRAINT "servicios_tecnicos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_tecnico_repuestos" ADD CONSTRAINT "servicio_tecnico_repuestos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios_tecnicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_tecnico_repuestos" ADD CONSTRAINT "servicio_tecnico_repuestos_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_tecnico_seguimientos" ADD CONSTRAINT "servicio_tecnico_seguimientos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios_tecnicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
