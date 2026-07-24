-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'REVISION_FISCAL';

-- CreateEnum
CREATE TYPE "HallazgoTipo" AS ENUM ('INVENTARIO', 'CAJA', 'VENTAS', 'OTRO');

-- CreateEnum
CREATE TYPE "HallazgoSeveridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "HallazgoStatus" AS ENUM ('ABIERTO', 'RESUELTO');

-- CreateTable
CREATE TABLE "usuario_sucursales" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallazgos" (
    "id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "tipo" "HallazgoTipo" NOT NULL,
    "severidad" "HallazgoSeveridad" NOT NULL DEFAULT 'MEDIA',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "status" "HallazgoStatus" NOT NULL DEFAULT 'ABIERTO',
    "user_id" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hallazgos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_sucursales_usuario_id_sucursal_id_key" ON "usuario_sucursales"("usuario_id", "sucursal_id");

-- CreateIndex
CREATE INDEX "hallazgos_sucursal_id_status_idx" ON "hallazgos"("sucursal_id", "status");

-- AddForeignKey
ALTER TABLE "usuario_sucursales" ADD CONSTRAINT "usuario_sucursales_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_sucursales" ADD CONSTRAINT "usuario_sucursales_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
