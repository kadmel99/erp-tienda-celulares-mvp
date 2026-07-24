"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { WarrantyStatus } from "@/generated/prisma/enums";

export async function createWarranty(formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const productId = formData.get("productId") as string;
  const userId = formData.get("userId") as string;
  const clienteId = (formData.get("clienteId") as string)?.trim();
  const motivo = (formData.get("motivo") as string)?.trim();

  if (!productId || !userId || !clienteId || !motivo) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    await prisma.warranty.create({
      data: { productId, userId, clienteId, motivo },
    });
    revalidatePath("/dashboard/garantias");
    return { success: true };
  } catch {
    return { error: "Error al crear la garant\u00eda" };
  }
}

export async function updateWarrantyStatus(id: string, status: string) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  try {
    await prisma.warranty.update({
      where: { id },
      data: { status: status as WarrantyStatus, updatedAt: new Date() },
    });
    revalidatePath("/dashboard/garantias");
    return { success: true };
  } catch {
    return { error: "Error al actualizar estado" };
  }
}
