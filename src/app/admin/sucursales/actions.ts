"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSucursal(formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const ciudad = (formData.get("ciudad") as string)?.trim();
  const direccion = (formData.get("direccion") as string)?.trim() || null;

  if (!nombre || !ciudad) {
    return { error: "Nombre y ciudad son obligatorios" };
  }

  try {
    await prisma.sucursal.create({ data: { nombre, ciudad, direccion } });
    revalidatePath("/admin/sucursales");
    return { success: true };
  } catch {
    return { error: "Error al crear la sucursal" };
  }
}

export async function updateSucursal(id: string, formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const ciudad = (formData.get("ciudad") as string)?.trim();
  const direccion = (formData.get("direccion") as string)?.trim() || null;

  if (!nombre || !ciudad) {
    return { error: "Nombre y ciudad son obligatorios" };
  }

  try {
    await prisma.sucursal.update({
      where: { id },
      data: { nombre, ciudad, direccion },
    });
    revalidatePath("/admin/sucursales");
    return { success: true };
  } catch {
    return { error: "Error al actualizar la sucursal" };
  }
}

export async function toggleSucursalActiva(id: string, activa: boolean) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  try {
    await prisma.sucursal.update({
      where: { id },
      data: { activa },
    });
    revalidatePath("/admin/sucursales");
    return { success: true };
  } catch {
    return { error: "Error al cambiar estado" };
  }
}
