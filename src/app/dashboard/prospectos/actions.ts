"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function capturarProspecto(formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim() || null;
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const correo = (formData.get("correo") as string)?.trim() || null;
  const productoInteres = (formData.get("productoInteres") as string)?.trim() || null;
  const presupuesto = formData.get("presupuesto") ? Number(formData.get("presupuesto")) || null : null;
  const sucursalId = formData.get("sucursalId") as string;

  if (!nombre || !telefono) {
    return { error: "Nombre y tel\u00e9fono son obligatorios" };
  }

  try {
    await prisma.prospecto.create({
      data: { nombre, telefono, correo, productoInteres, presupuesto, sucursalId },
    });
    return { success: true };
  } catch {
    return { error: "Error al guardar" };
  }
}

export async function listProspectos(sucursalId?: string) {
  const prisma = getPrisma();
  if (!prisma) return [];

  const filter = sucursalId ? { sucursalId } : {};

  return prisma.prospecto.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { sucursal: { select: { nombre: true } } },
  });
}
