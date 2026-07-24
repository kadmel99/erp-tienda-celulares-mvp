"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ProductCategory, ProductCondition } from "@/generated/prisma/enums";

function generateSku(categoria: string): string {
  const prefix = categoria.substring(0, 3).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export async function createProduct(formData: FormData) {
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

  if (!nombre || !categoria || !sucursalId || !costo || !precioVenta) {
    return { error: "Nombre, categor\u00eda, sucursal, costo y precio son obligatorios" };
  }

  try {
    const sku = generateSku(categoria);
    await prisma.product.create({
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
      },
    });
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
  const disponible = formData.get("disponible") === "on";

  if (!nombre || !categoria || !costo || !precioVenta) {
    return { error: "Nombre, categor\u00eda, costo y precio son obligatorios" };
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        nombre, categoria: categoria as ProductCategory, condicion: condicion as ProductCondition,
        costo, precioVenta, imei, marca, modelo, color, capacidad,
        serial, tieneGarantia, mesesGarantia, disponible,
      },
    });
    revalidatePath("/dashboard/inventario");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el producto" };
  }
}

export async function toggleDisponible(id: string, disponible: boolean) {
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
