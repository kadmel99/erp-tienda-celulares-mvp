"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import type { ProductCategory, ProductCondition, InventoryMovementType } from "@/generated/prisma/enums";

function generateSku(categoria: string): string {
  const prefix = categoria.substring(0, 3).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

// Categorías con IMEI/serial propio: cada fila es una unidad física única, cantidad fija en 1.
// El resto (forros, cargadores, vidrios, accesorios) se maneja por lote/cantidad.
const CATEGORIAS_SERIALIZADAS = new Set(["IPHONE", "IPAD", "APPLE_WATCH", "AIRPODS"]);

function resolveCantidad(categoria: string, rawCantidad: FormDataEntryValue | null): number {
  if (CATEGORIAS_SERIALIZADAS.has(categoria)) return 1;
  const n = Number(rawCantidad);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export async function createProduct(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const categoria = formData.get("categoria") as string;
  const condicion = formData.get("condicion") as string || "NUEVO";
  const costo = Number(formData.get("costo"));
  const precioVenta = Number(formData.get("precioVenta"));
  const sucursalId = formData.get("sucursalId") as string;
  const imei = (formData.get("imei") as string)?.trim() || null;
  const marca = (formData.get("marca") as string)?.trim() || null;
  const modelo = (formData.get("modelo") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const capacidad = (formData.get("capacidad") as string)?.trim() || null;
  const serial = (formData.get("serial") as string)?.trim() || null;
  const tieneGarantia = formData.get("tieneGarantia") === "on";
  const mesesGarantia = tieneGarantia ? Number(formData.get("mesesGarantia")) || null : null;
  const cantidad = resolveCantidad(categoria, formData.get("cantidad"));
  const userId = formData.get("userId") as string;

  if (!nombre || !categoria || !sucursalId || !costo || !precioVenta) {
    return { error: "Nombre, categor\u00eda, sucursal, costo y precio son obligatorios" };
  }

  try {
    const sku = generateSku(categoria);
    const producto = await prisma.product.create({
      data: {
        sku,
        nombre,
        categoria: categoria as ProductCategory,
        condicion: condicion as ProductCondition,
        costo,
        precioVenta,
        sucursalId,
        imei,
        marca,
        modelo,
        color,
        capacidad,
        serial,
        tieneGarantia,
        mesesGarantia,
        cantidad,
      },
    });

    if (userId) {
      await prisma.inventoryMovement.create({
        data: {
          productId: producto.id,
          tipo: "ENTRADA" as InventoryMovementType,
          cantidad,
          motivo: "Alta de inventario",
          userId,
        },
      });
    }

    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };
    if (err?.code === "P2002") {
      const field = err?.meta?.target?.[0] ?? "campo";
      return { error: `Ya existe un producto con ese ${field}` };
    }
    return { error: "Error al crear el producto" };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const categoria = formData.get("categoria") as string;
  const condicion = formData.get("condicion") as string || "NUEVO";
  const costo = Number(formData.get("costo"));
  const precioVenta = Number(formData.get("precioVenta"));
  const imei = (formData.get("imei") as string)?.trim() || null;
  const marca = (formData.get("marca") as string)?.trim() || null;
  const modelo = (formData.get("modelo") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const capacidad = (formData.get("capacidad") as string)?.trim() || null;
  const serial = (formData.get("serial") as string)?.trim() || null;
  const tieneGarantia = formData.get("tieneGarantia") === "on";
  const mesesGarantia = tieneGarantia ? Number(formData.get("mesesGarantia")) || null : null;
  const userId = formData.get("userId") as string;

  if (!nombre || !categoria || !costo || !precioVenta) {
    return { error: "Nombre, categor\u00eda, costo y precio son obligatorios" };
  }

  try {
    const anterior = await prisma.product.findUnique({ where: { id }, select: { cantidad: true } });
    // \u00cdtems serializados no exponen el campo de cantidad en el formulario \u2014 se conserva el valor actual.
    const cantidad = CATEGORIAS_SERIALIZADAS.has(categoria)
      ? (anterior?.cantidad ?? 1)
      : resolveCantidad(categoria, formData.get("cantidad"));
    const delta = cantidad - (anterior?.cantidad ?? cantidad);

    await prisma.product.update({
      where: { id },
      data: {
        nombre, categoria: categoria as ProductCategory, condicion: condicion as ProductCondition,
        costo, precioVenta, imei, marca, modelo, color, capacidad,
        serial, tieneGarantia, mesesGarantia, cantidad,
        disponible: cantidad > 0,
      },
    });

    if (delta !== 0 && userId) {
      await prisma.inventoryMovement.create({
        data: {
          productId: id,
          tipo: (delta > 0 ? "ENTRADA" : "SALIDA") as InventoryMovementType,
          cantidad: Math.abs(delta),
          motivo: "Ajuste manual de inventario",
          referenceType: "AJUSTE",
          userId,
        },
      });
    }

    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el producto" };
  }
}

export async function toggleDisponible(id: string, disponible: boolean) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };
  try {
    await prisma.product.update({ where: { id }, data: { disponible } });
    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch {
    return { error: "Error al cambiar estado" };
  }
}
